import { Inline } from '../types/inline';
import { createInline } from './inline';

/**
 * Parse markdown inline syntax in a text string and return an array of Inline objects
 * with proper formatting attributes applied.
 *
 * Supported patterns:
 * - **bold** or __bold__
 * - *italic* or _italic_
 * - ~~strikethrough~~
 * - `inline code`
 * - [link text](https://url)
 */
export function parseMarkdownInlines(text: string): Inline[] {
  const inlines: Inline[] = [];

  // Order matters: bold (**) before italic (*), __ before _
  const pattern =
    /(\*\*(.+?)\*\*|__(.+?)__|~~(.+?)~~|`(.+?)`|\[(.+?)\]\((https?:\/\/[^\s)]+)\)|\*(.+?)\*|_(.+?)_)/;

  let remaining = text;

  while (remaining.length > 0) {
    const match = remaining.match(pattern);

    if (!match || match.index === undefined) {
      inlines.push(createInline('TEXT', remaining));
      break;
    }

    // Add text before the match as plain text
    if (match.index > 0) {
      inlines.push(createInline('TEXT', remaining.substring(0, match.index)));
    }

    // Determine the format and create the formatted inline
    if (match[2] !== undefined) {
      // Bold **text**
      inlines.push(createInline('TEXT', match[2], { bold: true }));
    } else if (match[3] !== undefined) {
      // Bold __text__
      inlines.push(createInline('TEXT', match[3], { bold: true }));
    } else if (match[4] !== undefined) {
      // Strike ~~text~~
      inlines.push(createInline('TEXT', match[4], { strike: true }));
    } else if (match[5] !== undefined) {
      // Inline code `text`
      inlines.push(createInline('TEXT', match[5], { code: true }));
    } else if (match[6] !== undefined && match[7] !== undefined) {
      // Link [text](url)
      inlines.push(createInline('TEXT', match[6], { link: match[7] }));
    } else if (match[8] !== undefined) {
      // Italic *text*
      inlines.push(createInline('TEXT', match[8], { italic: true }));
    } else if (match[9] !== undefined) {
      // Italic _text_
      inlines.push(createInline('TEXT', match[9], { italic: true }));
    }

    // Continue with remaining text after the match
    remaining = remaining.substring(match.index + match[0].length);
  }

  return inlines.length > 0 ? inlines : [createInline('TEXT', text)];
}
