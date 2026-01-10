import * as React from 'react';
import styled from 'styled-components';
import { Formats } from '../../types/format';
import { EditorController } from '../../types/editor';
import { useBlockRenderer } from '../../hooks/use-block-renderer';
import { InlineContainer } from '../inlines/Container';
import { textToPrismaToken } from '../../utils/code-block';
import { getBlockElementById } from '../../utils/block';

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

const Outer = styled.div`
  position: relative;
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 1;
  pointer-events: none;
  background-color: rgba(46, 170, 220, 0.2);
`;

export const BlockContainer: React.FC<BlockProps> = React.memo(
  ({ blockId, editor, selected, readOnly = false, scrollContainer, formats, ...props }) => {
    const block = useBlockRenderer({ blockId, editor });

    const memoContents = React.useMemo(() => {
      const { embeddedBlocks } = editor.getSettings();
      if (embeddedBlocks.includes(block?.type ?? '')) {
        return [];
      }
      if (block?.type === 'CODE-BLOCK') {
        const text = block.contents.map((content) => content.text).join('');
        return (
          <InlineContainer
            contents={textToPrismaToken(text, block.attributes?.language ?? 'typescript')}
            formats={formats}
            editor={editor}
            scrollContainer={scrollContainer}
          />
        );
      }
      return (
        <InlineContainer
          contents={block?.contents ?? []}
          formats={formats}
          editor={editor}
          scrollContainer={scrollContainer}
        />
      );
    }, [block?.contents, block?.type, formats, editor]);

    const blockFormat = `block/${block?.type.toLocaleLowerCase()}`;
    const Container: React.FC<any> = formats[blockFormat] ?? formats['block/paragraph'];

    const memoOverlay = React.useMemo(() => {
      const blockEl = getBlockElementById(blockId);
      if (!blockEl || !blockEl.parentElement) return;
      let rect = blockEl.getBoundingClientRect();
      if (block?.type === 'TABLE') {
        const tableRect = blockEl.querySelector('table')?.getBoundingClientRect();
        if (tableRect) rect = tableRect;
      }
      const parentRect = blockEl.parentElement.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        left: rect.left - parentRect.left,
        top: rect.top - parentRect.top,
      };
    }, [blockId, selected]);

    return (
      <Outer
        data-id={blockId}
        className={'shibuya-block-outer'}
        style={{ '--indent': `${block?.attributes?.indent ?? 0}` } as React.CSSProperties}
      >
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
          childBlocks={block?.childBlocks}
          meta={block?.meta ?? {}}
          contents={memoContents}
          editor={editor}
          scrollContainer={scrollContainer}
          selected={selected}
          {...props}
        />
        {selected && <Overlay style={memoOverlay} />}
      </Outer>
    );
  },
);
