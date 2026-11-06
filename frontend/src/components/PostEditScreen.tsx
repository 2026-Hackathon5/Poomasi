
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postsApi } from '../api/posts';
import { LogoHeader } from './ui';
import BottomNav from './BottomNav';

export default function PostEditScreen() {
  const navigate = useNavigate();
  const { postId = '' } = useParams();
  const detailPath = `/posts/${postId}`;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [validate, setValidate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 주소의 글 번호로 기존 글을 불러와서 입력칸에 채운다
  useEffect(() => {
    let active = true;

    postsApi
      .get(postId)
      .then((post) => {
        if (!active) return;

        if (!post.is_mine) {
          navigate(detailPath, { replace: true });
          return;
        }

        setTitle(post.title);
        setContent(post.content);
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
  }, [postId, navigate, detailPath]);

  const titleError = validate && !title.trim();
  const contentError = validate && !content.trim();

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    setValidate(true);
    setError('');

    if (!title.trim() || !content.trim() || saving) {
      return;
    }

    setSaving(true);

    try {
      await postsApi.update(postId, {
        title: title.trim(),
        content: content.trim(),
      });

      navigate(detailPath, { replace: true });
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
          게시물을 불러오고 있어요...
        </p>
      </div>
    );
  }

  return (
    <div className="poomasi-page edit-page">
      {/* 상단 로고: 공통 LogoHeader + 뒤로가기(상세로) */}
      <LogoHeader onBack={() => navigate(detailPath)} />

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
              onClick={() => navigate(detailPath)}
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

      <BottomNav />
    </div>
  );
}
