"""User 模型，对应 PostgreSQL `users` 表。

包含字段:
- id (UUID, 主键, 默认 gen_random_uuid())
- username (唯一, 登录/显示)
- email (唯一)
- password_hash (加密后的密码)
- avatar_url (可空)
- bio (可空)
- role (默认 user) 约束: admin/editor/user
- status (默认 active) 约束: active/inactive/banned
- created_at / updated_at (默认 CURRENT_TIMESTAMP)
- last_login_at (可空)
- email_verified (默认 false)
"""
from __future__ import annotations

import datetime as dt

from sqlalchemy import String, Text, CheckConstraint, text, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base
from .mixins import UUIDPrimaryKeyMixin, TimestampMixin

# 角色和状态允许的取值（应用层可复用）
ROLE_CHOICES = ("admin", "editor", "user")
STATUS_CHOICES = ("active", "inactive", "banned")

class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False, comment="用户名，用于登录和显示，唯一")
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False, comment="邮箱地址，用于登录和通知，唯一")
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False, comment="加密后的密码哈希值")
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="用户头像图片 URL 地址")
    bio: Mapped[str | None] = mapped_column(Text, nullable=True, comment="用户个人简介或签名")
    role: Mapped[str | None] = mapped_column(String(20), server_default=text("'user'"), comment="用户角色：admin-管理员, editor-编辑, user-普通用户")
    status: Mapped[str | None] = mapped_column(String(20), server_default=text("'active'"), comment="用户状态：active-活跃, inactive-未激活, banned-封禁")
    last_login_at: Mapped[dt.datetime | None] = mapped_column(nullable=True, comment="最后登录时间")
    email_verified: Mapped[bool | None] = mapped_column(Boolean, server_default=text("false"), comment="邮箱验证状态：true-已验证, false-未验证")

    __table_args__ = (
        CheckConstraint(
            f"role IN ({', '.join([f"'{r}'" for r in ROLE_CHOICES])})",
            name="users_role_check",
        ),
        CheckConstraint(
            f"status IN ({', '.join([f"'{s}'" for s in STATUS_CHOICES])})",
            name="users_status_check",
        ),
        {"comment": "博客网站用户表，存储用户基本信息和认证数据"},
    )
