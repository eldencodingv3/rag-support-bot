from openai import OpenAI
from app.config import (
    OPENAI_API_KEY,
    OPENAI_EMBEDDING_MODEL,
    OPENAI_CHAT_MODEL,
    TOP_K_RESULTS,
)
from app.ingest import get_chroma_client


SYSTEM_PROMPT = (
    "You are a helpful customer support assistant. Answer the user's question "
    "based ONLY on the provided context. If the context doesn't contain relevant "
    "information, say you don't have information about that topic. Be concise and helpful."
)


def query_rag(user_question: str) -> dict:
    """
    RAG pipeline: embed query, search ChromaDB, generate answer with GPT.
    """
    client = OpenAI(api_key=OPENAI_API_KEY)

    # 1. Embed the user question
    embed_response = client.embeddings.create(
        model=OPENAI_EMBEDDING_MODEL,
        input=user_question,
    )
    query_embedding = embed_response.data[0].embedding

    # 2. Query ChromaDB for top K similar documents
    chroma_client = get_chroma_client()
    collection = chroma_client.get_collection("support_docs")

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=TOP_K_RESULTS,
    )

    # 3. Construct context from retrieved documents
    context_parts = []
    sources = []
    if results["documents"] and results["documents"][0]:
        for i, doc in enumerate(results["documents"][0]):
            context_parts.append(doc)
            if results["metadatas"] and results["metadatas"][0]:
                meta = results["metadatas"][0][i]
                sources.append({
                    "question": meta.get("question", ""),
                    "category": meta.get("category", ""),
                })

    context = "\n\n---\n\n".join(context_parts)

    # 4. Call OpenAI chat completion
    chat_response = client.chat.completions.create(
        model=OPENAI_CHAT_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nUser question: {user_question}",
            },
        ],
        temperature=0.3,
        max_tokens=500,
    )

    answer = chat_response.choices[0].message.content

    # 5. Return response with sources
    return {
        "response": answer,
        "sources": sources,
    }
