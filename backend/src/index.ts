import express from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase } from './database';
import apiRouter from './routes/api';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

initializeDatabase();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/events', apiRouter);

// Production: serve frontend static files
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
