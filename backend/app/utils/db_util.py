import asyncio
from contextlib import asynccontextmanager
import sys
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession, AsyncEngine
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, DBAPIError
from tenacity import AsyncRetrying, stop_after_attempt, wait_exponential_jitter, retry_if_exception_type
from app.core.config import settings
from app.utils.i18n_util import _, t
from app.utils.logger_util import get_logger

# 在 Windows 上设置兼容的事件循环策略
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

class AsyncDatabase:
    """异步数据库连接工具类"""

    def __init__(self, db_url: str):
        """
        初始化数据库连接

        Args:
            db_url (str): 数据库连接字符串, 
                          传入格式为 "postgresql+psycopg_async://user:password@host:port/dbname"
        """
        self.utils_logger = get_logger("utils")
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
    
    async def test_connection_with_retry(self):
        """在启动阶段测试数据库连接, 并在失败时进行重试"""
        if not self.engine:
            raise RuntimeError(_("数据库引擎未初始化"))

        # 若未启用重试, 直接测试一次
        if not getattr(settings.database, 'retry_enabled', True):
            async with self.engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            self.utils_logger.info(_("[DB] 启动连接检测成功 (未启用重试)"))
            return

        max_attempts = int(getattr(settings.database, 'retry_max_attempts', 6))
        initial_wait = float(getattr(settings.database, 'retry_initial_wait', 1))
        max_wait = float(getattr(settings.database, 'retry_max_wait', 20))
        attempt_timeout = float(getattr(settings.database, 'attempt_timeout', 10))

        attempt_index = 0
        self.utils_logger.info(
            t("[DB] 开始连接检测: 最大尝试 {max_attempts} 次, 初始等待 {initial_wait}s, 最大等待 {max_wait}s",
              max_attempts=max_attempts, initial_wait=initial_wait, max_wait=max_wait)
        )

        async for attempt in AsyncRetrying(
            stop=stop_after_attempt(max_attempts),
            wait=wait_exponential_jitter(initial=initial_wait, max=max_wait),
            retry=retry_if_exception_type((OperationalError, DBAPIError, OSError, TimeoutError)),
            reraise=True,
        ):
            with attempt:
                attempt_index += 1
                try:
                    async def _probe():
                        async with self.engine.connect() as conn:
                            await conn.execute(text("SELECT 1"))

                    await asyncio.wait_for(_probe(), timeout=attempt_timeout)
                    self.utils_logger.info(t("[DB] 连接检测成功 (第 {attempt_index} 次) <- 用时正常", attempt_index=attempt_index))
                    return
                except asyncio.TimeoutError as e:
                    self.utils_logger.warning(
                        t("[DB] 连接检测超时 (第 {attempt_index} 次, 超过 {attempt_timeout}s): {error}",
                          attempt_index=attempt_index, attempt_timeout=attempt_timeout, error=e)
                    )
                    raise
                except (OperationalError, DBAPIError, OSError, TimeoutError) as e:
                    self.utils_logger.warning(
                        t("[DB] 连接检测失败 (第 {attempt_index} 次): {error_class}: {error}",
                          attempt_index=attempt_index, error_class=e.__class__.__name__, error=e)
                    )
                    raise
    
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
            self.utils_logger.error(t("关闭数据库连接时出错: {error}", error=e))
