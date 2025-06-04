import { Module } from '@nestjs/common';
import { CategoriaService } from './categoria.service';
import { CategoriaController } from './categoria.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categoria } from './entities/categoria.entity';
import { AuthModule } from '../auth/auth.module';
import { ClienteModule } from '../cliente/cliente.module';

@Module({
  controllers: [CategoriaController],
  imports:[
    TypeOrmModule.forFeature([Categoria]),
    AuthModule,
    ClienteModule
  ],
  providers: [CategoriaService],
  exports:[CategoriaService]
})
export class CategoriaModule {}
