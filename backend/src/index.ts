import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { aiRoutes } from './routes/ai';
import { animeRoutes } from './routes/anime';
import { watchlistRoutes } from './routes/watchlist';
import { authRoutes } from './routes/auth';
import { notificationRoutes } from './routes/notifications';
import { userRoutes } from './routes/user';
import { adminRoutes } from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/anime', animeRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(`🚀 AniVerse Backend running on http://localhost:${PORT}`);
});
