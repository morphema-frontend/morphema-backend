import { Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/audit.service';

export interface PaymentIntentCreateRequest {
  bookingId: number;
  amountCents: number;
  currency: 'EUR';
  payerUserId: number; // client
  payeeUserId: number; // worker (payout in futuro)
  metadata?: Record<string, any>;
}

export interface PaymentIntentCreateResponse {
  provider: 'DUMMY_STRIPE';
  paymentIntentId: string;
  clientSecret: string;
  amountCents: number;
  currency: 'EUR';
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded';
}

@Injectable()
export class PaymentsIntegration {
  constructor(private readonly audit: AuditService) {}

  createPaymentIntent(req: PaymentIntentCreateRequest): PaymentIntentCreateResponse {
    const paymentIntentId = `pi_${req.bookingId}_${Date.now()}`;
    const res: PaymentIntentCreateResponse = {
      provider: 'DUMMY_STRIPE',
      paymentIntentId,
      clientSecret: `dummy_secret_${paymentIntentId}`,
      amountCents: req.amountCents,
      currency: req.currency,
      status: 'requires_confirmation',
    };

    this.audit.record({
      type: 'PAYMENT_INTENT_CREATED',
      actorUserId: req.payerUserId,
      bookingId: req.bookingId,
      metadata: res,
    });

    return res;
  }

  // dummy: cattura immediata
  capture(paymentIntentId: string, actorUserId?: number) {
    this.audit.record({
      type: 'PAYMENT_CAPTURED',
      actorUserId,
      metadata: { paymentIntentId },
    });
    return { paymentIntentId, status: 'succeeded' as const };
  }
}
