import { BadRequestException, Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HorecaVenuesService } from '../horeca-venues/horeca-venues.service';
import type { CreateHorecaVenueDto } from '../horeca-venues/dto/create-horeca-venue.dto';

type VenueOnboardingPayload = {
  legalName: string;
  vatNumber: string;
  taxCode?: string;
  ateco?: string;
  legalAddress: {
    line: string;
    city: string;
    province: string;
    zipCode: string;
    country: string;
  };
  legalRepresentative?: {
    firstName?: string;
    lastName?: string;
    taxCode?: string;
    birthDate?: string;
    email?: string;
    phone?: string;
  };
  consents?: Record<string, unknown>;
};

type WorkerOnboardingPayload = {
  cf: string;
  residence: {
    line?: string;
    city?: string;
    province?: string;
    zipCode?: string;
    country?: string;
  };
  fileIds?: {
    front?: string;
    back?: string;
    photo?: string;
  };
  consents?: Record<string, unknown>;
};

@Controller()
export class OnboardingController {
  constructor(private readonly venuesService: HorecaVenuesService) {}

  @UseGuards(JwtAuthGuard)
  @Post('venue/onboarding/submit')
  async submitVenue(@Req() req: any, @Body() payload: VenueOnboardingPayload) {
    const role = req?.user?.role;
    if (role !== 'horeca' && role !== 'venue' && role !== 'admin') {
      throw new BadRequestException('Invalid role');
    }

    const legalName = payload?.legalName?.trim();
    const vatNumber = payload?.vatNumber?.trim();
    const address = payload?.legalAddress?.line?.trim();
    const city = payload?.legalAddress?.city?.trim();
    const province = payload?.legalAddress?.province?.trim();
    const zipCode = payload?.legalAddress?.zipCode?.trim();
    const country = payload?.legalAddress?.country?.trim();

    if (!legalName || !vatNumber || !address || !city || !province || !zipCode || !country) {
      throw new BadRequestException('Missing venue fields');
    }

    const dto: CreateHorecaVenueDto = {
      name: legalName,
      address,
      city,
      province,
      zipCode,
      country,
      legalName,
      vatNumber,
    };

    const venue = await this.venuesService.create(dto, Number(req.user.id));
    return { ok: true, venueId: venue.id };
  }

  @UseGuards(JwtAuthGuard)
  @Post('worker/onboarding/submit')
  async submitWorker(@Req() req: any, @Body() payload: WorkerOnboardingPayload) {
    const role = req?.user?.role;
    if (role !== 'worker' && role !== 'admin') {
      throw new BadRequestException('Invalid role');
    }

    const cf = payload?.cf?.trim();
    if (!cf) {
      throw new BadRequestException('Missing worker fields');
    }

    return { ok: true };
  }
}
