import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobTypesService } from './job-types.service';
import { JobTypesController } from './job-types.controller';
import { JobType } from './entities/job-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JobType])],
  controllers: [JobTypesController],
  providers: [JobTypesService],
  exports: [JobTypesService],
})
export class JobTypesModule {}
