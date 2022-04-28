import * as React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { Subscription } from 'rxjs';
import { EditorEvents } from '../../constants';
import { EditorController } from '../../types/editor';
import { InlineAttributes } from '../../types/inline';
import { BlockType } from '../../types/block';
import { getScrollContainer } from '../../utils/dom';
import { LinkPopup } from '../popups';
import { CaretPosition } from '../../types/caret';

export interface BubbleToolbarProps {
  editor: EditorController;
  scrollContainer?: HTMLElement | string;
}

interface ContainerProps {
  top: number;
  left: number;
}

interface ToolbarPosition {
  top: number;
  left: number;
}

interface ButtonProps {
  active: boolean;
}

const Container = styled.div<ContainerProps>`
  position: absolute;
  top: ${({ top }) => `${top}px`};
  left: ${({ left }) => `${left}px`};
  transform: translateY(-100%);
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #ccc;
  padding: 4px;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 1;
`;

const Button = styled.a<ButtonProps>`
  display: inline-block;
  padding: 2px 8px;
  text-decoration: none;
  border-radius: 8px;
  margin: 0 4px;
  ${({ active }) => active && 'background-color: #e3def3'};
  &:hover {
    background-color: #e3def3;
  }
`;

export const BubbleToolbar = React.memo(
  ({ editor, scrollContainer, ...props }: BubbleToolbarProps) => {
    const [formats, setFormats] = React.useState<InlineAttributes>({});
    const [position, setPosition] = React.useState<ToolbarPosition>();
    const [blockType, setBlockType] = React.useState<BlockType>();
    const [collapsed, setCollapsed] = React.useState<boolean>(true);
    const [currentCaretPosition, setCurrentCaretPosition] = React.useState<CaretPosition | null>();

    const handleBold = React.useCallback(
      (event: React.MouseEvent) => {
        event.preventDefault();
        editor.getModule('toolbar').formatInline({ bold: !formats?.bold });
      },
      [formats],
    );

    const handleUnderline = React.useCallback(
      (event: React.MouseEvent) => {
        event.preventDefault();
        editor.getModule('toolbar').formatInline({ underline: !formats?.underline });
      },
      [formats],
    );

    const handleStrike = React.useCallback(
      (event: React.MouseEvent) => {
        event.preventDefault();
        editor.getModule('toolbar').formatInline({ strike: !formats?.strike });
      },
      [formats],
    );

    const handleLink = React.useCallback(
      (event: React.MouseEvent) => {
        event.preventDefault();
        const eventEmitter = editor.getEventEmitter();
        eventEmitter.emit(EditorEvents.EVENT_LINK_CLICK, {
          mode: 'openEnterLink',
          caretPosition: currentCaretPosition,
        });
      },
      [formats, currentCaretPosition],
    );

    const handleInlineCode = React.useCallback(
      (event: React.MouseEvent) => {
        event.preventDefault();
        editor.getModule('toolbar').formatInline({ code: !formats?.code });
      },
      [formats],
    );

    const handleHeader1 = React.useCallback(
      (event: React.MouseEvent) => {
        event.preventDefault();
        editor.getModule('toolbar').formatBlock('HEADER1');
      },
      [formats],
    );

    React.useEffect(() => {
      const subs = new Subscription();
      const eventEmitter = editor.getEventEmitter();
      subs.add(
        eventEmitter.select(EditorEvents.EVENT_SELECTION_CHANGE).subscribe((v) => {
          const caret = editor.getCaretPosition();
          if (!caret || !editor.hasFocus()) {
            setPosition(undefined);
            setCollapsed(true);
            return;
          }
          const container = getScrollContainer(scrollContainer);
          if (container) {
            const containerRect = container.getBoundingClientRect();
            const top = (container?.scrollTop ?? 0) + caret.rect.top - containerRect.top;
            const left = caret.rect.left - containerRect.left;
            setPosition({ top, left });
          } else {
            const scrollEl = document.scrollingElement as HTMLElement;
            const top = scrollEl.scrollTop + caret.rect.top;
            const left = caret.rect.left;
            setPosition({ top, left });
          }

          setCollapsed(caret.collapsed);
          setFormats(editor.getFormats(caret.blockId, caret.index, caret.length));
          setBlockType(editor.getBlock(caret.blockId)?.type);
        }),
      );
      return () => {
        subs.unsubscribe();
      };
    }, [editor, scrollContainer]);

    return ReactDOM.createPortal(
      <>
        {!collapsed && (
          <Container top={position?.top ?? 0} left={position?.left ?? 0} {...props}>
            <Button href="#" onClick={handleHeader1} active={blockType === 'HEADER1'}>
              H1
            </Button>
            <Button href="#" onClick={handleBold} active={!!formats?.bold}>
              B
            </Button>
            <Button href="#" onClick={handleUnderline} active={!!formats?.underline}>
              U
            </Button>
            <Button href="#" onClick={handleStrike} active={!!formats?.strike}>
              S
            </Button>
            <Button href="#" onClick={handleInlineCode} active={!!formats?.code}>
              code
            </Button>
            <Button href="#" onClick={handleLink} active={!!formats?.link}>
              L
            </Button>
          </Container>
        )}
      </>,
      getScrollContainer(scrollContainer) ?? document.body,
    );
  },
);
