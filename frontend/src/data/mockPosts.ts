
import type {
  Author,
  Comment,
  CreateCommentInput,
  CreatePostInput,
  Post,
  UpdatePostInput,
} from '../types/post';

export const MOCK_CURRENT_USER: Author = {
  id: 'user-1',
  name: '복복님',
  type: '한국에 거주하는 외국인',
};

const POSTS_KEY = 'poomasi-mock-posts-v1';
const COMMENTS_KEY = 'poomasi-mock-comments-v1';

const initialPosts: Post[] = [
  {
    id: 'post-100',
    title: '“욕 보이소”가 무슨 뜻인가요?',
    content:
      '식당에서 밥을 먹고 있었는데 아저씨들이 가게 주인분께 “욕 보이소~” 이러면서 나가셨어요. 무슨 뜻인가요? 사투리인가요?',
    author: {
      id: 'user-2',
      name: '복복님',
      type: '한국에 거주하는 외국인',
    },
    createdAt: '2026-11-05T09:30:00.000Z',
    is_mine: false,
  },
  {
    id: 'post-101',
    title: '옷을 샀는데 친구가 “나쁘지는 않네.”라고 했어요.',
    content: '별로라는 건가요, 좋다는 건가요? 어떤 뉘앙스인지 궁금해요.',
    author: {
      id: 'user-3',
      name: '민지님',
      type: '한국어를 배우는 외국인',
    },
    createdAt: '2026-11-04T08:00:00.000Z',
    is_mine: false,
  },
];

const initialComments: Comment[] = [
  {
    id: 'comment-1',
    postId: 'post-100',
    content:
      '“욕 보이소”는 “수고하세요”와 비슷한 의미로 쓰이는 경상도 사투리예요!',
    author: {
      id: 'user-4',
      name: '한국어도우미',
      type: '한국인',
    },
    createdAt: '2026-11-05T10:00:00.000Z',
  },
  {
    id: 'comment-2',
    postId: 'post-100',
    content:
      '상황에 따라 “고생하세요”라는 따뜻한 인사로 이해하면 돼요.',
    author: {
      id: 'user-2',
      name: '복복님',
      type: '한국에 거주하는 외국인',
    },
    createdAt: '2026-11-05T10:20:00.000Z',
  },
];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getPosts(): Post[] {
  const posts = readStorage<Post[] | null>(POSTS_KEY, null);

  if (posts) return posts;

  const seeded = initialPosts.map((post) => ({
    ...post,
    is_mine: post.author.id === MOCK_CURRENT_USER.id,
  }));

  writeStorage(POSTS_KEY, seeded);
  return seeded;
}

function getAllComments(): Comment[] {
  const comments = readStorage<Comment[] | null>(
    COMMENTS_KEY,
    null,
  );

  if (comments) return comments;

  writeStorage(COMMENTS_KEY, initialComments);
  return initialComments;
}

function withMine(post: Post): Post {
  return {
    ...post,
    is_mine: post.author.id === MOCK_CURRENT_USER.id,
  };
}

export const mockPostsApi = {
  async list(): Promise<Post[]> {
    return getPosts()
      .map(withMine)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );
  },

  async get(id: string): Promise<Post> {
    const post = getPosts().find((item) => item.id === id);

    if (!post) {
      throw new Error('게시물을 찾을 수 없습니다.');
    }

    return withMine(post);
  },

  async create(input: CreatePostInput): Promise<Post> {
    const post: Post = {
      id: `post-${Date.now()}`,
      title: input.title,
      content: input.content,
      author: MOCK_CURRENT_USER,
      createdAt: new Date().toISOString(),
      is_mine: true,
    };

    writeStorage(POSTS_KEY, [post, ...getPosts()]);

    return post;
  },

  async update(
    id: string,
    input: UpdatePostInput,
  ): Promise<Post> {
    const posts = getPosts();

    const index = posts.findIndex((item) => item.id === id);

    if (index < 0) {
      throw new Error('게시물을 찾을 수 없습니다.');
    }

    if (posts[index].author.id !== MOCK_CURRENT_USER.id) {
      throw new Error('본인이 작성한 게시물만 수정할 수 있습니다.');
    }

    const updated: Post = {
      ...posts[index],
      title: input.title,
      content: input.content,
      updatedAt: new Date().toISOString(),
      is_mine: true,
    };

    posts[index] = updated;
    writeStorage(POSTS_KEY, posts);

    return updated;
  },

  async remove(id: string): Promise<void> {
    const posts = getPosts();
    const target = posts.find((item) => item.id === id);

    if (!target) {
      throw new Error('게시물을 찾을 수 없습니다.');
    }

    if (target.author.id !== MOCK_CURRENT_USER.id) {
      throw new Error('본인이 작성한 게시물만 삭제할 수 있습니다.');
    }

    writeStorage(
      POSTS_KEY,
      posts.filter((item) => item.id !== id),
    );

    writeStorage(
      COMMENTS_KEY,
      getAllComments().filter(
        (comment) => comment.postId !== id,
      ),
    );
  },

  async listComments(postId: string): Promise<Comment[]> {
    return getAllComments()
      .filter((comment) => comment.postId === postId)
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
    const post = getPosts().find(
      (item) => item.id === postId,
    );

    if (!post) {
      throw new Error('게시물을 찾을 수 없습니다.');
    }

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      postId,
      content: input.content,
      author: MOCK_CURRENT_USER,
      createdAt: new Date().toISOString(),
    };

    writeStorage(
      COMMENTS_KEY,
      [...getAllComments(), comment],
    );

    return comment;
  },
};
