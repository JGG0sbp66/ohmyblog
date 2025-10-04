from fastapi_offline import FastAPIOffline
from app.utils import lifespan

app = FastAPIOffline(lifespan=lifespan)


@app.get("/")
async def root():
    return {"message": "Hello World"}