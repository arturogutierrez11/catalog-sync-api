export interface Category {
  id: string;
  name: string;

  hasChildren: boolean;
  children?: Category[];

  picture?: string | null;
  permalink?: string | null;
  totalItems?: number | null;
  pathFromRoot?: { id: string; name: string }[];
}
