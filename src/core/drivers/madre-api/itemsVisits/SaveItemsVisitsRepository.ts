import { Inject, Injectable } from '@nestjs/common';
import type { IMadreHttpClient } from 'src/core/adapters/madre-api/http/IMadreHttpClient';
import { ISaveItemsVisitsRepository } from 'src/core/adapters/madre-api/itemsVisits/ISaveItemsVisitsRepository';

@Injectable()
export class SaveItemsVisitsRepository implements ISaveItemsVisitsRepository {
  private readonly basePath = '/mercadolibre/item-visits';

  constructor(
    @Inject('IMadreHttpClient')
    private readonly httpClient: IMadreHttpClient,
  ) {}

  async saveItemsVisits(params: {
    itemId: string;
    totalVisits: number;
  }): Promise<{ saved: boolean }> {
    const response = await this.httpClient.post<{ saved: boolean }>(
      this.basePath,
      {
        itemId: params.itemId,
        totalVisits: params.totalVisits,
      },
    );

    return {
      saved: Boolean(response.saved),
    };
  }
}
