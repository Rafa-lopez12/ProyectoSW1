import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';

@Module({
  controllers: [TenantController],
  providers: [TenantService],
  imports: [TypeOrmModule.forFeature([Tenant])],
  exports: [TypeOrmModule, TenantService]
})
export class TenantModule {}
