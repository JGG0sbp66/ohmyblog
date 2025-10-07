"""
使用建议:
        更新文案后: 先 extract -> update -> edit .po -> compile

1. 提取 (生成/更新 POT):
    pybabel extract -F app\\utils\\i18n\\babel.cfg -o app\\utils\\i18n\\messages.pot .
2. 初始化新语言 (示例: 法语):
    pybabel init -i app\\utils\\i18n\\messages.pot -d app\\utils\\i18n -l fr_FR
3. 更新已有语言 (新增或修改 msgid 后):
    pybabel update -i app\\utils\\i18n\\messages.pot -d app\\utils\\i18n
4. 编译生成 .mo (部署 / 运行前必须):
    pybabel compile -d app\\utils\\i18n
"""

from __future__ import annotations

import gettext
from pathlib import Path
from typing import Dict
from contextvars import ContextVar
from app.core.config import settings


class I18nManager:
    """国际化管理器"""

    def __init__(self):
        self.lang_dir = Path(__file__).resolve().parent / "i18n"
        self.domain = settings.i18n.domain
        # TODO: 优先从数据库配置读取
        self.lang = settings.i18n.default_locale
        self.current_locale: ContextVar[str] = ContextVar("current_locale", default=self.lang)
        self.translations_cache: Dict[str, gettext.NullTranslations] = {}


    def available_locales(self) -> list[str]:
        """
        扫描 i18n 目录下可用语言

        returns: 可用语言列表, 例如['zh_CN', 'en_US']
        """
        locales = []
        if self.lang_dir.exists():
            for p in self.lang_dir.iterdir():
                if p.is_dir() and (p / "LC_MESSAGES" / f"{self.domain}.mo").exists():
                    locales.append(p.name)
        return locales
    
    def _load_translation(self, locale: str) -> gettext.NullTranslations:
        """加载某 locale 的翻译, 带缓存, 若缺失则回退到默认或 gettext fallback"""
        if locale not in self.translations_cache:
            try:
                trans = gettext.translation(
                    self.domain, localedir=str(self.lang_dir), languages=[locale]
                )
            except FileNotFoundError:
                # 回退: 首选 en_US, 再 fallback=True
                try:
                    trans = gettext.translation(
                        self.domain, localedir=str(self.lang_dir), languages=self.lang
                    )
                except FileNotFoundError:
                    trans = gettext.NullTranslations()
            self.translations_cache[locale] = trans
        return self.translations_cache[locale]


    def set_locale(self, locale: str):
        """显式设置当前上下文 locale"""
        self.current_locale.set(locale)


    def get_locale(self) -> str:
        return self.current_locale.get()


def _(message: str, /, **kwargs) -> str:
    """翻译并执行 str.format 插值

    示例: _("默认语言: {locale}", locale="zh_CN")
    """
    i18n_manager = I18nManager()
    trans = i18n_manager._load_translation(i18n_manager.get_locale())
    if kwargs:
        return trans.gettext(message).format(**kwargs)
    return trans.gettext(message)
