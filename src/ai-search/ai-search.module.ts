import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiSearchService } from './ai-search.service';
import { AiSearchController } from './ai-search.controller';
import { Producto } from '../producto/entities/producto.entity';
import { ProductoImage } from '../producto/entities/ProductoImagen.entity';
import { AuthModule } from '../auth/auth.module';
import { ClienteModule } from '../cliente/cliente.module';

@Module({
  controllers: [AiSearchController],
  providers: [AiSearchService],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Producto, ProductoImage]),
    AuthModule,
    ClienteModule
  ],
  exports: [AiSearchService]
})
export class AiSearchModule {}
