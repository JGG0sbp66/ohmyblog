from contextlib import asynccontextmanager
from app.utils.db_util import AsyncDatabase
from app.core.config import settings
from app.utils.logger_util import init_logger
import logging
from typing import Dict
from singleton_decorator import singleton


@singleton
class InitUtils:
    """工具类初始化管理"""

    def __init__(self):
        """
        初始化异步数据库实例
        """
        self.isInitialized = False
        self.db_instance: AsyncDatabase | None = None
        self.loggers: Dict[str, logging.Logger] = {}
    
    async def initialize(self):
        """
        异步初始化所有工具
        """
        if self.isInitialized:
            return
        self.isInitialized = True
        await self.init_loggers()
        await self.init_database()
    
    async def dispose(self):
        """
        异步释放所有工具
        """
        if self.db_instance:
            await self.db_instance.dispose()
            self.loggers['utils'].info("数据库连接已关闭")
        self.isInitialized = False

    async def init_loggers(self):
        """
        初始化所有 logger
        """
        self.loggers['utils'] = init_logger('utils', 'utils.log', logging.INFO, is_console=True)
        logger_names = list(self.loggers.keys())
        self.loggers['utils'].info(f"Logger 初始化完成, 共 {len(logger_names)} 个日志器: {logger_names}")

    async def init_database(self):
        """
        初始化数据库连接
        """
        db_url = f"postgresql+psycopg_async://{settings.database.user}:{settings.database.password}@{settings.database.host}:{settings.database.port}/{settings.database.db}"
        self.db_instance = AsyncDatabase(db_url, self.loggers['utils'])
        self.loggers['utils'].info(f"数据库连接初始化完成, 数据库地址: {db_url}")

# 创建全局工具实例
init_utils = InitUtils()

@asynccontextmanager
async def lifespan():
    # 启动时初始化
    await init_utils.initialize()
    yield
    # 关闭时释放资源
    await init_utils.dispose()

# 全局依赖项
async def get_db():
    """获取数据库实例的依赖项"""
    return init_utils.db_instance.get_db()