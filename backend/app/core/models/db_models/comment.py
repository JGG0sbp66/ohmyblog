"""Comment 模型，对应 PostgreSQL `comments` 表。

字段:
- id (UUID 主键，默认 gen_random_uuid())
- post_id (所属文章 ID，外键 posts.id，删除文章级联删除评论)
- user_id (评论者用户 ID，可为空，外键 users.id，删除用户置 NULL 表示匿名)
- parent_id (父评论 ID，自引用，级联删除子回复)
- content (评论内容，必填)
- status (pending/approved/spam/trash，默认 pending，Check 约束限制取值)
- like_count (点赞数，默认 0)
- created_at / updated_at (创建 / 最后更新时间)
- approved_at (审核通过时间)
- approved_by (审核人用户 ID，外键 users.id，删除用户置 NULL)

索引:
- idx_comments_created_at(created_at)
- idx_comments_parent_id(parent_id)
- idx_comments_post_id(post_id)
- idx_comments_status(status)
- idx_comments_user_id(user_id)
- idx_comments_post_status(post_id, status) WHERE status='approved'

约束:
- comments_status_check 限制 status 取值

触发器: update_comments_updated_at (数据库层维护 updated_at / approved_at 逻辑, 代码中不实现)

表注释: 博客评论表，支持多级回复和审核机制，用户ID为空时表示匿名评论。
"""
from __future__ import annotations

import datetime as dt
import uuid

from sqlalchemy import (
    String,
    Text,
    Integer,
    CheckConstraint,
    ForeignKey,
    Index,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .mixins import UUIDPrimaryKeyMixin, TimestampMixin
from typing import TYPE_CHECKING

if TYPE_CHECKING:  # 仅类型检查时导入，避免循环导入
    from .post import Post
    from .user import User

COMMENT_STATUS_CHOICES = ("pending", "approved", "spam", "trash")


class Comment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "comments"

    post_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, comment="关联的文章ID"
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, comment="评论者用户ID"
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, comment="父评论ID"
    )
    content: Mapped[str] = mapped_column(Text, nullable=False, comment="评论内容")
    status: Mapped[str | None] = mapped_column(String(20), server_default=text("'pending'"), comment="评论状态")
    like_count: Mapped[int | None] = mapped_column(Integer, server_default=text("0"), comment="点赞数量")
    approved_at: Mapped[dt.datetime | None] = mapped_column(nullable=True, comment="审核通过时间")
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, comment="审核人用户ID"
    )

    # 关系
    post: Mapped["Post"] = relationship("Post", back_populates="comments")
    user: Mapped["User | None"] = relationship("User", foreign_keys=[user_id])
    parent: Mapped["Comment | None"] = relationship(
        "Comment", remote_side="Comment.id", back_populates="children"
    )
    children: Mapped[list["Comment"]] = relationship(
        "Comment", back_populates="parent", cascade="all, delete-orphan"
    )
    approved_by_user: Mapped["User | None"] = relationship(
        "User", foreign_keys=[approved_by]
    )

    __table_args__ = (
        CheckConstraint(
            f"status IN ({', '.join([f"'{s}'" for s in COMMENT_STATUS_CHOICES])})",
            name="comments_status_check",
        ),
        Index("idx_comments_created_at", "created_at"),
        Index("idx_comments_parent_id", "parent_id"),
        Index("idx_comments_post_id", "post_id"),
        Index("idx_comments_status", "status"),
        Index("idx_comments_user_id", "user_id"),
        Index(
            "idx_comments_post_status",
            "post_id",
            "status",
            postgresql_where=text("status = 'approved'"),
        ),
        {"comment": "博客评论表，支持多级回复和审核机制，用户ID为空时表示匿名评论"},
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Comment id={self.id} post_id={self.post_id} status={self.status} user_id={self.user_id}>"
