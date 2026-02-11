import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

type Actor = { sub: number; role: 'admin' | 'horeca' | 'worker' };

function extractActor(req: any): Actor {
  const u = req?.user ?? {};
  const rawSub = u.sub ?? u.id ?? u.userId;

  const sub = Number(rawSub);
  const role = u.role;

  if (!Number.isFinite(sub) || sub < 1) throw new UnauthorizedException('USER_SUB_MISSING');
  if (role !== 'admin' && role !== 'horeca' && role !== 'worker') {
    throw new UnauthorizedException('USER_ROLE_MISSING');
  }

  return { sub, role };
}

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // Worker applies to a gig -> creates a booking
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: any, @Body() body: CreateBookingDto) {
    const actor = extractActor(req);
    if (actor.role !== 'worker') {
      throw new ForbiddenException('Only workers can apply to gigs');
    }
    return this.bookingsService.applyToGig(body.gigId, actor, req);
  }

  // Horeca/admin accepts a booking
  @UseGuards(JwtAuthGuard)
  @Post(':id/accept')
  async accept(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const actor = extractActor(req);
    if (actor.role === 'worker') {
      throw new ForbiddenException('Workers cannot accept bookings');
    }
    return this.bookingsService.acceptBooking(id, actor, req);
  }

  // Worker confirms attendance (called from reminder flow)
  @UseGuards(JwtAuthGuard)
  @Post(':id/confirm-attendance')
  async confirmAttendance(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const actor = extractActor(req);
    if (actor.role !== 'worker') {
      throw new ForbiddenException('Only workers can confirm attendance');
    }
    return this.bookingsService.confirmAttendance(id, actor, req);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async list() {
    return this.bookingsService.findAll();
  }
}
