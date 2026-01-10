import * as React from 'react';
import styled from 'styled-components';
import prettyBytes from 'pretty-bytes';
import { RotatingLines } from '../../icons/Spinner';
import { EditorController } from '../../../types/editor';
import { Formats } from '../../../types/format';
import { Download } from '../../icons';
import { Tooltip } from '../../popups';

export interface FileProps {
  blockId: string;
  formats?: Formats;
  contents: React.ReactNode;
  attributes: { fileName: string; original: string; size: number; files: string[] };
  meta: { isUploading?: boolean };
  editor: EditorController;
}

const Container = styled.div`
  outline: none;
  display: flex;
  align-items: center;
  padding: 16px 32px;
  gap: 8px;
  margin: 12px 0;
  border: 1px solid #f0f0f0;
  height: 56px;
  box-sizing: border-box;
`;
const IconContainer = styled.div`
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
`;
const Button = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  cursor: pointer;
  &:hover svg {
    fill: #666;
  }
`;
const Inner = styled.div`
  flex-shrink: 1;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
`;

const FileName = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: bold;
`;
const Size = styled.div`
  font-size: 12px;
  color: #999;
  display: flex;
  flex-shrink: 0;
`;
const Loading = styled.div`
  margin-left: 8px;
`;

export const File = React.memo(
  ({
    blockId,
    contents,
    attributes,
    meta: { isUploading = false },
    editor,
    ...props
  }: FileProps) => {
    const imageRef = React.useRef(null);
    const handleDownload = React.useCallback(
      (e: React.MouseEvent) => {
        editor.getModule('uploader').download(attributes?.files ?? []);
      },
      [attributes],
    );

    return (
      <Container ref={imageRef} {...props} contentEditable={false}>
        <IconContainer>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18.5 16H7C4.79 16 3 14.21 3 12C3 9.79 4.79 8 7 8H19.5C20.88 8 22 9.12 22 10.5C22 11.88 20.88 13 19.5 13H9C8.45 13 8 12.55 8 12C8 11.45 8.45 11 9 11H18.5V9.5H9C7.62 9.5 6.5 10.62 6.5 12C6.5 13.38 7.62 14.5 9 14.5H19.5C21.71 14.5 23.5 12.71 23.5 10.5C23.5 8.29 21.71 6.5 19.5 6.5H7C3.96 6.5 1.5 8.96 1.5 12C1.5 15.04 3.96 17.5 7 17.5H18.5V16Z"
              fill="#18181B"
            />
          </svg>
        </IconContainer>
        <Inner>
          <FileName>{attributes?.fileName}</FileName>
        </Inner>
        <Size>
          {prettyBytes(attributes?.size)}
          {isUploading && (
            <Loading>
              <RotatingLines
                strokeColor="grey"
                strokeWidth="5"
                width="18"
                visible={true}
              />
            </Loading>
          )}
        </Size>
        <IconContainer>
          <Tooltip
            targetElement={
              <Button onClick={handleDownload}>
                <Download />
              </Button>
            }
            maxWidth={200}
            position={'bottom'}
          >
            ファイルをダウンロードする
          </Tooltip>
        </IconContainer>
      </Container>
    );
  },
);
