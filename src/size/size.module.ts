import { Module } from '@nestjs/common';
import { SizeService } from './size.service';
import { SizeController } from './size.controller';
import { Size } from './entities/size.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [SizeController],
  providers: [SizeService],
  imports: [
    TypeOrmModule.forFeature([Size]),
    AuthModule
  ],
  exports: [TypeOrmModule, SizeService]
})
export class SizeModule {}
