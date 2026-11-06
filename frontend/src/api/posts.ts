
import type {
  Author,
  Comment,
  CreateCommentInput,
  CreatePostInput,
  Post,
  UpdatePostInput,
} from '../types/post';

import { mockPostsApi } from '../data/mockPosts';
import { apiFetch, ApiError } from './client';

const USE_MOCK_API =
  import.meta.env.VITE_USE_MOCK_API !== 'false';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    return await apiFetch<T>(path, options);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      throw new Error('LOGIN_REQUIRED', { cause: e });
    }
    throw e;
  }
}

// ---------- 백엔드 응답 모양 (Swagger "D. 숨은 뜻 지식인"과 같음) ----------

type AuthorRes = {
  id: string;
  nickname: string;
  nationality: string; // KR / JP / CN / US / OTHER
  user_type: 'korean' | 'foreign_resident';
};

type CommentRes = {
  id: number;
  content: string;
  author: AuthorRes;
  created_at: string;
};

type PostRes = {
  id: number;
  title: string;
  content: string;
  author: AuthorRes;
  comment_count: number;
  is_mine: boolean;
  created_at: string;
  updated_at: string;
};

// 상세 · 등록 · 수정 응답은 글 + 댓글 목록(오래된 순)
type PostDetailRes = PostRes & { comments: CommentRes[] };

// ---------- 서버 모양 → 화면 모양 ----------

// 작성자 유형 문구: 한국인 / 한국에 거주하는 외국인
function authorTypeLabel(a: AuthorRes): string {
  return a.user_type === 'korean' ? '한국인' : '한국에 거주하는 외국인';
}

function toAuthor(a: AuthorRes): Author {
  return { id: a.id, name: a.nickname, type: authorTypeLabel(a) };
}

function toPost(p: PostRes): Post {
  return {
    id: String(p.id),
    title: p.title,
    content: p.content,
    author: toAuthor(p.author),
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    is_mine: p.is_mine,
  };
}

// 서버 댓글에는 글 번호가 없어서, 어느 글의 댓글인지 같이 받아 넣는다
function toComment(c: CommentRes, postId: string): Comment {
  return {
    id: String(c.id),
    postId,
    content: c.content,
    author: toAuthor(c.author),
    createdAt: c.created_at,
  };
}

export const postsApi = {
  // D.3.1 게시글 목록 (최신순)
  async list(): Promise<Post[]> {
    if (USE_MOCK_API) {
      return mockPostsApi.list();
    }

    const rows = await request<PostRes[]>('/api/posts');
    return rows.map(toPost);
  },

  // D.3.2 게시글 상세
  async get(id: string): Promise<Post> {
    if (USE_MOCK_API) {
      return mockPostsApi.get(id);
    }

    return toPost(await request<PostDetailRes>(`/api/posts/${id}`));
  },

  // D.2 게시글 등록
  async create(input: CreatePostInput): Promise<Post> {
    if (USE_MOCK_API) {
      return mockPostsApi.create(input);
    }

    return toPost(
      await request<PostDetailRes>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    );
  },

  // D.3.3 게시글 수정 (작성자만. 백엔드는 PATCH)
  async update(id: string, input: UpdatePostInput): Promise<Post> {
    if (USE_MOCK_API) {
      return mockPostsApi.update(id, input);
    }

    return toPost(
      await request<PostDetailRes>(`/api/posts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    );
  },

  // 삭제 API는 아직 없음 → 서버에 요청하지 않고 안내 문구를 보여준다
  async remove(id: string): Promise<void> {
    if (USE_MOCK_API) {
      return mockPostsApi.remove(id);
    }

    throw new Error('삭제 기능은 준비 중이에요');
  },

  // 댓글 목록: 따로 있는 API가 없어서 상세 응답의 comments(오래된 순)를 꺼내 쓴다
  async listComments(postId: string): Promise<Comment[]> {
    if (USE_MOCK_API) {
      return mockPostsApi.listComments(postId);
    }

    const detail = await request<PostDetailRes>(`/api/posts/${postId}`);
    return detail.comments.map((c) => toComment(c, postId));
  },

  // D.3.4 댓글 등록
  async createComment(postId: string, input: CreateCommentInput): Promise<Comment> {
    if (USE_MOCK_API) {
      return mockPostsApi.createComment(postId, input);
    }

    const created = await request<CommentRes>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return toComment(created, postId);
  },
};