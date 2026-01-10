import * as React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { EditorController, Formats, Inline } from '../../types';
import { getHtmlElement } from '../../utils/dom';
import { EditorEvents } from '../../constants';
import { Copy } from '../icons';

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

// ホバーしたときに表示するポップアップのコンテナ
const HoverPopupContainer = styled.div<PopupPosition>`
  position: absolute;
  display: flex;
  align-items: center;
  gap: 8px;
  top: ${(props) => props.top ?? 0}px;
  left: ${(props) => props.left ?? 0}px;
  padding: 8px;
  border: 1px solid #ccc;
  background-color: #fff;
  border-radius: 4px;
  font-size: 14px;
  z-index: 2;
  svg {
    cursor: pointer;
  }
`;

const PopupLinkText = styled.div`
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EditButton = styled.button`
  cursor: pointer;
  display: inline-block;
  flex-shrink: 0;
`;

const HoverPopup = React.memo(
  ({ top, left, link, scrollContainer, onMouseEnter, onEdit, onClose }: PopupProps) => {
    const modalRef = React.useRef<HTMLDivElement>(null);
    const [copied, setCopied] = React.useState(false);

    const handleEdit = React.useCallback(() => {
      onEdit();
    }, [onEdit, onClose]);

    const handleCopy = React.useCallback(async () => {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }, []);

    const handleMouseLeave = React.useCallback(() => {
      handleClose();
    }, []);

    const handleMouseEnter = React.useCallback(() => {
      onMouseEnter();
    }, [onMouseEnter]);

    const handleClose = React.useCallback(() => {
      onClose();
    }, [onClose]);

    React.useEffect(() => {
      const handleClose = (e: MouseEvent) => {
        if (!modalRef.current?.contains(e.target as Node)) {
          onClose();
        }
      };
      document.addEventListener('click', handleClose, true);
      return () => {
        document.removeEventListener('click', handleClose, true);
      };
    }, []);

    return ReactDOM.createPortal(
      <HoverPopupContainer
        ref={modalRef}
        top={top}
        left={left}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <PopupLinkText>{link}</PopupLinkText>
        {copied ? (
          <div>copied!</div>
        ) : (
          <div onClick={handleCopy}>
            <Copy size="16" />
          </div>
        )}
        <EditButton onClick={handleEdit}>編集</EditButton>
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
