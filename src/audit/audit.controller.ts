import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditService } from './audit.service';

function toIntOrUndef(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.trunc(n);
}

@Controller('audit')
@UseGuards(AuthGuard('jwt'))
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  async list(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityIdRaw?: string,
    @Query('actorUserId') actorUserIdRaw?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const entityId = toIntOrUndef(entityIdRaw);
    const actorUserId = toIntOrUndef(actorUserIdRaw);
    const limit = toIntOrUndef(limitRaw);

    return this.audit.find({
      entityType: entityType || undefined,
      entityId,
      actorUserId,
      limit,
    });
  }
}
