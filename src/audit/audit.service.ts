// src/audit/audit.service.ts
// IMPORTANT: Must match DDL table public.audit_events.
// No invented columns (e.g. payloadHash does NOT exist in DDL).

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditEvent } from './audit-event.entity';
import type { CanonicalRole } from '../auth/role.utils';

export type AuditActor = { sub: number; role: CanonicalRole };

export type AuditFindFilters = {
  entityType?: string;
  entityId?: number;
  actorUserId?: number;
  limit?: number;
};

// Legacy shape used by integrations/* and some services.
export type AuditRecordInput = {
  type: string; // action
  actorUserId?: number | null;
  actorRole?: string | null;
  bookingId?: number | null;
  gigId?: number | null;
  entityType?: string | null;
  entityId?: number | null;
  metadata?: unknown;
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditRepo: Repository<AuditEvent>,
  ) {}

  /**
   * Append-only audit log.
   * This is the ONLY write path that should touch the DB.
   */
  async log(evt: {
    actor?: AuditActor | null;
    entityType: string;
    entityId?: number | null;
    action: string;
    payload?: unknown;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<AuditEvent> {
    const actorUserId = evt.actor?.sub ?? null;
    const actorRole = evt.actor?.role ?? null;

    const event = this.auditRepo.create({
      actorUserId,
      actorRole,
      entityType: evt.entityType,
      entityId: evt.entityId ?? null,
      action: evt.action,
      payload: evt.payload ?? null,
      ip: evt.ip ?? null,
      userAgent: evt.userAgent ?? null,
    });

    return this.auditRepo.save(event);
  }

  /**
   * Controller contract: find({ entityType, entityId, actorUserId, limit }).
   */
  async find(filters: AuditFindFilters): Promise<AuditEvent[]> {
    const qb = this.auditRepo.createQueryBuilder('a');

    if (filters.entityType) {
      qb.andWhere('a.entityType = :entityType', { entityType: filters.entityType });
    }
    if (typeof filters.entityId === 'number') {
      qb.andWhere('a.entityId = :entityId', { entityId: filters.entityId });
    }
    if (typeof filters.actorUserId === 'number') {
      qb.andWhere('a.actorUserId = :actorUserId', { actorUserId: filters.actorUserId });
    }

    const takeRaw = typeof filters.limit === 'number' ? filters.limit : 200;
    const take = Math.max(1, Math.min(500, Math.trunc(takeRaw)));

    return qb.orderBy('a.id', 'DESC').take(take).getMany();
  }

  // Back-compat helper
  async findByEntity(entityType: string, entityId: number) {
    return this.find({ entityType, entityId, limit: 200 });
  }

  /**
   * Legacy API used by integrations/* and older services.
   * Maps to DDL fields without inventing schema.
   */
  async record(input: AuditRecordInput): Promise<AuditEvent> {
    const entityType =
      input.entityType ??
      (typeof input.bookingId === 'number'
        ? 'booking'
        : typeof input.gigId === 'number'
          ? 'gig'
          : 'system');

    const entityId =
      input.entityId ??
      (typeof input.bookingId === 'number'
        ? input.bookingId
        : typeof input.gigId === 'number'
          ? input.gigId
          : null);

    const event = this.auditRepo.create({
      actorUserId: input.actorUserId ?? null,
      actorRole: input.actorRole ?? null,
      entityType,
      entityId: entityId ?? null,
      action: input.type,
      payload: input.metadata ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    });

    return this.auditRepo.save(event);
  }

  /**
   * Dummy instant document builder for demo (contract/insurance docs).
   * Returns a JSON structure (later can become a PDF).
   */
  buildInstantDocument(input: {
    bookingId?: number;
    title: string;
    parties: Record<string, unknown>;
    payload: Record<string, unknown>;
  }) {
    return {
      kind: 'INSTANT_DOCUMENT',
      title: input.title,
      bookingId: input.bookingId ?? null,
      parties: input.parties,
      payload: input.payload,
      createdAt: new Date().toISOString(),
    };
  }
}
