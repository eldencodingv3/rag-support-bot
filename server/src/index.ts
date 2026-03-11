import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chatRouter } from './routes/chat.js';
import { initializeRAG } from './rag/pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});
app.use('/api', chatRouter);

// Serve static frontend in production
const clientPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

async function start() {
  await initializeRAG();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch(console.error);
