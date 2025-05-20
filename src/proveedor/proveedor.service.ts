import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProveedorService {

  constructor(
    
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,
  ){}


  async create(createProveedorDto: CreateProveedorDto) {
    try {
      const proveedor = this.proveedorRepository.create(createProveedorDto);
      await this.proveedorRepository.save(proveedor);
      return proveedor;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
  
  async findAll() {
    return this.proveedorRepository.find();
  }
  
  async findOne(id: string) {
    const proveedor = await this.proveedorRepository.findOne({ where: { id } });
    
    if (!proveedor) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    }
    
    return proveedor;
  }
  
  async findByName(nombre: string): Promise<Proveedor[]> {
    return this.proveedorRepository.find({
      where: {
        nombre: nombre
      }
    });
  }
  
  async update(id: string, updateProveedorDto: UpdateProveedorDto) {
    const proveedor = await this.findOne(id);
    
    try {
      Object.assign(proveedor, updateProveedorDto);
      await this.proveedorRepository.save(proveedor);
      return proveedor;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
  
  async remove(id: string): Promise<void> {
    // Soft delete - solo cambia el estado a inactivo
    const proveedor = await this.findOne(id);
    proveedor.isActive = false;
    await this.proveedorRepository.save(proveedor);
  }
  
  async activate(id: string): Promise<Proveedor> {
    // Reactivar un proveedor
    const proveedor = await this.findOne(id);
    proveedor.isActive = true;
    await this.proveedorRepository.save(proveedor);
    return proveedor;
  }
  
  async findAllActive(): Promise<Proveedor[]> {
    return this.proveedorRepository.find({
      where: { isActive: true }
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
