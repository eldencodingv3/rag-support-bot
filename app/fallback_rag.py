import json
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class FallbackRAG:
    def __init__(self):
        self.faq_data = []
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.tfidf_matrix = None
        self.ready = False

    def ingest(self, data_path: str = "data/support_faq.json"):
        faq_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), data_path)
        with open(faq_path, 'r') as f:
            self.faq_data = json.load(f)
        docs = [f"{item['question']} {item['answer']}" for item in self.faq_data]
        self.tfidf_matrix = self.vectorizer.fit_transform(docs)
        self.ready = True

    def query(self, question: str, top_k: int = 3) -> dict:
        if not self.ready:
            return {"response": "RAG pipeline not initialized.", "sources": []}
        q_vec = self.vectorizer.transform([question])
        similarities = cosine_similarity(q_vec, self.tfidf_matrix).flatten()
        top_indices = similarities.argsort()[-top_k:][::-1]

        context_parts = []
        sources = []
        for idx in top_indices:
            if similarities[idx] > 0.05:
                item = self.faq_data[idx]
                context_parts.append(f"Q: {item['question']}\nA: {item['answer']}")
                sources.append({"question": item["question"], "category": item["category"]})

        if not context_parts:
            return {
                "response": "I don't have information about that topic. Please contact our support team for further assistance.",
                "sources": [],
            }

        best_answer = self.faq_data[top_indices[0]]["answer"]
        return {"response": best_answer, "sources": sources}
