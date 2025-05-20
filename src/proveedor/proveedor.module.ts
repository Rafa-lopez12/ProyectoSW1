import { Module } from '@nestjs/common';
import { ProveedorService } from './proveedor.service';
import { ProveedorController } from './proveedor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Proveedor } from './entities/proveedor.entity';

@Module({
  controllers: [ProveedorController],
  providers: [ProveedorService],
  imports: [
    TypeOrmModule.forFeature([Proveedor]),
    AuthModule
  ],
  exports: [ProveedorService, TypeOrmModule]
})
export class ProveedorModule {}
