export interface CaretPosition {
  blockId: string;
  blockFormat: string;
  index: number;
  length: number;
  collapsed: boolean;
  isTop: boolean;
  isBottom: boolean;
  rect: DOMRect;
}
