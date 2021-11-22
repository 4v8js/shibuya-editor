import * as React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { Subscription } from 'rxjs';
import { EditorEvents } from '../../constants';
import { EditorController } from '../../hooks/use-editor';
import { InlineAttributes } from '../../types/inline';

export interface BubbleToolbarProps {
  editor: EditorController;
}

const Container = styled.div`
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 8px;
`;

const Button = styled.a`
  margin: 8px;
  border: 1px solid #666;
  border-radius: 4px;
  padding: 4px;
`;

export const BubbleToolbar = React.memo(({ editor, ...props }: BubbleToolbarProps) => {
  const [formats, setFormats] = React.useState<InlineAttributes>({});
  const handleBold = React.useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      editor.getModule('toolbar').formatInline({ bold: !formats?.bold });
    },
    [formats],
  );

  const handleUnderline = React.useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      editor.getModule('toolbar').formatInline({ underline: !formats?.underline });
    },
    [formats],
  );

  const handleStrike = React.useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      editor.getModule('toolbar').formatInline({ strike: !formats?.strike });
    },
    [formats],
  );

  const handleHeader1 = React.useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      editor.getModule('toolbar').formatBlock('HEADER1');
    },
    [formats],
  );

  React.useEffect(() => {
    const subs = new Subscription();
    const eventEmitter = editor.getEventEmitter();
    subs.add(
      eventEmitter.on(EditorEvents.EVENT_SELECTION_CHANGE).subscribe((v) => {
        const caret = editor.getCaretPosition();
        if (!caret) return;
        setFormats(editor.getFormats(caret.blockId, caret.index, caret.length));
      }),
    );
    return () => {
      subs.unsubscribe();
    };
  });

  return ReactDOM.createPortal(
    <Container {...props}>
      <Button href="#" onClick={handleHeader1}>
        H1
      </Button>
      <Button href="#" onClick={handleBold}>
        B
      </Button>
      <Button href="#" onClick={handleUnderline}>
        U
      </Button>
      <Button href="#" onClick={handleStrike}>
        S
      </Button>
    </Container>,
    document.body,
  );
});
