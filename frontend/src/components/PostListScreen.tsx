
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Post } from '../types/post';
import { postsApi } from '../api/posts';
import icon from '../assets/icon.png';
import BottomNav from './BottomNav';

const dailyExpressions = [
  {
    word: '괜찮아요.',
    meaning: '문제없다는 뜻뿐 아니라 정중하게 거절할 때도 사용해요.',
    example: '“물 더 드릴까요?”라는 질문에 “괜찮아요.”라고 하면 사양한다는 뜻일 수 있어요.',
  },
  {
    word: '눈치가 빠르다.',
    meaning: '상황이나 다른 사람의 마음을 빠르게 알아차린다는 뜻이에요.',
    example: '말하지 않아도 친구의 기분을 알아차렸다면 눈치가 빠르다고 해요.',
  },
  {
    word: '손이 크다.',
    meaning: '음식이나 물건을 넉넉하게 준비한다는 뜻이에요.',
    example: '많은 음식을 준비하는 사람에게 “손이 크시네요!”라고 해요.',
  },
  {
    word: '입이 무겁다.',
    meaning: '다른 사람의 비밀을 잘 지킨다는 뜻이에요.',
    example: '비밀을 잘 지키는 친구에게 “입이 무겁다”고 표현해요.',
  },
];

export default function PostListScreen() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const dayNumber = Math.floor(
    new Date().setHours(0, 0, 0, 0) / 86400000,
  );

  const today = dailyExpressions[
    ((dayNumber % dailyExpressions.length) +
      dailyExpressions.length) %
      dailyExpressions.length
  ];

  useEffect(() => {
    let active = true;

    postsApi
      .list()
      .then((data) => {
        if (active) {
          setPosts(data);
          setError('');
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : '게시물을 불러오지 못했어요.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="poomasi-page list-page">
      <header className="pm-header">
        <div className="pm-logo">
          <img src={icon} alt="" />
          <strong>POOMASI</strong>
        </div>
      </header>

      <main className="list-main">
        <section className="daily-expression">
          <span>오늘의 한국어 표현</span>

          <h2>{today.word}</h2>

          <p className="daily-meaning">
            {today.meaning}
          </p>

          <p className="daily-example">
            {today.example}
          </p>
        </section>

        <section className="posts-section">
          <h2 className="posts-heading">숨은 뜻</h2>

          {loading && (
            <p className="pm-message">
              게시물을 불러오고 있어요...
            </p>
          )}

          {error && (
            <p className="pm-error">{error}</p>
          )}

          {!loading && !error && posts.length === 0 && (
            <p className="pm-message">
              아직 등록된 게시물이 없어요.
            </p>
          )}

          <div className="post-list">
            {posts.map((post) => (
              <button
                type="button"
                className="post-list-card"
                key={post.id}
                onClick={() => navigate(`/posts/${post.id}`)}
              >
                <div className="post-card-author">
                  <span className="pm-avatar">●</span>

                  <span className="post-author-name">
                    {post.author.name}
                  </span>

                  <span className="post-author-type">
                    {post.author.type ||
                      '한국어를 배우는 사용자'}
                  </span>
                </div>

                <strong>{post.title}</strong>

                <p>{post.content}</p>
              </button>
            ))}
          </div>
        </section>
      </main>

      <button
        type="button"
        className="post-write-fab"
        onClick={() => navigate('/posts/new')}
        aria-label="글 작성하기"
      >
        ✎
      </button>

      <BottomNav />
    </div>
  );
}
