import axios from 'axios';
import { Logger } from '@nestjs/common';

export class MeliHttpErrorHandler {
  private static readonly logger = new Logger('MeliHttpClient');

  static handle(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;
      const url = error.config?.url;

      console.error('[MELI API ERROR]', { status, url, data });

      switch (status) {
        case 401:
          return new Error('[MELI API] Unauthorized');
        case 403:
          return new Error('[MELI API] Forbidden');
        case 404:
          return new Error('[MELI API] Not found');
        case 500:
          return new Error('[MELI API] Internal server error');
        default:
          return new Error(
            `[MELI API] Unexpected error${status ? ` (${status})` : ''}`,
          );
      }
    }

    console.error('[MELI API ERROR] Unknown error', error);
    return new Error('[MELI API] Unknown error');
  }
}
