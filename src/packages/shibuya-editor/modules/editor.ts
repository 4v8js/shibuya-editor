import { Subscription } from 'rxjs';
import { EventEmitter } from '../utils/event-emitter';
import {
  createBlock,
  splitInlineContents,
  deleteInlineContents,
  getBlockElementById,
} from '../utils/block';
import { createInline } from '../utils/inline';
import { Module } from '../types/module';
import { EditorController } from '../types/editor';
import { copyObject } from '../utils/object';

interface Props {
  eventEmitter: EventEmitter;
  editor: EditorController;
}

export class EditorModule implements Module {
  private eventEmitter;
  private editor;
  private subs: Subscription;

  constructor({ eventEmitter, editor }: Props) {
    this.subs = new Subscription();
    this.eventEmitter = eventEmitter;
    this.editor = editor;
  }

  onInit() {
    this.eventEmitter.info('init editor module');
    const blocks = this.editor.getBlocks();
    if (blocks.length < 1) {
      this.createBlock();
    }
  }

  onDestroy() {
    this.eventEmitter.info('destory editor module');
    setTimeout(() => this.subs.unsubscribe());
  }

  createBlock(blockId?: string) {
    const caretPosition = this.editor.getCaretPosition();
    const appendBlock = createBlock('PARAGRAPH');
    const prevBlockId = blockId ?? caretPosition?.blockId;
    this.editor.createBlock(appendBlock, prevBlockId);
    this.editor.numberingList();
    this.editor.getModule('history')?.optimizeOp();

    setTimeout(() => {
      this.editor.setCaretPosition({
        blockId: prevBlockId,
        index: 0,
      });
      this.editor.updateCaretRect();
      this.editor.next();
    }, 10);
    this.editor.render([]);
  }

  deleteBlock(blockId?: string) {
    const caretPosition = this.editor.getCaretPosition();
    blockId = blockId ?? caretPosition?.blockId;
    const blocks = this.editor.getBlocks();
    const currentIndex = blocks.findIndex((v) => v.id === blockId);
    if (!blockId || blocks.length <= 1 || currentIndex < 1) return;
    const prevBlockLength = this.editor.getBlockLength(blocks[currentIndex - 1].id) ?? 0;
    this.editor.prev({ index: prevBlockLength });
    this.editor.deleteBlock(blockId);
    this.editor.numberingList();
    this.editor.getModule('history').optimizeOp();
    this.editor.render();
  }

  deleteBlocks(blockIds: string[]) {
    const blocks = this.editor.getBlocks();
    if (blocks.length <= 1) return;
    this.editor.deleteBlocks(blockIds);
    const deletedBlocks = this.editor.getBlocks();
    if (deletedBlocks.length < 1) {
      this.createBlock();
    }
    this.editor.numberingList();
    this.editor.getModule('history').optimizeOp();
    this.editor.render();
    const currentIndex = blocks.findIndex((v) => v.id === blockIds[0]);
    if (currentIndex !== -1) {
      const deletedBlocks = this.editor.getBlocks();
      const targetBlockId = currentIndex === 0 ? deletedBlocks[0].id : blocks[currentIndex - 1].id;
      const targetBlockLength = this.editor.getBlockLength(targetBlockId) ?? 0;
      this.editor.setCaretPosition({
        blockId: targetBlockId,
        index: targetBlockLength,
      });
    }
  }

  mergeBlock(sourceBlockId: string, otherBlockId: string) {
    const blocks = this.editor.getBlocks();
    const source = blocks.find((v) => v.id === sourceBlockId);
    const other = blocks.find((v) => v.id === otherBlockId);
    if (!source || !other) return;
    this.editor.deleteBlock(other.id);
    const currentSourceLength = this.editor.getBlockLength(source.id) ?? 0;
    this.editor.updateBlock({
      ...source,
      contents: copyObject([...source.contents, ...other.contents]),
    });
    this.editor.numberingList();
    this.editor.getModule('history').optimizeOp();
    setTimeout(
      () => this.editor.setCaretPosition({ blockId: source.id, index: currentSourceLength }),
      10,
    );
    this.editor.render([source.id]);
  }

  splitBlock(blockId: string, index: number, length: number = 0) {
    const blocks = this.editor.getBlocks();
    const currentIndex = blocks.findIndex((v) => v.id === blockId);
    if (currentIndex === -1) return;
    let contents = blocks[currentIndex].contents;
    if (length > 0) {
      contents = deleteInlineContents(contents, index, length);
    }
    const [first, last] = splitInlineContents(contents, index);
    const firstBlock = {
      ...blocks[currentIndex],
      contents: first.length < 1 ? [createInline('TEXT')] : first,
    };
    const lastBlock = createBlock('PARAGRAPH', last, blocks[currentIndex].attributes);
    this.editor.createBlock(lastBlock, firstBlock.id);
    this.editor.updateBlock(firstBlock);
    this.editor.numberingList();
    this.editor.getModule('history').optimizeOp();
    this.editor.render([blocks[currentIndex].id]);
    this.editor.blur();
    setTimeout(() => {
      this.editor.setCaretPosition({ blockId: lastBlock.id });
      this.editor.scrollIntoView();
    }, 10);
  }
}
