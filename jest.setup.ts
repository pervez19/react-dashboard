import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// jsdom gaps: React Router needs TextEncoder; MUI's colour-scheme/media queries need matchMedia.
Object.assign(globalThis, { TextEncoder, TextDecoder });

// React Router's data router builds a Request per navigation; jsdom has no Fetch API.
// shortcut: only url/method/signal are implemented, enough for routers without loaders/actions.
if (typeof globalThis.Request === 'undefined') {
  class RequestPolyfill {
    readonly url: string;
    readonly method: string;
    readonly signal: AbortSignal;
    constructor(input: string | URL, init: { method?: string; signal?: AbortSignal } = {}) {
      this.url = String(input);
      this.method = init.method ?? 'GET';
      this.signal = init.signal ?? new AbortController().signal;
    }
  }
  Object.assign(globalThis, { Request: RequestPolyfill });
}

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// The refresh token is kept in sessionStorage; never let one test's session leak into the next.
afterEach(() => sessionStorage.clear());
