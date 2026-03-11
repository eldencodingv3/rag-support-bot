# RAG Support Bot

An end-to-end Retrieval-Augmented Generation (RAG) chatbot that answers customer support questions using a curated FAQ dataset. The bot retrieves relevant FAQ entries using vector similarity search and generates natural language answers with an LLM.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Express, TypeScript
- **RAG Pipeline:** LangChain.js, OpenAI Embeddings (`text-embedding-3-small`), GPT-4o-mini
- **Vector Store:** In-memory (LangChain MemoryVectorStore)
- **Deployment:** Railway

## Prerequisites

- Node.js 20+
- OpenAI API key

## Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/eldencodingv3/rag-support-bot.git
   cd rag-support-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   cd ..
   ```

3. Create a `.env` file in the `server/` directory:
   ```
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000`.

## Updating the FAQ Dataset

Edit `server/data/support-faq.json` to add, modify, or remove Q&A pairs. Each entry follows this format:

```json
{
  "question": "Your question here?",
  "answer": "The detailed answer.",
  "category": "account"
}
```

Categories: `account`, `billing`, `shipping`, `returns`, `orders`, `technical`, `subscription`, `general`

Restart the server after making changes so the vector store is rebuilt with the updated data.

## Environment Variables

| Variable        | Required | Description                  | Default |
| --------------- | -------- | ---------------------------- | ------- |
| `OPENAI_API_KEY` | Yes      | OpenAI API key for embeddings and chat | —       |
| `PORT`          | No       | Server port                  | `3000`  |
| `NODE_ENV`      | No       | Environment mode             | —       |

## Deployment (Railway)

1. Push your code to the GitHub repository.
2. Create a new project on [Railway](https://railway.app).
3. Connect the GitHub repository.
4. Set environment variables (`OPENAI_API_KEY`, `NODE_ENV=production`, `PORT=3000`).
5. Railway will automatically build and deploy using the root `package.json` scripts.
6. Generate a public domain in Railway settings to access your bot.

## Architecture

```
┌─────────────┐     POST /api/chat      ┌──────────────────┐
│   React UI  │ ──────────────────────►  │  Express Server  │
│  (Vite SPA) │ ◄──────────────────────  │                  │
└─────────────┘    { answer, sources }   └────────┬─────────┘
                                                  │
                                         ┌────────▼─────────┐
                                         │   RAG Pipeline    │
                                         │                   │
                                         │ 1. Embed question │
                                         │ 2. Vector search  │
                                         │ 3. Build prompt   │
                                         │ 4. LLM answer     │
                                         └────────┬─────────┘
                                                  │
                                    ┌─────────────┼─────────────┐
                                    │             │             │
                              ┌─────▼─────┐ ┌────▼────┐ ┌──────▼──────┐
                              │ Vector DB │ │ OpenAI  │ │ FAQ Dataset │
                              │ (Memory)  │ │ API     │ │ (JSON)      │
                              └───────────┘ └─────────┘ └─────────────┘
```

On startup, the server loads `support-faq.json`, creates embeddings for each FAQ entry, and stores them in an in-memory vector store. When a user asks a question, the pipeline finds the 3 most relevant FAQ entries, builds a prompt with that context, and calls GPT-4o-mini to generate a natural language answer.
