// backend/src/auth/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import type { CanonicalRole } from './role.utils';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: CanonicalRole[]) => SetMetadata(ROLES_KEY, roles);
