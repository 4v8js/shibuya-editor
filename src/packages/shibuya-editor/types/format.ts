import * as React from 'react';
import { FlattenSimpleInterpolation } from 'styled-components';
import { Header1Props, ParagraphProps } from '../components/blocks';
import { InlineTextProps } from '../components/inlines';
import { LinkPopupProps } from '../components/popups/linkPopup';
import { BubbleToolbarProps, GlobalToolbarProps } from '../components/toolbar';

export interface Formats {
  'toolbar/global': React.FC<GlobalToolbarProps>;
  'toolbar/bubble': React.FC<BubbleToolbarProps>;
  'block/paragraph': React.FC<ParagraphProps>;
  'block/header1': React.FC<Header1Props>;
  'inline/text': React.FC<InlineTextProps>;
  'inline/style/bold': FlattenSimpleInterpolation;
  'inline/style/underline': FlattenSimpleInterpolation;
  'inline/style/strike': FlattenSimpleInterpolation;
  'inline/style/code': FlattenSimpleInterpolation;
  'inline/style/link': FlattenSimpleInterpolation;
  'popup/link': React.FC<LinkPopupProps>;
  [key: string]: any;
}
