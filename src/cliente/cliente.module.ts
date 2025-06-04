import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ClienteAuthService } from './cliente.service';
import { ClienteAuthController } from './cliente.controller';
import { Cliente } from './entities/cliente.entity';
import { ClienteJwtStrategy } from './strategies/cliente-jwt.strategy';
import { ProductoModule } from '../producto/producto.module';

@Module({
  controllers: [ClienteAuthController],
  providers: [ClienteAuthService, ClienteJwtStrategy],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Cliente]),
    
    PassportModule.register({ defaultStrategy: 'cliente-jwt' }),
    
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get('JWT_SECRET_CLIENTE') || configService.get('JWT_SECRET') + '_cliente',
          signOptions: {
            expiresIn: '7d'
          },
        }
      }
    }),
  ],
  exports: [
    TypeOrmModule,
    ClienteJwtStrategy,
    PassportModule,
    JwtModule,
    ClienteAuthService
  ]
})
export class ClienteModule {}
