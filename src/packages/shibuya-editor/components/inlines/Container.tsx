import * as React from 'react';
import styled from 'styled-components';
import { EditorController } from '../../types/editor';
import { Formats } from '../../types/format';
import { Inline } from '../../types/inline';

interface ContainerProps {
  contents: Inline[];
  formats: Formats;
  editor: EditorController;
  scrollContainer?: HTMLElement | string;
}

export const InlineContainer: React.FC<ContainerProps> = ({
  contents,
  formats,
  editor,
  ...props
}: ContainerProps) => {
  return (
    <>
      {contents.map((content) => {
        let Container;
        const inlineFormat = `inline/${content.type.toLocaleLowerCase()}`;
        if (!formats[inlineFormat]) {
          // default block format
          Container = formats['inline/text'];
        } else {
          Container = formats[inlineFormat];
        }
        return (
          <Container
            key={content.id}
            formats={formats}
            editor={editor}
            attributes={content.attributes}
            data-inline-id={content.id}
            data-format={inlineFormat}
            data-attributes={JSON.stringify(content.attributes)}
            inline={content}
            {...props}
          />
        );
      })}
    </>
  );
};
