"""Post 模型，对应 PostgreSQL `posts` 表。

包含字段:
- id (UUID, 主键, 默认 gen_random_uuid())
- title (文章标题，必填)
- slug (唯一 URL 别名 / SEO 永久链接，必填，唯一+索引)
- content (正文内容，必填，支持富文本)
- excerpt (文章摘要，可选，用于列表预览)
- cover_image (封面图 URL，可选)
- status (文章状态：draft/published/archived/private，默认 draft，Check 约束限制取值)
- comment_status (是否允许评论，bool，默认 true)
- is_pinned (是否置顶，bool，默认 false)
- post_password (访问密码，私密或受限内容可用，空=公开)
- view_count (阅读次数，默认 0)
- like_count (点赞数，默认 0)
- created_at / updated_at (创建 / 最后更新时间，触发器或 server_default 维护)
- published_at (发布时间，只有发布后才会设置)

索引:
- idx_posts_created_at(created_at)
- idx_posts_published_at(published_at)
- idx_posts_status(status)
- slug: unique + index (自动生成)

约束:
- posts_status_check: status 取值限制

表注释: 个人博客文章表，存储所有文章内容
"""

from __future__ import annotations

import datetime as dt

from sqlalchemy import (
    String,
    Text,
    Boolean,
    Integer,
    CheckConstraint,
    Index,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base
from .mixins import UUIDPrimaryKeyMixin, TimestampMixin

POST_STATUS_CHOICES = ("draft", "published", "archived", "private")


class Post(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "posts"

    title: Mapped[str] = mapped_column(String(200), nullable=False, comment="文章标题")
    slug: Mapped[str] = mapped_column(
        String(200),
        unique=True,
        index=True,
        nullable=False,
        comment="文章URL别名，用于SEO友好的永久链接",
    )
    content: Mapped[str] = mapped_column(
        Text, nullable=False, comment="文章正文内容，支持富文本"
    )
    excerpt: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="文章摘要，可选，用于文章列表页显示"
    )
    cover_image: Mapped[str | None] = mapped_column(
        String(500), nullable=True, comment="文章封面图URL，可选"
    )
    status: Mapped[str | None] = mapped_column(
        String(20),
        server_default=text("'draft'"),
        comment="文章状态：draft/published/archived/private",
    )
    comment_status: Mapped[bool | None] = mapped_column(
        Boolean,
        server_default=text("true"),
        comment="评论开关：true-允许评论, false-禁止评论",
    )
    is_pinned: Mapped[bool | None] = mapped_column(
        Boolean, server_default=text("false"), comment="是否置顶"
    )
    post_password: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="文章访问密码，私密文章使用，为空表示公开"
    )
    view_count: Mapped[int | None] = mapped_column(
        Integer, server_default=text("0"), comment="文章阅读次数"
    )
    like_count: Mapped[int | None] = mapped_column(
        Integer, server_default=text("0"), comment="文章点赞数"
    )
    published_at: Mapped[dt.datetime | None] = mapped_column(
        nullable=True, comment="文章发布时间"
    )

    __table_args__ = (
        CheckConstraint(
            f"status IN ({', '.join([f"'{s}'" for s in POST_STATUS_CHOICES])})",
            name="posts_status_check",
        ),
        Index("idx_posts_created_at", "created_at"),
        Index("idx_posts_published_at", "published_at"),
        Index("idx_posts_status", "status"),
        {"comment": "个人博客文章表，存储所有文章内容"},
    )
