from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os

from app.fallback_rag import FallbackRAG

rag_initialized = False
openai_rag_available = False
fallback_rag = FallbackRAG()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag_initialized, openai_rag_available
    # Startup: try OpenAI+ChromaDB first, fall back to TF-IDF
    try:
        from app.ingest import ingest_faq
        ingest_faq()
        openai_rag_available = True
        rag_initialized = True
        print("FAQ data ingested successfully with OpenAI + ChromaDB")
    except Exception as e:
        print(f"Warning: OpenAI/ChromaDB RAG failed: {e}")
        print("Falling back to TF-IDF RAG...")
        try:
            fallback_rag.ingest()
            rag_initialized = True
            print("TF-IDF fallback RAG initialized successfully")
        except Exception as e2:
            print(f"Error: TF-IDF fallback also failed: {e2}")
            print("Server will start without RAG capabilities")
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
    if not rag_initialized:
        return {
            "response": "RAG pipeline not initialized. Please configure a valid OPENAI_API_KEY or check server logs.",
            "sources": [],
        }
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    try:
        if openai_rag_available:
            from app.rag import query_rag
            result = query_rag(request.message)
        else:
            result = fallback_rag.query(request.message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Mount static files LAST so API routes take priority
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
