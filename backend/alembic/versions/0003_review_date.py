"""user_missions.reviewed_at (I.3 후기 작성 날짜)

Revision ID: 0003
Revises: 0002 (팀원의 posts.title)
Create Date: 2026-11-05
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("user_missions", sa.Column("reviewed_at", sa.DateTime(timezone=True)))
    # 이미 후기가 있는 기록은 작성 날짜를 완료 날짜로 채워 둔다
    op.execute("UPDATE user_missions SET reviewed_at = completed_at WHERE review IS NOT NULL")


def downgrade() -> None:
    op.drop_column("user_missions", "reviewed_at")
