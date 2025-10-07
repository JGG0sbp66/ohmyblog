from typing import Iterable, Optional
from fastapi import Request, FastAPI
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.i18n_util import I18nManager, _
from app.utils.logger_util import get_logger
from app.core.config import settings


class I18nMiddleware(BaseHTTPMiddleware):
    """FastAPI / Starlette 中间件: 解析请求语言并设置上下文 locale

    优先级:
        1. URL 查询参数 lang (?lang=en_US)
        2. Header: X-Locale / X-Language / Accept-Language
    """

    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.i18n_manager = I18nManager()
        self.supported = self.i18n_manager.available_locales()
        if self.i18n_manager.lang not in self.supported:
            self.supported.append(self.i18n_manager.lang)


    def _normalize_locale(self, candidate: str, supported: Iterable[str]) -> Optional[str]:
        """
            尝试匹配 candidate 到 supported, 支持:
        1. 完全匹配: zh_CN -> zh_CN
        2. 主语言回退: zh -> zh_CN (若 supported 有 zh_CN)
        3. 忽略大小写
        """
        cl = candidate.strip().replace("-", "_")
        supported_lower = {s.lower(): s for s in supported}
        if cl.lower() in supported_lower:
            return supported_lower[cl.lower()]
        # 主语言
        if "_" in cl:
            base = cl.split("_", 1)[0]
        else:
            base = cl
        # 找到第一个以 base 开头的 supported
        for s in supported:
            if s.lower().startswith(base.lower() + "_") or s.lower() == base.lower():
                return s
        return None


    def _parse_accept_language(self, header_value: str) -> list[str]:
        """解析 Accept-Language, 返回按 q 权重排序的 locale 列表(简化实现)"""
        if not header_value:
            return []
        parts = header_value.split(",")
        locale_q = []
        for part in parts:
            if ";q=" in part:
                lang, qv = part.split(";q=", 1)
                try:
                    q = float(qv)
                except ValueError:
                    q = 1.0
            else:
                lang = part
                q = 1.0
            lang = lang.strip().replace("-", "_")
            if lang:
                locale_q.append((lang, q))
        # 按权重降序
        locale_q.sort(key=lambda x: x[1], reverse=True)
        return [lang for lang, _ in locale_q]


    async def dispatch(self, request: Request, call_next):
        raw = (
            request.query_params.get("lang")
            or request.headers.get("X-Locale")
            or request.headers.get("X-Language")
        )
        chosen = None
        if raw:
            chosen = self._normalize_locale(raw, self.supported)
        if not chosen:
            # 解析 Accept-Language
            accepts = self._parse_accept_language(
                request.headers.get("Accept-Language", "")
            )
            for cand in accepts:
                chosen = self._normalize_locale(cand, self.supported)
                if chosen:
                    break
        if not chosen:
            chosen = self.i18n_manager.lang
        token = self.i18n_manager.current_locale.set(chosen)
        try:
            resp = await call_next(request)
        finally:
            self.i18n_manager.current_locale.reset(token)
        # 在响应头里暴露最终 locale (可选)
        resp.headers["Content-Language"] = chosen
        return resp


def setup_i18n(app: FastAPI):
    """
    在 FastAPI 应用中安装 i18n 中间件
    """
    try:
        app.add_middleware(I18nMiddleware)
        utils_logs = get_logger("utils")
        utils_logs.info(_("国际化中间件已添加"))
        utils_logs.info(_("默认语言: {locale}", locale=settings.i18n.default_locale))
    except Exception as e:
        utils_logs.error(_("国际化中间件初始化失败: {error}", error=e))
