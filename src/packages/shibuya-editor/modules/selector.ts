import { throttle } from 'throttle-debounce';
import { Module } from '../types/module';
import { EventEmitter } from '../utils/event-emitter';
import { EditorController } from '../types/editor';
import { getBlockId, getBlockElementById } from '../utils/block';
import { KeyCodes, EditorEvents } from '../constants';
import { Block } from '../types/block';
import { copyObject } from '../utils/object';

const ShortKey = /Mac/i.test(navigator.platform) ? 'metaKey' : 'ctrlKey';

interface Props {
  eventEmitter: EventEmitter;
  editor: EditorController;
}

interface Position {
  start: string | null;
  end: string | null;
}

interface KeyBindingProps {
  key: string;
  formats?: string[];
  shortKey?: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  prevented?: boolean;
  handler: (editor: EditorController, event: React.KeyboardEvent) => void;
}

export class SelectorModule implements Module {
  private eventEmitter;
  private editor;
  private position: Position = { start: null, end: null };
  private enabled = false;
  private mousePressed = false;
  private changed = false;
  private selectedBlocks: Block[] = [];
  private bindings: KeyBindingProps[] = [];

  mouseMove = throttle(100, (e: MouseEvent) => {
    if (!this.mousePressed) return;
    const blocks = this.editor.getBlocks();
    const startIndex = blocks.findIndex((v) => v.id === this.position.start);
    if (startIndex === -1) return;
    const [blockId] = getBlockId(e.target as HTMLElement);
    let blockIds: string[] = [];
    let selectedBlocks: Block[] = [];
    const blockIndex = blocks.findIndex((v) => v.id === blockId);
    if (!blockId || blockIndex === -1) {
      const startEl = getBlockElementById(blocks[startIndex].id);
      const startTop = startEl?.getBoundingClientRect()?.top ?? 0;
      const isUpward = startTop > e.clientY;

      if (isUpward) {
        for (let i = startIndex; i >= 0; i--) {
          const blockEl = getBlockElementById(blocks[i].id);
          const rect = blockEl?.getBoundingClientRect();

          if (rect && rect.top + rect.height > e.clientY) {
            blockIds.push(blocks[i].id);
          } else {
            break;
          }
        }
      } else {
        for (let i = startIndex; i < blocks.length; i++) {
          const blockEl = getBlockElementById(blocks[i].id);
          const rect = blockEl?.getBoundingClientRect();
          if (rect && rect.top < e.clientY) {
            blockIds.push(blocks[i].id);
          } else {
            break;
          }
        }
      }
      selectedBlocks = copyObject(blocks.filter((v) => blockIds.includes(v.id)));
    } else {
      this.position.end = blockId;
      const endIndex = blocks.findIndex((v) => v.id === this.position.end);
      if (startIndex > endIndex) {
        selectedBlocks = copyObject(blocks.slice(endIndex, startIndex + 1));
        blockIds = selectedBlocks.map((v) => v.id);
      } else {
        selectedBlocks = copyObject(blocks.slice(startIndex, endIndex + 1));
        blockIds = selectedBlocks.map((v) => v.id);
      }
    }

    if (!this.enabled && blockIds.length > 1) {
      this.enabled = true;
      this.changed = true;
      this.editor.blur();
    }

    if (this.enabled) {
      this.selectedBlocks = selectedBlocks;
      this.sendBlockSelectedEvent(blockIds);
    }
  });

  constructor({ eventEmitter, editor }: Props) {
    this.editor = editor;
    this.eventEmitter = eventEmitter;
  }

  sendBlockSelectedEvent(blockIds: string[]) {
    this.eventEmitter.emit(EditorEvents.EVENT_BLOCK_SELECTED, blockIds);
  }

  onInit() {
    this.eventEmitter.info('init selector module');

    this.addBinding({
      key: KeyCodes.BACKSPACE,
      prevented: true,
      handler: this._handleBackspace.bind(this),
    });
  }

  onDestroy() {
    this.eventEmitter.info('destroy selector module');
  }

  mouseDown(e: MouseEvent) {
    this.reset();

    const [blockId] = getBlockId(e.target as HTMLElement);
    if (!blockId) return;
    this.mousePressed = true;
    this.position.start = blockId;
  }

  mouseUp(e: MouseEvent) {
    this.mousePressed = false;

    setTimeout(() => {
      this.changed = false;
    });
  }

  reset() {
    if (this.changed) return;
    this.mousePressed = false;
    this.enabled = false;
    this.position = { start: null, end: null };
    this.selectedBlocks = [];
    this.sendBlockSelectedEvent([]);
  }

  getSelectedBlocks() {
    return this.selectedBlocks;
  }

  addBinding(props: KeyBindingProps) {
    this.bindings.push(props);
  }

  onKeyDown(e: React.KeyboardEvent) {
    let prevented = false;

    this.bindings.forEach((binding) => {
      if (this._trigger(e, binding)) {
        prevented = true;
      }
    });

    if (prevented) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  private _trigger(e: React.KeyboardEvent, props: KeyBindingProps): boolean {
    const {
      key,
      metaKey = false,
      ctrlKey = false,
      shiftKey = false,
      shortKey = false,
      altKey = false,
      prevented = false,
      handler,
    } = props;
    if (shortKey && !e[ShortKey]) return false;
    if (!shortKey) {
      if ((metaKey && !e.metaKey) || (!metaKey && e.metaKey)) return false;
      if ((ctrlKey && !e.ctrlKey) || (!ctrlKey && e.ctrlKey)) return false;
    } else {
      if (metaKey && !e.metaKey) return false;
      if (ctrlKey && !e.ctrlKey) return false;
    }

    if ((shiftKey && !e.shiftKey) || (!shiftKey && e.shiftKey)) return false;
    if ((altKey && !e.altKey) || (!altKey && e.altKey)) return false;

    if (key !== e.code) return false;

    handler(this.editor, e);

    return prevented;
  }

  private _handleBackspace(editor: EditorController) {
    const selectedBlocks = editor.getModule('selector').getSelectedBlocks();
    if (selectedBlocks.length < 1) return;
    editor.getModule('editor').deleteBlocks(selectedBlocks.map((block) => block.id));
    this.reset();
  }
}
