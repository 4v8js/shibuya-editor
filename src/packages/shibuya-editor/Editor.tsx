import * as React from 'react';
import styled, { css } from 'styled-components';
import { Subscription } from 'rxjs';
import {
  BlockContainer,
  Header1,
  Header2,
  Header3,
  OrderedList,
  BulletList,
  CheckList,
  Blockquote,
  CodeBlock,
  Decision,
  Task,
  Paragraph,
  Image,
  File,
  Table,
  YouTube,
} from './components/blocks';
import { InlineText, CodeToken } from './components/inlines';
import { Bold, Strike, Underline, InlineCode, Italic, Color, Link } from './components/styles';
import { GlobalToolbar, BubbleToolbar } from './components/toolbar';
import { useEditor } from './hooks/use-editor';
import { useEventEmitter } from './hooks/use-event-emitter';
import {
  EditorModule,
  KeyBoardModule,
  LoggerModule,
  ToolbarModule,
  SelectorModule,
  HistoryModule,
  ClipboardModule,
  MarkdownShortcutModule,
  UploaderModule,
  DragDropModule,
  CollaboratorModule,
  TocModule,
} from './modules';
import { getBlockElementById, getBlockLength } from './utils/block';
import { EditorEvents } from './constants';
import { LinkPopup } from './components/popups';
import { Formats, Block, Settings, EditorController } from './types';
import { Collaborators } from './components/Collaborators';
import { PalettePopup } from './components/popups/PalettePopup';
import { useMutationObserver } from './hooks';

interface Props {
  readOnly?: boolean;
  placeholder?: string;
  formats?: { [key: string]: any };
  settings?: Partial<Settings>;
  ref?: React.Ref<EditorController>;
}

const Container = styled.div`
  border: 1px solid #ccc;
  border-radius: 12px;
  margin: 12px;
  padding: 12px 0;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  cursor: text;
  position: relative;
  deepl-inline-translate {
    display: none;
  }
`;
const Inner = styled.div<{ $placeholder?: string }>`
  flex-shrink: 0;
  flex-grow: 0;
  position: relative;
  ${({ $placeholder }) => {
    return (
      $placeholder &&
      css`
        ::after {
          position: absolute;
          top: 4px;
          left: 12px;
          pointer-events: none;
          opacity: 0.3;
          content: '${$placeholder}';
        }
      `
    );
  }}
`;
const MarginBottom = styled.div`
  flex-shrink: 0;
  flex-grow: 1;
  user-select: none;
`;
const Selector = styled.div`
  left: -100000px;
  height: 1px;
  overflow-y: hidden;
  position: absolute;
  top: 50%;
`;

