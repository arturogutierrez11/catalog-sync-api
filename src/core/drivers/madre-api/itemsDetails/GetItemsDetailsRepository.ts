import { Inject, Injectable } from '@nestjs/common';
import { IGetItemsDetailsRepository } from 'src/core/adapters/madre-api/itemsDetails/IGetItemsDetailsRepository';
import type { IMadreHttpClient } from 'src/core/adapters/madre-api/http/IMadreHttpClient';
import { MercadoLibreProduct } from 'src/core/entitis/madre-api/itemsDetails/MercadoLibreProduct';

@Injectable()
export class GetItemsDetailsRepository implements IGetItemsDetailsRepository {
  private readonly basePath = '/mercadolibre/products/search';

  constructor(
    @Inject('IMadreHttpClient')
    private readonly httpClient: IMadreHttpClient,
  ) {}

  async getByIds(params: {
    sellerId: string;
    ids: string[];
  }): Promise<MercadoLibreProduct[]> {
    if (!params.ids?.length) return [];

    const response = await this.httpClient.post<any[]>(this.basePath, {
      sellerId: params.sellerId,
      ids: params.ids,
    });

    if (!response || !Array.isArray(response)) {
      return [];
    }

    return response.map((p) => ({
      id: p.id,
      categoryId: p.category_id ?? null,
      title: p.title ?? null,
      price: Number(p.price ?? 0),
      currency: p.currency ?? null,
      stock: Number(p.stock ?? 0),
      soldQuantity: Number(p.sold_quantity ?? 0),
      status: p.status ?? null,
      condition: p.condition ?? null,
      permalink: p.permalink ?? null,
      thumbnail: p.thumbnail ?? null,
      pictures: Array.isArray(p.pictures) ? p.pictures : [],
      sellerSku: p.seller_sku ?? null,
      brand: p.brand ?? null,
      warranty: p.warranty ?? null,
      freeShipping: Boolean(p.free_shipping),
      health: Number(p.health ?? 0),
      lastUpdated: p.last_updated ?? null,
      description: p.description ?? null,
    }));
  }
}
