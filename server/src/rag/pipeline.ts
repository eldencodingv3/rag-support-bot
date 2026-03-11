import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { Document } from '@langchain/core/documents';
import { loadFAQDocuments } from './dataset.js';

let vectorStore: MemoryVectorStore;

const SYSTEM_PROMPT = `You are a helpful customer support assistant. Answer the user's question based ONLY on the following FAQ context. If the context does not contain information relevant to the question, say "I don't have information about that. Please contact our support team for further assistance."

Be concise, friendly, and accurate. Do not make up information that is not in the context.

Context:
{context}`;

export async function initializeRAG(): Promise<void> {
  const docs = loadFAQDocuments();

  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
  });

  vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

  console.log(`RAG pipeline initialized with ${docs.length} FAQ documents`);
}

export interface RAGResult {
  answer: string;
  sources: { question: string; category: string }[];
}

export async function queryRAG(question: string): Promise<RAGResult> {
  const relevantDocs: Document[] = await vectorStore.similaritySearch(
    question,
    3
  );

  const context = relevantDocs
    .map((doc) => doc.pageContent)
    .join('\n\n---\n\n');

  const sources = relevantDocs.map((doc) => ({
    question: doc.metadata.question as string,
    category: doc.metadata.category as string,
  }));

  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0.3,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', SYSTEM_PROMPT],
    ['human', '{question}'],
  ]);

  const chain = prompt.pipe(llm).pipe(new StringOutputParser());

  const answer = await chain.invoke({ context, question });

  return { answer, sources };
}
