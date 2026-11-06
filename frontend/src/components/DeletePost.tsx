
interface DeletePostProps {
  isOpen: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeletePost({
  isOpen,
  loading = false,
  onCancel,
  onConfirm,
}: DeletePostProps) {
  if (!isOpen) return null;

  return (
    <div
      className="delete-post-overlay"
      onClick={onCancel}
    >
      <div
        className="delete-post-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-post-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-post-title">
          게시물을 삭제할까요?
        </h2>

        <p>
          삭제한 게시물은 복구할 수 없어요.
        </p>

        <div className="delete-post-actions">
          <button
            type="button"
            className="delete-post-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            취소
          </button>

          <button
            type="button"
            className="delete-post-confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? '삭제 중...' : '삭제하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
