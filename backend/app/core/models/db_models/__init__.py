"""数据库模型聚合入口。

外部只需要从这里导入 Base / 具体模型即可，保证 Alembic 或初始化时
只 import 一次即可让所有模型注册到 metadata。
"""

from .base import Base
from .user import User
from .post import Post

__all__ = [
	"Base",
	"User",
	"Post",
]