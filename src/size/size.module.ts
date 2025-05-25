import { Module } from '@nestjs/common';
import { SizeService } from './size.service';
import { SizeController } from './size.controller';
import { Size } from './entities/size.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [SizeController],
  providers: [SizeService],
  imports:[TypeOrmModule.forFeature([Size]),],
  exports:[TypeOrmModule]
})
export class SizeModule {}
