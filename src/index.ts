import express from 'express';
import dotenv from 'dotenv';
import { authenticate } from './middleware/auth';
import authRouter from './routes/auth';
import bookmarksRouter from './routes/bookmarks';

dotenv.config();

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use('/bookmarks', authenticate, bookmarksRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;