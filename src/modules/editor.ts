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
    blockId = blockId ?? caretPosition?.blockId;
    const appendBlock = createBlock('PARAGRAPH');
    this.editor.createBlock(appendBlock, blockId);
    setTimeout(() => {
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
    this.editor.render();
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
    setTimeout(() => {
      this.editor.render([blocks[currentIndex].id]);
      this.editor.blur();
      setTimeout(() => this.editor.setCaretPosition({ blockId: lastBlock.id }), 10);
    }, 10);
    this.editor.createBlock(lastBlock, firstBlock.id);
    this.editor.updateBlock(firstBlock);
  }
}
