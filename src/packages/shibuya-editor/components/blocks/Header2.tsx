import * as React from 'react';
import styled from 'styled-components';
import { EditorController } from '../../types/editor';
import { Formats } from '../../types/format';
import { Inline } from '../../types/inline';
import { BlockAttributes } from '../../types/block';
import { useMutationObserver } from '../../hooks/use-mutation-observer';

export interface Header2Props {
  blockId: string;
  formats?: Formats;
  contents: React.ReactNode;
  placeholder?: string;
  attributes: BlockAttributes;
  editor: EditorController;
}
const Header = styled.h2<{ $placeholder?: string }>`
  outline: 0;
  box-sizing: border-box;
  padding: 8px 12px;
  padding-left: calc(12px + 1.5em * var(--indent));
  margin: 0;

  ::after {
    opacity: 0.3;
    content: '${({ $placeholder }) => $placeholder ?? ''}';
  }
`;

export const Header2 = React.memo(
  ({ blockId, contents, placeholder = 'Header 2', attributes, editor, ...props }: Header2Props) => {
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

    return (
      <Header
        ref={headerRef}
        spellCheck={false}
        $placeholder={showPlaceholder ? placeholder : ''}
        {...props}
      >
        {contents}
      </Header>
    );
  },
);
