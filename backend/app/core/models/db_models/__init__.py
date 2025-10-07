"""数据库模型聚合入口。

外部只需要从这里导入具体模型即可，保证 Alembic 或初始化时
只 import 一次即可让所有模型注册到 metadata。
"""

from .user import User
from .post import Post
from .comment import Comment
from .system_config import SystemConfig

__all__ = [
	"User",
	"Post",
	"Comment",
	"SystemConfig",
]