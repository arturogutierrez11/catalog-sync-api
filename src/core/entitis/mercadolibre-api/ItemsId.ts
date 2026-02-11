export interface ItemsId {
  sellerId: string;
  items: string[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasNext: boolean;
  };
  scrollId?: string;
}
