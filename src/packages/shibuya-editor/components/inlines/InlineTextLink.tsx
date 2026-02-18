import * as React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { EditorController, Formats, Inline } from '../../types';
import { getHtmlElement } from '../../utils/dom';
import { EditorEvents } from '../../constants';
import { Copy, ExternalLink, Pencil, Unlink } from '../icons';
import {
  getBlockId,
  getChildBlockId,
  getChildBlockRangeByElement,
  getRangeByElement,
} from '../../utils/block';

interface Props {
  editor: EditorController;
  inline: Inline;
  attributes: Inline['attributes'];
  formats: Formats;
  innerHtml: {
    __html: string;
  };
  scrollContainer?: HTMLElement | string;
  onClick: () => void;
}

interface InlineContentProps {
  attributes: Inline['attributes'];
  formats: Formats;
}

interface PopupProps extends PopupPosition {
  link: string;
  editor: EditorController;
  inline: Inline;
  scrollContainer?: HTMLElement | string;
  onMouseEnter: () => void;
  onEdit: () => void;
  onClose: () => void;
}

interface PopupPosition {
  top: number;
  left: number;
}

const Container = styled.a<InlineContentProps>`
  position: relative;
  &::selection {
    background: rgba(46, 170, 220, 0.2);
  }
  img.emoji {
    height: 1em;
    width: 1em;
    margin: 0 0.05em 0 0.1em;
    vertical-align: -0.1em;
    &::selection {
      background: rgba(46, 170, 220, 0.2);
    }
  }
  ${({ attributes, formats }) => {
    return Object.keys(attributes).map((key: string) => {
      const styleFormat = `inline/style/${key}`;
      if (attributes[key] && formats[styleFormat]) {
        return formats[styleFormat](attributes[key]);
      }
      return;
    });
  }}
`;

const HoverPopupContainer = styled.div<PopupPosition>`
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 6px;
  top: ${(props) => props.top ?? 0}px;
  left: ${(props) => props.left ?? 0}px;
  padding: 8px 12px;
  border: 1px solid #e4e4e7;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  font-size: 13px;
  z-index: 10;
  max-width: 360px;
`;

const PopupLinkText = styled.a`
  display: block;
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #2563eb;
  text-decoration: none;
  font-size: 13px;
  &:hover {
    text-decoration: underline;
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: 2px;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  border-radius: 4px;
  cursor: pointer;
  color: #71717a;
  &:hover {
    background-color: #f4f4f5;
  }
`;

const CopiedText = styled.span`
  font-size: 12px;
  color: #22c55e;
  display: flex;
  align-items: center;
  padding: 0 4px;
`;

