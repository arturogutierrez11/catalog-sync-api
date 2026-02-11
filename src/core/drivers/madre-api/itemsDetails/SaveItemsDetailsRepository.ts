import { Inject, Injectable } from '@nestjs/common';
import type { IMadreHttpClient } from 'src/core/adapters/madre-api/http/IMadreHttpClient';
import { ISaveItemsDetailsRepository } from 'src/core/adapters/madre-api/itemsDetails/ISaveItemsDetailsRepository';
import { MercadoLibreProduct } from 'src/core/entitis/madre-api/itemsDetails/MercadoLibreProduct';

@Injectable()
export class SaveItemsDetailsRepository implements ISaveItemsDetailsRepository {
  private readonly basePath = '/mercadolibre/products';

  constructor(
    @Inject('IMadreHttpClient')
    private readonly httpClient: IMadreHttpClient,
  ) {}

  async saveBulk(params: {
    sellerId: string;
    products: MercadoLibreProduct[];
  }): Promise<number> {
    const response = await this.httpClient.post<{ inserted: number }>(
      this.basePath,
      params,
    );

    return response?.inserted ?? 0;
  }

  async get(params: { sellerId: string; limit: number; offset: number }) {
    return this.httpClient.get(this.basePath, {
      params: {
        seller_id: params.sellerId,
        limit: params.limit,
        offset: params.offset,
      },
    });
  }
}
