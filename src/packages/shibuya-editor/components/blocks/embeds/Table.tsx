import * as React from 'react';
import styled from 'styled-components';
import { EditorController } from '../../../types/editor';
import { InlineContainer } from '../../inlines/Container';
import { Formats } from '../../../types/format';
import { Block, Inline } from '../../../types';
import { createBlock, getBlockElementById } from '../../../utils/block';
import { useChildBlockRenderer } from '../../../hooks';
import { copyObject } from '../../../utils/object';

export interface TableProps {
  blockId: string;
  formats: Formats;
  contents: React.ReactNode;
  scrollContainer?: HTMLElement | string;
  attributes: {
    tableR: number;
    tableC: number;
    tableSettings: {
      [key: string]: any;
    };
  };
  childBlocks: Block[];
  editor: EditorController;
}

export interface TableCellProps {
  parentBlockId: string;
  blockId: string;
  formats: Formats;
  scrollContainer?: HTMLElement | string;
  editor: EditorController;
}

const Container = styled.div`
  outline: none;
  display: flex;
  margin: 0;
  padding: 12px 0;
  justify-content: center;
`;

const StyledTable = styled.table`
  border: 1px solid #c1c7cd;
  border-spacing: 0;
  border-collapse: collapse;
`;

const StyledTr = styled.tr``;

const StyledTd = styled.td`
  border: 1px solid #c1c7cd;
  border-inline-end-width: 0;
  border-bottom-width: 0;
  vertical-align: top;
  background-clip: padding-box;
  position: relative;
  user-drag: none;
  box-sizing: border-box;
}
`;

const TableContent = styled.div`
  outline: none;
  padding: 8px;
`;

const Resizer = styled.div`
  position: absolute;
  width: 5px;
  top: 0;
  right: -2px;
  height: 100%;
  z-index: 1;
  transition: background 150ms ease 50ms;
  cursor: col-resize;
  user-drag: none;
`;

const AddColumn = styled.div`
  position: absolute;
  width: 24px;
  height: 24px;
  top: -12px;
  right: -14px;
  z-index: 1;
  background: #fff;
  border-radius: 50%;
  border: 1px solid #c1c7cd;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 300ms ease 100ms;
  &:hover {
    opacity: 1;
  }
`;
const AddRow = styled.div`
  position: absolute;
  width: 24px;
  height: 24px;
  bottom: -12px;
  left: -32px;
  z-index: 1;
  background: #fff;
  border-radius: 50%;
  border: 1px solid #c1c7cd;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 300ms ease 100ms;
  &:hover {
    opacity: 1;
  }
`;

const RemoveColumn = styled.div`
  position: absolute;
  width: 24px;
  height: 24px;
  top: -12px;
  left: 50%;
  z-index: 1;
  transform: translateX(-50%);
  background: #fff;
  border-radius: 50%;
  border: 1px solid #c1c7cd;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 300ms ease 100ms;
  &:hover {
    opacity: 1;
  }
  cursor: pointer;
`;

const RemoveRow = styled.div`
  position: absolute;
  width: 24px;
  height: 24px;
  left: -32px;
  top: 50%;
  z-index: 1;
  transform: translateY(-50%);
  background: #fff;
  border-radius: 50%;
  border: 1px solid #c1c7cd;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 300ms ease 100ms;
  &:hover {
    opacity: 1;
  }
  cursor: pointer;
`;

