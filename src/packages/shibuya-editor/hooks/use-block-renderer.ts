import * as React from 'react';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import isEqual from 'lodash.isequal';
import { EditorController } from '../types/editor';
import { Block } from '../types/block';
import { EditorEvents } from '../constants';
import { copyObject } from '../utils/object';

interface Props {
  blockId: string;
  editor: EditorController;
}

export function useBlockRenderer({ blockId, editor }: Props): Block | null {
  const [block, setBlock] = React.useState<Block | null>(null);

  React.useEffect(() => {
    const currentBlock = editor.getBlock(blockId);
    const eventEmitter = editor.getEventEmitter();
    if (currentBlock) {
      setBlock(currentBlock);
    }

    const subs = new Subscription();

    subs.add(
      eventEmitter
        .select<string[]>(EditorEvents.EVENT_BLOCK_RERENDER)
        .pipe(filter((affectedIds) => affectedIds.includes(blockId)))
        .subscribe(() => {
          const currentBlock = editor.getBlock(blockId);
          if (currentBlock) {
            setBlock((prev) => {
              if (currentBlock.contents.length > 0 && isEqual(currentBlock, prev)) {
                setTimeout(() => setBlock(currentBlock));
                return { ...currentBlock, contents: [] };
              }
              return copyObject(currentBlock);
            });
          }
        }),
    );

    subs.add(
      eventEmitter
        .select<string[]>(EditorEvents.EVENT_BLOCK_RERENDER_FORCE)
        .pipe(filter((affectedIds) => affectedIds.includes(blockId)))
        .subscribe(() => {
          const currentBlock = editor.getBlock(blockId);
          if (currentBlock) {
            setBlock((prev) => {
              setTimeout(() => setBlock(currentBlock));
              return { ...currentBlock, contents: [] };
            });
          }
        }),
    );

    return () => {
      subs.unsubscribe();
    };
  }, [blockId]);

  return block;
}
