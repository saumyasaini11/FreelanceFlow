import app from './app';
import { connectDB } from './config/db';
import { logger } from './utils/logger';
import { startCronJobs } from './services/cronService';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  startCronJobs();

  const server = app.listen(PORT, () => {
    logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Handle unhandled rejections
  process.on('unhandledRejection', (err: Error) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
