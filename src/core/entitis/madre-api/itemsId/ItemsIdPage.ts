export type ItemsIdPage = {
  seller_id: string;
  items: string[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_next: boolean;
  };
};
