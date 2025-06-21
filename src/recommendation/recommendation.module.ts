import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsService } from './recommendation.service';
import { RecommendationsController } from './recommendation.controller';

// Importar entidades necesarias
import { Producto } from '../producto/entities/producto.entity';
import { ProductoVariedad } from '../producto/entities/productoVariedad.entity';
import { Venta } from '../venta/entities/venta.entity';
import { DetalleVenta } from '../venta/entities/detalleVenta.entity';
import { Cliente } from '../cliente/entities/cliente.entity';

// Importar módulos necesarios
import { AuthModule } from '../auth/auth.module';
import { ClienteModule } from '../cliente/cliente.module';

@Module({
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Producto,
      ProductoVariedad,
      Venta,
      DetalleVenta,
      Cliente
    ]),
    AuthModule,
    ClienteModule
  ],
  exports: [RecommendationsService]
})
export class RecommendationsModule {}
