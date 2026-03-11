import { Router } from 'express';
import { queryRAG, ragReady } from '../rag/pipeline.js';

export const chatRouter = Router();

chatRouter.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'A "message" string is required' });
      return;
    }

    if (!ragReady) {
      res.json({
        response: 'RAG pipeline not initialized. Please check the OPENAI_API_KEY configuration.',
        sources: [],
      });
      return;
    }

    const result = await queryRAG(message.trim());
    res.json({ response: result.answer, sources: result.sources });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'An error occurred processing your message' });
  }
});
