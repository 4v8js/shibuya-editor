import * as React from 'react';
import styled from 'styled-components';
import twemoji from 'twemoji';
import { EditorController } from '../../types/editor';
import { Formats } from '../../types/format';
import { Inline } from '../../types/inline';
import { getScrollContainer } from '../../utils/dom';
import { Subscription } from 'rxjs';
import { EditorEvents } from '../../constants';
import { copyObject } from '../../utils/object';

export interface InlineTextProps {
  inline: Inline;
  formats: Formats;
  editor: EditorController;
  scrollContainer?: HTMLElement | string;
}

interface InlineContentProps {
  attributes: Inline['attributes'];
  formats: Formats;
}

interface PopupProps {
  top: number;
  left: number;
}

const Text = styled.span<InlineContentProps>`
  &::selection {
    background: rgba(46, 170, 220, 0.2);
  }
  img.emoji {
    height: 1em;
    width: 1em;
    margin: 0 0.05em 0 0.1em;
    vertical-align: -0.1em;
    &::selection {
      background: rgba(46, 170, 220, 0.2);
    }
  }
  ${({ attributes, formats }) => {
    return Object.keys(attributes).map((key: string) => {
      const styleFormat = `inline/style/${key}`;
      if (attributes[key] && formats[styleFormat]) {
        return formats[styleFormat];
      }
      return;
    });
  }}
`;

const Link = styled.a<InlineContentProps>`
  ${({ attributes, formats }) => {
    return Object.keys(attributes).map((key: string) => {
      const styleFormat = `inline/style/${key}`;
      if (attributes[key] && formats[styleFormat]) {
        return formats[styleFormat];
      }
      return;
    });
  }}
`;

export const InlineText = ({
  inline,
  formats,
  editor,
  scrollContainer,
  ...props
}: InlineTextProps) => {
  const memoInnerHTML = React.useMemo(() => {
    const text = inline.text.replaceAll('\n', '<br>');
    return {
      __html: twemoji.parse(text, {
        folder: 'svg',
        ext: '.svg',
      }),
    };
  }, [inline]);

  const handleClickLink = () => {
    const caretPosition = editor.getCaretPosition();
    const eventEmitter = editor.getEventEmitter();
    eventEmitter.emit(EditorEvents.EVENT_LINK_CLICK, {
      mode: 'openPreview',
      inline,
      caretPosition,
    });
  };

  // const handleClickDelete = React.useCallback(() => {
  //   const caretPosition = editor.getCaretPosition();
  //   if (!caretPosition) return;
  //   const block = editor.getBlock(caretPosition.blockId);
  //   if (!block) return;
  //   const inlineIndex = block.contents.findIndex((v) => v.id === inline.id);
  //   if (inlineIndex === -1) return;
  //   editor.updateBlock({
  //     ...block,
  //     contents: copyObject([
  //       ...block.contents.slice(0, inlineIndex),
  //       {
  //         ...block.contents[inlineIndex],
  //         attributes: {
  //           ...block.contents[inlineIndex].attributes,
  //           link: false,
  //         },
  //       },
  //       ...block.contents.slice(inlineIndex + 1),
  //     ]),
  //   });
  //   editor.render([block.id]);
  //   setTimeout(() => {
  //     editor.focus();
  //   }, 10);
  // }, [inline]);

  return (
    <>
      {inline.attributes['link'] ? (
        <>
          <Link
            href={inline.attributes['link']}
            target="_blank"
            dangerouslySetInnerHTML={memoInnerHTML}
            formats={formats}
            attributes={inline.attributes}
            onClick={handleClickLink}
            {...props}
          />
        </>
      ) : (
        <Text
          dangerouslySetInnerHTML={memoInnerHTML}
          formats={formats}
          attributes={inline.attributes}
          {...props}
        />
      )}
    </>
  );
};
