"""基础模型与通用字段聚合。

说明:
 - 避免与业务表模型文件混在一起。
"""
from .base import Base
from .mixins import UUIDPrimaryKeyMixin, TimestampMixin

__all__ = [
    "Base",
    "UUIDPrimaryKeyMixin",
    "TimestampMixin",
]
