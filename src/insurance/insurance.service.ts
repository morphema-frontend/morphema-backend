import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InsuranceProvider } from './entities/insurance-provider.entity';
import { InsuranceProduct } from './entities/insurance-product.entity';
import { InsurancePolicy } from './entities/insurance-policy.entity';
import { InsurancePolicyStatus } from './entities/insurance-policy.entity';

@Injectable()
export class InsuranceService {
  constructor(
    @InjectRepository(InsuranceProvider)
    private readonly providersRepo: Repository<InsuranceProvider>,
    @InjectRepository(InsuranceProduct)
    private readonly productsRepo: Repository<InsuranceProduct>,
    @InjectRepository(InsurancePolicy)
    private readonly policiesRepo: Repository<InsurancePolicy>,
  ) {}

  async seedDefaultCatalogIfEmpty(): Promise<{
    ok: true;
    insertedProviders: number;
    insertedProducts: number;
  }> {
    const providersCount = await this.providersRepo.count();
    if (providersCount > 0) {
      return { ok: true, insertedProviders: 0, insertedProducts: 0 };
    }

    const provider = this.providersRepo.create({
      name: 'DUMMY-INSURER',
      country: 'IT',
      isActive: true,
    });
    const savedProvider = await this.providersRepo.save(provider);

    const p1 = this.productsRepo.create({
      code: 'BASIC_JOB',
      name: 'Basic per Job',
      description: 'Copertura base per singolo job (dummy).',
      scope: 'job',
      priceCents: 199,
      currency: 'EUR',
      isActive: true,
      provider: savedProvider,
    });

    const p2 = this.productsRepo.create({
      code: 'VENUE_JOB',
      name: 'Venue per Job',
      description: 'Copertura venue per singolo job (dummy).',
      scope: 'job',
      priceCents: 299,
      currency: 'EUR',
      isActive: true,
      provider: savedProvider,
    });

    await this.productsRepo.save([p1, p2]);
    return { ok: true, insertedProviders: 1, insertedProducts: 2 };
  }

  /**
   * Gigs preauth/publish happy-path helper.
   * Uses jobType.defaultInsuranceTierCode if present, otherwise falls back to the cheapest active product.
   */
  async pickDefaultProductForJobType(jobType: { defaultInsuranceTierCode: string | null }) {
    await this.seedDefaultCatalogIfEmpty();

    const preferredCode = jobType.defaultInsuranceTierCode ?? null;
    if (preferredCode) {
      const preferred = await this.productsRepo.findOne({
        where: { code: preferredCode, isActive: true },
      });
      if (preferred) return preferred;
    }

    // fallback: cheapest active product
    return this.productsRepo
      .createQueryBuilder('p')
      .where('p.isActive = :isActive', { isActive: true })
      .orderBy('p.priceCents', 'ASC')
      .addOrderBy('p.id', 'ASC')
      .getOne();
  }

  async listProducts(scope?: string) {
    const qb = this.productsRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.provider', 'provider')
      .where('p.isActive = :isActive', { isActive: true });

    if (scope) qb.andWhere('p.scope = :scope', { scope });

    return qb.orderBy('p.id', 'ASC').getMany();
  }

  async quote(dto: { bookingId: number; insuredUserId: number; productCode: string }) {
    const product = await this.productsRepo.findOne({
      where: { code: dto.productCode, isActive: true },
      relations: ['provider'],
    });

    if (!product) {
      return { ok: false as const, error: 'PRODUCT_NOT_FOUND' as const };
    }

    return {
      ok: true as const,
      bookingId: dto.bookingId,
      insuredUserId: dto.insuredUserId,
      product: {
        code: product.code,
        name: product.name,
        provider: product.provider?.name ?? 'UNKNOWN',
        scope: product.scope,
      },
      premiumCents: product.priceCents,
      currency: product.currency,
      documentsPreview: {
        policyPdf: 'DUMMY_POLICY_PDF_URL',
        termsPdf: 'DUMMY_TERMS_PDF_URL',
      },
    };
  }

  async bind(dto: { bookingId: number; insuredUserId: number; productCode: string }) {
    const product = await this.productsRepo.findOne({
      where: { code: dto.productCode, isActive: true },
      relations: ['provider'],
    });

    if (!product) {
      return { ok: false as const, error: 'PRODUCT_NOT_FOUND' as const };
    }

    const existing = await this.policiesRepo.findOne({
      where: {
        holderType: 'user',
        holderId: dto.insuredUserId,
        bookingId: dto.bookingId,
      },
      relations: ['product'],
    });

    if (existing) {
      return {
        ok: true as const,
        policyId: existing.id,
        status: existing.status,
        premiumCents: existing.premiumCents,
        currency: existing.currency,
        documents: existing.documents,
      };
    }

    const policy = this.policiesRepo.create({
      holderType: 'user',
      holderId: dto.insuredUserId,
      bookingId: dto.bookingId,
      status: 'pending' as InsurancePolicyStatus,
      premiumCents: product.priceCents,
      currency: product.currency,
      product: product,
      documents: {
        issuedAt: new Date().toISOString(),
        provider: product.provider?.name ?? 'DUMMY-INSURER',
        policyPdf: 'DUMMY_POLICY_PDF_URL',
        receiptPdf: 'DUMMY_RECEIPT_PDF_URL',
        productCode: product.code,
      },
    });

    const saved = await this.policiesRepo.save(policy);

    return {
      ok: true as const,
      policyId: saved.id,
      status: saved.status,
      premiumCents: saved.premiumCents,
      currency: saved.currency,
      documents: saved.documents,
    };
  }

  async listPoliciesForUser(userId: number) {
    return this.policiesRepo.find({
      where: { holderType: 'user', holderId: userId },
      relations: ['product'],
      order: { id: 'DESC' },
    });
  }
}
