// backend/src/auth/roles.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import type { CanonicalRole } from './role.utils';
import { isRoleAllowed } from './role.utils';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<CanonicalRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    // se non ci sono ruoli richiesti, lasciamo passare (solo RBAC, non Auth)
    if (requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!isRoleAllowed(user.role, requiredRoles)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
