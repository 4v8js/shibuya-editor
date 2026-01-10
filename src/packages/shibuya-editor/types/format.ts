import * as React from 'react';
import { RuleSet } from 'styled-components';
import { Header1Props, ParagraphProps } from '../components/blocks';
import { InlineTextProps } from '../components/inlines';
import { LinkPopupProps } from '../components/popups/LinkPopup';
import { PalettePopupProps } from '../components/popups/PalettePopup';
import { BubbleToolbarProps, GlobalToolbarProps } from '../components/toolbar';

export interface Formats {
  'toolbar/global': React.FC<GlobalToolbarProps>;
  'toolbar/bubble': React.FC<BubbleToolbarProps>;
  'block/paragraph': React.FC<ParagraphProps>;
  'block/header1': React.FC<Header1Props>;
  'inline/text': React.FC<InlineTextProps>;
  'inline/style/bold': () => RuleSet;
  'inline/style/underline': () => RuleSet;
  'inline/style/strike': () => RuleSet;
  'inline/style/code': () => RuleSet;
  'inline/style/italic': () => RuleSet;
  'inline/style/color': (color: string) => RuleSet;
  'inline/style/link': (url?: string) => RuleSet;
  'popup/link': React.FC<LinkPopupProps>;
  'popup/palette': React.FC<PalettePopupProps>;
  [key: string]: any;
}
