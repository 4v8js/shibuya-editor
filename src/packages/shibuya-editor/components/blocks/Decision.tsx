import * as React from 'react';
import styled, { css } from 'styled-components';
import { EditorController } from '../../types/editor';
import { Decision as DecisionIcon } from '../icons';
import { Formats } from '../../types/format';
import { BlockAttributes } from '../../types/block';
import { useMutationObserver } from '../../hooks/use-mutation-observer';

export interface DecisionProps {
  blockId: string;
  formats?: Formats;
  contents: React.ReactNode;
  placeholder?: string;
  attributes: BlockAttributes;
  editor: EditorController;
}

const Container = styled.div<{ $placeholder?: string }>`
  font-size: 1rem;
  outline: 0;
  margin: 0.25rem 0;
  padding: 0 0 0 calc(1.5rem + 1.5em * var(--indent));
  line-height: 1.6;
  box-sizing: border-box;
  position: relative;

  ::after {
    opacity: 0.3;
    content: '${({ $placeholder }) => $placeholder ?? ''}';
  }
`;

const IconOuter = styled.div`
  position: absolute;
  left: calc(1.5em * var(--indent));
  top: 0.25rem;
  border-radius: 15%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
`;

export const Decision = React.memo(
  ({
    blockId,
    contents,
    placeholder = '決定事項',
    attributes,
    editor,
    ...props
  }: DecisionProps) => {
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
      <Container
        ref={headerRef}
        spellCheck={false}
        $placeholder={showPlaceholder ? placeholder : ''}
        {...props}
      >
        <IconOuter>
          <DecisionIcon size="18px" />
        </IconOuter>
        {contents}
      </Container>
    );
  },
);
