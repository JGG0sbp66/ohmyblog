"""User 模型，对应 PostgreSQL `users` 表。

包含字段:
- id (UUID, 主键, 默认 gen_random_uuid())
- username (varchar(50), 唯一，用于登录和显示)
- email (varchar(100), 唯一，用于登录和通知)
- password_hash (varchar(255), 存储加密后的密码哈希)
- avatar_url (varchar(500), 可空，用户头像 URL)
- bio (text, 可空，用户个人简介或签名)
- role (varchar(20), 默认 'user', 仅允许 'admin','editor','user')
- status (varchar(20), 默认 'active', 仅允许 'active','inactive','banned')
- created_at / updated_at (timestamptz, 默认 CURRENT_TIMESTAMP，由 server_default 或触发器维护)
- last_login_at (timestamptz, 可空，记录最后登录时间)
- email_verified (bool, 默认 false)

索引:
- idx_users_created_at(created_at) — 创建时间索引，用于时间分析/排序
- idx_users_email(email) — 邮箱索引，加速登录/验证查询
- idx_users_role(role) — 角色索引，加速权限/角色筛选
- idx_users_status(status) — 状态索引，加速状态筛选
- idx_users_username(username) — 用户名索引，加速登录查询

唯一约束:
- users_username_key (username)
- users_email_key (email)

触发器:
- update_users_updated_at BEFORE UPDATE ON users — 自动维护 updated_at 字段

表注释: 博客网站用户表，存储用户基本信息和认证数据
"""

from __future__ import annotations

import datetime as dt

from sqlalchemy import String, Text, CheckConstraint, text, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from .common import Base, UUIDPrimaryKeyMixin, TimestampMixin

# 角色和状态允许的取值（应用层可复用）
ROLE_CHOICES = ("admin", "editor", "user")
STATUS_CHOICES = ("active", "inactive", "banned")


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
        comment="用户名，用于登录和显示，唯一",
    )
    email: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
        comment="邮箱地址，用于登录和通知，唯一",
    )
    password_hash: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="加密后的密码哈希值"
    )
    avatar_url: Mapped[str | None] = mapped_column(
        String(500), nullable=True, comment="用户头像图片 URL 地址"
    )
    bio: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="用户个人简介或签名"
    )
    role: Mapped[str | None] = mapped_column(
        String(20),
        server_default=text("'user'"),
        comment="用户角色：admin-管理员, editor-编辑, user-普通用户",
    )
    status: Mapped[str | None] = mapped_column(
        String(20),
        server_default=text("'active'"),
        comment="用户状态：active-活跃, inactive-未激活, banned-封禁",
    )
    last_login_at: Mapped[dt.datetime | None] = mapped_column(
        nullable=True, comment="最后登录时间"
    )
    email_verified: Mapped[bool | None] = mapped_column(
        Boolean,
        server_default=text("false"),
        comment="邮箱验证状态：true-已验证, false-未验证",
    )

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
