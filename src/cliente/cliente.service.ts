import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';

import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { LoginClienteDto } from './dto/loginCli.dto';
import { ClienteJwtPayload } from './interfaces/cliente-jwt-payload.interface';
import { TenantBaseService } from '../common/services/tenant-base.service';

@Injectable()
export class ClienteAuthService extends TenantBaseService<Cliente> {

  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super(clienteRepository);
  }

  async register(tenantId: string, createClienteDto: CreateClienteDto) {
    try {
      const { password, fechaNacimiento, ...clienteData } = createClienteDto;
      
      const cliente = this.clienteRepository.create({
        ...clienteData,
        password: bcrypt.hashSync(password, 10),
        tenantId
      });

      await this.clienteRepository.save(cliente);
      delete cliente[password];

      return {
        ...cliente,
        token: this.getClienteJwtToken({ 
          id: cliente.id, 
          email: cliente.email,
          firstName: cliente.firstName,
          lastName: cliente.lastName,
          type: 'cliente',
          tenantId
        })
      };

    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async login(tenantId: string, loginClienteDto: LoginClienteDto) {
    const { password, email } = loginClienteDto;

    const cliente = await this.clienteRepository.findOne({
      where: { email, tenantId },
      select: { 
        email: true, 
        password: true, 
        id: true, 
        firstName: true, 
        lastName: true,
        isActive: true,
        tenantId: true
      }
    });

    if (!cliente) 
      throw new UnauthorizedException('Credenciales no válidas (email)');
      
    if (!cliente.isActive)
      throw new UnauthorizedException('Cliente inactivo, contacta al administrador');
      
    if (!bcrypt.compareSync(password, cliente.password))
      throw new UnauthorizedException('Credenciales no válidas (password)');

    delete cliente[password];

    return {
      ...cliente,
      token: this.getClienteJwtToken({ 
        id: cliente.id, 
        email: cliente.email,
        firstName: cliente.firstName,
        lastName: cliente.lastName,
        type: 'cliente',
        tenantId: cliente.tenantId
      })
    };
  }

  async checkAuthStatus(cliente: Cliente) {
    return {
      ...cliente,
      token: this.getClienteJwtToken({ 
        id: cliente.id, 
        email: cliente.email,
        firstName: cliente.firstName,
        lastName: cliente.lastName,
        type: 'cliente',
        tenantId: cliente.tenantId
      })
    };
  }

  // Métodos administrativos para gestionar clientes desde el admin
  async findAll(tenantId: string) {
    return this.findAllByTenant(tenantId);
  }

  async findOne(tenantId: string, id: string) {
    const cliente = await this.findOneByTenant(tenantId, id);
    
    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }
    
    return cliente;
  }

  async update(tenantId: string, id: string, updateClienteDto: any) {
    try {
      return await this.updateByTenant(tenantId, id, updateClienteDto);
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async deactivate(tenantId: string, id: string) {
    const cliente = await this.findOneByTenant(tenantId, id);
    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }
    
    cliente.isActive = false;
    await this.clienteRepository.save(cliente);
    
    return { message: 'Cliente desactivado exitosamente' };
  }

  async activate(tenantId: string, id: string) {
    const cliente = await this.findOneByTenant(tenantId, id);
    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }
    
    cliente.isActive = true;
    await this.clienteRepository.save(cliente);
    
    return { message: 'Cliente activado exitosamente' };
  }

  async findByEmail(tenantId: string, email: string) {
    return this.clienteRepository.findOne({
      where: { email, tenantId }
    });
  }

  private getClienteJwtToken(payload: ClienteJwtPayload) {
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET_CLIENTE') || this.configService.get('JWT_SECRET') + '_cliente',
      expiresIn: '7d'
    });
    return token;
  }

  private handleDBErrors(error: any): never {
    if (error.code === '23505') 
      throw new BadRequestException('El email ya está registrado en este tenant');

    console.log(error);
    throw new InternalServerErrorException('Por favor revisa los logs del servidor');
  }
}