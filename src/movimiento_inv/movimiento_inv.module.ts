import { Module } from '@nestjs/common';
import { MovimientoInvService } from './movimiento_inv.service';
import { MovimientoInvController } from './movimiento_inv.controller';

@Module({
  controllers: [MovimientoInvController],
  providers: [MovimientoInvService],
})
export class MovimientoInvModule {}
