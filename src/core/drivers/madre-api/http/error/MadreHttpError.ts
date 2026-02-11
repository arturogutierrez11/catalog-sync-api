import axios from 'axios';

export class MadreHttpErrorHandler {
  static handle(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;
      const url = error.config?.url;

      console.error('[MADRE API ERROR]', {
        status,
        url,
        data,
      });

      switch (status) {
        case 401:
          throw new Error(
            '[MADRE API] Unauthorized (invalid internal api key)',
          );
        case 403:
          throw new Error('[MADRE API] Forbidden');
        case 404:
          throw new Error('[MADRE API] Not found');
        case 409:
          throw new Error('[MADRE API] Conflict');
        case 500:
          throw new Error('[MADRE API] Internal server error');
        default:
          throw new Error(
            `[MADRE API] Unexpected error${status ? ` (${status})` : ''}`,
          );
      }
    }

    console.error('[MADRE API ERROR] Unknown error', error);
    throw new Error('[MADRE API] Unknown error');
  }
}
