import { Router } from 'express';
import { queryRAG } from '../rag/pipeline.js';

export const chatRouter = Router();

chatRouter.post('/chat', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'A "question" string is required' });
      return;
    }

    const result = await queryRAG(question.trim());
    res.json(result);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'An error occurred processing your question' });
  }
});
