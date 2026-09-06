import { searchBombe } from './bombe.ts';
import type { SearchOptions } from './bombe.ts';
self.onmessage = (event: MessageEvent<SearchOptions>) => {
  try {
    for (const update of searchBombe(event.data)) self.postMessage({ type: 'progress', update });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Search failed.',
    });
  }
};
