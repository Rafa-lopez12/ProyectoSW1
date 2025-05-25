import { Module } from '@nestjs/common';
import { MovimientoInvService } from './movimiento_inv.service';
import { MovimientoInvController } from './movimiento_inv.controller';
import { MovimientoInv } from './entities/movimiento_inv.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetalleMov } from './entities/detalle_mov_inv.entity';
import { ProductoModule } from '../producto/producto.module';
import { ProveedorModule } from '../proveedor/proveedor.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [MovimientoInvController],
  providers: [MovimientoInvService],
  imports:[
    TypeOrmModule.forFeature([MovimientoInv, DetalleMov]),
    ProductoModule,
    ProveedorModule,
    AuthModule,
  ],
  exports:[TypeOrmModule]
})
export class MovimientoInvModule {}
