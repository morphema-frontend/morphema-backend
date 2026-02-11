import 'reflect-metadata';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'morphemapwd',
  database: 'morphema',

  // build output
  entities: ['dist/**/*.entity.js', 'dist/**/booking.entity.js'],
  migrations: ['dist/migrations/*.js'],

  synchronize: false,
});
