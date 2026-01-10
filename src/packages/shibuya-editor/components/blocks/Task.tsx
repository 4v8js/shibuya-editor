import * as React from 'react';
import styled, { css } from 'styled-components';
import { EditorController } from '../../types/editor';
import { CheckSquare, Schedule, Assignment } from '../icons';
import { Formats } from '../../types/format';
import { DatePicker, AssigneePicker, Tooltip } from '../popups';
import { BlockAttributes } from '../../types/block';
import { useMutationObserver } from '../../hooks/use-mutation-observer';
import { getHtmlElement } from '../../utils/dom';
import { formatDate } from '../../utils/date';
import { Member } from '../../modules';

export interface TaskProps {
  blockId: string;
  formats?: Formats;
  contents: React.ReactNode;
  placeholder?: string;
  attributes: BlockAttributes;
  editor: EditorController;
  scrollContainer?: HTMLElement | string;
}

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Buttons = styled.div`
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const IconButton = styled.div`
  cursor: pointer;
  margin: 4px;
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #a1a1aa;
  flex-direction: row-reverse;
`;

const Container = styled.div<{ $placeholder?: string }>`
  font-size: 1rem;
  outline: 0;
  margin: 0.25rem 0;
  padding: 0 0 0 calc(1.5rem + 1.5em * var(--indent));
  line-height: 1.6;
  box-sizing: border-box;
  position: relative;
  width: 100%;
  ${({ $placeholder }) => {
    return (
            $placeholder &&
            css`
              ::after {
                opacity: 0.3;
                content: '${$placeholder}';
              }
            `
    );
  }}
`;
const CheckBoxOuter = styled.div`
  position: absolute;
  left: calc(1.5em * var(--indent));
  top: 0.25rem;
  border-radius: 15%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
`;

const MemberIcon = styled.div`
  width: 20px;
  height: 20px;
  position: absolute;
  user-select: none;
  border-radius: 100%;
  box-shadow: 0px 1px 5px 0px;
  background-color: #fff;
  overflow: hidden;
  transition: top 0.3s ease-in-out;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Text = styled.div`
  font-size: 12px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
`;

