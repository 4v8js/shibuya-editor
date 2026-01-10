import { Module } from '../types/module';
import { EventEmitter } from '../utils/event-emitter';
import { EditorController } from '../types/editor';
import { EditorEvents } from '../constants';

export interface Member {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface CollaboratingMember extends Member {
  blockId: string | null;
  onClick?: (el: HTMLElement) => void;
}

interface Props {
  eventEmitter: EventEmitter;
  editor: EditorController;
  options: {
    marginTop: number; // スクロールコンテナ内のmargin設定用
  };
}

export class CollaboratorModule implements Module {
  private eventEmitter;
  private editor;
  private options: Props['options'];
  private members: Member[] = [];

  constructor({ eventEmitter, editor, options }: Props) {
    this.editor = editor;
    this.eventEmitter = eventEmitter;
    this.options = { ...options };
  }

  onInit() {
    this.eventEmitter.info('init collaborator module');
    // 共同編集のテスト用
    this.eventEmitter.select(EditorEvents.EVENT_SELECTION_CHANGE).subscribe((v) => {
      const caret = this.editor.getCaretPosition();
      this.editor.getModule('collaborator').updatePosition({
        id: 'OodywE2HkiW1KeTBPCa96',
        name: 'ktgr',
        blockId: caret?.blockId ?? null,
        imageUrl: 'https://pbs.twimg.com/profile_images/1287576269442318337/TAhRwDuP_normal.jpg',
      });
      this.editor.getModule('collaborator').updatePosition({
        id: 'OodywE2HkiW1KeTBPCa95',
        name: 'ktgr2',
        blockId: caret?.blockId ?? null,
      });
    });
  }

  onDestroy() {
    this.eventEmitter.info('destroy collaborator module');
  }

  getOptions() {
    return this.options;
  }

  updatePosition(member: CollaboratingMember) {
    this.eventEmitter.emit(EditorEvents.EVENT_COLLABORATOR_UPDATE_POSITION, member);
  }

  removeAll() {
    this.eventEmitter.emit(EditorEvents.EVENT_COLLABORATOR_REMOVE_ALL);
  }

  setMembers(members: Member[]) {
    this.members = members;
  }

  getMembers(): Member[] {
    return this.members;
  }
}
