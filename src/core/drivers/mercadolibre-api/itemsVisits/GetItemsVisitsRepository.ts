import { Inject, Injectable } from '@nestjs/common';
import type { IMeliHttpClient } from 'src/core/adapters/mercadolibre-api/http/IMeliHttpClient';
import { IGetItemsVisitsFromMeliRepository } from 'src/core/adapters/mercadolibre-api/itemsVisits/IGetItemsVisitsFromMeliRepository';
import { MeliItemVisit } from 'src/core/entitis/mercadolibre-api/itemsVisits/MeliItemVisit';

@Injectable()
export class GetItemsVisitsRepository implements IGetItemsVisitsFromMeliRepository {
  constructor(
    @Inject('IMeliHttpClient')
    private readonly httpClient: IMeliHttpClient,
  ) {}

  async getByItemId(itemId: string): Promise<MeliItemVisit> {
    const response = await this.httpClient.get<any>(
      `/meli/items/${itemId}/visits`,
    );

    if (!response?.item_id) {
      throw new Error(`Invalid visits response for item ${itemId}`);
    }

    return {
      itemId: response.item_id,
      total: Number(response.total ?? 0),
    };
  }
}
