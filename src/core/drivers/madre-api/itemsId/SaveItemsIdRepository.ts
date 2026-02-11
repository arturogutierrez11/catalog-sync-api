import { Inject, Injectable } from '@nestjs/common';
import type { IMadreHttpClient } from 'src/core/adapters/madre-api/http/IMadreHttpClient';
import { ISaveItemsIdRepository } from 'src/core/adapters/madre-api/itemsId/ISaveItemsIdRepository';

@Injectable()
export class SaveItemsIdRepository implements ISaveItemsIdRepository {
  private readonly basePath = '/mercadolibre/items';

  constructor(
    @Inject('IMadreHttpClient')
    private readonly httpClient: IMadreHttpClient,
  ) {}

  async save(payload: {
    sellerId: string;
    status: 'active' | 'paused' | 'closed';
    items: string[];
  }): Promise<void> {
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        const response = await this.httpClient.post<{ inserted: number }>(
          this.basePath,
          payload,
        );

        console.log(
          `[SaveItemsIdRepository] SUCCESS | Requested=${payload.items.length} | Inserted=${response?.inserted}`,
        );

        return; // éxito → salimos
      } catch (error) {
        attempt++;

        console.error(
          `[SaveItemsIdRepository] RETRY ${attempt}/${MAX_RETRIES} FAILED`,
          error?.message,
        );

        if (attempt >= MAX_RETRIES) {
          console.error(
            `[SaveItemsIdRepository] GIVING UP after ${MAX_RETRIES} attempts`,
          );
          throw error; // ahora sí dejamos fallar
        }

        // pequeño backoff
        await new Promise((res) => setTimeout(res, 1000 * attempt));
      }
    }
  }
}
