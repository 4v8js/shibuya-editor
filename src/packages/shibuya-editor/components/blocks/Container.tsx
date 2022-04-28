import * as React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { Formats } from '../../types/format';
import { EditorController } from '../../types/editor';
import { useBlockRenderer } from '../../hooks/use-block-renderer';
import { InlineContainer } from '../inlines/Container';
import { Block } from '../../types/block';

interface BlockProps {
  blockId: string;
  readOnly: boolean;
  selected: boolean;
  formats: Formats;
  editor: EditorController;
  scrollContainer?: HTMLElement | string;
  onCompositionStart: (e: React.CompositionEvent) => void;
  onCompositionEnd: (e: React.CompositionEvent) => void;
  onBeforeInput: (e: React.FormEvent) => void;
}

const FadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const Outer = styled.div`
  position: relative;
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0 10px;
  opacity: 1;
  pointer-events: none;
  background-color: rgba(46, 170, 220, 0.2);
  animation: ${FadeIn} 0.1s ease;
`;

export const BlockContainer: React.VFC<BlockProps> = React.memo(
  ({ blockId, editor, selected, readOnly = false, scrollContainer, formats, ...props }) => {
    const [blockFormat, setBlockFormat] = React.useState<string>();
    const [Container, setContainer] = React.useState<React.FC<any>>(formats['block/paragraph']);
    const block = useBlockRenderer({ blockId, editor });

    const memoContents = React.useMemo(() => {
      return InlineContainer({ contents: block?.contents ?? [], formats, editor, scrollContainer });
    }, [block?.contents, formats]);

    React.useEffect(() => {
      const newBlockFormat = `block/${block?.type.toLocaleLowerCase()}`;
      setBlockFormat(newBlockFormat);
      setContainer(() => {
        if (!formats[newBlockFormat]) {
          // defalut block format
          return formats['block/paragraph'];
        } else {
          return formats[newBlockFormat];
        }
      });
    }, [block?.type]);

    return (
      <Outer style={{ '--indent': `${block?.attributes?.indent ?? 0}` } as React.CSSProperties}>
        <Container
          suppressContentEditableWarning
          className={'notranslate'}
          contentEditable={!readOnly}
          blockId={blockId}
          data-block-id={blockId}
          data-attributes={JSON.stringify(block?.attributes)}
          data-metas={JSON.stringify(block?.meta)}
          data-format={blockFormat}
          formats={formats}
          attributes={block?.attributes}
          meta={block?.meta}
          contents={memoContents}
          selected={selected}
          {...props}
        />
        {selected && <Overlay />}
      </Outer>
    );
  },
);
