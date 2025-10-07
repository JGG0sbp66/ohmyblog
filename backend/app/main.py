from fastapi_offline import FastAPIOffline
from app.utils import lifespan
from app.core.middleware import setup_middleware

app = FastAPIOffline(lifespan=lifespan)

# 注册中间件
setup_middleware(app)


@app.get("/")
async def root():
    return {"message": "Hello World"}
