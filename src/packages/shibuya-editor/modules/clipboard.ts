import * as React from 'react';
import { Subscription } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Module } from '../types/module';
import { EventEmitter } from '../utils/event-emitter';
import { EditorController } from '../types/editor';
import { EditorEvents } from '../constants';
import { Block } from '../types/block';
import {
  convertBlocksToText,
  createBlock,
  deleteInlineContents,
  getInlineContents,
  splitInlineContents,
} from '../utils/block';
import { Inline } from '../types/inline';
import { uniCount } from 'unicount';
import { createInline } from '../utils/inline';
import { copyObject } from '../utils/object';
import { parseMarkdownInlines } from '../utils/parse-markdown-inlines';

interface Props {
  eventEmitter: EventEmitter;
  editor: EditorController;
}

export class ClipboardModule implements Module {
  private eventEmitter;
  private editor;
  private editorRef;
  private clipboardEl: HTMLElement | null = null;
  private subs = new Subscription();

  constructor({ eventEmitter, editor }: Props) {
    this.editor = editor;
    this.editorRef = this.editor.getEditorRef();
    this.eventEmitter = eventEmitter;
  }

  onInit() {
    this.eventEmitter.info('init clipboard module');
    const editorRef = this.editor.getEditorRef();
    this.clipboardEl = editorRef?.parentElement?.querySelector('.clipboard') ?? null;
    this.subs.add(
      this.eventEmitter
        .select(EditorEvents.EVENT_BLOCK_SELECTED)
        .subscribe((blockIds: string[]) => {
          if (blockIds.length < 1) return;
          this.focus();
        }),
    );
  }

  onDestroy() {
    this.eventEmitter.info('destroy clipboard module');
    this.subs.unsubscribe();
  }

