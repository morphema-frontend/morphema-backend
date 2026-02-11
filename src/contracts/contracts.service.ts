import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractTemplate } from './entities/contract-template.entity';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(ContractTemplate)
    private readonly templatesRepo: Repository<ContractTemplate>,
  ) {}

  async list(): Promise<ContractTemplate[]> {
    return this.templatesRepo.find({ order: { id: 'DESC' } });
  }

  private buildCodeForJobType(jobTypeCode: string): string {
    // Matches your existing convention:
    // jobType: HORECA_WAITER_BASIC -> contract: HORECA_HORECA_WAITER_BASIC_V1
    return `HORECA_${jobTypeCode}_V1`;
  }

  async getActiveTemplateForJobType(jobTypeCode: string): Promise<ContractTemplate | null> {
    const code = this.buildCodeForJobType(jobTypeCode);

    return this.templatesRepo.findOne({
      where: { code, active: true as any },
      order: { id: 'DESC' },
    });
  }

  /**
   * Gigs preauth/publish happy-path helper.
   * Must be deterministic and DDL-safe.
   */
  async pickDefaultForJobType(jobType: { code: string }): Promise<ContractTemplate | null> {
    // Ensure seed exists for demo if DB is empty.
    await this.seed();
    return this.getActiveTemplateForJobType(jobType.code);
  }

  async seed(): Promise<{ ok: true; inserted: number }> {
    // Minimal seed for demo: just ensure at least one template exists.
    const existing = await this.templatesRepo.count();
    if (existing > 0) return { ok: true, inserted: 0 };

    const t = this.templatesRepo.create({
      code: 'HORECA_HORECA_WAITER_BASIC_V1',
      name: 'Contratto Cameriere (base)',
      version: 'v1',
      body: 'CONTRATTO TEMPLATE (v1)\n\nJobType: Cameriere (base) (HORECA_WAITER_BASIC)\n\n[INSERIRE TESTO LEGALE COMPLETO QUI]',
      active: true,
    });

    await this.templatesRepo.save(t);
    return { ok: true, inserted: 1 };
  }
}
