import 'reflect-metadata';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  ...(process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DATABASE_HOST ?? process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DATABASE_PORT ?? process.env.DB_PORT ?? 5432),
        username: process.env.DATABASE_USER ?? process.env.DB_USER ?? 'postgres',
        password: process.env.DATABASE_PASSWORD ?? process.env.DB_PASSWORD ?? 'morphemapwd',
        database: process.env.DATABASE_NAME ?? process.env.DB_NAME ?? 'morphema',
      }),

  // build output
  entities: ['dist/**/*.entity.js', 'dist/**/booking.entity.js'],
  migrations: ['dist/migrations/*.js'],

  synchronize: false,
});
