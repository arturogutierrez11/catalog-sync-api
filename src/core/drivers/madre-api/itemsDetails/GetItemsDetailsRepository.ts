import { Inject, Injectable } from '@nestjs/common';
import type { IMeliHttpClient } from 'src/core/adapters/mercadolibre-api/http/IMeliHttpClient';
import { MercadoLibreProduct } from 'src/core/entitis/madre-api/itemsDetails/MercadoLibreProduct';

@Injectable()
export class IGetItemsDetailsRepository implements IGetItemsDetailsRepository {
  constructor(
    @Inject('IMeliHttpClient')
    private readonly httpClient: IMeliHttpClient,
  ) {}

  async getByIds(params: { ids: string[] }): Promise<MercadoLibreProduct[]> {
    if (!params.ids.length) return [];

    const idsParam = params.ids.join(',');

    const response = await this.httpClient.get<any>(`/meli/products`, {
      params: { ids: idsParam },
    });

    if (!response?.items) return [];

    return response.items as MercadoLibreProduct[];
  }
}
