import { Source } from '../types/editor';
import {
  AddOp,
  UpdateOp,
  RemoveOp,
  UpdateChildBlockOp,
  AddChildBlockOp,
  RemoveChildBlockOp,
} from '../types/history';

export const KeyCodes = {
  ESC: 'Escape',
  ENTER: 'Enter',
  NUMPAD_ENTER: 'NumpadEnter',
  TAB: 'Tab',
  DELETE: 'Delete',
  A: 'KeyA',
  B: 'KeyB',
  C: 'KeyC',
  D: 'KeyD',
  E: 'KeyE',
  F: 'KeyF',
  G: 'KeyG',
  H: 'KeyH',
  I: 'KeyI',
  J: 'KeyJ',
  K: 'KeyK',
  L: 'KeyL',
  M: 'KeyM',
  N: 'KeyN',
  O: 'KeyO',
  P: 'KeyP',
  Q: 'KeyQ',
  R: 'KeyR',
  S: 'KeyS',
  T: 'KeyT',
  U: 'KeyU',
  V: 'KeyV',
  W: 'KeyW',
  X: 'KeyX',
  Y: 'KeyY',
  Z: 'KeyZ',
  SPACE: 'Space',
  BACKSPACE: 'Backspace',
  DEL: 'Delete',
  ARROW_UP: 'ArrowUp',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ARROW_DOWN: 'ArrowDown',
};

export const EditorEvents = {
  EVENT_EDITOR_CREATE: 'editor-create',
  EVENT_EDITOR_HISTORY_PUSH: 'editor-history-push', // for undo/redo
  EVENT_EDITOR_CHANGED: 'editor-changed',
  EVENT_BLOCK_RERENDER: 'block-rerender',
  EVENT_BLOCK_RERENDER_FORCE: 'block-rerender-force',
  EVENT_CHILD_BLOCK_RERENDER: 'child-block-rerender',
  EVENT_CHILD_BLOCK_RERENDER_FORCE: 'child-block-rerender-force',
  EVENT_BLOCK_SELECTED: 'block-selected', // Selector Mode (Block)
  EVENT_SELECTION_CHANGE: 'selection-change',
  EVENT_LINK_CLICK: 'button-clicked',
  EVENT_PALETTE_CLICK: 'palette-clicked',
  EVENT_LOG_INFO: 'log-info',
  EVENT_LOG_WARNING: 'log-warning',
  EVENT_LOG_ERROR: 'log-error',
  EVENT_COLLABORATOR_UPDATE_POSITION: 'collaborator-update-position', // 共同編集用
  EVENT_COLLABORATOR_REMOVE_ALL: 'collaborator-remove-all', // 共同編集用
};

export const HistoryType = {
  UPDATE_CONTENTS: 'update_contents' as UpdateOp['type'],
  ADD_BLOCK: 'add_block' as AddOp['type'],
  REMOVE_BLOCK: 'remove_block' as RemoveOp['type'],
  CHILD_BLOCK_UPDATE_CONTENTS: 'child_block_update_contents' as UpdateChildBlockOp['type'],
  CHILD_BLOCK_ADD_BLOCK: 'child_block_add_block' as AddChildBlockOp['type'],
  CHILD_BLOCK_REMOVE_BLOCK: 'child_block_remove_block' as RemoveChildBlockOp['type'],
};

export const EventSources: {
  [key: string]: Source;
} = {
  SILENT: 'silent',
  USER: 'user',
  COLLABORATOR: 'collaborator',
};

export const LogLevels = {
  NONE: 0,
  ERROR: 1,
  WARNING: 2,
  INFO: 3,
};

export const CodeBlockLanguages = [
  'go',
  'graphql',
  'java',
  'javascript',
  'json',
  'php',
  'ruby',
  'rust',
  'scss',
  'sql',
  'swift',
  'typescript',
  'yaml',
];
