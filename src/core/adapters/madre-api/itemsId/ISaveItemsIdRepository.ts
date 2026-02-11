export interface ISaveItemsIdRepository {
  save(payload: {
    sellerId: string;
    status: 'active' | 'paused' | 'closed';
    items: string[];
  }): Promise<void>;
}
