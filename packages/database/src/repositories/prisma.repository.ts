import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class PrismaRepository<T, ID> implements BaseRepository<T, ID> {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly model: any
  ) {}

  async findById(id: ID): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<T[]> {
    return this.model.findMany();
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    return this.model.create({
      data,
    });
  }

  async update(id: ID, data: Partial<T>): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    });
  }

  async delete(id: ID): Promise<boolean> {
    await this.model.delete({
      where: { id },
    });
    return true;
  }
}