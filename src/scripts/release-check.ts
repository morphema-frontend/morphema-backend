import dataSource from '../data-source';
import { validateRequiredEnv } from '../config/env';

async function run() {
  try {
    validateRequiredEnv();

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    const pending = await dataSource.showMigrations();
    if (pending) {
      console.error('Pending migrations detected');
      await dataSource.destroy();
      process.exit(1);
    }

    await dataSource.destroy();
    console.log('release-check ok');
    process.exit(0);
  } catch (err: any) {
    console.error('release-check failed', err?.stack || err);
    process.exit(1);
  }
}

run();
