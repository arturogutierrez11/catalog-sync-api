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

  /**
   * 🔹 Trae SOLO categorías padre (nivel 1)
   * GET /meli/categories
   */
  async getTree(): Promise<Category[]> {
    const response = await this.httpClient.get<any[]>(`${this.basePath}`);

    if (!response) return [];

    return response.map((r) => ({
      id: r.id,
      name: r.name,
      hasChildren: true,
      children: [],
    }));
  }

  /**
   * 🔹 Trae categoría completa por ID
   * GET /meli/categories/:id
   */
  async getBranchById(categoryId: string): Promise<Category> {
    if (!categoryId) {
      throw new Error('CategoryId is required');
    }

    const response = await this.httpClient.get<any>(
      `${this.basePath}/${categoryId}`,
    );

    if (!response) {
      throw new Error(`Category ${categoryId} not found`);
    }

    return {
      id: response.id,
      name: response.name,
      hasChildren: (response.children_categories?.length ?? 0) > 0,
      children:
        response.children_categories?.map((child: any) => ({
          id: child.id,
          name: child.name,
          hasChildren: false,
          children: [],
        })) ?? [],
      picture: response.picture ?? null,
      permalink: response.permalink ?? null,
      totalItems: response.total_items_in_this_category ?? null,
      pathFromRoot: response.path_from_root ?? [],
    };
  }
}
