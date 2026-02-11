import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobType } from './entities/job-type.entity';
import { CreateJobTypeDto } from './dto/create-job-type.dto';
import { UpdateJobTypeDto } from './dto/update-job-type.dto';

@Injectable()
export class JobTypesService {
  constructor(
    @InjectRepository(JobType)
    private readonly jobTypesRepository: Repository<JobType>,
  ) {}

  async create(createJobTypeDto: CreateJobTypeDto): Promise<JobType> {
    const jobType = this.jobTypesRepository.create({
      active: true,
      ...createJobTypeDto,
    });
    return this.jobTypesRepository.save(jobType);
  }

  findAll(): Promise<JobType[]> {
    return this.jobTypesRepository.find();
  }

  async findOne(id: number): Promise<JobType> {
    const jobType = await this.jobTypesRepository.findOne({
      where: { id },
    });
    if (!jobType) {
      throw new NotFoundException(`JobType with id ${id} not found`);
    }
    return jobType;
  }

  async update(
    id: number,
    updateJobTypeDto: UpdateJobTypeDto,
  ): Promise<JobType> {
    const jobType = await this.findOne(id);
    Object.assign(jobType, updateJobTypeDto);
    return this.jobTypesRepository.save(jobType);
  }

  async remove(id: number): Promise<void> {
    const jobType = await this.findOne(id);
    await this.jobTypesRepository.remove(jobType);
  }
}