const HoverPopup = React.memo(
  ({ top, left, link, editor, inline, scrollContainer, onMouseEnter, onEdit, onClose }: PopupProps) => {
    const modalRef = React.useRef<HTMLDivElement>(null);
    const [copied, setCopied] = React.useState(false);

    const handleEdit = React.useCallback(() => {
      onEdit();
    }, [onEdit]);

    const handleCopy = React.useCallback(async () => {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }, [link]);

    const handleOpenLink = React.useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        window.open(link, '_blank', 'noreferrer');
      },
      [link],
    );

    const handleUnlink = React.useCallback(() => {
      const element = document.querySelector(`[data-inline-id="${inline.id}"]`);
      if (!element) return;
      const parent = element.parentElement;
      if (!parent) return;
      const [blockId] = getBlockId(parent);
      if (!blockId) return;
      const [childBlockId] = getChildBlockId(parent);
      const block = editor.getBlock(blockId);
      const blockRect = parent.getBoundingClientRect();
      if (childBlockId) {
        const childRange = getChildBlockRangeByElement(element as HTMLElement);
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
        const range = getRangeByElement(element as HTMLElement);
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
      onClose();
    }, [editor, inline, onClose]);

    const handleMouseLeave = React.useCallback(() => {
      onClose();
    }, [onClose]);

    const handleMouseEnter = React.useCallback(() => {
      onMouseEnter();
    }, [onMouseEnter]);

    React.useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (!modalRef.current?.contains(e.target as Node)) {
          onClose();
        }
      };
      document.addEventListener('click', handleClickOutside, true);
      return () => {
        document.removeEventListener('click', handleClickOutside, true);
      };
    }, [onClose]);

    return ReactDOM.createPortal(
      <HoverPopupContainer
        ref={modalRef}
        top={top}
        left={left}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <PopupLinkText href={link} target="_blank" rel="noreferrer" onClick={handleOpenLink}>
          {link}
        </PopupLinkText>
        <ActionRow>
          {copied ? (
            <CopiedText>Copied!</CopiedText>
          ) : (
            <IconButton onClick={handleCopy} title="URLをコピー">
              <Copy size="15" fill="#71717a" />
            </IconButton>
          )}
          <IconButton onClick={handleEdit} title="編集">
            <Pencil size="15" fill="#71717a" />
          </IconButton>
          <IconButton onClick={handleOpenLink} title="新しいタブで開く">
            <ExternalLink size="15" fill="#71717a" />
          </IconButton>
          <IconButton onClick={handleUnlink} title="リンクを解除">
            <Unlink size="15" fill="#71717a" />
          </IconButton>
        </ActionRow>
      </HoverPopupContainer>,
      getHtmlElement(scrollContainer) ?? document.body,
    );
  },
);

export const InlineTextLink = React.memo(
  ({
    editor,
    inline,
    scrollContainer,
    attributes,
    formats,
    innerHtml,
    onClick,
    ...props
  }: Props) => {
    const [popupPosition, setPopupPosition] = React.useState<PopupPosition | null>(null);
    const positionRef = React.useRef<PopupPosition | null>(null);
    positionRef.current = popupPosition;
    const hoverTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const leaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const handleEdit = React.useCallback(() => {
      setPopupPosition(null);
      const eventEmitter = editor.getEventEmitter();
      eventEmitter.emit(EditorEvents.EVENT_LINK_CLICK, {
        mode: 'openEnterLink',
        inline,
        link: inline.attributes['link'],
      });
    }, [formats, inline]);

    const handleMouseEnterLink = React.useCallback(() => {
      clearLeaveTimeout();
      if (popupPosition) return;
      const container = getHtmlElement(scrollContainer);
      const element = document.querySelector(`[data-inline-id="${inline.id}"]`);
      const linkRect = element?.getBoundingClientRect();
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      if (linkRect) {
        const top = linkRect.top + (container?.scrollTop ?? 0) + containerRect.top + 4;
        const left = linkRect.left - containerRect.left;
        hoverTimeoutRef.current = setTimeout(() => {
          setPopupPosition({
            top,
            left,
          });
        }, 500);
      }
    }, [inline, scrollContainer, popupPosition]);

    const clearLeaveTimeout = React.useCallback(() => {
      if (!leaveTimeoutRef.current) return;
      clearTimeout(leaveTimeoutRef.current);
    }, []);

    const handleClose = React.useCallback(() => {
      if (!hoverTimeoutRef.current) return;
      clearTimeout(hoverTimeoutRef.current);
      leaveTimeoutRef.current = setTimeout(() => {
        setPopupPosition(null);
      }, 500);
    }, [popupPosition]);

    return (
      <>
        <Container
          onMouseOver={handleMouseEnterLink}
          onMouseLeave={handleClose}
          href={inline.attributes['link']}
          target="_blank"
          dangerouslySetInnerHTML={innerHtml}
          formats={formats}
          attributes={inline.attributes}
          onClick={onClick}
          {...props}
        />
        {!!popupPosition && (
          <HoverPopup
            top={popupPosition.top}
            left={popupPosition.left}
            link={inline.attributes['link']}
            editor={editor}
            inline={inline}
            scrollContainer={scrollContainer}
            onMouseEnter={clearLeaveTimeout}
            onEdit={handleEdit}
            onClose={handleClose}
          />
        )}
      </>
    );
  },
);
