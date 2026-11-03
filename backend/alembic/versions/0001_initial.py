"""initial tables + RLS

Revision ID: 0001
Revises:
Create Date: 2026-11-04
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TABLES = ("profiles", "missions", "user_missions", "posts", "comments")


def upgrade() -> None:
    op.create_table(
        "profiles",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("email", sa.String(255)),
        sa.Column("nickname", sa.String(20), nullable=False, unique=True),
        sa.Column("user_type", sa.String(20), nullable=False),
        sa.Column("nationality", sa.String(50), nullable=False),
        sa.Column("xp", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("user_type IN ('korean', 'foreign_resident')", name="ck_profiles_user_type"),
    )

    op.create_table(
        "missions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("country", sa.String(50), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("verify_type", sa.String(10), nullable=False),
        sa.Column("source", sa.String(10), nullable=False, server_default="user"),
        sa.Column("place_name", sa.String(100)),
        sa.Column("address", sa.String(255)),
        sa.Column("lat", sa.Float()),
        sa.Column("lng", sa.Float()),
        sa.Column("radius_m", sa.Integer(), nullable=False, server_default="300"),
        sa.Column("creator_id", sa.Uuid(), sa.ForeignKey("profiles.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("verify_type IN ('location', 'photo', 'none')", name="ck_missions_verify_type"),
        sa.CheckConstraint("source IN ('ai', 'user')", name="ck_missions_source"),
        sa.CheckConstraint(
            "verify_type <> 'location' OR (lat IS NOT NULL AND lng IS NOT NULL)",
            name="ck_missions_location_coords",
        ),
    )
    op.create_index("ix_missions_country", "missions", ["country"])

    op.create_table(
        "user_missions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("mission_id", sa.Integer(), sa.ForeignKey("missions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="in_progress"),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("xp_awarded", sa.Integer()),
        sa.Column("photo_url", sa.String(500)),
        sa.Column("review", sa.String(300)),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint(
            "status IN ('in_progress', 'reviewing', 'completed', 'cancelled')",
            name="ck_user_missions_status",
        ),
        sa.CheckConstraint("char_length(review) <= 300", name="ck_user_missions_review_len"),
    )
    op.create_index("ix_user_missions_user_id", "user_missions", ["user_id"])
    op.create_index("ix_user_missions_mission_id", "user_missions", ["mission_id"])
    op.create_index(
        "uq_user_missions_active",
        "user_missions",
        ["user_id", "mission_id"],
        unique=True,
        postgresql_where=sa.text("status IN ('in_progress', 'reviewing')"),
    )

    op.create_table(
        "posts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("author_id", sa.Uuid(), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_posts_author_id", "posts", ["author_id"])

    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_id", sa.Uuid(), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_comments_post_id", "comments", ["post_id"])
    op.create_index("ix_comments_author_id", "comments", ["author_id"])

    # RLS를 켜고 정책은 만들지 않는다 → Supabase anon key로는 테이블에 직접 접근 불가.
    # 백엔드는 테이블 소유자(postgres)로 연결하므로 영향 없음.
    for table in (*TABLES, "alembic_version"):
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    for table in reversed(TABLES):
        op.drop_table(table)
