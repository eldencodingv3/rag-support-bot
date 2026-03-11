from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os

from app.ingest import ingest_faq
from app.rag import query_rag


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ingest FAQ data into ChromaDB
    try:
        ingest_faq()
        print("FAQ data ingested successfully")
    except Exception as e:
        print(f"Warning: Failed to ingest FAQ data: {e}")
    yield


app = FastAPI(title="RAG Support Bot", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    try:
        result = query_rag(request.message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Mount static files LAST so API routes take priority
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
