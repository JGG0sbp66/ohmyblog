"""SystemConfig 模型，对应 PostgreSQL `system_config` 表。

字段:
- id (UUID 主键, 默认 gen_random_uuid())
- config_key (配置键名, 唯一, 例如: app.language, email.smtp)
- config_value (JSONB 格式配置值, 支持复杂结构)
- config_type (配置类型: string/boolean/number/json/array, 默认 string)
- config_group (配置分组: general/email/auth/captcha/ui 等, 默认 general)
- description (配置描述, 可为空)
- is_public (是否前端可读取, 默认 false)
- created_at / updated_at (创建/更新时间, 由 server_default + onupdate 维护)

索引:
- idx_system_config_key(config_key)
- idx_system_config_group(config_group)
- idx_system_config_public(is_public) WHERE is_public = true

约束:
- system_config_type_check 限制 config_type 取值

表注释: 系统配置表，存储所有动态配置项。
"""
from __future__ import annotations

from sqlalchemy import (
    String,
    Text,
    Boolean,
    CheckConstraint,
    Index,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .common import Base, UUIDPrimaryKeyMixin, TimestampMixin

CONFIG_TYPE_CHOICES = ("string", "boolean", "number", "json", "array")


class SystemConfig(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "system_config"

    config_key: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False, comment="配置键名，唯一标识符，如：app.language, email.smtp"
    )
    config_value: Mapped[dict] = mapped_column(
        JSONB, nullable=False, comment="配置值，JSONB格式，支持复杂数据结构"
    )
    config_type: Mapped[str | None] = mapped_column(
        String(20), server_default=text("'string'"), comment="配置类型：string/boolean/number/json/array"
    )
    config_group: Mapped[str | None] = mapped_column(
        String(50), server_default=text("'general'"), comment="配置分组：general/email/auth/captcha/ui 等"
    )
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="配置项描述，说明用途和格式"
    )
    is_public: Mapped[bool | None] = mapped_column(
        Boolean, server_default=text("false"), comment="是否公开：true-前端可读取, false-仅后端使用"
    )

    __table_args__ = (
        CheckConstraint(
            f"config_type IN ({', '.join([f'\'{t}\'' for t in CONFIG_TYPE_CHOICES])})",
            name="system_config_type_check",
        ),
        Index("idx_system_config_key", "config_key"),
        Index("idx_system_config_group", "config_group"),
        Index(
            "idx_system_config_public",
            "is_public",
            postgresql_where=text("is_public = true"),
        ),
        {"comment": "系统配置表，存储所有动态配置项"},
    )
