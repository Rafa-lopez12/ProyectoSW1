import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VirtualTryonService } from './virtual-tryon.service';
import { VirtualTryonController } from './virtual-tryon.controller';
import { VirtualTryonSession } from './entities/virtual-tryon-session.entity';
import { AuthModule } from '../auth/auth.module';
import { ClienteModule } from '../cliente/cliente.module';
import { ProductoModule } from '../producto/producto.module';

@Module({
  controllers: [VirtualTryonController],
  providers: [VirtualTryonService],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([VirtualTryonSession]),
    AuthModule,
    ClienteModule,
    ProductoModule
  ],
  exports: [VirtualTryonService]
})
export class VirtualTryonModule {}
