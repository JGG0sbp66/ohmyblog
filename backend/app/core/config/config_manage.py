import os
from dynaconf import Dynaconf

# 获取配置文件的绝对路径
config_dir = os.path.dirname(os.path.abspath(__file__))
settings_path = os.path.join(config_dir, 'settings.toml')
env_path = os.path.join(config_dir, '.env')

# 读取项目配置, 优先读取.env，其次读取settings.toml
settings = Dynaconf(
    settings_files=[settings_path], # 配置文件路径
    dotenv_path=env_path,           # 敏感信息文件路径
    load_dotenv=True,               # 自动加载环境变量
)
