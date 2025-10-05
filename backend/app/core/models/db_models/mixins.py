"""通用字段 Mixins, 例如 ID、时间戳等。"""
from __future__ import annotations

import uuid
import datetime as dt
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import func, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID

class UUIDPrimaryKeyMixin:
    # as_uuid=True 使得 ORM 层直接使用 uuid.UUID 对象
    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        nullable=False,
        comment="用户唯一标识符，UUID 格式",
    )

class TimestampMixin:
    created_at: Mapped[dt.datetime | None] = mapped_column(server_default=func.now(), comment="创建时间")
    updated_at: Mapped[dt.datetime | None] = mapped_column(server_default=func.now(), onupdate=func.now(), comment="更新时间")
