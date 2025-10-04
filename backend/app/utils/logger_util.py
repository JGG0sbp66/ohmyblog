import logging
from pathlib import Path
import colorlog

def init_logger(logger_name: str, log_file: str, level=logging.INFO, mode='a', is_console=False):
    """
    初始化一个logger

    Args:
        logger_name (str): logger的名称
        log_file (str, optional): 日志文件路径。如果为None，则只输出到控制台
        level (int, optional): 日志级别，默认为INFO
        mode (str, optional): 文件模式，'a'为追加，'w'为覆盖，默认为'a'

    Returns:
        logging.Logger: 配置好的logger实例
    """
    # 创建logger, 并设置日志级别
    logger = logging.getLogger(logger_name)
    logger.setLevel(level)

    # 清除原有的handler
    logger.handlers.clear()

    # 创建格式化器
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'
                                  , datefmt='%Y-%m-%d %H:%M:%S')
    
    # 如果开启控制台模式， 就输出到控制台
    if is_console:
        console_formatter = colorlog.ColoredFormatter(
            "%(light_blue)s%(asctime)s%(reset)s - %(name)s - %(log_color)s%(levelname)s%(reset)s - %(message)s",
            datefmt='%Y-%m-%d %H:%M:%S',
            log_colors={
                'DEBUG': 'cyan',
                'INFO': 'green',
                'WARNING': 'yellow',
                'ERROR': 'red',
                'CRITICAL': 'bold_red',
            }
        )
        console_handler = colorlog.StreamHandler()
        console_handler.setLevel(level)
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)
    
    # 输出到指定文件
    current_path = Path(__file__).resolve().parent
    file_handler = logging.FileHandler(str(current_path / 'logs' / log_file), mode=mode, encoding='utf-8')
    file_handler.setLevel(level)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger
