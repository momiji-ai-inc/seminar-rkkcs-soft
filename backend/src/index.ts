import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database';
import apiRouter from './routes/api';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

initializeDatabase();

app.use('/api/events', apiRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