export const Table = React.memo(
  ({
    blockId,
    contents,
    formats,
    attributes: { tableR, tableC, tableSettings = {} },
    childBlocks = [],
    scrollContainer,
    editor,
    ...props
  }: TableProps) => {
    const tableRef = React.useRef<HTMLTableElement>(null);
    const [hoverResizeCol, setHoverResizeCol] = React.useState<number>();
    const [dragParams, setDragParams] = React.useState<{
      col: number;
      left: number;
      width: number;
    }>();

    const handleInput = React.useCallback(
      (e: React.FormEvent) => {
        e.stopPropagation();
        const keyboard = editor.getModule('keyboard');
        if (keyboard) {
          keyboard.onInputChildBlock(blockId, e);
        }
      },
      [blockId],
    );

    const handleResizeMouseOver = React.useCallback(
      (col: number) => (e: React.FormEvent) => {
        setHoverResizeCol(col);
      },
      [],
    );
    const handleResizeMouseLeave = React.useCallback((e: React.FormEvent) => {
      setHoverResizeCol(undefined);
    }, []);
    const handleMouseDown = React.useCallback(
      (col: number) => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const block = childBlocks.find((v) => v.name === `r0-c${col}`);
        if (!block) return;
        const el = getBlockElementById(block.id, true);
        if (!el) return;
        setDragParams({ col, left: e.clientX, width: el.clientWidth });
      },
      [tableSettings],
    );

    const handleAddColumn = React.useCallback(
      (colIndex: number) => (e: React.MouseEvent) => {
        const currentBlock = editor.getBlock(blockId);
        if (!currentBlock) return;

        // 拡縮情報を更新
        const prevSettings = copyObject(tableSettings);
        const nextSettings: TableProps['attributes']['tableSettings'] = {};
        for (let c = 0; c < currentBlock.attributes.tableC + 1; c++) {
          if (c > colIndex) {
            if (!prevSettings[`cw${c - 1}`]) continue;
            nextSettings[`cw${c}`] = prevSettings[`cw${c - 1}`];
          } else if (c < colIndex) {
            if (!prevSettings[`cw${c}`]) continue;
            nextSettings[`cw${c}`] = prevSettings[`cw${c}`];
          }
        }

        editor.updateBlock({
          ...currentBlock,
          attributes: {
            ...currentBlock.attributes,
            tableC: currentBlock.attributes.tableC + 1,
            tableSettings: nextSettings,
          },
        });

        // 追加されたカラム位置より後のブロックを採番しなおす
        let createdBlocks: Block[] = [];
        let updatedBlockIds: string[] = [];
        for (let r = 0; r < currentBlock.attributes.tableR; r++) {
          for (let c = 0; c < currentBlock.attributes.tableC + 1; c++) {
            if (c === colIndex) {
              createdBlocks = [
                ...createdBlocks,
                { ...createBlock('PARAGRAPH'), name: `r${r}-c${c}` },
              ];
            }
            if (c > colIndex) {
              const childBlock = currentBlock.childBlocks.find((v) => v.name === `r${r}-c${c - 1}`);
              if (!childBlock) {
                const appendBlock = { ...createBlock('PARAGRAPH'), name: `r${r}-c${c}` };
                createdBlocks = [...createdBlocks, appendBlock];
              } else {
                editor.updateChildBlock(blockId, {
                  ...childBlock,
                  name: `r${r}-c${c}`,
                });
                updatedBlockIds = [...updatedBlockIds, childBlock.id];
              }
            }
          }
        }

        editor.createChildBlocks(blockId, createdBlocks);
        editor.getModule('history')?.optimizeOp();
        editor.render([blockId]);
        editor.renderChild(blockId, updatedBlockIds);
      },
      [blockId, editor, tableSettings],
    );

    const handleRemoveColumn = React.useCallback(
      (colIndex: number) => (e: React.MouseEvent) => {
        colIndex--;
        const currentBlock = editor.getBlock(blockId);
        if (!currentBlock) return;
        if (currentBlock.attributes.tableC <= 1) return;

        // 拡縮情報を更新
        const prevSettings = copyObject(tableSettings);
        const nextSettings: TableProps['attributes']['tableSettings'] = {};
        for (let c = 0; c < currentBlock.attributes.tableC; c++) {
          if (c > colIndex) {
            if (!prevSettings[`cw${c}`]) continue;
            nextSettings[`cw${c - 1}`] = prevSettings[`cw${c}`];
          } else if (c < colIndex) {
            if (!prevSettings[`cw${c}`]) continue;
            nextSettings[`cw${c}`] = prevSettings[`cw${c}`];
          }
        }

        editor.updateBlock({
          ...currentBlock,
          attributes: {
            ...currentBlock.attributes,
            tableC: currentBlock.attributes.tableC - 1,
            tableSettings: nextSettings,
          },
        });

        // 削除されたカラム位置より後のブロックを採番しなおす
        let removedBlockIds: string[] = [];
        let createdBlocks: Block[] = [];
        let updatedBlockIds: string[] = [];
        for (let r = 0; r < currentBlock.attributes.tableR; r++) {
          for (let c = 0; c < currentBlock.attributes.tableC; c++) {
            if (c === colIndex) {
              const childBlock = currentBlock.childBlocks.find((v) => v.name === `r${r}-c${c}`);
              if (childBlock) {
                removedBlockIds = [...removedBlockIds, childBlock.id];
              }
            }
            if (c > colIndex) {
              const childBlock = currentBlock.childBlocks.find((v) => v.name === `r${r}-c${c}`);
              if (!childBlock) {
                const appendBlock = { ...createBlock('PARAGRAPH'), name: `r${r}-c${c - 1}` };
                createdBlocks = [...createdBlocks, appendBlock];
              } else {
                editor.updateChildBlock(blockId, {
                  ...childBlock,
                  name: `r${r}-c${c - 1}`,
                });
                updatedBlockIds = [...updatedBlockIds, childBlock.id];
              }
            }
          }
        }

        if (createdBlocks.length > 0) {
          editor.createChildBlocks(blockId, createdBlocks);
        }
        editor.deleteChildBlocks(blockId, removedBlockIds);
        editor.getModule('history')?.optimizeOp();
        editor.render([blockId]);
        editor.renderChild(blockId, updatedBlockIds);
      },
      [blockId, editor, tableSettings],
    );

    const handleAddRow = React.useCallback(
      (rowIndex: number) => (e: React.MouseEvent) => {
        const currentBlock = editor.getBlock(blockId);
        if (!currentBlock) return;

        editor.updateBlock({
          ...currentBlock,
          attributes: {
            ...currentBlock.attributes,
            tableR: currentBlock.attributes.tableR + 1,
          },
        });

        // 追加されたカラム位置より後のブロックを採番しなおす
        let createdBlocks: Block[] = [];
        let updatedBlockIds: string[] = [];
        for (let r = 0; r < currentBlock.attributes.tableR + 1; r++) {
          for (let c = 0; c < currentBlock.attributes.tableC; c++) {
            if (r === rowIndex) {
              createdBlocks = [
                ...createdBlocks,
                { ...createBlock('PARAGRAPH'), name: `r${r}-c${c}` },
              ];
            }
            if (r > rowIndex) {
              const childBlock = currentBlock.childBlocks.find((v) => v.name === `r${r - 1}-c${c}`);
              if (!childBlock) {
                const appendBlock = { ...createBlock('PARAGRAPH'), name: `r${r}-c${c}` };
                createdBlocks = [...createdBlocks, appendBlock];
              } else {
                editor.updateChildBlock(blockId, {
                  ...childBlock,
                  name: `r${r}-c${c}`,
                });
                updatedBlockIds = [...updatedBlockIds, childBlock.id];
              }
            }
          }
        }

        editor.createChildBlocks(blockId, createdBlocks);
        editor.getModule('history')?.optimizeOp();
        editor.render([blockId]);
        editor.renderChild(blockId, updatedBlockIds);
      },
      [blockId, editor, tableSettings],
    );

    const handleRemoveRow = React.useCallback(
      (rowIndex: number) => (e: React.MouseEvent) => {
        rowIndex--;
        const currentBlock = editor.getBlock(blockId);
        if (!currentBlock) return;
        if (currentBlock.attributes.tableR <= 1) return;

        editor.updateBlock({
          ...currentBlock,
          attributes: {
            ...currentBlock.attributes,
            tableR: currentBlock.attributes.tableR - 1,
          },
        });

        // 削除されたカラム位置より後のブロックを採番しなおす
        let removedBlockIds: string[] = [];
        let createdBlocks: Block[] = [];
        let updatedBlockIds: string[] = [];
        for (let r = 0; r < currentBlock.attributes.tableR; r++) {
          for (let c = 0; c < currentBlock.attributes.tableC; c++) {
            if (r === rowIndex) {
              const childBlock = currentBlock.childBlocks.find((v) => v.name === `r${r}-c${c}`);
              if (childBlock) {
                removedBlockIds = [...removedBlockIds, childBlock.id];
              }
            }
            if (r > rowIndex) {
              const childBlock = currentBlock.childBlocks.find((v) => v.name === `r${r}-c${c}`);
              if (!childBlock) {
                const appendBlock = { ...createBlock('PARAGRAPH'), name: `r${r - 1}-c${c}` };
                createdBlocks = [...createdBlocks, appendBlock];
              } else {
                editor.updateChildBlock(blockId, {
                  ...childBlock,
                  name: `r${r - 1}-c${c}`,
                });
                updatedBlockIds = [...updatedBlockIds, childBlock.id];
              }
            }
          }
        }

        if (createdBlocks.length > 0) {
          editor.createChildBlocks(blockId, createdBlocks);
        }
        editor.deleteChildBlocks(blockId, removedBlockIds);
        editor.getModule('history')?.optimizeOp();
        editor.render([blockId]);
        editor.renderChild(blockId, updatedBlockIds);
      },
      [blockId, editor, tableSettings],
    );

    const memoTableRows: Block[][] = React.useMemo(() => {
      if (!tableR || !tableC) return [];
      let margedRows: Block[][] = [];
      for (let r = 0; r < tableR; r++) {
        margedRows[r] = [];
        for (let c = 0; c < tableC; c++) {
          const cellBlock = childBlocks.find((v) => v?.name === `r${r}-c${c}`);
          margedRows[r][c] = cellBlock ?? createBlock('PARAGRAPH');
        }
      }

      return margedRows;
    }, [childBlocks, tableR, tableC]);

    const memoTableWidths = React.useMemo(() => {
      let widths: number[] = [];
      for (let c = 0; c < tableC; c++) {
        widths[c] = Object.prototype.hasOwnProperty.call(tableSettings, `cw${c}`)
          ? tableSettings[`cw${c}`]
          : null;
      }

      return widths;
    }, [tableSettings]);

    const memoContents = React.useMemo(() => {
      return (
        <tbody>
          {memoTableRows?.map((row, rIndex) => {
            return (
              <StyledTr key={rIndex}>
                {row.map((column, cIndex) => {
                  return (
                    <StyledTd
                      key={memoTableRows[rIndex][cIndex].id}
                      data-child-block-name={memoTableRows[rIndex][cIndex].name}
                      style={{
                        minWidth:
                          memoTableWidths[cIndex] && rIndex === 0
                            ? `${memoTableWidths[cIndex]}px`
                            : '120px',
                        maxWidth:
                          memoTableWidths[cIndex] && rIndex === 0
                            ? `${memoTableWidths[cIndex]}px`
                            : '120px',
                      }}
                    >
                      <TableCell
                        formats={formats}
                        editor={editor}
                        scrollContainer={scrollContainer}
                        parentBlockId={blockId}
                        blockId={memoTableRows[rIndex][cIndex].id}
                      />
                      <Resizer
                        style={{
                          backgroundColor:
                            cIndex === hoverResizeCol || cIndex === dragParams?.col
                              ? 'red'
                              : 'transparent',
                        }}
                        onMouseOver={handleResizeMouseOver(cIndex)}
                        onMouseLeave={handleResizeMouseLeave}
                        onMouseDown={handleMouseDown(cIndex)}
                        draggable="false"
                      />
                      {rIndex === 0 && cIndex === 0 && (
                        <AddColumn
                          onClick={handleAddColumn(cIndex)}
                          style={{ right: 'auto', left: '-14px' }}
                        >
                          +
                        </AddColumn>
                      )}
                      {rIndex === 0 && (
                        <AddColumn onClick={handleAddColumn(cIndex + 1)}>+</AddColumn>
                      )}
                      {rIndex === 0 && (
                        <RemoveColumn onClick={handleRemoveColumn(cIndex + 1)}>-</RemoveColumn>
                      )}
                      {cIndex === 0 && <AddRow onClick={handleAddRow(rIndex + 1)}>+</AddRow>}
                      {cIndex === 0 && (
                        <RemoveRow onClick={handleRemoveRow(rIndex + 1)}>-</RemoveRow>
                      )}
                    </StyledTd>
                  );
                })}
              </StyledTr>
            );
          })}
        </tbody>
      );
    }, [
      memoTableRows,
      memoTableWidths,
      formats,
      scrollContainer,
      editor,
      hoverResizeCol,
      dragParams,
    ]);

    React.useEffect(() => {
      if (!editor || !dragParams) return;

      const handleMouseMove = (e: MouseEvent) => {
        let width = 0;
        if (e.clientX > dragParams.left) {
          width = dragParams.width + (e.clientX - dragParams.left);
        } else {
          width = dragParams.width - (dragParams.left - e.clientX);
        }
        if (width < 120) {
          width = 120;
        }

        const block = childBlocks.find((v) => v.name === `r0-c${dragParams.col}`);
        if (!block) return;
        const el = getBlockElementById(block.id, true);
        if (!el?.parentElement) return;
        el.parentElement.style.minWidth = `${width}px`;
        el.parentElement.style.maxWidth = `${width}px`;
      };

      const handleMouseUp = (e: MouseEvent) => {
        const block = childBlocks.find((v) => v.name === `r0-c${dragParams.col}`);
        if (!block) return;
        const el = getBlockElementById(block.id, true);
        if (!el?.parentElement) return;
        setDragParams(undefined);
        const currentBlock = editor.getBlock(blockId);
        if (!currentBlock) return;
        const _settings = copyObject(tableSettings);
        _settings[`cw${dragParams.col}`] = el.parentElement.getBoundingClientRect().width;
        editor.updateBlock({
          ...currentBlock,
          attributes: {
            ...currentBlock.attributes,
            tableSettings: {
              ...(currentBlock.attributes.tableSettings ?? {}),
              ..._settings,
            },
          },
        });
        editor.render([blockId]);
      };

      window.addEventListener('mousemove', handleMouseMove, true);
      window.addEventListener('mouseup', handleMouseUp, true);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove, true);
        window.removeEventListener('mouseup', handleMouseUp, true);
      };
    }, [dragParams, childBlocks, tableSettings]);

    return (
      <Container {...props} contentEditable={false} draggable="false" onBeforeInput={handleInput}>
        <StyledTable ref={tableRef}>{memoContents}</StyledTable>
      </Container>
    );
  },
);

export const TableCell = React.memo(
  ({ parentBlockId, blockId, formats, scrollContainer, editor }: TableCellProps) => {
    const block = useChildBlockRenderer({ parentBlockId, blockId, editor });

    const memoContent = React.useMemo(() => {
      return (
        <TableContent
          suppressContentEditableWarning
          contentEditable={true}
          data-child-block-id={block?.id}
        >
          <InlineContainer
            contents={block?.contents ?? []}
            formats={formats}
            editor={editor}
            scrollContainer={scrollContainer}
          />
        </TableContent>
      );
    }, [block?.id, block?.contents, editor, scrollContainer]);

    return <>{memoContent}</>;
  },
);
