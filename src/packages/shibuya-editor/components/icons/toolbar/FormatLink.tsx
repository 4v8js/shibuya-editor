import * as React from 'react';
import { Icon, IconProps, baseIconProps, Path } from '../Icon';

export const FormatLink: React.FC<IconProps> = React.memo(
  ({ size = baseIconProps.size, fill = baseIconProps.fill, ...props }) => (
    <Icon
      width={size}
      height={size}
      fill={fill}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M3.24996 10C3.24996 8.57504 4.40829 7.41671 5.83329 7.41671H9.16663V5.83337H5.83329C3.53329 5.83337 1.66663 7.70004 1.66663 10C1.66663 12.3 3.53329 14.1667 5.83329 14.1667H9.16663V12.5834H5.83329C4.40829 12.5834 3.24996 11.425 3.24996 10ZM6.66663 10.8334H13.3333V9.16671H6.66663V10.8334ZM14.1666 5.83337H10.8333V7.41671H14.1666C15.5916 7.41671 16.75 8.57504 16.75 10C16.75 11.425 15.5916 12.5834 14.1666 12.5834H10.8333V14.1667H14.1666C16.4666 14.1667 18.3333 12.3 18.3333 10C18.3333 7.70004 16.4666 5.83337 14.1666 5.83337Z"
        fill={fill}
      />
    </Icon>
  ),
);
