import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { Repository } from 'typeorm';
import { TenantBaseService } from '../common/services/tenant-base.service';

@Injectable()
export class ProveedorService extends TenantBaseService<Proveedor> {

  constructor(
    
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,
  ){
    super(proveedorRepository)
  }


  async create(tenantId: string, createProveedorDto: CreateProveedorDto) {
    try {
      return await this.createWithTenant(tenantId, createProveedorDto);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
  
  async findAll(tenantId: string) {
    return this.findAllByTenant(tenantId);
  }
  
  async findOne(tenantid:string, id: string) {
    const proveedor = await this.findOneByTenant(tenantid, id);
    
    if (!proveedor) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    }
    
    return proveedor;
  }
  
  async findByName(tenantId: string,nombre: string): Promise<Proveedor[]> {
    return this.findByFieldAndTenant(tenantId, 'nombre', nombre);
  }
  
  async update(tenantId:string, id: string, updateProveedorDto: UpdateProveedorDto) {
    //const proveedor = await this.findOne(id);
    
    try {
      return await this.updateByTenant(tenantId, id, updateProveedorDto);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
  
  async remove(tenantId: string, id: string): Promise<void> {
    const proveedor = await this.findOneByTenant(tenantId, id);
    if (!proveedor) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    }
    
    proveedor.isActive = false;
    await this.proveedorRepository.save(proveedor);
  }
  
  async activate(tenantId: string, id: string): Promise<Proveedor> {
    const proveedor = await this.findOneByTenant(tenantId, id);
    if (!proveedor) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    }
    
    proveedor.isActive = true;
    await this.proveedorRepository.save(proveedor);
    return proveedor;
  }
  
  async findAllActive(tenantId: string): Promise<Proveedor[]> {
    return this.proveedorRepository.find({
      where: { isActive: true, tenantId }
    });
  }
  
  private handleDBExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(`El proveedor ya existe en la base de datos: ${error.detail}`);
    }
    
    console.error(error);
    throw new InternalServerErrorException('Error inesperado, revisar logs del servidor');
  }
}
