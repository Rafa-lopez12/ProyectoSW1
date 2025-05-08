import { Module } from '@nestjs/common';
import { FuncionalidadService } from './funcionalidad.service';
import { FuncionalidadController } from './funcionalidad.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Funcionalidad } from './entities/funcionalidad.entity';

@Module({
  controllers: [FuncionalidadController],
  providers: [FuncionalidadService],
  imports: [TypeOrmModule.forFeature([Funcionalidad])]
})
export class FuncionalidadModule {}
