
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { FormEvent } from 'react';
import type { Post } from '../types';
import { postsApi } from '../api/posts';
import icon from '../assets/icon.png';

export default function PostEditScreen() {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [loading, setLoading] = useState(true);
  const [validate, setValidate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadPost = async () => {
      if (!postId) {
        setError('게시글 주소가 올바르지 않아요.');
        setLoading(false);
        return;
      }

      try {
        const data = await postsApi.get(postId);

        if (active) {
          setPost(data);
          setTitle(data.title);
          setContent(data.content);
          setError('');
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : '게시물을 불러오지 못했어요.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadPost();

    return () => {
      active = false;
    };
  }, [postId]);

  const titleError = validate && !title.trim();
  const contentError = validate && !content.trim();

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    setValidate(true);
    setError('');

    if (!post || !title.trim() || !content.trim() || saving) {
      return;
    }

    setSaving(true);

    try {
      const updated = await postsApi.update(post.id, {
        title: title.trim(),
        content: content.trim(),
      });

      navigate(`/posts/${updated.id}`, {
        replace: true,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '수정하지 못했어요.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="poomasi-page">
        <p className="pm-message">
          게시글을 불러오고 있어요...
        </p>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="poomasi-page">
        <p className="pm-error">{error}</p>
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
    <div className="poomasi-page edit-page">
      <header className="pm-header">
        <button
          className="pm-back"
          onClick={() => navigate(`/posts/${postId}`)}
        >
          ‹
        </button>

        <div className="pm-logo">
          <img src={icon} alt="" />
          <strong>POOMASI</strong>
        </div>
      </header>

      <main className="write-main">
        <h1>글 수정하기</h1>

        <p className="write-subtitle">
          기존 내용을 수정하고, 더 완성도 있게 작성해 보세요.
        </p>

        <form onSubmit={submit} noValidate>
          <label htmlFor="edit-title">
            제목 <b>*</b>
          </label>

          <input
            id="edit-title"
            value={title}
            maxLength={100}
            disabled={saving}
            className={titleError ? 'invalid' : ''}
            onChange={(e) => setTitle(e.target.value)}
          />

          {titleError && (
            <small className="field-error">
              ⓘ 제목을 입력해 주세요.
            </small>
          )}

          <label htmlFor="edit-content">
            내용 <b>*</b>
          </label>

          <textarea
            id="edit-content"
            value={content}
            maxLength={3000}
            disabled={saving}
            className={contentError ? 'invalid' : ''}
            onChange={(e) => setContent(e.target.value)}
          />

          {contentError && (
            <small className="field-error">
              ⓘ 내용을 입력해 주세요.
            </small>
          )}

          {error && (
            <p className="pm-error">{error}</p>
          )}

          <div className="write-actions">
            <button
              type="button"
              className="outline-btn"
              onClick={() => navigate(`/posts/${postId}`)}
              disabled={saving}
            >
              취소
            </button>

            <button
              type="submit"
              className="solid-btn"
              disabled={saving}
            >
              {saving ? '수정 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </main>

      <nav className="pm-bottom-nav">
        <button onClick={() => navigate('/')}>
          랜덤미션
        </button>

        <button
          className="active"
          onClick={() => navigate('/posts')}
        >
          숨은 뜻
        </button>

        <button disabled>지도</button>

        <button onClick={() => navigate('/profile')}>
          프로필
        </button>
      </nav>

      <div className="pm-home-indicator" />
    </div>
  );
}
