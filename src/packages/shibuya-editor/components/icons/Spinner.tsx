import * as React from 'react';
import styled, { keyframes } from 'styled-components';

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const RotatingLinesContainer = styled.div<{ $width: string; $strokeColor: string; $strokeWidth: string }>`
  width: ${({ $width }) => $width}px;
  height: ${({ $width }) => $width}px;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: ${rotate} 0.75s linear infinite;
  border: ${({ $strokeWidth }) => $strokeWidth}px solid transparent;
  border-top: ${({ $strokeWidth }) => $strokeWidth}px solid ${({ $strokeColor }) => $strokeColor};
  border-radius: 50%;
  box-sizing: border-box;
`;

interface RotatingLinesProps {
  strokeColor?: string;
  strokeWidth?: string;
  width?: string;
  visible?: boolean;
}

export const RotatingLines: React.FC<RotatingLinesProps> = ({
  strokeColor = 'grey',
  strokeWidth = '5',
  width = '18',
  visible = true,
}) => {
  if (!visible) return null;
  return <RotatingLinesContainer $width={width} $strokeColor={strokeColor} $strokeWidth={strokeWidth} />;
};

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
`;

const MutatingDotsContainer = styled.div<{ $width: string; $height: string }>`
  width: ${({ $width }) => $width}px;
  height: ${({ $height }) => $height}px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
`;

const Dot = styled.div<{ $color: string; $radius: string; $delay: number }>`
  width: ${({ $radius }) => parseFloat($radius) * 2}px;
  height: ${({ $radius }) => parseFloat($radius) * 2}px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  animation: ${pulse} 1s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
`;

interface MutatingDotsProps {
  height?: string;
  width?: string;
  color?: string;
  secondaryColor?: string;
  radius?: string;
  ariaLabel?: string;
  visible?: boolean;
}

export const MutatingDots: React.FC<MutatingDotsProps> = ({
  height = '100',
  width = '100',
  color = '#4fa94d',
  secondaryColor = '#4fa94d',
  radius = '12.5',
  ariaLabel = 'loading',
  visible = true,
}) => {
  if (!visible) return null;
  return (
    <MutatingDotsContainer $width={width} $height={height} aria-label={ariaLabel}>
      <Dot $color={color} $radius={radius} $delay={0} />
      <Dot $color={secondaryColor} $radius={radius} $delay={0.2} />
      <Dot $color={color} $radius={radius} $delay={0.4} />
    </MutatingDotsContainer>
  );
};
