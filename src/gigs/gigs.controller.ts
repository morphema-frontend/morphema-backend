// src/gigs/gigs.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateGigDto } from './dto/create-gig.dto';
import { GigsService } from './gigs.service';

@Controller('gigs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class GigsController {
  constructor(private readonly gigsService: GigsService) {}

  @Get()
  async list(
    @Req() req: any,
    @Query('publishStatus') publishStatus?: string,
    @Query('venueId') venueId?: string,
  ) {
    const actor = this.gigsService.getActor(req);

    if (actor.role === 'worker') {
      return this.gigsService.findPublishedFeed(actor);
    }

    if (venueId) {
      const idNum = Number(venueId);
      return this.gigsService.findAllByVenue(idNum, actor);
    }

    return this.gigsService.findAll(actor, publishStatus);
  }

  @Post()
  @Roles('venue')
  async create(@Body() dto: CreateGigDto, @Req() req: any) {
    const actor = this.gigsService.getActor(req);
    return this.gigsService.create(dto, actor, req);
  }

  @Post(':id/preauthorize')
  @Roles('venue')
  async preauthorize(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const actor = this.gigsService.getActor(req);
    return this.gigsService.preauthorizeGig(id, actor, req);
  }

  @Post(':id/publish')
  @Roles('venue')
  async publish(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const actor = this.gigsService.getActor(req);
    return this.gigsService.publishGig(id, actor, req);
  }
}
