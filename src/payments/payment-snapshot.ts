// src/payments/payment-snapshot.ts
// DDL: gigs."paymentSnapshot" is jsonb. We store a deterministic breakdown.

import { randomUUID } from 'crypto';

export type PaymentSnapshotBreakdown = {
  workerGross: number;
  insurancePremium: number;
  platformFee: number;
  stripeFeeEstimated: number;
  total: number;
  currency: string;
  computedAt: string;
  inputs: Record<string, unknown>;
  pricingVersion: string;
};

export type PaymentSnapshot = {
  id: string;
  provider: 'stripe';
  preauth: {
    paymentIntentId: string | null;
    amountCents: number;
    currency: string;
    status: string;
    captureMethod: 'manual' | 'skipped';
  };
  breakdown: PaymentSnapshotBreakdown;
};

function n(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const num = Number(v);
  return Number.isFinite(num) ? num : null;
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

export function estimateStripeFee(amount: number): {
  percent: number;
  fixed: number;
  fee: number;
} {
  // Safe defaults: 2.9% + 0.30
  const percent = n(process.env.STRIPE_FEE_PERCENT) ?? 2.9;
  const fixed = n(process.env.STRIPE_FEE_FIXED) ?? 0.3;
  const fee = round2((amount * percent) / 100 + fixed);
  return { percent, fixed, fee };
}

export function buildGigPaymentSnapshot(input: {
  workerGross: number;
  insurancePremium: number;
  platformFee: number;
  currency: string;
  jobTypeCode: string;
  hours: number;
  minHourlyRate: number;
}): { snapshot: PaymentSnapshot; totalCharge: number } {
  const pricingVersion = 'v1';

  const base = input.workerGross + input.insurancePremium + input.platformFee;
  const { percent, fixed, fee } = estimateStripeFee(base);
  const total = round2(base + fee);

  const snapshot: PaymentSnapshot = {
    id: randomUUID(),
    provider: 'stripe',
    preauth: {
      paymentIntentId: null,
      amountCents: Math.round(total * 100),
      currency: input.currency,
      status: 'requires_payment_method',
      captureMethod: 'manual',
    },
    breakdown: {
      workerGross: round2(input.workerGross),
      insurancePremium: round2(input.insurancePremium),
      platformFee: round2(input.platformFee),
      stripeFeeEstimated: round2(fee),
      total: round2(total),
      currency: input.currency,
      computedAt: new Date().toISOString(),
      inputs: {
        jobTypeCode: input.jobTypeCode,
        hours: round2(input.hours),
        minHourlyRate: round2(input.minHourlyRate),
        stripeFeePercent: percent,
        stripeFeeFixed: fixed,
      },
      pricingVersion,
    },
  };

  return { snapshot, totalCharge: total };
}
