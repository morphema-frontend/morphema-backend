// src/gigs/gigs.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';

import { AuditService } from '../audit/audit.service';
import { InsuranceService } from '../insurance/insurance.service';
import { JobTypesService } from '../job-types/job-types.service';
import { ContractsService } from '../contracts/contracts.service';
import { buildGigPaymentSnapshot } from '../payments/payment-snapshot';

import { Gig } from './gig.entity';
import { CreateGigDto } from './dto/create-gig.dto';
import { normalizeRole, type CanonicalRole } from '../auth/role.utils';

export type Actor = { sub: number; role: CanonicalRole };

function getIp(req: any): string | null {
  return (req?.ip ?? req?.headers?.['x-forwarded-for'] ?? null) as string | null;
}
function getUa(req: any): string | null {
  return (req?.headers?.['user-agent'] ?? null) as string | null;
}

@Injectable()
export class GigsService {
  private readonly stripe: Stripe | null;

  constructor(
    @InjectRepository(Gig) private readonly gigRepo: Repository<Gig>,
    private readonly audit: AuditService,
    private readonly insurance: InsuranceService,
    private readonly jobTypes: JobTypesService,
    private readonly contracts: ContractsService,
  ) {
    const key = process.env.STRIPE_SECRET_KEY;
    // Demo-safe: if not configured, preauth is "skipped" rather than hard failing.
    this.stripe = key ? new Stripe(key, { apiVersion: '2024-06-20' as any }) : null;
  }

  getActor(req: any): Actor {
    const rawRole = req?.user?.role;
    const role = normalizeRole(rawRole);
    if (!role) throw new ForbiddenException('INVALID_ROLE');

    const sub = Number(req?.user?.sub);
    if (!sub) throw new ForbiddenException('INVALID_SUB');

    return { sub, role };
  }

  async findPublishedFeed(_actor: Actor) {
    return this.gigRepo.find({
      where: { publishStatus: 'published' as any },
      order: { publishedAt: 'DESC' as any, id: 'DESC' as any },
      take: 200,
    });
  }

  async findAllByVenue(venueId: number, actor: Actor) {
    if (actor.role === 'worker') throw new ForbiddenException('FORBIDDEN');
    return this.gigRepo.find({
      where: { venueId: venueId as any },
      order: { id: 'DESC' as any },
      take: 200,
    });
  }

  async findAll(actor: Actor, publishStatus?: string) {
    if (actor.role !== 'admin') return [];
    const where: any = {};
    if (publishStatus) where.publishStatus = publishStatus;
    return this.gigRepo.find({ where, order: { id: 'DESC' as any }, take: 200 });
  }

  async create(dto: CreateGigDto, actor: Actor, req: any) {
    if (actor.role !== 'venue') throw new ForbiddenException('FORBIDDEN');

    // DTO doesn't include publicId -> generate it internally.
    const publicId = `GIG-${Math.floor(100000 + Math.random() * 900000)}`;

    // payAmount in entity is typically decimal stored as string
    const payAmountStr =
      dto.payAmount === undefined || dto.payAmount === null ? null : String(dto.payAmount);

    const gig = this.gigRepo.create({
      publicId,
      title: dto.title,
      description: dto.description ?? null,
      venueId: dto.venueId as any,
      jobTypeId: dto.jobTypeId ?? null,
      status: 'open' as any,
      startTime: new Date(dto.startTime as any),
      endTime: new Date(dto.endTime as any),
      payAmount: payAmountStr,
      currency: dto.currency ?? 'EUR',
      publishStatus: 'draft' as any,
      publishedAt: null,

      // Snapshots are produced at preauthorize, not from CreateGigDto
      insuranceProductId: dto.insuranceProductId ?? null,
      insuranceSnapshot: null,
      contractTemplateId: dto.contractTemplateId ?? null,
      contractSnapshot: null,

      paymentSnapshot: null,
    } as any);

    // Avoid TypeORM save() overload inference returning Gig[]
    const insertRes = await this.gigRepo.insert(gig as any);
    const id =
      (insertRes.identifiers?.[0]?.id as number | undefined) ??
      (insertRes.generatedMaps?.[0]?.id as number | undefined);

    if (!id) {
      throw new BadRequestException('GIG_CREATE_FAILED');
    }

    const saved = await this.gigRepo.findOne({ where: { id: id as any } });
    if (!saved) throw new BadRequestException('GIG_CREATE_FAILED');

    await this.audit.log({
      actor,
      entityType: 'gig',
      entityId: (saved as any).id,
      action: 'JOB_CREATED',
      payload: {
        venueId: (saved as any).venueId,
        publishStatus: (saved as any).publishStatus,
      },
      ip: getIp(req),
      userAgent: getUa(req),
    });

    return saved;
  }

  private computeHours(start: Date, end: Date): number {
    const ms = end.getTime() - start.getTime();
    if (ms <= 0) return 0;
    return ms / (1000 * 60 * 60);
  }

