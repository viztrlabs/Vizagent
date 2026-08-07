import { PrismaClient } from '@prisma/client';

export type ModelName = keyof PrismaClient;

export abstract class BaseRepository<T> {
  constructor(protected prisma: PrismaClient) {}

  protected abstract get model(): ModelName;

  protected getModel() {
    return this.prisma[this.model] as unknown as {
      findFirst(args: { where: Record<string, unknown> }): Promise<T | null>;
      findMany(args: { where?: Record<string, unknown>; orderBy?: Record<string, unknown> }): Promise<T[]>;
      create(args: { data: Record<string, unknown> }): Promise<T>;
      update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<T>;
      delete(args: { where: { id: string } }): Promise<T>;
    };
  }

  async findById(id: string, tenantId: string): Promise<T | null> {
    return this.getModel().findFirst({ where: { id, tenantId } });
  }

  async findMany(tenantId: string, where?: Record<string, unknown>): Promise<T[]> {
    return this.getModel().findMany({
      where: { tenantId, ...where },
    });
  }

  async create(data: Record<string, unknown>, tenantId: string): Promise<T> {
    return this.getModel().create({
      data: { ...data, tenantId } as Record<string, unknown>,
    });
  }

  async update(id: string, data: Record<string, unknown>, tenantId: string): Promise<T> {
    return this.getModel().update({
      where: { id },
      data: { ...data, tenantId } as Record<string, unknown>,
    });
  }

  async delete(id: string, _tenantId: string): Promise<T> {
    return this.getModel().delete({
      where: { id },
    });
  }
}
