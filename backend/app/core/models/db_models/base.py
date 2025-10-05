"""SQLAlchemy 基础声明与公共约定。

- 提供统一命名约定，避免 Alembic 迁移无谓 diff。
- 提供 Base 基类，未来所有模型继承。
"""
from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase, declared_attr
from sqlalchemy import MetaData

# 统一命名约定（索引/约束名字更可预测）
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=NAMING_CONVENTION)

class Base(DeclarativeBase):
    metadata = metadata

    # 如果未显式定义 __tablename__ 则默认使用类名小写
    @declared_attr.directive
    def __tablename__(cls) -> str:
        return cls.__name__.lower()