export const Editor = React.memo(
  ({
    readOnly = false,
    placeholder = 'ご自由にお書きください',
    formats,
    settings = {},
    ref: forwardRef,
    ...props
  }: Props) => {
      const [eventEmitter, eventTool] = useEventEmitter();
      const [editorRef, editor] = useEditor({
        settings: {
          // default settings
          scrollMarginTop: settings.scrollMarginTop ?? 100,
          scrollMarginBottom: settings.scrollMarginBottom ?? 250,
          allowFormats: settings.allowFormats ?? [],
          embeddedBlocks: settings.embeddedBlocks ?? ['IMAGE', 'FILE', 'TABLE', 'YOUTUBE'],
          collaborationLevel: settings.collaborationLevel ?? 'block',
          indentableFormats: settings.indentableFormats ?? ['ORDERED-LIST', 'BULLET-LIST'],
          disableDecorationFormats: settings.disableDecorationFormats ?? ['CODE-BLOCK'],
          scrollContainer: settings.scrollContainer,
        },
        eventEmitter,
      });
      const containerRef = React.useRef<HTMLDivElement>(null);
      const [blockFormats, setBlockFormats] = React.useState<Formats>({
        'toolbar/global': GlobalToolbar,
        'toolbar/bubble': BubbleToolbar,
        'block/container': BlockContainer,
        'block/paragraph': Paragraph,
        'block/ordered-list': OrderedList,
        'block/bullet-list': BulletList,
        'block/check-list': CheckList,
        'block/header1': Header1,
        'block/header2': Header2,
        'block/header3': Header3,
        'block/blockquote': Blockquote,
        'block/code-block': CodeBlock,
        'block/decision': Decision,
        'block/task': Task,
        'block/image': Image,
        'block/file': File,
        'block/table': Table,
        'block/youtube': YouTube,
        'inline/text': InlineText,
        'inline/code-token': CodeToken,
        'inline/style/bold': Bold,
        'inline/style/underline': Underline,
        'inline/style/strike': Strike,
        'inline/style/code': InlineCode,
        'inline/style/italic': Italic,
        'inline/style/link': Link,
        'inline/style/color': Color,
        'popup/link': LinkPopup,
        'popup/palette': PalettePopup,
      });
      const [blocks, setBlocks] = React.useState<Block[]>([]);
      const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
      const [showPlaceholder, setShowPlaceholder] = React.useState(false);
      const handleChangeElement = React.useCallback(() => {
        if (!containerRef.current) return;
        const changedBlocks = editor.getBlocks();
        if (
          changedBlocks.length <= 1 &&
          changedBlocks[0].type === 'PARAGRAPH' &&
          (getBlockLength(changedBlocks[0].id) ?? 0) < 1
        ) {
          setShowPlaceholder(true);
        } else {
          setShowPlaceholder(false);
        }
      }, [editor]);
      useMutationObserver(containerRef, handleChangeElement);

      const handleKeyDown = React.useCallback(
        (event: React.KeyboardEvent) => {
          const keyboard = editor.getModule('keyboard');
          if (keyboard && keyboard instanceof KeyBoardModule) {
            keyboard.onKeyDown(event);
          }
        },
        [editor],
      );

      const handleSelectorKeyDown = React.useCallback(
        (event: React.KeyboardEvent) => {
          const selector = editor.getModule('selector');
          if (selector) {
            selector.onKeyDown(event);
          }
        },
        [editor],
      );

      const handleCopy = React.useCallback(
        (event: React.ClipboardEvent) => {
          const clipboard = editor.getModule('clipboard');
          if (clipboard) {
            clipboard.onCopy(event);
          }
        },
        [editor],
      );

      const handleCut = React.useCallback(
        (event: React.ClipboardEvent) => {
          const clipboard = editor.getModule('clipboard');
          if (clipboard) {
            clipboard.onCut(event);
          }
        },
        [editor],
      );

      const handleSelectorInput = React.useCallback(
        (event: React.FormEvent) => {
          // event.preventDefault();
          // event.stopPropagation();
        },
        [editor],
      );

      const handleCompositionStart = React.useCallback(
        (event: React.CompositionEvent) => {
          const keyboard = editor.getModule('keyboard');
          if (keyboard && keyboard instanceof KeyBoardModule) {
            keyboard.onCompositionStart(event);
          }
        },
        [editor],
      );

      const handleCompositionEnd = React.useCallback(
        (event: React.CompositionEvent) => {
          const keyboard = editor.getModule('keyboard');
          if (keyboard && keyboard instanceof KeyBoardModule) {
            keyboard.onCompositionEnd(event);
          }
        },
        [editor],
      );

      const handleInput = React.useCallback((e: React.FormEvent) => {
        const keyboard = editor.getModule('keyboard');
        if (keyboard) {
          keyboard.onInput(e);
        }
      }, []);

      const handleClick = React.useCallback(
        (e: React.MouseEvent) => {
          editor.updateCaretRect();
        },
        [editor],
      );

      const handlePaste = React.useCallback(
        (e: React.ClipboardEvent) => {
          editor.getModule('clipboard').onPaste(e.nativeEvent);
        },
        [editor],
      );

      const handleDrop = React.useCallback(
        (e: React.DragEvent) => {
          e.preventDefault();
          editor.getModule('drag-drop').handleDrop(e.nativeEvent);
        },
        [editor],
      );

      const handleDrag = React.useCallback(
        (e: React.DragEvent) => {
          e.preventDefault();
        },
        [editor],
      );

      const handleDragOver = React.useCallback(
        (e: React.DragEvent) => {
          if ((e.target as HTMLElement)?.getAttribute('contenteditable') !== 'true') {
            e.preventDefault();
          }
        },
        [editor],
      );

      const handleContainerClick = React.useCallback(
        (e: React.MouseEvent) => {
          const lastBlock = blocks[blocks.length - 1];
          if (!lastBlock) return;
          const element = getBlockElementById(lastBlock.id);
          if (!element) return;
          e.preventDefault();
          editor.setCaretPosition({
            blockId: lastBlock.id,
            index: editor.getBlockLength(lastBlock.id) ?? 0,
          });
        },
        [blocks],
      );

      React.useEffect(() => {
        const subs = new Subscription();
        editor.addModules(
          [
            { name: 'logger', module: LoggerModule },
            { name: 'editor', module: EditorModule },
            { name: 'keyboard', module: KeyBoardModule },
            { name: 'toolbar', module: ToolbarModule },
            { name: 'selector', module: SelectorModule },
            { name: 'history', module: HistoryModule },
            { name: 'clipboard', module: ClipboardModule },
            { name: 'markdown-shortcut', module: MarkdownShortcutModule },
            { name: 'uploader', module: UploaderModule },
            { name: 'drag-drop', module: DragDropModule },
            { name: 'collaborator', module: CollaboratorModule },
            { name: 'toc', module: TocModule },
          ],
          settings?.modules ?? {},
        );
        subs.add(
          eventEmitter.select(EditorEvents.EVENT_BLOCK_RERENDER).subscribe(() => {
            const renderBlocks = editor.getBlocks();
            setBlocks(renderBlocks);

            if (renderBlocks.length > 2000) {
              editor.getModule('selector').changeAreaMoveDelay(300);
            } else if (renderBlocks.length > 1000) {
              editor.getModule('selector').changeAreaMoveDelay(200);
            } else if (renderBlocks.length > 500) {
              editor.getModule('selector').changeAreaMoveDelay(100);
            } else {
              editor.getModule('selector').changeAreaMoveDelay(50);
            }
          }),
        );
        subs.add(eventEmitter.select(EditorEvents.EVENT_EDITOR_HISTORY_PUSH).subscribe(() => {}));
        subs.add(
          eventEmitter.select(EditorEvents.EVENT_BLOCK_SELECTED).subscribe((blockIds: string[]) => {
            setSelectedIds(blockIds);
          }),
        );
        editor.render();

        return () => {
          editor.removeAllModules();
          subs.unsubscribe();
        };
      }, [editor]);

      React.useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
          if (editorRef.current?.contains(e.target as Element)) {
            editor.getModule('selector').mouseDown(e);
          } else {
            editor.getModule('selector').areaStart(e);
          }
        };

        const handleMouseMove = (e: MouseEvent) => {
          editor.getModule('selector')?.mouseMove(e);
        };

        const handleMouseUp = (e: MouseEvent) => {
          editor.getModule('selector').mouseUp(e);
        };

        const handleOutsideClick = (e: MouseEvent) => {
          if (!editorRef.current || editorRef.current.contains(e.target as Node)) {
            return;
          }
          editor.getModule('selector').reset(e);
        };

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('click', handleOutsideClick);

        return () => {
          document.removeEventListener('mousedown', handleMouseDown);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.removeEventListener('click', handleOutsideClick);
        };
      }, [editor]);

      React.useEffect(() => {
        const appendFormats = formats ?? {};
        setBlockFormats((prevFormats) => {
          return { ...prevFormats, ...appendFormats };
        });
      }, [formats]);

      const memoBlocks = React.useMemo(() => {
        return blocks.map((v, i) => {
          return {
            id: v.id,
            type: v.type,
            selected: selectedIds.includes(v.id),
          };
        });
      }, [blocks, selectedIds]);

      const memoEditor = React.useMemo(() => {
        return editor;
      }, []);

      const MemoGlobalToolbar = React.useMemo(() => {
        return blockFormats['toolbar/global'];
      }, [blockFormats]);

      const MemoBubbleToolbar = React.useMemo(() => {
        return blockFormats['toolbar/bubble'];
      }, [blockFormats]);

      const MemoLinkPopup = React.useMemo(() => {
        return blockFormats['popup/link'];
      }, [blockFormats]);

      const MemoPalettePopup = React.useMemo(() => {
        return blockFormats['popup/palette'];
      }, [blockFormats]);

      React.useImperativeHandle(forwardRef, () => editor, [editor]);

      const BlockItem = blockFormats['block/container'];
      return (
        <Container ref={containerRef} {...props}>
          <Inner
            ref={editorRef}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onCopy={handleCopy}
            onCut={handleCut}
            onDrop={handleDrop}
            onDrag={handleDrag}
            onDragOver={handleDragOver}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onBeforeInput={handleInput}
            $placeholder={showPlaceholder ? placeholder : ''}
          >
            {memoBlocks.map((block, index) => {
              return (
                <BlockItem
                  key={block.id}
                  formats={blockFormats}
                  editor={memoEditor}
                  blockId={block.id}
                  readOnly={readOnly}
                  selected={block.selected}
                  scrollContainer={settings.scrollContainer}
                />
              );
            })}
          </Inner>
          <MarginBottom onClick={handleContainerClick} />
          <MemoGlobalToolbar editor={memoEditor} />
          <MemoBubbleToolbar editor={memoEditor} scrollContainer={settings.scrollContainer} />
          <Collaborators editor={memoEditor} />
          <MemoLinkPopup editor={memoEditor} scrollContainer={settings.scrollContainer} />
          <MemoPalettePopup editor={memoEditor} scrollContainer={settings.scrollContainer} />
          <Selector
            contentEditable={true}
            className="clipboard"
            onKeyDown={handleSelectorKeyDown}
            onBeforeInput={handleSelectorInput}
            onCopy={handleCopy}
            onCut={handleCut}
          />
        </Container>
      );
  },
);
