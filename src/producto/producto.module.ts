import { Module } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { ProductoController } from './producto.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity';
import { CategoriaModule } from '../categoria/categoria.module';
import { ProductoVariedad } from './entities/productoVariedad.entity';
import { ProductoImage } from './entities/ProductoImagen.entity';
import { SizeModule } from '../size/size.module';
import { AuthModule } from '../auth/auth.module';
import { ClienteModule } from '../cliente/cliente.module';

@Module({
  controllers: [ProductoController],
  imports:[
    TypeOrmModule.forFeature([Producto, ProductoVariedad, ProductoImage]),
    CategoriaModule,
    SizeModule,
    AuthModule,
    ClienteModule
  ],
  providers: [ProductoService],
  exports:[ProductoService, TypeOrmModule]
})
export class ProductoModule {}
