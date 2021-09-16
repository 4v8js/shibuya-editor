import * as React from 'react';
import styled from 'styled-components';
import { Block } from './types/block';
import { ModuleOptions } from './types/module';
import { Header, Text } from './components/blocks';
import { useEditor } from './hooks/use-editor';
import { useModule } from './hooks/use-module';
import { useEventEmitter } from './hooks/use-event-emitter';
import { EditorModule, KeyBoardModule, LoggerModule } from './modules';
import { EditorEvents } from './constants';

interface Props {
  readOnly?: boolean;
  settings?: ModuleOptions;
}

interface Formats {
  [key: string]: React.FC<{ block: Block }>;
}

interface BlockProps {
  block: Block;
  formats: Formats;
}

const BlockContainer: React.VFC<BlockProps> = React.memo(({ block, formats }) => {
  let Container;
  if (!formats[block.type.toLocaleLowerCase()]) {
    // defalut block format
    Container = formats['text'];
  } else {
    Container = formats[block.type.toLocaleLowerCase()];
  }

  return <Container block={block} />;
});

const Container = styled.div`
  border: 1px solid #ccc;
  border-radius: 12px;
  margin: 12px;
  padding: 12px;
  min-height: 300px;
`;

export const Editor: React.VFC<Props> = React.memo(({ readOnly = false, settings = {} }: Props) => {
  const [eventEmitter, eventController] = useEventEmitter();
  const [editorRef, editorController] = useEditor({ eventEmitter });
  const [modules, moduleController] = useModule({ eventEmitter });
  const [blocks, setBlocks] = React.useState<Block[]>([]);
  const [formats] = React.useState<Formats>({
    text: Text,
    header: Header,
  });

  const handleBeforeInput = React.useCallback(() => {}, []);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (modules['keyboard'] && modules['keyboard'] instanceof KeyBoardModule) {
        modules['keyboard'].onKeyDown(event);
      }
    },
    [modules],
  );

  const handleClick = React.useCallback(() => {
    const selection = document.getSelection();
    if (selection) {
      const range = selection.getRangeAt(0);
      console.log('click', range.commonAncestorContainer === editorRef.current);
      editorController.focus();
    }
  }, []);

  React.useEffect(() => {
    eventController.on(EditorEvents.EVENT_EDITOR_UPDATE, (blocks: Block[]) => {
      setBlocks(blocks);
    });

    moduleController.addModules(
      [
        { name: 'logger', module: LoggerModule },
        { name: 'editor', module: EditorModule },
        { name: 'keyboard', module: KeyBoardModule },
      ],
      settings,
    );

    return () => {
      moduleController.removeAll();
    };
  }, []);

  return (
    <Container
      ref={editorRef}
      contentEditable={!readOnly}
      onBeforeInput={handleBeforeInput}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      suppressContentEditableWarning={true}
    >
      {blocks.map((block, index) => {
        return <BlockContainer key={index} formats={formats} block={block} />;
      })}
    </Container>
  );
});
