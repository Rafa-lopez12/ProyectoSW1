import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';
import { Size } from './entities/size.entity';
import { TenantBaseService } from '../common/services/tenant-base.service';

@Injectable()
export class SizeService extends TenantBaseService<Size> {
  
  constructor(
    @InjectRepository(Size)
    private readonly sizeRepository: Repository<Size>,
  ) {
    super(sizeRepository);
  }

  async create(tenantId: string, createSizeDto: CreateSizeDto) {
    try {
      return await this.createWithTenant(tenantId, createSizeDto);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(tenantId: string) {
    return this.findAllByTenant(tenantId);
  }

  async findOne(tenantId: string, id: string) {
    const size = await this.findOneByTenant(tenantId, id);
    
    if (!size) {
      throw new NotFoundException(`Size with ID ${id} not found`);
    }
    
    return size;
  }

  async update(tenantId: string, id: string, updateSizeDto: UpdateSizeDto) {
    try {
      return await this.updateByTenant(tenantId, id, updateSizeDto);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(tenantId: string, id: string) {
    const deleted = await this.deleteByTenant(tenantId, id);
    
    if (!deleted) {
      throw new NotFoundException(`Size with ID ${id} not found`);
    }
    
    return {
      message: `Size with ID ${id} was successfully removed`
    };
  }

  // Método para buscar size por nombre dentro del tenant
  async findByName(tenantId: string, name: string) {
    return this.sizeRepository.findOne({
      where: { name, tenantId }
    });
  }

  // Método para verificar si existe un size con ese nombre en el tenant
  async existsByName(tenantId: string, name: string): Promise<boolean> {
    const size = await this.findByName(tenantId, name);
    return !!size;
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException('Ya existe un size con ese nombre en este tenant');
    }
    
    console.error(error);
    throw new BadRequestException('Error inesperado, revisar logs del servidor');
  }
}