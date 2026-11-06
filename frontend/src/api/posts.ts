
import type {
  Comment,
  CreateCommentInput,
  CreatePostInput,
  Post,
  UpdatePostInput,
} from '../types/post';

import { mockPostsApi } from '../data/mockPosts';

const USE_MOCK_API =
  import.meta.env.VITE_USE_MOCK_API !== 'false';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    },
  );

  if (!response.ok) {
    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new Error('LOGIN_REQUIRED');
    }

    throw new Error(`요청 실패 (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function unwrapPost(value: unknown): Post {
  const root = value as Record<string, unknown>;

  const raw = (
    root.post ??
    root.data ??
    root
  ) as Record<string, unknown>;

  const author = (
    raw.author ?? {}
  ) as Record<string, unknown>;

  return {
    id: String(raw.id ?? raw.postId),
    title: String(raw.title ?? ''),
    content: String(raw.content ?? ''),

    author: {
      id: String(author.id ?? raw.authorId ?? ''),
      name: String(
        author.name ?? raw.authorName ?? '익명',
      ),
      type: String(
        author.type ?? raw.authorType ?? '',
      ),
    },

    createdAt: String(
      raw.createdAt ??
      raw.created_at ??
      new Date().toISOString(),
    ),

    updatedAt: raw.updatedAt
      ? String(raw.updatedAt)
      : undefined,

    is_mine: Boolean(
      raw.is_mine ?? raw.isMine,
    ),
  };
}

function unwrapPosts(value: unknown): Post[] {
  const root = value as Record<string, unknown>;

  const rows = Array.isArray(value)
    ? value
    : (root.posts ?? root.data ?? []) as unknown[];

  return rows.map(unwrapPost);
}

function unwrapComment(value: unknown): Comment {
  const root = value as Record<string, unknown>;

  const raw = (
    root.comment ??
    root.data ??
    root
  ) as Record<string, unknown>;

  const author = (
    raw.author ?? {}
  ) as Record<string, unknown>;

  return {
    id: String(raw.id ?? raw.commentId),
    postId: String(
      raw.postId ?? raw.post_id ?? '',
    ),
    content: String(raw.content ?? ''),

    author: {
      id: String(author.id ?? raw.authorId ?? ''),
      name: String(
        author.name ?? raw.authorName ?? '익명',
      ),
      type: String(
        author.type ?? raw.authorType ?? '',
      ),
    },

    createdAt: String(
      raw.createdAt ??
      raw.created_at ??
      new Date().toISOString(),
    ),
  };
}

export const postsApi = {
  async list(): Promise<Post[]> {
    if (USE_MOCK_API) {
      return mockPostsApi.list();
    }

    return unwrapPosts(
      await request<unknown>('/api/posts'),
    );
  },

  async get(id: string): Promise<Post> {
    if (USE_MOCK_API) {
      return mockPostsApi.get(id);
    }

    return unwrapPost(
      await request<unknown>(`/api/posts/${id}`),
    );
  },

  async create(
    input: CreatePostInput,
  ): Promise<Post> {
    if (USE_MOCK_API) {
      return mockPostsApi.create(input);
    }

    return unwrapPost(
      await request<unknown>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    );
  },

  async update(
    id: string,
    input: UpdatePostInput,
  ): Promise<Post> {
    if (USE_MOCK_API) {
      return mockPostsApi.update(id, input);
    }

    return unwrapPost(
      await request<unknown>(`/api/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    );
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCK_API) {
      return mockPostsApi.remove(id);
    }

    await request<void>(
      `/api/posts/${id}`,
      { method: 'DELETE' },
    );
  },

  async listComments(
    postId: string,
  ): Promise<Comment[]> {
    if (USE_MOCK_API) {
      return mockPostsApi.listComments(postId);
    }

    const result = await request<unknown>(
      `/api/posts/${postId}/comments`,
    );

    const root = result as Record<string, unknown>;

    const rows = Array.isArray(result)
      ? result
      : (root.comments ?? root.data ?? []) as unknown[];

    return rows
      .map(unwrapComment)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime(),
      );
  },

  async createComment(
    postId: string,
    input: CreateCommentInput,
  ): Promise<Comment> {
    if (USE_MOCK_API) {
      return mockPostsApi.createComment(postId, input);
    }

    return unwrapComment(
      await request<unknown>(
        `/api/posts/${postId}/comments`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      ),
    );
  },
};
