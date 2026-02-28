import dataSource from '../data-source';
import { validateRequiredEnv } from '../config/env';

async function run() {
  try {
    validateRequiredEnv();

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    await dataSource.runMigrations();
    await dataSource.destroy();
    console.log('migrate ok');
    process.exit(0);
  } catch (err: any) {
    console.error('migrate failed', err?.stack || err);
    process.exit(1);
  }
}

run();