  async preauthorizeGig(gigId: number, actor: Actor, req: any) {
    if (actor.role !== 'venue') throw new ForbiddenException('FORBIDDEN');

    const gig = await this.gigRepo.findOne({ where: { id: gigId as any } });
    if (!gig) throw new NotFoundException('GIG_NOT_FOUND');

    if ((gig as any).publishStatus !== ('draft' as any)) {
      throw new BadRequestException({ error: 'INVALID_STATE', message: 'Gig must be draft' });
    }

    if (!(gig as any).jobTypeId) {
      throw new BadRequestException({ error: 'JOB_TYPE_REQUIRED', message: 'jobTypeId required' });
    }

    // Your JobTypesService doesn't have findOneById -> use findOne(id)
    const jobType = await this.jobTypes.findOne(Number((gig as any).jobTypeId));

    const hours = this.computeHours(new Date((gig as any).startTime), new Date((gig as any).endTime));
    const minHourly = Number((jobType as any).minHourlyRate);
    const minTotal = Math.round(minHourly * hours * 100) / 100;

    const payTotal = Number((gig as any).payAmount ?? 0);
    if (!payTotal || payTotal < minTotal) {
      throw new BadRequestException({
        error: 'PAY_BELOW_MINIMUM',
        message: `payAmount must be >= ${minTotal.toFixed(2)}`,
      });
    }

    // Insurance default if missing
    let insuranceProductId = (gig as any).insuranceProductId;
    let insuranceSnapshot = (gig as any).insuranceSnapshot;

    if (!insuranceProductId) {
      const product = await this.insurance.pickDefaultProductForJobType(jobType as any);
      insuranceProductId = (product as any)?.id ?? null;
      insuranceSnapshot = product
        ? {
            id: (product as any).id,
            code: (product as any).code,
            name: (product as any).name,
            scope: (product as any).scope,
            currency: (product as any).currency,
            priceCents: (product as any).priceCents,
            providerId: (product as any).providerId,
            description: (product as any).description,
          }
        : null;
    }

    if (!insuranceProductId || !insuranceSnapshot) {
      throw new BadRequestException({ error: 'INSURANCE_REQUIRED', message: 'No insurance product' });
    }

    // Contract default if missing
    let contractTemplateId = (gig as any).contractTemplateId;
    let contractSnapshot = (gig as any).contractSnapshot;

    if (!contractTemplateId) {
      const tpl = await this.contracts.pickDefaultForJobType(jobType as any);
      contractTemplateId = (tpl as any)?.id ?? null;
      contractSnapshot = tpl
        ? {
            id: (tpl as any).id,
            code: (tpl as any).code,
            name: (tpl as any).name,
            version: (tpl as any).version,
            body: (tpl as any).body,
          }
        : null;
    }

    if (!contractTemplateId || !contractSnapshot) {
      throw new BadRequestException({ error: 'CONTRACT_REQUIRED', message: 'No contract template' });
    }

    const insurancePremium = Number((insuranceSnapshot as any).priceCents ?? 0) / 100;
    const platformFee = Number(process.env.PLATFORM_FEE ?? 5);

    const { snapshot: paymentSnapshot, totalCharge } = buildGigPaymentSnapshot({
      workerGross: payTotal,
      insurancePremium,
      platformFee,
      currency: (gig as any).currency ?? 'EUR',
      jobTypeCode: (jobType as any).code,
      hours,
      minHourlyRate: minHourly,
    });

    // Stripe preauth (manual capture) OR demo-safe skip
    if (this.stripe) {
      const pi = await this.stripe.paymentIntents.create({
        amount: Math.round(totalCharge * 100),
        currency: ((gig as any).currency ?? 'EUR').toLowerCase(),
        capture_method: 'manual',
        metadata: {
          morphema_gig_id: String((gig as any).id),
          morphema_public_id: String((gig as any).publicId),
        },
      });
      (paymentSnapshot as any).preauth.paymentIntentId = pi.id;
      (paymentSnapshot as any).preauth.status = pi.status;
      (paymentSnapshot as any).preauth.captureMethod = 'manual';
    } else {
      (paymentSnapshot as any).preauth.status = 'skipped';
      (paymentSnapshot as any).preauth.captureMethod = 'skipped';
    }

    (gig as any).insuranceProductId = insuranceProductId;
    (gig as any).insuranceSnapshot = insuranceSnapshot;
    (gig as any).contractTemplateId = contractTemplateId;
    (gig as any).contractSnapshot = contractSnapshot;
    (gig as any).paymentSnapshot = paymentSnapshot;
    (gig as any).publishStatus = 'preauthorized' as any;

    const saved = await this.gigRepo.save(gig as any);

    await this.audit.log({
      actor,
      entityType: 'gig',
      entityId: (saved as any).id,
      action: 'JOB_PREAUTHORIZED',
      payload: { paymentSnapshot },
      ip: getIp(req),
      userAgent: getUa(req),
    });

    return saved;
  }

  async publishGig(gigId: number, actor: Actor, req: any) {
    if (actor.role !== 'venue') throw new ForbiddenException('FORBIDDEN');

    const gig = await this.gigRepo.findOne({ where: { id: gigId as any } });
    if (!gig) throw new NotFoundException('GIG_NOT_FOUND');

    if ((gig as any).publishStatus !== ('preauthorized' as any)) {
      throw new BadRequestException({ error: 'GIG_NOT_PREAUTHORIZED', message: 'Preauth first' });
    }

    (gig as any).publishStatus = 'published' as any;
    (gig as any).publishedAt = new Date();

    const saved = await this.gigRepo.save(gig as any);

    await this.audit.log({
      actor,
      entityType: 'gig',
      entityId: (saved as any).id,
      action: 'JOB_PUBLISHED',
      payload: { publishedAt: (saved as any).publishedAt },
      ip: getIp(req),
      userAgent: getUa(req),
    });

    return saved;
  }
}
