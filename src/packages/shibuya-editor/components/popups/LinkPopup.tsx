import * as React from 'react';
import ReactDOM from 'react-dom';
import { Subscription } from 'rxjs';
import styled from 'styled-components';
import { EditorEvents, KeyCodes } from '../../constants';
import { CaretPosition } from '../../types/caret';
import { EditorController } from '../../types/editor';
import { Inline, InlineAttributes } from '../../types/inline';
import { getHtmlElement } from '../../utils/dom';
import { TOOLBAR_CHILD_WIDTH } from '../toolbar';
import {
  getBlockId,
  getChildBlockId,
  getChildBlockRangeByElement,
  getRangeByElement,
} from '../../utils/block';
import { FormatLink } from '../icons';

export interface LinkPopupProps {
  editor: EditorController;
  scrollContainer?: HTMLElement | string;
}

interface PopupPosition {
  top: number;
  left: number;
}

interface Props {
  editor: EditorController;
  style?: React.ComponentProps<'div'>['style'];
  scrollContainer?: HTMLElement | string;
}

const PopupContainer = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #e4e4e7;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  font-size: 14px;
  z-index: 10;
  width: 320px;
  box-sizing: border-box;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  padding: 6px 10px;
  background-color: #fafafa;
  &:focus-within {
    border-color: #a1a1aa;
    background-color: #fff;
  }
`;

const StyledInput = styled.input`
  border: none;
  outline: none;
  flex: 1;
  font-size: 14px;
  color: #18181b;
  background: transparent;
  min-width: 0;
  &::placeholder {
    color: #a1a1aa;
  }
`;

const RemoveButton = styled.button`
  font-size: 13px;
  color: #ef4444;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  &:hover {
    text-decoration: underline;
  }
