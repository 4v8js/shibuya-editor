export function caretRangeFromPoint(x: number, y: number): Range | null {
  // for chrome & safari & edge
  if (document.caretRangeFromPoint) {
    return document.caretRangeFromPoint(x, y);
  }
  // @ts-ignore for firefox
  if (document.caretPositionFromPoint) {
    // @ts-ignore
    const position = document.caretPositionFromPoint(x, y);
    if (!position) return null;
    const range = document.createRange();
    range.setStart(position.offsetNode, position.offset);
    range.setEnd(position.offsetNode, position.offset);
    return range;
  }
  return null;
}

export function getRectByRange(range: Range): DOMRect | null {
  let clientRect = null;

  if (range.endContainer instanceof Text) {
    clientRect = range.getBoundingClientRect();
  } else {
    const index =
      range.endOffset > range.endContainer.childNodes.length - 1
        ? range.endContainer.childNodes.length - 1
        : range.endOffset;
    const currentNode = range.endContainer.childNodes[index];
    if (!currentNode) return null;
    if (currentNode instanceof Text) {
      const currentNodeRange = document.createRange();
      currentNodeRange.selectNode(currentNode);
      clientRect = currentNodeRange.getBoundingClientRect();
    } else {
      if (!(currentNode instanceof Image) && (currentNode as HTMLElement)?.tagName !== 'BR')
        return null;
      clientRect = (currentNode as HTMLElement).getBoundingClientRect();
    }
  }
  return clientRect;
}
