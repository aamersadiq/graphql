import * as React from 'react';

declare global {
  namespace React {
    interface ReactNode {
      children?: ReactNode | undefined;
    }
  }
}

export {};