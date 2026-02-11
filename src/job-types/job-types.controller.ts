import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JobTypesService } from './job-types.service';
import { CreateJobTypeDto } from './dto/create-job-type.dto';
import { UpdateJobTypeDto } from './dto/update-job-type.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('job-types')
export class JobTypesController {
  constructor(private readonly jobTypesService: JobTypesService) {}

  // lettura: ok per MVP (pubblica)
  @Get()
  findAll() {
    return this.jobTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobTypesService.findOne(+id);
  }

  // write: ADMIN only
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() createJobTypeDto: CreateJobTypeDto) {
    return this.jobTypesService.create(createJobTypeDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateJobTypeDto: UpdateJobTypeDto) {
    return this.jobTypesService.update(+id, updateJobTypeDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobTypesService.remove(+id);
  }
}
