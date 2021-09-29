import { Subscription } from 'rxjs';
import { EventEmitter } from '../utils/event-emitter';
import { createBlock } from '../utils/block';
import { createlineBreak } from '../utils/inline';
import { EditorEvents } from '../constants';
import { Module } from '../types/module';
import { EditorController } from '../hooks/use-editor';

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

  createBlock() {
    const caretPosition = this.editor.getCaretPosition();
    const appendBlock = createBlock('TEXT');
    const blocks = this.editor.getBlocks();
    const currentIndex = blocks.findIndex((v) => v.id === caretPosition?.blockId);
    const insertedBlocks =
      currentIndex !== -1
        ? [...blocks.slice(0, currentIndex + 1), appendBlock, ...blocks.slice(currentIndex + 1)]
        : [...blocks, appendBlock];

    setTimeout(() => this.editor.setCaretPosition({ blockId: appendBlock.id }));
    this.eventEmitter.emit(EditorEvents.EVENT_EDITOR_UPDATE, insertedBlocks);
    this.editor.render();
  }

  lineBreak() {
    const caretPosition = this.editor.getCaretPosition();
    const blocks = this.editor.getBlocks();
    const currentIndex = blocks.findIndex((v) => v.id === caretPosition?.blockId);
    if (currentIndex === -1) return;
    this.eventEmitter.emit(EditorEvents.EVENT_BLOCK_UPDATE, {
      ...blocks[currentIndex],
      contents: [...blocks[currentIndex].contents, createlineBreak()],
    });
  }
}
