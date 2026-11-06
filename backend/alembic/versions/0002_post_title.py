"""posts에 title(제목) 추가

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-05
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 이미 있는 글은 빈 제목("")으로 채워진다. 새 글은 API에서 1~100자를 받는다
    op.add_column("posts", sa.Column("title", sa.String(100), nullable=False, server_default=""))


def downgrade() -> None:
    op.drop_column("posts", "title")
