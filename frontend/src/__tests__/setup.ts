// Ensure React uses development mode in tests - must be before React imports
process.env.NODE_ENV = 'development';

import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

expect.extend({
  toBeInTheElement(received: HTMLElement | null) {
    if (received === null) {
      return {
        pass: false,
        message: () => `expected element to be in the document, but received null`,
      };
    }
    const pass = document.body.contains(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected element not to be in the document, but it was found`
          : `expected element to be in the document, but it was not found`,
    };
  },
});

declare module 'vitest' {
  interface Assertion {
    toBeInTheElement(): void;
  }
}
