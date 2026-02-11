import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorecaVenue } from './horeca-venue.entity';
import { HorecaVenuesService } from './horeca-venues.service';
import { HorecaVenuesController } from './horeca-venues.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([HorecaVenue]), UsersModule],
  providers: [HorecaVenuesService],
  controllers: [HorecaVenuesController],
  exports: [HorecaVenuesService],
})
export class HorecaVenuesModule {}
