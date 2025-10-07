from contextlib import asynccontextmanager

from fastapi import FastAPI
from app.utils.db_util import AsyncDatabase
from app.core.config import settings
from app.utils.logger_util import get_logger
from singleton_decorator import singleton
from app.utils.i18n_util import _


@singleton
class InitUtils:
    """工具类初始化管理"""

    def __init__(self):
        """
        初始化异步数据库实例
        """
        self.isInitialized = False
        self.db_instance: AsyncDatabase | None = None
        self.utils_logger = get_logger("utils", is_console=True)

    async def initialize(self):
        """
        异步初始化所有工具
        """
        if self.isInitialized:
            return
        self.isInitialized = True
        await self.init_database()
    
    async def dispose(self):
        """
        异步释放所有工具
        """
        if self.db_instance:
            await self.db_instance.dispose()
            self.utils_logger.info(_("数据库连接已关闭"))
        self.isInitialized = False

    async def init_database(self):
        """
        初始化数据库连接
        """
        db_url = f"postgresql+psycopg_async://{settings.database.user}:{settings.database.password}@{settings.database.host}:{settings.database.port}/{settings.database.db}"
        self.db_instance = AsyncDatabase(db_url)
        # 启动时进行连接检测
        try:
            await self.db_instance.test_connection_with_retry()
            self.utils_logger.info(_("数据库连接初始化完成, 数据库地址: {db_url}", db_url=db_url))
        except Exception as e:
            self.utils_logger.error(_("数据库连接在重试后仍失败: {error}", error=e))
            raise

# 创建全局工具实例
init_utils = InitUtils()

@asynccontextmanager
async def lifespan(_: FastAPI):
    # 启动时初始化
    await init_utils.initialize()
    yield
    # 关闭时释放资源
    await init_utils.dispose()

# 全局依赖项
async def get_db():
    """获取数据库实例的依赖项"""
    return init_utils.db_instance.get_db()