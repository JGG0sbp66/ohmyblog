import asyncio
from contextlib import asynccontextmanager
import logging
import sys
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession, AsyncEngine
from app.core.config import settings


# 在 Windows 上设置兼容的事件循环策略
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

class AsyncDatabase:
    """异步数据库连接工具类"""

    def __init__(self, db_url: str, logger: logging.Logger):
        """
        初始化数据库连接

        Args:
            db_url (str): 数据库连接字符串, 
                          传入格式为 "postgresql+psycopg_async://user:password@host:port/dbname"
        """
        self.utils_logger = logger
        self.db_url: str = db_url
        self.engine: AsyncEngine | None = None
        self.async_session: AsyncSession | None = None

        # 初始化数据库连接
        self.init_db()

    def init_db(self):
        """
        初始化数据库引擎和会话工厂
        """
        # 创建异步数据库引擎
        self.engine = create_async_engine(
            self.db_url,
            echo=settings.database.echo,
            pool_size=settings.database.pool_size,
            max_overflow=settings.database.max_overflow,
            pool_timeout=settings.database.pool_timeout,
            pool_recycle=settings.database.pool_recycle,
            pool_pre_ping=settings.database.pool_pre_ping,
        )

        # 创建会话工厂
        self.async_session = async_sessionmaker(
            self.engine,
            class_=AsyncSession,       # 使用异步会话
            expire_on_commit=False,    # 提交后实例不过期
            autoflush=False,           # 关闭自动刷新
            autocommit=False           # 关闭自动提交
        )
    
    @asynccontextmanager
    async def get_db(self) -> AsyncGenerator[AsyncSession, None]:
        """
        异步上下文管理器, 提供数据库会话
        """
        async with self.async_session() as session:
            try:
                yield session
                await session.commit()    # 正常提交事务
            except Exception:
                await session.rollback()  # 异常回滚事务
                raise
    
    async def dispose(self):
        """
        异步关闭数据库连接
        """
        try:
            if self.engine:
                await self.engine.dispose()
        except Exception as e:
            self.utils_logger.error(f"关闭数据库连接时出错: {e}")



# TODO 连接不上数据库需要考虑重试机制，然后重试多次后还是不行就得设置一定后时间后断开



