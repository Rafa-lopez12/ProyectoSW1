import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarritoService } from './carrito.service';
import { CarritoController } from './carrito.controller';
import { Carrito } from './entities/carrito.entity';
import { ClienteModule } from '../cliente/cliente.module';
import { ProductoModule } from '../producto/producto.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [CarritoController],
  providers: [CarritoService],
  imports: [
    TypeOrmModule.forFeature([Carrito]),
    ClienteModule, 
    ProductoModule,
    AuthModule
  ],
  exports: [CarritoService, TypeOrmModule]
})
export class CarritoModule {}
