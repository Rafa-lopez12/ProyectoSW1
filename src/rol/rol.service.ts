import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Rol } from './entities/rol.entity';
import { Repository } from 'typeorm';
import { TenantBaseService } from '../common/services/tenant-base.service';

@Injectable()
export class RolService extends TenantBaseService<Rol> {
  
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>
  ) {
    super(rolRepository);
  }
  
  async create(tenantId: string, createRolDto: CreateRolDto) {
    try {
      return await this.createWithTenant(tenantId, createRolDto);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(tenantId: string) {
    return this.findAllByTenant(tenantId);
  }

  async findOne(tenantId: string, id: string) {
    const rol = await this.rolRepository.findOne({
      where: { id, tenantId },
      relations: ['funcionalidades']
    });
    
    if (!rol) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }
    
    return rol;
  }

  async update(tenantId: string, id: string, updateRolDto: UpdateRolDto) {
    try {
      return await this.updateByTenant(tenantId, id, updateRolDto);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(tenantId: string, id: string) {
    const deleted = await this.deleteByTenant(tenantId, id);
    
    if (!deleted) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }
    
    return {
      message: `Rol con ID ${id} eliminado exitosamente`
    };
  }

  // Método para buscar rol por nombre dentro del tenant
  async findByName(tenantId: string, nombre: string) {
    return this.rolRepository.findOne({
      where: { nombre, tenantId },
      relations: ['funcionalidades']
    });
  }

  // Método para obtener roles activos del tenant
  async findAllActive(tenantId: string) {
    return this.rolRepository.find({
      where: { tenantId },
      relations: ['funcionalidades']
    });
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException('Ya existe un rol con ese nombre en este tenant');
    }
    
    console.error(error);
    throw new BadRequestException('Error inesperado, revisar logs del servidor');
  }
}
