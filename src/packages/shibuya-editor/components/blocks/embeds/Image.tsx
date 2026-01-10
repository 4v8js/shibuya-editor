import * as React from 'react';
import styled from 'styled-components';
import { MutatingDots } from '../../icons/Spinner';
import { EditorController } from '../../../types/editor';
import { Formats } from '../../../types/format';

export interface ImageProps {
  blockId: string;
  formats?: Formats;
  contents: React.ReactNode;
  attributes: { thumbnail: string; original: string; width?: number };
  meta: { isUploading?: boolean };
  editor: EditorController;
}

const Container = styled.div`
  outline: none;
  display: flex;
  margin: 0;
  padding: 12px 0;
  justify-content: center;
  img {
    max-width: 100%;
    user-select: none;
    vertical-align: bottom;
  }
`;
const Inner = styled.div`
  position: relative;
`;
const Loading = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ImageResizer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 16px;
  z-index: 1;
  cursor: col-resize;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const LeftImageResizer = styled(ImageResizer)`
  left: 0;
`;
const RightImageResizer = styled(ImageResizer)`
  right: 0;
`;

const ResizeHandler = styled.div<{ opacity: 0 | 1 }>`
  pointer-events: none;
  transition: opacity 0.3s;
  opacity: ${({ opacity }) => opacity};
  border-radius: 20px;
  background: rgba(15, 15, 15, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.9);
  width: 6px;
  height: 48px;
  max-height: 50%;
`;

export const Image = React.memo(
  ({
    blockId,
    contents,
    attributes: { thumbnail, original, width },
    meta: { isUploading = false },
    editor,
    ...props
  }: ImageProps) => {
    const imageRef = React.useRef<HTMLImageElement>(null);
    const [displayResizer, setDisplayResizer] = React.useState(false);
    const [dragParams, setDragParams] = React.useState<{
      type: 'left' | 'right';
      left: number;
      width: number;
    }>();
    const [imageWidth, setImageWidth] = React.useState<number | 'auto'>(width ?? 'auto');
    const handleClick = React.useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);
    const handleMouseEnter = React.useCallback((e: React.MouseEvent) => {
      setDisplayResizer(true);
    }, []);
    const handleMouseLeave = React.useCallback((e: React.MouseEvent) => {
      setDisplayResizer(false);
    }, []);
    const handleMouseDown = React.useCallback(
      (type: 'left' | 'right') => (e: React.MouseEvent) => {
        if (!imageRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = imageRef.current.getBoundingClientRect();
        setDragParams({
          type,
          left: e.clientX,
          width: width ?? (rect.width < 100 ? 100 : rect.width),
        });
      },
      [width],
    );

    React.useEffect(() => {
      setImageWidth(width ?? 'auto');
    }, [width]);

    React.useEffect(() => {
      if (!editor || !dragParams) return;

      const handleMouseMove = (e: MouseEvent) => {
        if (!dragParams.type) return;
        let width = 0;
        if (dragParams.type === 'left') {
          if (e.clientX < dragParams.left) {
            width = dragParams.width - (e.clientX - dragParams.left) * 2;
          } else {
            width = dragParams.width + (dragParams.left - e.clientX) * 2;
          }
        } else if (dragParams.type === 'right') {
          if (e.clientX > dragParams.left) {
            width = dragParams.width + (e.clientX - dragParams.left) * 2;
          } else {
            width = dragParams.width - (dragParams.left - e.clientX) * 2;
          }
        }
        if (width < 100) {
          width = 100;
        }
        setImageWidth(width);
      };

      const handleMouseUp = (e: MouseEvent) => {
        setDragParams(undefined);
        if (imageRef.current && typeof imageRef.current.width === 'number') {
          const currentBlock = editor.getBlock(blockId);
          if (!currentBlock) return;
          editor.updateBlock({
            ...currentBlock,
            attributes: {
              ...currentBlock.attributes,
              width: imageRef.current.width,
            },
          });
          editor.render([blockId]);
        }
      };

      window.addEventListener('mousemove', handleMouseMove, true);
      window.addEventListener('mouseup', handleMouseUp, true);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove, true);
        window.removeEventListener('mouseup', handleMouseUp, true);
      };
    }, [dragParams]);
    return (
      <Container {...props} contentEditable={false} draggable="false">
        <Inner onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <img
            src={thumbnail}
            onClick={handleClick}
            ref={imageRef}
            width={imageWidth}
            draggable="false"
          />
          {isUploading ? (
            <Loading>
              <MutatingDots
                height="100"
                width="100"
                color="#4fa94d"
                secondaryColor="#4fa94d"
                radius="12.5"
                ariaLabel="mutating-dots-loading"
                visible={true}
              />
            </Loading>
          ) : (
            <>
              <LeftImageResizer onMouseDown={handleMouseDown('left')}>
                <ResizeHandler opacity={displayResizer ? 1 : 0} />
              </LeftImageResizer>
              <RightImageResizer onMouseDown={handleMouseDown('right')}>
                <ResizeHandler opacity={displayResizer ? 1 : 0} />
              </RightImageResizer>
            </>
          )}
        </Inner>
      </Container>
    );
  },
);
