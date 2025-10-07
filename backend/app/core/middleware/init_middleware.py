from fastapi import FastAPI
from app.core.middleware.i18n_middleware import setup_i18n


def setup_middleware(app: FastAPI):
    """
    在 FastAPI 应用中安装所有中间件
    """
    # 安装 i18n 中间件
    setup_i18n(app)