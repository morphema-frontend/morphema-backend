import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HorecaVenue } from './horeca-venue.entity';
import { CreateHorecaVenueDto } from './dto/create-horeca-venue.dto';
import { UpdateHorecaVenueDto } from './dto/update-horeca-venue.dto';

@Injectable()
export class HorecaVenuesService {
  constructor(
    @InjectRepository(HorecaVenue)
    private readonly repo: Repository<HorecaVenue>,
  ) {}

  private makePublicId(): string {
    // semplice, unico “abbastanza” per demo + vincolo UNIQUE su DB
    const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
    return `VENUE-${rand}`;
  }

  async create(dto: CreateHorecaVenueDto, ownerId: number): Promise<HorecaVenue> {
    const venue = this.repo.create({
      ...dto,
      ownerId,
      publicId: this.makePublicId(),
      // status lasciato al default DB, ma lo settiamo uguale per chiarezza
      status: 'active',
    });

    return this.repo.save(venue);
  }

  async findAll(): Promise<HorecaVenue[]> {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  async findByOwnerId(ownerId: number): Promise<HorecaVenue[]> {
    return this.repo.find({
      where: { ownerId },
      order: { id: 'DESC' },
    });
  }

  async findOneById(id: number): Promise<HorecaVenue | null> {
    return this.repo.findOne({ where: { id } });
  }

  async updateVenue(id: number, dto: UpdateHorecaVenueDto): Promise<HorecaVenue> {
    await this.repo.update({ id }, dto as any);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async deleteVenue(id: number): Promise<void> {
    await this.repo.delete({ id });
  }
}
