import * as React from 'react';
import styled, { css } from 'styled-components';
import { EditorController } from '../../types/editor';
import { Formats } from '../../types/format';
import { BlockAttributes } from '../../types/block';
import { useMutationObserver } from '../../hooks/use-mutation-observer';

export interface BulletListProps {
  blockId: string;
  formats?: Formats;
  contents: React.ReactNode;
  placeholder?: string;
  attributes: BlockAttributes;
  editor: EditorController;
}

const ListItem = styled.div<{ $placeholder?: string }>`
  font-size: 1rem;
  outline: 0;
  margin: 0.25rem 0;
  padding: 0 0 0 calc(1.5rem + 1.5em * var(--indent));
  box-sizing: border-box;
  position: relative;

  ::before {
    content: '';
    position: absolute;
    width: 0.315rem;
    height: 0.315rem;
    border-radius: 50%;
    background-color: rgba(60, 60, 60, 0.33);
    transition: background-color 0.5s;
    left: calc(0.25rem + 1.5rem * var(--indent));
    top: 0.7rem;
  }

  ${({ $placeholder }) => {
    return (
      $placeholder &&
      css`
        ::after {
          opacity: 0.3;
          content: '${$placeholder}';
        }
      `
    );
  }}
`;

export const BulletList = React.memo(
  ({ blockId, contents, placeholder = 'List', attributes, editor, ...props }: BulletListProps) => {
    const headerRef = React.useRef(null);
    const [showPlaceholder, setShowPlaceholder] = React.useState(false);
    const handleChangeElement = React.useCallback(() => {
      if (!headerRef.current) return;
      const innerText = (headerRef.current as HTMLElement).innerText.replaceAll(/\uFEFF/gi, '');
      setShowPlaceholder(innerText.length < 1);
    }, []);
    useMutationObserver(headerRef, handleChangeElement);

    React.useEffect(() => {
      handleChangeElement();
    }, []);

    const memoStyle = React.useMemo(() => {
      const numberType = (attributes?.indent ?? 0) % 3;
      let content = '';
      switch (numberType) {
        case 1:
          content = '◦';
          break;
        case 2:
          content = '▪';
          break;
        default:
          content = '•';
          break;
      }

      return { '--content': `'${content}'` } as React.CSSProperties;
    }, [attributes?.indent]);

    return (
      <ListItem
        ref={headerRef}
        style={memoStyle}
        spellCheck={false}
        $placeholder={showPlaceholder ? placeholder : ''}
        {...props}
      >
        {contents}
      </ListItem>
    );
  },
);
