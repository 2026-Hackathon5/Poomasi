
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Comment, Post } from '../types/post';
import { postsApi } from '../api/posts';
import { LogoHeader } from './ui';
import BottomNav from './BottomNav';

export default function PostDetailScreen() {
  const navigate = useNavigate();
  const { postId = '' } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // 글과 댓글을 서버(또는 mock)에서 불러온다
  const load = useCallback(async () => {
    try {
      const [postData, commentData] = await Promise.all([
        postsApi.get(postId),
        postsApi.listComments(postId),
      ]);

      setPost(postData);
      setComments(commentData);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '게시물을 불러오지 못했어요.',
      );
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(() => {
      if (active) void load();
    });

    return () => {
      active = false;
    };
  }, [load]);

  const share = async () => {
    if (!post) return;

    const shareData = {
      title: post.title,
      text: post.content,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${post.title}\n${post.content}`,
        );

        alert('게시물 내용을 복사했어요.');
      }
    } catch {
      // 사용자가 공유 창을 닫은 경우
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || sending) return;

    setSending(true);

    try {
      await postsApi.createComment(postId, {
        content: commentText.trim(),
      });

      setCommentText('');
      await load();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : '댓글 등록에 실패했어요.',
      );
    } finally {
      setSending(false);
    }
  };

  const deletePost = async () => {
    if (!post) return;

    if (!window.confirm('게시물을 삭제할까요?')) {
      return;
    }

    try {
      await postsApi.remove(post.id);
      navigate('/posts', { replace: true });
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : '삭제하지 못했어요.',
      );
    }
  };

  if (loading) {
    return (
      <div className="poomasi-page">
        <p className="pm-message">
          게시물을 불러오고 있어요...
        </p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="poomasi-page">
        <p className="pm-error">
          {error || '게시물을 찾을 수 없어요.'}
        </p>

        <button
          className="solid-btn"
          onClick={() => navigate('/posts')}
        >
          목록으로
        </button>
      </div>
    );
  }

  return (
    <div className="poomasi-page detail-page">
      {/* 상단 로고: 랜덤미션 · 프로필과 같은 공통 LogoHeader (누르면 메인으로) */}
      <LogoHeader />

      <main className="detail-main">
        <h1>숨은 뜻 지식인</h1>

        <section className="detail-panel">
          <div className="detail-toolbar">
            <button
              className="pm-back"
              onClick={() => navigate('/posts')}
            >
              ‹
            </button>

            {post.is_mine ? (
              <div className="detail-menu-wrap">
                <button
                  className="detail-menu-button"
                  onClick={() =>
                    setMenuOpen((value) => !value)
                  }
                  aria-label="게시물 메뉴"
                >
                  ☰
                </button>

                {menuOpen && (
                  <div className="detail-menu-popover">
                    <button onClick={() => navigate(`/posts/${post.id}/edit`)}>
                      수정하기
                    </button>

                    <button onClick={() => void deletePost()}>
                      삭제하기
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="detail-share-button"
                onClick={() => void share()}
                aria-label="공유하기"
              >
                ♧
              </button>
            )}
          </div>

          <div className="detail-author">
            <span className="pm-avatar large">●</span>

            <div>
              <strong>{post.author.name}</strong>

              <small>
                {post.author.type ||
                  '한국어를 배우는 사용자'}
              </small>
            </div>
          </div>

          <article className="detail-post-content">
            <h2>{post.title}</h2>
            <p>{post.content}</p>
          </article>

          <div className="detail-divider" />

          <section className="detail-comments">
            {comments.length === 0 ? (
              <div className="detail-empty">
                <div className="chat-bubble">•••</div>

                <h3>아직 댓글이 없어요.</h3>

                <p>
                  이 표현의 숨은 뜻을 알고 있다면
                  <br />
                  첫 번째 댓글을 남겨 보세요.
                </p>
              </div>
            ) : (
              <div className="comment-list">
                {comments.map((comment) => (
                  <article
                    className="comment-item"
                    key={comment.id}
                  >
                    <span className="pm-avatar small">
                      ●
                    </span>

                    <div className="comment-body">
                      <div className="comment-meta">
                        <strong>
                          {comment.author.name}
                        </strong>

                        {comment.author.id === post.author.id && (
                          <span className="author-label">
                            작성자
                          </span>
                        )}

                        <time>
                          {new Date(
                            comment.createdAt,
                          ).toLocaleDateString('ko-KR')}
                        </time>
                      </div>

                      <p>{comment.content}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="detail-comment-input">
            <span className="pm-avatar small">●</span>

            <input
              value={commentText}
              onChange={(e) =>
                setCommentText(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void submitComment();
                }
              }}
              placeholder="댓글을 입력해 주세요."
              maxLength={1000}
            />

            <button
              onClick={() => void submitComment()}
              disabled={!commentText.trim() || sending}
            >
              ➤
            </button>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