export const Task = React.memo(
  ({
    blockId,
    contents,
    placeholder = 'Task',
    attributes,
    editor,
    scrollContainer,
    ...props
  }: TaskProps) => {
    const headerRef = React.useRef<HTMLDivElement>(null);
    const [showPlaceholder, setShowPlaceholder] = React.useState(false);
    const [isHover, setHover] = React.useState(false);
    const [showDatePicker, setShowDatePicker] = React.useState(false);
    const [selectedMembers, setSelectedMembers] = React.useState<Member[]>([]);
    const [showAssigneePicker, setShowAssigneePicker] = React.useState(false);
    const handleChangeElement = React.useCallback(() => {
      if (!headerRef.current) return;
      const innerText = (headerRef.current as HTMLElement).innerText.replaceAll(/\uFEFF/gi, '');
      setShowPlaceholder(innerText.length < 1);
    }, []);
    useMutationObserver(headerRef, handleChangeElement);

    const handleClickDatePicker = React.useCallback(() => {
      setShowDatePicker(!showDatePicker);
    }, [showDatePicker]);

    const handleCloseDatePicker = React.useCallback(() => {
      setShowDatePicker(false);
      setHover(false);
    }, [showDatePicker]);

    const handleSelectDatePicker = React.useCallback(
      (date: Date | undefined) => {
        const currentBlock = editor.getBlock(blockId);
        if (currentBlock) {
          editor.updateBlock({
            ...currentBlock,
            attributes: {
              ...currentBlock.attributes,
              deadline: date ? date.getTime() : null,
            },
          });
          editor.render([blockId]);
        }
        setHover(false);
        setShowDatePicker(false);
      },
      [showDatePicker],
    );

    const handleClickAssigneePicker = React.useCallback(() => {
      setShowAssigneePicker(!showAssigneePicker);
    }, [showAssigneePicker]);

    const handleCloseAssigneePicker = React.useCallback(() => {
      setShowAssigneePicker(false);
      setHover(false);
    }, [showAssigneePicker]);

    const handleSelectAssigneePicker = React.useCallback(
      (member?: Member) => {
        const currentBlock = editor.getBlock(blockId);
        const updateMembers =
          member && !selectedMembers.some((v) => v.id == member.id)
            ? [...selectedMembers, member]
            : selectedMembers;
        if (currentBlock) {
          editor.updateBlock({
            ...currentBlock,
            attributes: {
              ...currentBlock.attributes,
              assignees: updateMembers,
            },
          });
          editor.render([blockId]);
        }
        setSelectedMembers(updateMembers);
      },
      [showDatePicker, selectedMembers],
    );

    const handleRemoveAssigneePicker = React.useCallback(
      (member?: Member) => {
        const currentBlock = editor.getBlock(blockId);
        const updateMembers = selectedMembers.filter((v) => v.id !== member?.id);
        if (currentBlock) {
          editor.updateBlock({
            ...currentBlock,
            attributes: {
              ...currentBlock.attributes,
              assignees: updateMembers,
            },
          });
          editor.render([blockId]);
        }
        setSelectedMembers(updateMembers);
      },
      [showDatePicker, selectedMembers],
    );

    React.useEffect(() => {
      handleChangeElement();
    }, []);

    React.useEffect(() => {
      setSelectedMembers(attributes?.assignees ?? []);
    }, [attributes?.assignees]);

    const handleClickCheckBox = React.useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const currentBlock = editor.getBlock(blockId);
        if (!currentBlock) return;
        editor.updateBlock({
          ...currentBlock,
          attributes: {
            ...currentBlock.attributes,
            checked: !attributes.checked,
          },
        });
        editor.render([blockId]);
      },
      [blockId, attributes],
    );

    const handleMouseOver = React.useCallback(
      (e: React.MouseEvent) => {
        setHover(true);
      },
      [showDatePicker],
    );

    const handleMouseOut = React.useCallback(
      (e: React.MouseEvent) => {
        if (showDatePicker) return;
        setHover(false);
      },
      [showDatePicker],
    );

    const checked = attributes?.checked ?? false;

    const modalPosition = { top: 0, left: 0 };
    const editorRef = editor.getEditorRef();
    const editorRect = editorRef?.getBoundingClientRect();
    if (scrollContainer) {
      const container = getHtmlElement(scrollContainer);
      const containerRect = container?.getBoundingClientRect();
      const blockRect = headerRef.current?.getBoundingClientRect();
      modalPosition.top =
        (container?.scrollTop ?? 0) - (containerRect?.top ?? 0) + (blockRect?.top ?? 0) - 60;
      modalPosition.left =
        (editorRect?.left ?? 0) - (containerRect?.left ?? 0) + (editorRect?.width ?? 0) - 400;
    } else {
      const scrollEl = document.scrollingElement as HTMLElement;
      const blockRect = headerRef.current?.getBoundingClientRect();
      modalPosition.top = (scrollEl?.scrollTop ?? 0) + (blockRect?.top ?? 0) - 60;
      modalPosition.left = (editorRect?.left ?? 0) + (editorRect?.width ?? 0) - 400;
    }

    return (
      <>
        <Wrapper
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          style={isHover ? { backgroundColor: '#f7f9fa' } : {}}
        >
          <Container
            ref={headerRef}
            spellCheck={false}
            $placeholder={showPlaceholder ? placeholder : ''}
            style={{
              textDecoration: checked ? 'line-through' : 'none',
            }}
            {...props}
          >
            <CheckBoxOuter onClick={handleClickCheckBox}>
              <CheckSquare size="18px" checked={checked} fill="#666" />
            </CheckBoxOuter>
            {contents}
          </Container>
          <Buttons>
            {(attributes?.assignees ?? []).length > 0 ? (
              <Tooltip
                targetElement={
                  <IconButton onClick={handleClickAssigneePicker}>
                    {attributes.assignees.slice(0, 2).map((assignee: Member, i: number) => {
                      return (
                        <MemberIcon key={assignee.id} style={{ right: `${12 * i}px` }}>
                          {assignee.imageUrl ? (
                            <img draggable="false" src={assignee.imageUrl} />
                          ) : (
                            <Text>{assignee.name.slice(0, 1)}</Text>
                          )}
                        </MemberIcon>
                      );
                    })}
                    {attributes.assignees.length > 2 && (
                      <MemberIcon style={{ right: `${12 * 2}px` }}>
                        <Text>+{attributes.assignees.length - 2}</Text>
                      </MemberIcon>
                    )}
                  </IconButton>
                }
                maxWidth={200}
                position={'bottom'}
              >
                {attributes.assignees.map((v: Member) => {
                  return (
                    <React.Fragment key={v.id}>
                      {v.name}
                      <br />
                    </React.Fragment>
                  );
                })}
              </Tooltip>
            ) : (
              <Tooltip
                targetElement={
                  <IconButton
                    onClick={handleClickAssigneePicker}
                    style={{ visibility: isHover ? 'visible' : 'hidden' }}
                  >
                    <Assignment size="20px" fill="#A1A1AA" />
                  </IconButton>
                }
                maxWidth={200}
                position={'bottom'}
              >
                担当者を割り当てる
              </Tooltip>
            )}
            {attributes?.deadline ? (
              <Tooltip
                targetElement={
                  <IconButton onClick={handleClickDatePicker}>
                    {formatDate(new Date(attributes.deadline))}
                  </IconButton>
                }
                position={'bottom'}
              >
                締め切りを変更する
              </Tooltip>
            ) : (
              <Tooltip
                targetElement={
                  <IconButton
                    onClick={handleClickDatePicker}
                    style={{ visibility: isHover ? 'visible' : 'hidden' }}
                  >
                    <Schedule size="20px" fill="#A1A1AA" />
                  </IconButton>
                }
                position={'bottom'}
              >
                締め切りを設定する
              </Tooltip>
            )}
          </Buttons>
        </Wrapper>
        {showDatePicker && (
          <DatePicker
            editor={editor}
            scrollContainer={scrollContainer}
            top={modalPosition.top}
            left={modalPosition.left}
            selected={attributes?.deadline ? new Date(attributes.deadline) : undefined}
            onSelect={handleSelectDatePicker}
            onClose={handleCloseDatePicker}
          />
        )}
        {showAssigneePicker && (
          <AssigneePicker
            editor={editor}
            scrollContainer={scrollContainer}
            top={modalPosition.top}
            left={modalPosition.left + 70}
            selectedMembers={selectedMembers}
            onSelect={handleSelectAssigneePicker}
            onRemove={handleRemoveAssigneePicker}
            onClose={handleCloseAssigneePicker}
          />
        )}
      </>
    );
  },
);
