import { Source } from '../types/editor';
import { AddOp, UpdateOp, RemoveOp } from '../types/history';

export const KeyCodes = {
  ESC: 'Escape',
  ENTER: 'Enter',
  NUMPAD_ENTER: 'NumpadEnter',
  TAB: 'Tab',
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
  EVENT_BLOCK_SELECTED: 'block-selected', // Selector Mode
  EVENT_SELECTION_CHANGE: 'selection-change',
  EVENT_LINK_CLICK: 'button-clicked',
  EVENT_LOG_INFO: 'log-info',
  EVENT_LOG_WARNING: 'log-warning',
  EVENT_LOG_ERROR: 'log-error',
};

export const HistoryType = {
  UPDATE_CONTENTS: 'update_contents' as UpdateOp['type'],
  ADD_BLOCK: 'add_block' as AddOp['type'],
  REMOVE_BLOCK: 'remove_block' as RemoveOp['type'],
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
