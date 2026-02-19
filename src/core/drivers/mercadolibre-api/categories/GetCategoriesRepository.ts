import { Inject, Injectable } from '@nestjs/common';
import type { IMeliHttpClient } from 'src/core/adapters/mercadolibre-api/http/IMeliHttpClient';
import { IGetCategoriesRepository } from 'src/core/adapters/mercadolibre-api/categories/IGetCategoriesRepository';
import { Category } from 'src/core/entitis/mercadolibre-api/categories/Category';

@Injectable()
export class GetCategoriesRepository implements IGetCategoriesRepository {
  private readonly basePath = '/meli/categories';

  // 🔹 Pequeño throttle para no saturar tu API wrapper
  private readonly THROTTLE_MS = 150;

  constructor(
    @Inject('IMeliHttpClient')
    private readonly httpClient: IMeliHttpClient,
  ) {}

  // ─────────────────────────────────────────────
  // 🔹 Trae categorías root (nivel 1)
  // ─────────────────────────────────────────────
  async getTree(): Promise<Category[]> {
    const response = await this.httpClient.get<Category[]>(
      `${this.basePath}/tree`,
    );

    return response ?? [];
  }

  // ─────────────────────────────────────────────
  // 🔹 Trae rama completa desde una categoría root
  // ─────────────────────────────────────────────
  async getBranchById(categoryId: string): Promise<Category> {
    if (!categoryId) {
      throw new Error('CategoryId is required');
    }

    const response = await this.httpClient.get<Category>(
      `${this.basePath}/${categoryId}/branch`,
    );

    if (!response) {
      throw new Error(`Category branch ${categoryId} not found`);
    }

    return response;
  }

  async getFullTree(): Promise<Category[]> {
    const roots = await this.getTree();

    if (!roots.length) {
      console.warn('[GetCategoriesRepository] No root categories found');
      return [];
    }

    const CONCURRENCY = 4;
    const results: Category[] = [];

    for (let i = 0; i < roots.length; i += CONCURRENCY) {
      const slice = roots.slice(i, i + CONCURRENCY);

      const branches = await Promise.all(
        slice.map(async (root) => {
          try {
            if (root.hasChildren) {
              return await this.getBranchById(root.id);
            }
            return root;
          } catch (error) {
            console.error(
              `[GetCategoriesRepository] Failed fetching branch ${root.id}`,
              error,
            );
            return null;
          }
        }),
      );

      results.push(...(branches.filter(Boolean) as Category[]));
    }

    return results;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
