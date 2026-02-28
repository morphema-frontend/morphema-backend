import dataSource from '../data-source';

async function run() {
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    const pending = await dataSource.showMigrations();
    console.log(
      JSON.stringify(
        {
          connected: true,
          pendingMigrations: pending,
        },
        null,
        2,
      ),
    );
    await dataSource.destroy();
    process.exit(0);
  } catch (err: any) {
    console.error('DB status failed', err?.stack || err);
    process.exit(1);
  }
}

run();
