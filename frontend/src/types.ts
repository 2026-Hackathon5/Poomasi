
export type ScreenType =
  | 'START'
  | 'SIGNUP'
  | 'LOGIN'
  | 'PROFILE'
  | 'POST_LIST'
  | 'POST_WRITE'
  | 'POST_DETAIL'
  | 'POST_EDIT';

export interface Author {
  id: string;
  name: string;
  type?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: Author;
  createdAt: string;
  updatedAt?: string;
  is_mine: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: Author;
  createdAt: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
}

export interface UpdatePostInput {
  title: string;
  content: string;
}

export interface CreateCommentInput {
  content: string;
}
