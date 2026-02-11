// src/users/users.service.ts
import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, role, isActive } = createUserDto;

    if (!email || !password) {
      // in teoria già protetto dal DTO, ma non mi fido ciecamente
      throw new BadRequestException('Email and password are required');
    }

    const existing = await this.usersRepository.findOne({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.usersRepository.create({
      email,
      password: passwordHash,
      role: role ?? 'worker',
      isActive: isActive ?? true,
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOneById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  // alias legacy, se qualche pezzo di codice lo usa ancora
  async findByEmail(email: string): Promise<User | null> {
    return this.findOneByEmail(email);
  }

  async findOne(email: string): Promise<User | null> {
    return this.findOneByEmail(email);
  }
}
