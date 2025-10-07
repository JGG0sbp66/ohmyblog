import logging
from pathlib import Path
from typing import Dict
from singleton_decorator import singleton
import colorlog


@singleton
class LoggerManager:
    def __init__(self, log_dir: Path = Path(__file__).resolve().parent):
        self.log_dir = log_dir / "logs"
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.loggers: Dict[str, logging.Logger] = {}

    def get_logger(
        self,
        logger_name: str,
        level=logging.INFO,
        mode="a",
        is_console=False,
    ) -> logging.Logger:
        """初始化并返回 logger"""
        if logger_name in self.loggers:
            return self.loggers[logger_name]  # 已存在则直接返回

        logger = self._create_logger(logger_name, level, mode, is_console)
        self.loggers[logger_name] = logger
        return logger

    def _create_logger(
        self, logger_name: str, level: int, mode: str, is_console: bool
    ) -> logging.Logger:
        """实际创建 logger 的逻辑"""
        logger = logging.getLogger(logger_name)
        logger.setLevel(level)
        logger.handlers.clear()  # 清除原有 handlers

        # 控制台 handler
        if is_console:
            console_handler = self._create_console_handler(level)
            logger.addHandler(console_handler)

        # 文件 handler
        file_handler = self._create_file_handler(logger_name, level, mode)
        logger.addHandler(file_handler)

        return logger

    def _create_console_handler(self, level: int) -> logging.Handler:
        """创建控制台 handler"""
        console_formatter = colorlog.ColoredFormatter(
            "%(light_blue)s%(asctime)s%(reset)s - %(name)s - %(log_color)s%(levelname)s%(reset)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
            log_colors={
                "DEBUG": "cyan",
                "INFO": "green",
                "WARNING": "yellow",
                "ERROR": "red",
                "CRITICAL": "bold_red",
            },
        )
        console_handler = colorlog.StreamHandler()
        console_handler.setLevel(level)
        console_handler.setFormatter(console_formatter)
        return console_handler

    def _create_file_handler(
        self, logger_name: str, level: int, mode: str
    ) -> logging.Handler:
        """创建文件 handler"""
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        file_handler = logging.FileHandler(
            str(self.log_dir / f"{logger_name}.log"), mode=mode, encoding="utf-8"
        )
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)
        return file_handler

# 全局 LoggerManager 实例
logger_manager = LoggerManager()

def get_logger(
    logger_name: str,
    level=logging.INFO,
    mode="a",
    is_console=True,
) -> logging.Logger:
    """获取全局 LoggerManager 的 logger"""
    return logger_manager.get_logger(logger_name, level, mode, is_console)