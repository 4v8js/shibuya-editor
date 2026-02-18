import * as React from 'react';
import { Icon, IconProps, baseIconProps } from './Icon';

export const Unlink: React.FC<IconProps> = React.memo(
  ({ size = baseIconProps.size, fill = baseIconProps.fill, ...props }) => (
    <Icon
      xmlns="http://www.w3.org/2000/svg"
      height={size + 'px'}
      viewBox="0 0 24 24"
      width={size + 'px'}
      {...props}
    >
      <path d="M0 0h24v24H0z" fill="none" />
      <path
        d="M17 7h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1 0 1.43-.98 2.63-2.31 2.98l1.46 1.46C20.88 15.61 22 13.95 22 12c0-2.76-2.24-5-5-5zm-1 4h-2.19l2 2H16v-2zM2 4.27l3.11 3.11C3.29 8.12 2 9.91 2 12c0 2.76 2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1 0-1.59 1.21-2.9 2.76-3.07L8.73 11H8v2h2.73l6.37 6.37 1.27-1.27L3.27 3 2 4.27z"
        fill={fill}
      />
    </Icon>
  ),
);
