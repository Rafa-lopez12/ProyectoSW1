import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { Cliente } from '../entities/cliente.entity';
import { ClienteJwtPayload } from '../interfaces/cliente-jwt-payload.interface';

@Injectable()
export class ClienteJwtStrategy extends PassportStrategy(Strategy, 'cliente-jwt') {

    constructor(
        @InjectRepository(Cliente)
        private readonly clienteRepository: Repository<Cliente>,
        configService: ConfigService
    ) {
        super({
            secretOrKey: configService.get<string>('JWT_SECRET_CLIENTE') || configService.get('JWT_SECRET') + '_cliente',
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        });
    }

    async validate(payload: ClienteJwtPayload): Promise<Cliente> {
        
        const { id, type, tenantId } = payload;

        // Verificar que el token es de tipo cliente
        if (type !== 'cliente') {
            throw new UnauthorizedException('Token no válido para cliente');
        }

        const cliente = await this.clienteRepository.findOne({
            where: { id, tenantId }
        });

        if (!cliente) 
            throw new UnauthorizedException('Token no válido');
            
        if (!cliente.isActive) 
            throw new UnauthorizedException('Cliente inactivo, contacta al administrador');
        
        return cliente;
    }
}