export interface IUpdateItemsDetailsRepository {
  updateBulk(params: {
    sellerId: string;
    products: {
      id: string;
      categoryId?: string | null;
      price?: number;
      stock?: number;
      soldQuantity?: number;
      status?: string;
      freeShipping?: boolean;
      health?: number;
      lastUpdated?: string;
    }[];
  }): Promise<{ updated: number }>;
}