`;

export const LinkPopup = React.memo(({ editor, scrollContainer, ...props }: Props) => {
  const [formats, setFormats] = React.useState<InlineAttributes>({});
  const [linkUrl, setLinkUrl] = React.useState('');
  const [inline, setInline] = React.useState<Inline>();
  const [popupMode, setPopupMode] = React.useState();
  const [popupOpen, setPopupOpen] = React.useState(false);
  const [inlineElement, setInlineElement] = React.useState<Element | null>(null);
  const [popupPosition, setPopupPosition] = React.useState<PopupPosition>();
  const [currentCaretPosition, setCurrentCaretPosition] = React.useState<CaretPosition | null>();
  const [hasExistingLink, setHasExistingLink] = React.useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setLinkUrl(event.target.value);
    },
    [linkUrl],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.code === KeyCodes.ENTER) {
        handleSave();
        setPopupOpen(false);
      }
      if (event.key === 'Escape') {
        setPopupOpen(false);
        setTimeout(() => editor.focus(), 10);
      }
    },
    [linkUrl, currentCaretPosition],
  );

  const handleDelete = React.useCallback(() => {
    const parent = inlineElement?.parentElement;
    if (!parent) return;
    const [blockId] = getBlockId(parent);
    if (!blockId) return;
    const [childBlockId] = getChildBlockId(parent);
    const block = editor.getBlock(blockId);
    const blockRect = parent.getBoundingClientRect();
    if (childBlockId) {
      const childRange = getChildBlockRangeByElement(inlineElement as HTMLElement);
      if (!childRange || !block) return;
      editor.getModule('toolbar').formatInline(
        { link: '' },
        {
          blockId: block.id,
          index: childRange[0],
          length: childRange[1] - childRange[0],
          childBlockId,
          collapsed: false,
          isBottom: true,
          isTop: true,
          rect: blockRect,
          blockFormat: `block/${block?.type.toLocaleLowerCase()}`,
        },
      );
    } else {
      if (blockId) {
        const range = getRangeByElement(inlineElement as HTMLElement);
        if (!range || !block) return;
        editor.getModule('toolbar').formatInline(
          { link: '' },
          {
            blockId,
            index: range[0],
            length: range[1] - range[0],
            childBlockId: null,
            collapsed: false,
            isBottom: true,
            isTop: true,
            rect: blockRect,
            blockFormat: `block/${block?.type.toLocaleLowerCase()}`,
          },
        );
      }
    }

    setPopupOpen(false);
    setInline(undefined);
    setInlineElement(null);
    setTimeout(() => editor.focus(), 10);
  }, [currentCaretPosition, editor, inlineElement]);

  const handleSave = React.useCallback(() => {
    if (!currentCaretPosition) {
      const parent = inlineElement?.parentElement;
      if (!parent) return;
      const [blockId] = getBlockId(parent);
      if (!blockId) return;
      const range = getRangeByElement(inlineElement as HTMLElement);
      const block = editor.getBlock(blockId);
      const blockRect = parent.getBoundingClientRect();
      if (!range || !block) return;
      editor.getModule('toolbar').formatInline(
        { link: linkUrl },
        {
          blockId,
          index: range[0],
          length: range[1] - range[0],
          childBlockId: null,
          collapsed: false,
          isBottom: true,
          isTop: true,
          rect: blockRect,
          blockFormat: `block/${block?.type.toLocaleLowerCase()}`,
        },
      );
    } else {
      editor.getModule('toolbar').setUpdating(true);
      editor.getModule('toolbar').formatInline({ link: linkUrl }, currentCaretPosition);
      setTimeout(() => editor.getModule('toolbar').setUpdating(false), 100);
    }
    setTimeout(() => editor.focus(), 10);
  }, [inline, linkUrl, currentCaretPosition, editor, inlineElement, getBlockId]);

  React.useEffect(() => {
    const subs = new Subscription();
    const eventEmitter = editor.getEventEmitter();
    subs.add(
      eventEmitter.select(EditorEvents.EVENT_LINK_CLICK).subscribe((v) => {
        setHasExistingLink(!!v.link);
        if (v.mode) {
          setPopupMode(v.mode);
        }
        setLinkUrl(v.link ?? '');
        setInline(v.inline ?? undefined);
        const container = getHtmlElement(scrollContainer);
        const caret = editor.getCaretPosition();
        setPopupOpen(true);
        if (!caret || v.inline) {
          const element = document.querySelector(`[data-inline-id="${v.inline.id}"]`);
          setInlineElement(element);
          const linkRect = element?.getBoundingClientRect();
          if (!container) return;
          const containerRect = container.getBoundingClientRect();
          if (linkRect) {
            const top = linkRect.top + (container?.scrollTop ?? 0) + containerRect.top + 4;
            const left = linkRect.left - containerRect.left;
            setPopupPosition({ top, left });
          }
          setCurrentCaretPosition(null);
          return;
        }
        const linkRect = document.getElementById('toolbar-link')?.getBoundingClientRect();
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const top = (container?.scrollTop ?? 0) + caret?.rect.top - containerRect.top + 4;
          if (linkRect) {
            const left = linkRect.left - containerRect.left - TOOLBAR_CHILD_WIDTH;
            setPopupPosition({ top, left });
          } else {
            setPopupPosition({
              top,
              left: caret?.rect.left - containerRect.left,
            });
          }
        } else {
          const scrollEl = document.scrollingElement as HTMLElement;
          const top = scrollEl.scrollTop + caret?.rect.top + 4;
          const left = caret?.rect.left;
          setPopupPosition({ top, left });
        }
        if (caret) {
          setFormats(editor.getFormats(caret?.blockId, caret?.index, caret?.length));
        }
        setCurrentCaretPosition(v.caretPosition ? v.caretPosition : caret);
      }),
    );
    return () => {
      subs.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (popupOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [popupOpen]);

  React.useEffect(() => {
    if (!popupOpen) return;
    const handleClose = (e: MouseEvent) => {
      if (!modalRef.current?.contains(e.target as Node)) {
        setPopupOpen(false);
      }
    };
    document.addEventListener('click', handleClose, true);
    return () => {
      document.removeEventListener('click', handleClose, true);
    };
  }, [popupOpen]);

  return ReactDOM.createPortal(
    popupOpen &&
      popupMode === 'openEnterLink' && (
        <div ref={modalRef}>
          <PopupContainer
            style={{
              top: popupPosition?.top ?? 0,
              left: popupPosition?.left ?? 0,
            }}
          >
            <InputWrapper>
              <FormatLink size="16" fill="#a1a1aa" />
              <StyledInput
                ref={inputRef}
                value={linkUrl}
                placeholder="URLを入力"
                onChange={handleChange}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
              />
            </InputWrapper>
            {hasExistingLink && (
              <RemoveButton onClick={handleDelete}>リンクを解除</RemoveButton>
            )}
          </PopupContainer>
        </div>
      ),
    getHtmlElement(scrollContainer) ?? document.body,
  );
});
