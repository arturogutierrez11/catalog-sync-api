import { Inject, Injectable } from '@nestjs/common';
import type { IMeliHttpClient } from 'src/core/adapters/mercadolibre-api/http/IMeliHttpClient';
import { IGetCategoriesRepository } from 'src/core/adapters/mercadolibre-api/categories/IGetCategoriesRepository';
import { Category } from 'src/core/entitis/mercadolibre-api/categories/Category';

@Injectable()
export class GetCategoriesRepository implements IGetCategoriesRepository {
  private readonly basePath = '/meli/categories';

  constructor(
    @Inject('IMeliHttpClient')
    private readonly httpClient: IMeliHttpClient,
  ) {}

  // ─────────────────────────────────────────────
  // GET FULL TREE
  // ─────────────────────────────────────────────
  async getTree(): Promise<Category[]> {
    const response = await this.httpClient.get<Category[]>(
      `${this.basePath}/tree`,
    );

    return response ?? [];
  }

  // ─────────────────────────────────────────────
  // GET BRANCH BY ID
  // ─────────────────────────────────────────────
  async getBranchById(categoryId: string): Promise<Category> {
    const response = await this.httpClient.get<Category>(
      `${this.basePath}/${categoryId}/branch`,
    );

    if (!response) {
      throw new Error(`Category branch ${categoryId} not found`);
    }

    return response;
  }
}
