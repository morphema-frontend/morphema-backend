import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Booking, BookingStatus } from './booking.entity';
import { Gig } from '../gigs/gig.entity';
import { HorecaVenue } from '../horeca-venues/horeca-venue.entity';
import { AuditService } from '../audit/audit.service';

type Actor = { sub: number; role: 'admin' | 'horeca' | 'worker' };

@Injectable()
export class BookingsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,

    @InjectRepository(Gig)
    private readonly gigsRepository: Repository<Gig>,

    @InjectRepository(HorecaVenue)
    private readonly venuesRepository: Repository<HorecaVenue>,

    private readonly audit: AuditService,
  ) {}

  private reqMeta(req?: any): { ip?: string | null; userAgent?: string | null } {
    const ip = (req?.ip ?? req?.headers?.['x-forwarded-for'] ?? null) as string | null;
    const userAgent = (req?.headers?.['user-agent'] ?? null) as string | null;
    return { ip, userAgent };
  }

  private async assertVenueOwnership(venueId: number, actor: Actor): Promise<void> {
    if (actor.role === 'admin') return;

    const venue = await this.venuesRepository.findOne({ where: { id: venueId } });
    if (!venue) throw new NotFoundException('VENUE_NOT_FOUND');

    if (venue.ownerId !== actor.sub) {
      throw new ForbiddenException('NOT_VENUE_OWNER');
    }
  }

  /**
   * Worker applies to a gig.
   * Creates a booking row compatible with DB schema and snapshots immutable data.
   */
  async applyToGig(gigId: number, actor: Actor, req?: any): Promise<Booking> {
    if (actor.role !== 'worker') throw new ForbiddenException('ONLY_WORKER_CAN_APPLY');

    return this.dataSource.transaction(async (manager) => {
      const gigRepo = manager.getRepository(Gig);
      const bookingRepo = manager.getRepository(Booking);

      const gig = await gigRepo.findOne({ where: { id: gigId } });
      if (!gig) throw new NotFoundException('GIG_NOT_FOUND');

      if (gig.publishStatus !== 'published') {
        throw new UnprocessableEntityException({
          error: 'GIG_NOT_PUBLISHED',
          message: 'You can only apply to published gigs',
        });
      }

      const booking = bookingRepo.create({
        gigId: gig.id,
        venueId: gig.venueId,
        createdByUserId: actor.sub,
        jobTypeId: gig.jobTypeId ?? null,
        workerUserId: actor.sub,
        status: BookingStatus.PENDING,
        startsAt: gig.startTime,
        endsAt: gig.endTime,

        // Snapshot immutable fields at time of application (frozen requirement).
        insuranceSnapshot: gig.insuranceSnapshot ?? null,

        // Payment snapshot for booking can be filled later at settlement; keep null for demo.
        paymentSnapshot: null,
      });

      const saved = await bookingRepo.save(booking);

      const meta = this.reqMeta(req);
      await this.audit.log({
        actor: { sub: actor.sub, role: actor.role as any },
        entityType: 'booking',
        entityId: saved.id,
        action: 'BOOKING_APPLIED',
        payload: {
          bookingId: saved.id,
          gigId: gig.id,
          venueId: gig.venueId,
          status: saved.status,
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      });

      return saved;
    });
  }

  /**
   * Horeca accepts a booking: pending -> confirmed (DB enum).
   */
  async acceptBooking(bookingId: number, actor: Actor, req?: any): Promise<Booking> {
    if (actor.role === 'worker') throw new ForbiddenException('WORKER_CANNOT_ACCEPT');

    return this.dataSource.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(Booking);

      const booking = await bookingRepo.findOne({ where: { id: bookingId } });
      if (!booking) throw new NotFoundException('BOOKING_NOT_FOUND');

      await this.assertVenueOwnership(booking.venueId, actor);

      if (booking.status !== BookingStatus.PENDING) {
        throw new UnprocessableEntityException({
          error: 'BOOKING_NOT_PENDING',
          message: 'Only pending bookings can be accepted',
        });
      }

      booking.status = BookingStatus.CONFIRMED;
      const saved = await bookingRepo.save(booking);

      const meta = this.reqMeta(req);
      await this.audit.log({
        actor: { sub: actor.sub, role: actor.role as any },
        entityType: 'booking',
        entityId: saved.id,
        action: 'BOOKING_ACCEPTED',
        payload: {
          bookingId: saved.id,
          gigId: saved.gigId,
          venueId: saved.venueId,
          status: saved.status,
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      });

      return saved;
    });
  }

  /**
   * Worker confirms attendance (10h before start handled elsewhere; this just records the confirmation).
   */
  async confirmAttendance(bookingId: number, actor: Actor, req?: any): Promise<Booking> {
    if (actor.role !== 'worker')
      throw new ForbiddenException('ONLY_WORKER_CAN_CONFIRM_ATTENDANCE');

    return this.dataSource.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(Booking);

      const booking = await bookingRepo.findOne({ where: { id: bookingId } });
      if (!booking) throw new NotFoundException('BOOKING_NOT_FOUND');

      if (booking.workerUserId !== actor.sub) {
        throw new ForbiddenException('NOT_BOOKING_WORKER');
      }

      if (booking.status !== BookingStatus.CONFIRMED) {
        throw new UnprocessableEntityException({
          error: 'BOOKING_NOT_CONFIRMED',
          message: 'Attendance can be confirmed only after the venue accepted the booking',
        });
      }

      // No status change available in current enum; keep status confirmed and just append audit event.
      const meta = this.reqMeta(req);
      await this.audit.log({
        actor: { sub: actor.sub, role: actor.role as any },
        entityType: 'booking',
        entityId: booking.id,
        action: 'ATTENDANCE_CONFIRMED',
        payload: {
          bookingId: booking.id,
          gigId: booking.gigId,
          venueId: booking.venueId,
          status: booking.status,
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      });

      return booking;
    });
  }

  async findAll(): Promise<Booking[]> {
    return this.bookingsRepository.find();
  }
}
