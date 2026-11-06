
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Post } from '../types/post';
import { postsApi } from '../api/posts';
import icon from '../assets/icon.png';
import BottomNav from './BottomNav';

const DRAFT_KEY = 'poomasi-post-draft-v1';

export default function PostScreen() {
  const navigate = useNavigate();
  const [draft] = useState(() => {
    try {
      const value = localStorage.getItem(DRAFT_KEY);

      return value
        ? JSON.parse(value) as {
            title: string;
            content: string;
          }
        : { title: '', content: '' };
    } catch {
      return { title: '', content: '' };
    }
  });

  const [title, setTitle] = useState(draft.title);
  const [content, setContent] = useState(draft.content);

  const [status, setStatus] = useState<
    'editing' | 'submitting' | 'success' | 'error' | 'login'
  >('editing');

  const [showExit, setShowExit] = useState(false);
  const [validate, setValidate] = useState(false);
  const [notice, setNotice] = useState('');
  const [created, setCreated] = useState<Post | null>(null);

  const titleError = validate && !title.trim();
  const contentError = validate && !content.trim();

  const busy = status === 'submitting';

  const saveDraft = () => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ title, content }),
      );

      setNotice('현재 기기에 임시저장했어요.');
    } catch {
      setNotice('임시저장에 실패했어요.');
    }
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();

    if (busy) return;

    setValidate(true);

    if (!title.trim() || !content.trim()) return;

    setStatus('submitting');

    try {
      const post = await postsApi.create({
        title: title.trim(),
        content: content.trim(),
      });

      setCreated(post);

      localStorage.removeItem(DRAFT_KEY);

      setStatus('success');
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'LOGIN_REQUIRED'
      ) {
        setStatus('login');
      } else {
        setStatus('error');
      }
    }
  };

  const back = () => {
    if (title.trim() || content.trim()) {
      setShowExit(true);
    } else {
      navigate('/posts');
    }
  };

  return (
    <div
      className={`poomasi-page write-page ${
        status === 'success' || status === 'error'
          ? 'write-green-bg'
          : ''
      }`}
    >
      <header className="pm-header">
        {(status === 'editing' ||
          status === 'submitting') && (
          <button
            className="pm-back"
            onClick={back}
            disabled={busy}
          >
            ‹
          </button>
        )}

        <div className="pm-logo">
          <img src={icon} alt="" />
          <strong>POOMASI</strong>
        </div>
      </header>

      {(status === 'editing' ||
        status === 'submitting') && (
        <main className="write-main">
          <h1>궁금했던 한국어 표현</h1>

          <p className="write-subtitle">
            한국어의 숨은 뜻을 다른 사람들과 나눠보세요!
          </p>

          <form onSubmit={submit} noValidate>
            <label htmlFor="new-title">
              제목 <b>*</b>
            </label>

            <input
              id="new-title"
              value={title}
              maxLength={100}
              disabled={busy}
              className={titleError ? 'invalid' : ''}
              placeholder="제목을 입력해 주세요."
              onChange={(e) => setTitle(e.target.value)}
            />

            {titleError && (
              <small className="field-error">
                ⓘ 제목을 입력해 주세요.
              </small>
            )}

            <label htmlFor="new-content">
              내용 <b>*</b>
            </label>

            <textarea
              id="new-content"
              value={content}
              maxLength={3000}
              disabled={busy}
              className={contentError ? 'invalid' : ''}
              placeholder="궁금한 내용을 자세히 적어 주세요."
              onChange={(e) => setContent(e.target.value)}
            />

            {contentError && (
              <small className="field-error">
                ⓘ 내용을 입력해 주세요.
              </small>
            )}

            <div className="write-actions">
              <button
                type="button"
                className="outline-btn"
                onClick={saveDraft}
                disabled={busy}
              >
                임시저장
              </button>

              <button
                type="submit"
                className="solid-btn"
                disabled={busy}
              >
                {busy ? '등록 중...' : '등록하기'}
              </button>
            </div>

            {notice && (
              <p className="pm-notice">{notice}</p>
            )}
          </form>
        </main>
      )}

      {status === 'success' && created && (
        <main className="feedback-main">
          <div className="feedback-card">
            <h2>게시물이 업로드됐어요!</h2>
          </div>

          <p>오늘도 한 걸음, 성장했어요!</p>

          <div className="feedback-actions">
            <button
              className="outline-btn"
              onClick={() => navigate('/posts')}
            >
              뒤로가기
            </button>

            <button
              className="solid-btn"
              onClick={() => navigate(`/posts/${created.id}`)}
            >
              글 보러가기
            </button>
          </div>
        </main>
      )}

      {status === 'error' && (
        <main className="feedback-main">
          <div className="feedback-card">
            <div className="warning-symbol">⚠</div>

            <h2>게시물을 등록하지 못했어요!</h2>

            <p>
              일시적인 오류가 발생했어요.
              <br />
              네트워크 상태를 확인하고 다시 시도해 주세요.
            </p>
          </div>

          <div className="feedback-stack">
            <button
              className="solid-btn"
              onClick={() => void submit()}
            >
              ↻ 다시 시도하기
            </button>

            <button
              className="outline-btn"
              onClick={() => setStatus('editing')}
            >
              글 작성 화면으로 돌아가기
            </button>
          </div>
        </main>
      )}

      {status === 'login' && (
        <main className="feedback-main">
          <div className="warning-symbol">♙</div>

          <h2>
            글을 등록하려면
            <br />
            로그인이 필요해요!
          </h2>

          <p>
            로그인하고 나만의 표현을
            <br />
            다른 사람들과 공유해 보세요.
          </p>

          <button
            className="solid-btn"
            onClick={() => navigate('/login')}
          >
            로그인하기
          </button>

          <button
            className="outline-btn"
            onClick={() => navigate('/signup')}
          >
            회원가입하기
          </button>

          <button
            className="text-btn"
            onClick={() => setStatus('editing')}
          >
            글쓰기 화면으로 돌아가기
          </button>
        </main>
      )}

      {showExit && (
        <div className="pm-modal-backdrop">
          <div className="pm-modal">
            <button
              className="modal-x"
              onClick={() => setShowExit(false)}
            >
              ×
            </button>

            <h2>지금 나가시겠어요?</h2>

            <p>
              지금 나가면 작성 중인 글은
              <br />
              저장되지 않을 수 있어요.
            </p>

            <div className="modal-actions">
              <button
                className="outline-btn"
                onClick={() => setShowExit(false)}
              >
                계속 작성
              </button>

              <button
                className="solid-btn"
                onClick={() => {
                  setShowExit(false);
                  navigate('/posts');
                }}
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
