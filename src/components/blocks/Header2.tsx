import * as React from 'react';
import styled from 'styled-components';
import { EditorController } from '../../types/editor';
import { Formats } from '../../types/format';
import { Inline } from '../../types/inline';
import { BlockAttributes } from '../../types/block';

export interface Header2Props {
  blockId: string;
  formats?: Formats;
  contents: Inline[];
  length: number;
  attributes: BlockAttributes;
  editor: EditorController;
  onClick: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}
const Header = styled.h2`
  outline: 0;
  transition: all 0.3s, color 0.3s;
  ::after {
    opacity: 0.3;
    content: attr(placeholder);
  }
`;

export const Header2 = React.memo(({ blockId, length, contents, attributes, editor, ...props }: Header2Props) => {
  return (
    <Header {...props} placeholder={length < 1 ? 'Heading 2' : ''}>
      {contents}
    </Header>
  );
});
