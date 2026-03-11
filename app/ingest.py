import json
import os
import chromadb
from openai import OpenAI
from app.config import OPENAI_API_KEY, CHROMA_PERSIST_DIR, OPENAI_EMBEDDING_MODEL


def load_faq_data() -> list[dict]:
    faq_path = os.path.join(os.path.dirname(__file__), "..", "data", "support_faq.json")
    with open(faq_path, "r") as f:
        return json.load(f)


def get_chroma_client():
    return chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)


def create_embeddings(texts: list[str]) -> list[list[float]]:
    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.embeddings.create(
        model=OPENAI_EMBEDDING_MODEL,
        input=texts,
    )
    return [item.embedding for item in response.data]


def ingest_faq():
    """Load FAQ data, create embeddings, and store in ChromaDB."""
    faqs = load_faq_data()
    chroma_client = get_chroma_client()

    # Delete existing collection if it exists, then create fresh
    try:
        chroma_client.delete_collection("support_docs")
    except Exception:
        pass
    collection = chroma_client.create_collection(name="support_docs")

    documents = []
    metadatas = []
    ids = []

    for i, faq in enumerate(faqs):
        doc_text = f"Question: {faq['question']}\nAnswer: {faq['answer']}"
        documents.append(doc_text)
        metadatas.append({
            "category": faq["category"],
            "question": faq["question"],
        })
        ids.append(f"faq_{i}")

    # Create embeddings in batches
    embeddings = create_embeddings(documents)

    collection.add(
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids,
    )

    print(f"Ingested {len(faqs)} FAQ entries into ChromaDB")
    return len(faqs)
