import { Block } from './block';
import { Inline } from './inline';
import { CaretPosition } from './caret';

export interface JSON0 {
  p: [keyof Block, number, keyof Inline, number];
  li: any;
  ld: any;
  si: string;
  sd: string;
}

export interface UpdateOp {
  type: 'update_contents';
  blockId: string;
  undo: JSON0[];
  redo: JSON0[];
  position?: CaretPosition;
}

export interface AddOp {
  type: 'add_block';
  blockId: string;
  block: Block;
  prevBlockId?: string;
  position?: CaretPosition;
}

export interface RemoveOp {
  type: 'remove_block';
  blockId: string;
  block: Block;
  prevBlockId?: string;
  position?: CaretPosition;
}

export interface UpdateChildBlockOp {
  type: 'child_block_update_contents';
  parentBlockId: string;
  blockId: string;
  undo: JSON0[];
  redo: JSON0[];
  position?: CaretPosition;
}

export interface AddChildBlockOp {
  type: 'child_block_add_block';
  blockId: string;
  block: Block;
  parentBlockId: string;
  position?: CaretPosition;
}

export interface RemoveChildBlockOp {
  type: 'child_block_remove_block';
  blockId: string;
  block: Block;
  parentBlockId: string;
  position?: CaretPosition;
}

export type Op =
  | UpdateOp
  | AddOp
  | RemoveOp
  | UpdateChildBlockOp
  | AddChildBlockOp
  | RemoveChildBlockOp;
