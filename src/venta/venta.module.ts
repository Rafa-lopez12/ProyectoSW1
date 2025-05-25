import { Module } from '@nestjs/common';
import { VentaService } from './venta.service';
import { VentaController } from './venta.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ClienteModule } from '../cliente/cliente.module';
import { ProductoModule } from '../producto/producto.module';
import { DetalleVenta } from './entities/detalleVenta.entity';
import { Venta } from './entities/venta.entity';
import { CarritoModule } from '../carrito/carrito.module';

@Module({
  controllers: [VentaController],
  providers: [VentaService],
  imports: [
    TypeOrmModule.forFeature([Venta, DetalleVenta]),
    AuthModule,    
    ClienteModule, 
    ProductoModule,
    CarritoModule
  ],
  exports: [VentaService, TypeOrmModule]
})
export class VentaModule {}
