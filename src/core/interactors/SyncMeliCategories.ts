import { Inject, Injectable } from '@nestjs/common';
import type { IGetCategoriesRepository } from '../adapters/mercadolibre-api/categories/IGetCategoriesRepository';
import type { ISaveMeliCategoriesRepository } from '../adapters/madre-api/categories/ISaveMeliCategoriesRepository';
import { FlatCategory } from '../entitis/madre-api/categories/FlatCategory';

@Injectable()
export class SyncMeliCategories {
  private readonly CHUNK_SIZE = 200;

  constructor(
    @Inject('IGetCategoriesRepository')
    private readonly categoriesRepo: IGetCategoriesRepository,

    @Inject('ISaveMeliCategoriesRepository')
    private readonly saveRepo: ISaveMeliCategoriesRepository,
  ) {}

  async execute(): Promise<void> {
    console.log('🚀 Starting full categories sync...');

    const roots = await this.categoriesRepo.getTree();
    console.log(`📦 Roots found: ${roots.length}`);

    const flat: FlatCategory[] = [];

    for (const root of roots) {
      await this.processCategoryRecursive(root.id, null, 1, null, flat);
    }

    console.log(`🌳 Total categories flattened: ${flat.length}`);

    await this.saveInChunks(flat);

    console.log('✅ Categories sync completed');
  }

  // 🔥 RECURSIVIDAD REAL
  private async processCategoryRecursive(
    categoryId: string,
    parentId: string | null,
    level: number,
    parentPath: string | null,
    accumulator: FlatCategory[],
  ): Promise<void> {
    const category = await this.categoriesRepo.getBranchById(categoryId);

    const path = parentPath ? `${parentPath}.${category.id}` : category.id;

    accumulator.push({
      id: category.id,
      name: category.name,
      parentId,
      level,
      path,
    });

    if (!category.children?.length) return;

    for (const child of category.children) {
      await this.processCategoryRecursive(
        child.id,
        category.id,
        level + 1,
        path,
        accumulator,
      );
    }
  }

  private async saveInChunks(categories: FlatCategory[]) {
    for (let i = 0; i < categories.length; i += this.CHUNK_SIZE) {
      const chunk = categories.slice(i, i + this.CHUNK_SIZE);

      await this.saveRepo.save(chunk);

      console.log(`💾 Saved chunk ${i} - ${i + chunk.length}`);
    }
  }
}
