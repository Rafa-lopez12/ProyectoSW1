import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoryDto } from './dto/update-categoria.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Categoria } from './entities/categoria.entity';
import { Repository } from 'typeorm';
import { TenantBaseService } from '../common/services/tenant-base.service';

@Injectable()
export class CategoriaService extends TenantBaseService<Categoria> {

  constructor(
    @InjectRepository(Categoria)
    private readonly categoryRepository: Repository<Categoria>,
  ){
    super(categoryRepository);
  }

  async create(tenantId: string, createCategoryDto: CreateCategoriaDto) {
    try {
      return await this.createWithTenant(tenantId, createCategoryDto);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(tenantId: string) {
    return this.findAllByTenant(tenantId);
  }

  async findOne(tenantId: string, id: string) {
    const category = await this.findOneByTenant(tenantId, id);
    
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    
    return category;
  }

  async update(tenantId: string, id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOneByTenant(tenantId, id);
    
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    
    Object.assign(category, updateCategoryDto);
    
    try {
      return await this.categoryRepository.save(category);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(tenantId: string, id: string) {
    const deleted = await this.deleteByTenant(tenantId, id);
    
    if (!deleted) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    
    return {
      message: `Category with ID ${id} was successfully removed`
    };
  }
  
  private handleDBExceptions(error: any) {
    if (error.code === '23505')
      throw new BadRequestException(error.detail);
      
    console.error(error);
    throw new BadRequestException('Unexpected error, check server logs');
  }
}
