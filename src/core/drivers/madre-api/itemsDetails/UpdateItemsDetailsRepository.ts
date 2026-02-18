import { Inject, Injectable } from '@nestjs/common';
import type { IMadreHttpClient } from 'src/core/adapters/madre-api/http/IMadreHttpClient';
import { IUpdateItemsDetailsRepository } from 'src/core/adapters/madre-api/itemsDetails/IUpdateItemsDetailsRepository';
import { MercadoLibreProduct } from 'src/core/entitis/madre-api/itemsDetails/MercadoLibreProduct';

@Injectable()
export class UpdateItemsDetailsRepository implements IUpdateItemsDetailsRepository {
  private readonly basePath = '/mercadolibre/products';

  constructor(
    @Inject('IMadreHttpClient')
    private readonly httpClient: IMadreHttpClient,
  ) {}

  async updateBulk(params: {
    sellerId: string;
    products: MercadoLibreProduct[];
  }): Promise<{ updated: number }> {
    if (!params.products?.length) {
      return { updated: 0 };
    }

    const response = await this.httpClient.patch<{ updated: number }>(
      this.basePath,
      params,
    );

    return {
      updated: response?.updated ?? 0,
    };
  }
}
