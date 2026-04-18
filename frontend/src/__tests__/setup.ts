import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { afterEach as cleanupAfterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
