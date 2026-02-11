import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HorecaVenuesService } from './horeca-venues.service';
import { CreateHorecaVenueDto } from './dto/create-horeca-venue.dto';
import { UpdateHorecaVenueDto } from './dto/update-horeca-venue.dto';

type AuthedRequest = Request & {
  user?: {
    sub: number;
    role?: string;
    email?: string;
  };
};

function requireAuth(req: AuthedRequest): { userId: number; role: string } {
  const userId = req.user?.sub;
  const role = req.user?.role ?? '';
  if (!userId) throw new ForbiddenException('Missing authenticated user id');
  return { userId, role };
}

@Controller('horeca-venues')
@UseGuards(JwtAuthGuard)
export class HorecaVenuesController {
  constructor(private readonly venuesService: HorecaVenuesService) {}

  @Post()
  async create(@Req() req: AuthedRequest, @Body() dto: CreateHorecaVenueDto) {
    const { userId, role } = requireAuth(req);
    if (role !== 'admin' && role !== 'horeca' && role !== 'venue') {
      throw new ForbiddenException('Insufficient role');
    }
    return this.venuesService.create(dto, userId);
  }

  // admin-only: lista globale
  @Get()
  async findAll(@Req() req: AuthedRequest) {
    const { role } = requireAuth(req);
    if (role !== 'admin') throw new ForbiddenException('Admin only');
    return this.venuesService.findAll();
  }

  // mie venue
  @Get('me')
  async findMine(@Req() req: AuthedRequest) {
    const { userId, role } = requireAuth(req);
    if (role !== 'admin' && role !== 'horeca' && role !== 'venue') {
      throw new ForbiddenException('Insufficient role');
    }
    return this.venuesService.findByOwnerId(userId);
  }

  @Get(':id')
  async findOne(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    const { userId, role } = requireAuth(req);
    const venue = await this.venuesService.findOneById(id);
    if (!venue) throw new NotFoundException('Venue not found');

    if (role !== 'admin' && venue.ownerId !== userId) {
      throw new ForbiddenException('Not your venue');
    }
    return venue;
  }

  @Patch(':id')
  async update(
    @Req() req: AuthedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHorecaVenueDto,
  ) {
    const { userId, role } = requireAuth(req);
    const venue = await this.venuesService.findOneById(id);
    if (!venue) throw new NotFoundException('Venue not found');

    if (role !== 'admin' && venue.ownerId !== userId) {
      throw new ForbiddenException('Not your venue');
    }
    return this.venuesService.updateVenue(id, dto);
  }

  @Delete(':id')
  async remove(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    const { userId, role } = requireAuth(req);
    const venue = await this.venuesService.findOneById(id);
    if (!venue) throw new NotFoundException('Venue not found');

    if (role !== 'admin' && venue.ownerId !== userId) {
      throw new ForbiddenException('Not your venue');
    }

    await this.venuesService.deleteVenue(id);
    return { deleted: true };
  }
}
