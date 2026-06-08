import { startLocalServer } from './bootstrap';

startLocalServer().catch((error: unknown) => {
  console.error('Failed to start application', error);
  process.exit(1);
});
