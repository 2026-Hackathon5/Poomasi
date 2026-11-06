
export interface Post {
  id: number | string;
  title?: string;
  content?: string;
  authorName?: string;
  authorType?: string;

  author?: {
    id?: number | string;
    name?: string;
    type?: string;
  };

  createdAt?: string;
  is_mine?: boolean;
}
