import { Module } from '@nestjs/common';
import { SuscripcionService } from './suscripcion.service';
import { SuscripcionController } from './suscripcion.controller';

@Module({
  controllers: [SuscripcionController],
  providers: [SuscripcionService],
})
export class SuscripcionModule {}
