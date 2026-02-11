import { Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/audit.service';

export type InsuranceTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

export interface InsuranceQuoteRequest {
  bookingId: number;
  jobTypeId?: number;
  startAt: string;
  endAt: string;
  workerUserId: number;
  clientUserId: number;
  venueId?: number;
  tier: InsuranceTier;
}

export interface InsuranceQuoteResponse {
  provider: string;
  productCode: string;
  tier: InsuranceTier;
  currency: 'EUR';
  premiumCents: number; // costo polizza (dummy)
  coverage: {
    rctCents: number; // responsabilità civile verso terzi
    infortuniCents: number;
  };
  termsUrl: string;
}

export interface InsurancePolicyIssueResponse {
  policyId: string;
  provider: string;
  productCode: string;
  premiumCents: number;
  issuedAt: string;
  document: any; // per ora JSON, poi PDF
}

@Injectable()
export class InsuranceIntegration {
  constructor(private readonly audit: AuditService) {}

  quote(req: InsuranceQuoteRequest): InsuranceQuoteResponse {
    // dummy market-based: €1–€6 a job (dipende tier e durata)
    const minutes = Math.max(
      1,
      Math.floor(
        (new Date(req.endAt).getTime() - new Date(req.startAt).getTime()) / 60000,
      ),
    );

    const base = req.tier === 'BASIC' ? 150 : req.tier === 'STANDARD' ? 300 : 550; // cents
    const perHour = req.tier === 'BASIC' ? 50 : req.tier === 'STANDARD' ? 90 : 140; // cents
    const hours = Math.ceil(minutes / 60);

    const premiumCents = base + perHour * hours;

    const res: InsuranceQuoteResponse = {
      provider: 'DUMMY_INSURER',
      productCode: `MORPHEMA_${req.tier}_PER_JOB`,
      tier: req.tier,
      currency: 'EUR',
      premiumCents,
      coverage: {
        rctCents: req.tier === 'PREMIUM' ? 200000000 : req.tier === 'STANDARD' ? 100000000 : 50000000,
        infortuniCents: req.tier === 'PREMIUM' ? 50000000 : req.tier === 'STANDARD' ? 25000000 : 10000000,
      },
      termsUrl: 'https://example.com/dummy-terms',
    };

    this.audit.record({
      type: 'INSURANCE_QUOTED',
      actorUserId: req.workerUserId,
      bookingId: req.bookingId,
      metadata: res,
    });

    return res;
  }

  issuePolicy(req: InsuranceQuoteRequest, quote: InsuranceQuoteResponse): InsurancePolicyIssueResponse {
    const issuedAt = new Date().toISOString();
    const policyId = `POL-${req.bookingId}-${Date.now()}`;

    const doc = this.audit.buildInstantDocument({
      bookingId: req.bookingId,
      title: 'Insurance Policy (Dummy)',
      parties: { workerUserId: req.workerUserId, clientUserId: req.clientUserId },
      payload: {
        provider: quote.provider,
        productCode: quote.productCode,
        tier: quote.tier,
        premiumCents: quote.premiumCents,
        coverage: quote.coverage,
        startAt: req.startAt,
        endAt: req.endAt,
      },
    });

    this.audit.record({
      type: 'INSURANCE_POLICY_ISSUED',
      actorUserId: req.workerUserId,
      bookingId: req.bookingId,
      metadata: { policyId, provider: quote.provider, productCode: quote.productCode },
    });

    return {
      policyId,
      provider: quote.provider,
      productCode: quote.productCode,
      premiumCents: quote.premiumCents,
      issuedAt,
      document: doc,
    };
  }
}
