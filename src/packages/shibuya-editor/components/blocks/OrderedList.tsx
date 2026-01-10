import * as React from 'react';
import styled, { css } from 'styled-components';
import { EditorController } from '../../types/editor';
import { Formats } from '../../types/format';
import { Inline } from '../../types/inline';
import { BlockAttributes } from '../../types/block';
import { useMutationObserver } from '../../hooks/use-mutation-observer';
import { decimalToRoman, decimalToAlphabet } from '../../utils/number';

export interface OrderedListProps {
  blockId: string;
  formats?: Formats;
  contents: React.ReactNode;
  placeholder?: string;
  attributes: BlockAttributes;
  meta: BlockAttributes;
  editor: EditorController;
}
const ListItem = styled.div<{ $placeholder?: string }>`
  font-size: 1rem;
  outline: 0;
  margin: 0.25rem 0;
  box-sizing: border-box;
  position: relative;
  padding: 2px 0 2px calc(1.5rem + 1.5rem * var(--indent));
  line-height: 1.6;

  ::before {
    position: absolute;
    left: calc(0.25rem + 1.5rem * var(--indent));
    top: 0.125rem;
    font-weight: 700;
    font-size: 0.875rem;
    color: rgba(60, 60, 60, 0.33);
    content: var(--content);
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

export const OrderedList = React.memo(
  ({
    blockId,
    contents,
    placeholder = 'List',
    attributes,
    editor,
    meta,
    ...props
  }: OrderedListProps) => {
    const headerRef = React.useRef(null);
    const [showPlaceholder, setShowPlaceholder] = React.useState(false);
    const handleChangeElement = React.useCallback(() => {
      if (!headerRef.current) return;
      const innerText = (headerRef.current as HTMLElement).innerText.replaceAll(/\uFEFF/gi, '');
      setShowPlaceholder(innerText.length < 1);
    }, []);
    useMutationObserver(headerRef, handleChangeElement);

    const memoStyle = React.useMemo(() => {
      const numberType = (attributes?.indent ?? 0) % 3;
      const listNumber = meta?.listNumber ?? 1;
      if (listNumber < 1) {
        return {};
      }
      let content = '';
      switch (numberType) {
        case 1:
          content = decimalToAlphabet(listNumber);
          break;
        case 2:
          content = decimalToRoman(listNumber);
          break;
        default:
          content = listNumber;
          break;
      }

      return { '--content': `'${content}.'` } as React.CSSProperties;
    }, [meta?.listNumber, attributes?.indent]);

    React.useEffect(() => {
      handleChangeElement();
    }, []);

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
