import { Injectable } from '@nestjs/common';
import { Repository, ObjectLiteral } from 'typeorm';

export interface TenantEntity extends ObjectLiteral {
  tenantId: string;
}

@Injectable()
export abstract class TenantBaseService<T extends TenantEntity> {
  constructor(protected repository: Repository<T>) {}

  async findAllByTenant(tenantId: string): Promise<T[]> {
    return this.repository.find({
      where: { tenantId } as any
    });
  }

  async findOneByTenant(tenantId: string, id: string): Promise<T | null> {
    return this.repository.findOne({
      where: { id, tenantId } as any
    });
  }

  async createWithTenant(tenantId: string, data: any): Promise<T> {
    const entityData = { ...data, tenantId };
    const entity = this.repository.create(entityData);
    const saved = await this.repository.save(entity);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async updateByTenant(tenantId: string, id: string, data: any): Promise<T> {
    await this.repository.update({ id, tenantId } as any, data);
    
    const updated = await this.findOneByTenant(tenantId, id);
    if (!updated) {
      throw new Error(`Entity with id ${id} not found for tenant ${tenantId}`);
    }
    
    return updated;
  }

  async deleteByTenant(tenantId: string, id: string): Promise<boolean> {
    const result = await this.repository.delete({ id, tenantId } as any);
    return (result.affected || 0) > 0;
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.repository.count({
      where: { tenantId } as any
    });
  }

  // Métodos adicionales útiles
  async existsByTenant(tenantId: string, id: string): Promise<boolean> {
    const entity = await this.findOneByTenant(tenantId, id);
    return !!entity;
  }

  async findByFieldAndTenant(tenantId: string, field: string, value: any): Promise<T[]> {
    return this.repository.find({
      where: { 
        tenantId, 
        [field]: value 
      } as any
    });
  }
}