  onPaste(event: React.ClipboardEvent) {
    event.preventDefault();
    const caretPosition = this.editor.getCaretPosition();
    if (!caretPosition) return;

    const dataTransferItems = event.clipboardData.items ?? [];
    const files: File[] = [];
    for (let i = 0; i < dataTransferItems.length; i++) {
      const file = dataTransferItems[i].getAsFile();
      if (file) files.push(file);
    }

    // file upload
    if (files.length > 0) {
      this.editor.getModule('uploader').upload(files);
      return;
    }

    const clipboardJson = event.clipboardData.getData('text/shibuya-formats');
    const prevBlock = this.editor.getBlock(caretPosition.blockId);
    if (prevBlock && clipboardJson) {
      const { type, data } = JSON.parse(clipboardJson);

      // blocks
      if (prevBlock && type === 'blocks') {
        const appendBlocks = data as Block[];
        let prevBlockId = prevBlock.id;
        const affectedIds = appendBlocks.map((v, i) => {
          const appendBlock = {
            ...v,
            id: uuidv4(),
            childBlocks: [],
          };
          this.editor.createBlock(appendBlock, prevBlockId);
          // 子コンポーネントが１つ以上あったら
          if (v.childBlocks.length > 0) {
            this.editor.createChildBlocks(
              appendBlock.id,
              v.childBlocks.map((c) => {
                return { ...c, id: uuidv4() };
              }),
            );
          }
          prevBlockId = appendBlock.id;
          return appendBlock.id;
        });
        this.editor.getModule('history')?.optimizeOp();
        this.editor.numberingList();
        this.editor.render(affectedIds);
        setTimeout(() => {
          const textIndex = this.editor.getBlockLength(prevBlockId) ?? 0;
          this.editor.setCaretPosition({
            blockId: prevBlockId,
            index: textIndex,
          });
          this.editor.updateCaretRect();
          this.editor.getModule('editor').scrollToBlock(prevBlockId);
        }, 10);
      } else if (type === 'inlines' && !caretPosition.childBlockId) {
        const appendContents = data as Inline[];
        let contents = copyObject(prevBlock.contents);
        if (caretPosition.length > 0) {
          contents = deleteInlineContents(contents, caretPosition.index, caretPosition.length);
        }
        const [first, last] = splitInlineContents(contents, caretPosition.index);
        const appendTextLength = uniCount(
          appendContents
            .map((v) => v.text)
            .join('')
            .replaceAll(/\uFEFF/gi, ''),
        );
        this.editor.updateBlock({
          ...prevBlock,
          contents: [
            ...first,
            ...appendContents.map((v) => {
              return { ...v, id: uuidv4() };
            }),
            ...last,
          ],
        });
        this.editor.render([prevBlock.id]);
        setTimeout(() => {
          this.editor.setCaretPosition({
            blockId: prevBlock.id,
            index: caretPosition.index + appendTextLength,
          });
          this.editor.updateCaretRect();
        }, 10);
      } else if (type === 'inlines' && caretPosition.childBlockId) {
        const targetBlock = prevBlock.childBlocks.find((v) => v.id === caretPosition.childBlockId);
        if (!targetBlock) return;
        const appendContents = data as Inline[];
        let contents = copyObject(targetBlock.contents);
        if (caretPosition.length > 0) {
          contents = deleteInlineContents(contents, caretPosition.index, caretPosition.length);
        }
        const [first, last] = splitInlineContents(contents, caretPosition.index);
        const appendTextLength = uniCount(
          appendContents
            .map((v) => v.text)
            .join('')
            .replaceAll(/\uFEFF/gi, ''),
        );
        this.editor.updateChildBlock(prevBlock.id, {
          ...targetBlock,
          contents: [
            ...first,
            ...appendContents.map((v) => {
              return { ...v, id: uuidv4() };
            }),
            ...last,
          ],
        });
        this.editor.renderChild(prevBlock.id, [targetBlock.id]);
        setTimeout(() => {
          this.editor.setCaretPosition({
            blockId: prevBlock.id,
            childBlockId: targetBlock.id,
            index: caretPosition.index + appendTextLength,
          });
          this.editor.updateCaretRect();
        }, 10);
      }
      return;
    }

    const clipboardText = event.clipboardData.getData('text/plain');
    const clipboardTextBlocks = clipboardText.replaceAll(/(\r|\r\n)/g, '\n').split('\n');

    // 複数行のコピペ対応
    if (prevBlock && clipboardTextBlocks.length > 1 && prevBlock.type !== 'CODE-BLOCK') {
      let prevBlockId = prevBlock.id;
      const affectedIds = clipboardTextBlocks
        .filter((inlineText) => {
          // 改行のみの行は消す
          return inlineText !== '';
        })
        .map((inlineText, i) => {
          let blockType = 'PARAGRAPH';
          let attributes = {};
          // 行全体が**で囲まれている場合、先にboldを剥がしてブロック検出を行う
          let isWrappedBold = false;
          const patternWrappedBold = /^\*\*(.+)\*\*$/;
          const matchWrappedBold = inlineText.match(patternWrappedBold);
          if (matchWrappedBold) {
            inlineText = matchWrappedBold[1];
            isWrappedBold = true;
          }
          const patternHeader = /^#{1,6}\s/;
          const matchHeader = inlineText.match(patternHeader);
          if (matchHeader) {
            const headerLength = uniCount(matchHeader[0]);
            inlineText = inlineText.replace(patternHeader, '');
            blockType = `HEADER${headerLength - 1}`;
          }
          const patternNumberList = /^[0-9]+.\s/;
          const matchNumberList = inlineText.match(patternNumberList);
          if (matchNumberList) {
            inlineText = inlineText.replace(patternNumberList, '');
            blockType = `ORDERED-LIST`;
          }
          const patternBulletList = /^(\*|-|\+)\s/;
          const matchBulletList = inlineText.match(patternBulletList);
          if (matchBulletList) {
            inlineText = inlineText.replace(patternBulletList, '');
            blockType = `BULLET-LIST`;
          }
          const patternCheckListt = /^\[\s?\]\s/;
          const matchCheckList = inlineText.match(patternCheckListt);
          if (matchCheckList) {
            inlineText = inlineText.replace(patternCheckListt, '');
            blockType = `CHECK-LIST`;
            attributes = { checked: false };
          }
          const patternCheckedList = /^\[x\]\s/;
          const matchCheckedList = inlineText.match(patternCheckedList);
          if (matchCheckedList) {
            inlineText = inlineText.replace(patternCheckedList, '');
            blockType = `CHECK-LIST`;
            attributes = { checked: true };
          }
          const patternBlockQuote = /^>\s/;
          const matchBlockQuote = inlineText.match(patternBlockQuote);
          if (matchBlockQuote) {
            inlineText = inlineText.replace(patternBlockQuote, '');
            blockType = `BLOCKQUOTE`;
          }
          inlineText = inlineText.trim();
          let inlines = parseMarkdownInlines(inlineText);
          if (isWrappedBold) {
            inlines = inlines.map((inline) => ({
              ...inline,
              attributes: { ...inline.attributes, bold: true },
            }));
          }
          const appendBlock = createBlock(blockType, inlines, attributes);
          this.editor.createBlock(appendBlock, prevBlockId);
          prevBlockId = appendBlock.id;
          return appendBlock.id;
        });
      this.editor.numberingList();
      this.editor.render(affectedIds);
      setTimeout(() => {
        const textIndex = this.editor.getBlockLength(prevBlockId) ?? 0;
        this.editor.setCaretPosition({
          blockId: prevBlockId,
          index: textIndex,
        });
        this.editor.updateCaretRect();
      }, 10);
      return;
    }

    // youtube embed
    const youtubeRegExp =
      /^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    const youtubeMatch = clipboardText.match(youtubeRegExp);
    if (prevBlock && caretPosition && youtubeMatch && youtubeMatch[1]) {
      this.editor.updateBlock({
        ...prevBlock,
        type: 'YOUTUBE',
        attributes: { videoId: youtubeMatch[1] },
      });
      this.editor.render([prevBlock.id]);
      return;
    }

    // url link
    const linkRegExp = new RegExp(`^https?://[a-zA-Z0-9-_.!'()*;/?:@&=+$,%#]+$`, 'i');
    const linkMatch = clipboardText.match(linkRegExp);
    if (prevBlock && caretPosition && linkMatch) {
      if (caretPosition.length > 0) {
        this.editor.formatText(prevBlock.id, caretPosition.index, caretPosition.length, {
          link: linkMatch[0],
        });
        this.editor.render([prevBlock.id]);
        setTimeout(() => {
          this.editor.setCaretPosition({
            blockId: prevBlock.id,
            index: caretPosition.index,
            length: caretPosition.length,
          });
          this.editor.updateCaretRect();
        }, 10);
      } else {
        const [first, last] = splitInlineContents(
          copyObject(prevBlock.contents),
          caretPosition.index,
        );
        const appendContent = createInline('TEXT', clipboardText, { link: linkMatch[0] });
        this.editor.updateBlock({
          ...prevBlock,
          contents: [...first, appendContent, ...last],
        });
        this.editor.render([prevBlock.id]);
        setTimeout(() => {
          this.editor.setCaretPosition({
            blockId: prevBlock.id,
            index: caretPosition.index + uniCount(clipboardText),
          });
          this.editor.updateCaretRect();
        }, 10);
      }
      return;
    }

    if (prevBlock && caretPosition && clipboardText.length > 0) {
      let contents = copyObject(prevBlock.contents);
      if (caretPosition.length > 0) {
        contents = deleteInlineContents(contents, caretPosition.index, caretPosition.length);
      }
      const [first, last] = splitInlineContents(contents, caretPosition.index);
      const appendContents = parseMarkdownInlines(clipboardText.replace(/\r\n/g, '\n'));

      this.editor.updateBlock({
        ...prevBlock,
        contents: [...first, ...appendContents, ...last],
      });
      this.editor.render([prevBlock.id]);
      setTimeout(() => {
        this.editor.setCaretPosition({
          blockId: prevBlock.id,
          index: caretPosition.index + uniCount(clipboardText),
        });
        this.editor.updateCaretRect();
      }, 10);
      return;
    }
  }

