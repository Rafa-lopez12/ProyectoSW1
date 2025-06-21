// src/reportes/reportes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';

// Importar entidades necesarias
import { Venta } from '../venta/entities/venta.entity';
import { DetalleVenta } from '../venta/entities/detalleVenta.entity';
import { MovimientoInv } from '../movimiento_inv/entities/movimiento_inv.entity';
import { DetalleMov } from '../movimiento_inv/entities/detalle_mov_inv.entity';
import { ProductoVariedad } from '../producto/entities/productoVariedad.entity';
import { Cliente } from '../cliente/entities/cliente.entity';
import { Proveedor } from '../proveedor/entities/proveedor.entity';

// Importar módulos necesarios
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [ReportesController],
  providers: [ReportesService],
  imports: [
    TypeOrmModule.forFeature([
      Venta,
      DetalleVenta,
      MovimientoInv,
      DetalleMov,
      ProductoVariedad,
      Cliente,
      Proveedor
    ]),
    AuthModule
  ],
  exports: [ReportesService]
})
export class ReportesModule {}
