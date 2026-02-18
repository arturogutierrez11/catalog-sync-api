export interface ISaveItemsVisitsRepository {
  saveItemsVisits(params: {
    itemId: string;
    totalVisits: number;
  }): Promise<{ saved: boolean }>;
}
