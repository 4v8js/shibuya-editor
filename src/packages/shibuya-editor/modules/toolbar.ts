import { Module } from '../types/module';
import { EventEmitter } from '../utils/event-emitter';
import { EditorController } from '../types/editor';
import { BlockType, BlockAttributes } from '../types/block';
import { InlineAttributes } from '../types/inline';
import { CaretPosition } from '../types/caret';

interface Props {
  eventEmitter: EventEmitter;
  editor: EditorController;
}
export class ToolbarModule implements Module {
  private eventEmitter;
  private editor;

  constructor({ eventEmitter, editor }: Props) {
    this.editor = editor;
    this.eventEmitter = eventEmitter;
  }

  onInit() {
    this.eventEmitter.info('init toolbar module');
  }

  onDestroy() {
    this.eventEmitter.info('destroy toolbar module');
  }

  formatInline(attributes: InlineAttributes = {}, caretPosition: CaretPosition | null = null) {
    if (!caretPosition) {
      caretPosition = this.editor.getCaretPosition();
    }
    if (!caretPosition) return;
    const block = this.editor.getBlock(caretPosition.blockId);
    if (!block) return;
    this.editor.formatText(block.id, caretPosition.index, caretPosition.length, attributes);

    setTimeout(
      () =>
        this.editor.setCaretPosition({
          blockId: block.id,
          index: caretPosition?.index,
          length: caretPosition?.length,
        }),
      10,
    );
  }

  formatBlock(type: BlockType, attributes: BlockAttributes = {}) {
    const caretPosition = this.editor.getCaretPosition();
    if (!caretPosition) return;
    const block = this.editor.getBlock(caretPosition.blockId);
    if (!block) return;
    this.editor.updateBlock({ ...block, type, attributes });
    this.editor.numberingList();
    this.editor.render([block.id]);
    setTimeout(
      () =>
        this.editor.setCaretPosition({
          blockId: block.id,
          index: caretPosition.index,
          length: caretPosition.length,
        }),
      10,
    );
  }
}
