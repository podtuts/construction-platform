import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import teamRoutes from './routes/teamRoutes';
import documentRoutes from './routes/documentRoutes';
import drawingRoutes from './routes/drawingRoutes';
import contactRoutes from './routes/contactRoutes';
import contractorRoutes from './routes/contractorRoutes';
import settingsRoutes from './routes/settingsRoutes';
import todoRoutes from './routes/todoRoutes';
import scheduleRoutes from './routes/scheduleRoutes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Express JSON parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), service: 'ConstructPulse SaaS Web Service' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api', projectRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/team', teamRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/drawings', drawingRoutes);
  app.use('/api/contacts', contactRoutes);
  app.use('/api/contractors', contractorRoutes);
  app.use('/api/todos', todoRoutes);
  app.use('/api/schedules', scheduleRoutes);
  app.use('/api', settingsRoutes);

  // Serve static /public folder assets directly if accessed
  const publicPath = path.join(process.cwd(), 'public');
  app.use('/public', express.static(publicPath));

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ConstructPulse Web Service running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
