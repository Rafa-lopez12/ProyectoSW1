import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';

import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { LoginClienteDto } from './dto/loginCli.dto';
import { ClienteJwtPayload } from './interfaces/cliente-jwt-payload.interface';

@Injectable()
export class ClienteAuthService {

  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(createClienteDto: CreateClienteDto) {
    try {
      const { password, fechaNacimiento, ...clienteData } = createClienteDto;
      
      const cliente = this.clienteRepository.create({
        ...clienteData,
        password: bcrypt.hashSync(password, 10),
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
          type: 'cliente'
        })
      };

    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async login(loginClienteDto: LoginClienteDto) {
    const { password, email } = loginClienteDto;

    const cliente = await this.clienteRepository.findOne({
      where: { email },
      select: { 
        email: true, 
        password: true, 
        id: true, 
        firstName: true, 
        lastName: true,
        isActive: true 
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
        type: 'cliente'
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
        type: 'cliente'
      })
    };
  }

  private getClienteJwtToken(payload: ClienteJwtPayload) {
    // Usar un secret diferente para clientes o agregar prefijo
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET_CLIENTE') || this.configService.get('JWT_SECRET') + '_cliente',
      expiresIn: '7d' // Token más largo para clientes
    });
    return token;
  }

  private handleDBErrors(error: any): never {
    if (error.code === '23505') 
      throw new BadRequestException('El email ya está registrado');

    console.log(error);
    throw new InternalServerErrorException('Por favor revisa los logs del servidor');
  }
}