  onCopy(event: React.ClipboardEvent) {
    event.preventDefault();
    const selectedBlocks = this.editor.getModule('selector').getSelectedBlocks();
    if (selectedBlocks.length > 0) {
      // block
      this._saveBlocks(event.nativeEvent, selectedBlocks);
    } else {
      // inline
      const caretPosition = this.editor.getCaretPosition();
      if (!caretPosition) return;
      const block = this.editor.getBlock(caretPosition.blockId);
      if (!block) return;
      let contents = [];
      if (caretPosition.childBlockId) {
        const childBlock = block.childBlocks.find((v) => v.id === caretPosition.childBlockId);
        if (!childBlock) return;
        contents = childBlock.contents;
      } else {
        contents = block.contents;
      }
      if (!caretPosition.collapsed && caretPosition.length > 0) {
        const inlineContents = getInlineContents(
          contents,
          caretPosition.index,
          caretPosition.length,
        );
        this._saveInlineContents(event.nativeEvent, inlineContents);
      }
    }
  }

  onCut(event: React.ClipboardEvent) {
    event.preventDefault();
    const caretPosition = this.editor.getCaretPosition();
    const selectedBlocks = this.editor.getModule('selector').getSelectedBlocks();
    if (selectedBlocks.length > 0) {
      // block
      this._saveBlocks(event.nativeEvent, selectedBlocks);
      this.editor.getModule('editor').deleteBlocks(selectedBlocks.map((block) => block.id));
      this.editor.getModule('selector').reset();
    } else if (caretPosition && !caretPosition.collapsed && caretPosition.length > 0) {
      // inline
      const block = this.editor.getBlock(caretPosition?.blockId ?? '');
      if (block) {
        const caretIndex = caretPosition.index;
        const inlineContents = getInlineContents(
          block.contents,
          caretPosition.index,
          caretPosition.length,
        );
        this._saveInlineContents(event.nativeEvent, inlineContents);
        const deletedContents = deleteInlineContents(
          block.contents,
          caretPosition.index,
          caretPosition.length,
        );
        this.editor.updateBlock({ ...block, contents: deletedContents });
        this.editor.blur();
        this.editor.render([block.id]);
        setTimeout(() => {
          this.editor.setCaretPosition({ blockId: block.id, index: caretIndex });
          this.editor.updateCaretRect();
        }, 10);
      }
    }
  }

  focus() {
    if (!this.clipboardEl) return;
    const range = new Range();
    const selection = document.getSelection();
    if (!selection) return;
    range.setStart(this.clipboardEl, 0);
    range.setEnd(this.clipboardEl, 0);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  private _saveBlocks(event: ClipboardEvent, blocks: Block[]) {
    if (event.clipboardData) {
      event.clipboardData.setData('text/plain', convertBlocksToText(blocks));
      event.clipboardData.setData(
        'text/shibuya-formats',
        JSON.stringify({ type: 'blocks', data: blocks }),
      );
    }
  }

  private _saveInlineContents(event: ClipboardEvent, inlines: Inline[]) {
    if (event.clipboardData) {
      const plainText = inlines.map((v) => v.text).join('');
      event.clipboardData.setData('text/plain', plainText);
      event.clipboardData.setData(
        'text/shibuya-formats',
        JSON.stringify({
          type: 'inlines',
          data: inlines,
        }),
      );
    }
  }
}
