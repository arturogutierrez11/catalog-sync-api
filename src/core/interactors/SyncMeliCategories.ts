import { Inject, Injectable } from '@nestjs/common';
import type { IGetCategoriesRepository } from '../adapters/mercadolibre-api/categories/IGetCategoriesRepository';
import type { ISaveMeliCategoriesRepository } from '../adapters/madre-api/categories/ISaveMeliCategoriesRepository';
import type { ISyncStatesRepository } from '../adapters/madre-api/syncStates/ISyncStatesRepository';
import { Category } from '../entitis/mercadolibre-api/categories/Category';
import { FlatCategory } from '../entitis/madre-api/categories/FlatCategory';

@Injectable()
export class SyncMeliCategories {
  private readonly PROCESS_NAME = 'meli_categories_sync';

  private readonly MAX_RETRIES = 3;
  private readonly CHUNK_SIZE = 200;

  constructor(
    @Inject('IGetCategoriesRepository')
    private readonly getCategoriesRepo: IGetCategoriesRepository,

    @Inject('ISaveMeliCategoriesRepository')
    private readonly saveCategoriesRepo: ISaveMeliCategoriesRepository,

    @Inject('ISyncStatesRepository')
    private readonly syncStatesRepo: ISyncStatesRepository,
  ) {}

  // ─────────────────────────────────────────────
  // PUBLIC ENTRY
  // ─────────────────────────────────────────────
  async execute(): Promise<void> {
    await this.syncStatesRepo.postState('start', {
      process_name: this.PROCESS_NAME,
      seller_id: 'GLOBAL',
    });

    try {
      const tree = await this.fetchTreeWithRetry();

      console.log(`[SyncMeliCategories] ROOT CATEGORIES: ${tree.length}`);

      const flat = this.flattenTree(tree);

      console.log(
        `[SyncMeliCategories] TOTAL FLATTENED CATEGORIES: ${flat.length}`,
      );

      await this.saveInChunks(flat);

      await this.syncStatesRepo.postState('done', {
        process_name: this.PROCESS_NAME,
        seller_id: 'GLOBAL',
      });

      console.log('[SyncMeliCategories] SYNC COMPLETED');
    } catch (error) {
      await this.syncStatesRepo.postState('failed', {
        process_name: this.PROCESS_NAME,
        seller_id: 'GLOBAL',
      });

      throw error;
    }
  }

  // ─────────────────────────────────────────────
  // FETCH TREE WITH RETRY
  // ─────────────────────────────────────────────
  private async fetchTreeWithRetry(): Promise<Category[]> {
    let attempts = 0;

    while (attempts < this.MAX_RETRIES) {
      try {
        return await this.getCategoriesRepo.getTree();
      } catch (error) {
        attempts++;
        console.error(
          `[SyncMeliCategories] TREE FETCH FAILED (attempt ${attempts})`,
        );
        await this.sleep(2000);
      }
    }

    throw new Error('Failed to fetch categories tree');
  }

  // ─────────────────────────────────────────────
  // FLATTEN TREE
  // ─────────────────────────────────────────────
  private flattenTree(tree: Category[]): FlatCategory[] {
    const result: FlatCategory[] = [];

    const traverse = (
      node: Category,
      parentId: string | null,
      level: number,
      parentPath: string | null,
    ) => {
      const path = parentPath ? `${parentPath}.${node.id}` : node.id;

      result.push({
        id: node.id,
        name: node.name,
        parentId,
        level,
        path,
      });

      for (const child of node.children ?? []) {
        traverse(child, node.id, level + 1, path);
      }
    };

    for (const root of tree) {
      traverse(root, null, 1, null);
    }

    return result;
  }

  // ─────────────────────────────────────────────
  // SAVE IN CHUNKS
  // ─────────────────────────────────────────────
  private async saveInChunks(categories: FlatCategory[]): Promise<void> {
    for (let i = 0; i < categories.length; i += this.CHUNK_SIZE) {
      const chunk = categories.slice(i, i + this.CHUNK_SIZE);

      let attempts = 0;

      while (attempts < this.MAX_RETRIES) {
        try {
          await this.saveCategoriesRepo.save(chunk);
          console.log(
            `[SyncMeliCategories] SAVED CHUNK ${i} - ${i + chunk.length}`,
          );
          break;
        } catch (error) {
          attempts++;
          console.error(
            `[SyncMeliCategories] SAVE CHUNK FAILED (attempt ${attempts})`,
          );
          await this.sleep(2000);
        }
      }

      if (attempts === this.MAX_RETRIES) {
        throw new Error('Failed saving categories chunk');
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }
}
