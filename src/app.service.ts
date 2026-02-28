import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import path from 'path';

@Injectable()
export class AppService {
  health() {
    let version = process.env.APP_VERSION || '';
    if (!version) {
      try {
        const pkgPath = path.join(process.cwd(), 'package.json');
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        version = pkg?.version || '';
      } catch {
        version = '';
      }
    }

    return {
      status: 'ok',
      service: 'backend',
      version,
      commitSha:
        process.env.RAILWAY_GIT_COMMIT_SHA ||
        process.env.GIT_COMMIT_SHA ||
        process.env.VERCEL_GIT_COMMIT_SHA ||
        '',
      buildTime: process.env.BUILD_TIME || '',
    };
  }
}
