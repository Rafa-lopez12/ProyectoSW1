import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { SizeService } from './size.service';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';
import { TenantFuncionalidadAuth } from '../common/decorators/tenant-auth.decorator';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';

@Controller('size')
export class SizeController {
  constructor(private readonly sizeService: SizeService) {}

  @Post()
  @TenantFuncionalidadAuth('crear-size')
  create(
    @GetTenantId() tenantId: string,
    @Body() createSizeDto: CreateSizeDto
  ) {
    return this.sizeService.create(tenantId, createSizeDto);
  }

  @Get()
  @TenantFuncionalidadAuth('obtener-sizes')
  findAll(@GetTenantId() tenantId: string) {
    return this.sizeService.findAll(tenantId);
  }

  @Get('buscar/:name')
  @TenantFuncionalidadAuth('obtener-size')
  findByName(
    @GetTenantId() tenantId: string,
    @Param('name') name: string
  ) {
    return this.sizeService.findByName(tenantId, name);
  }

  @Get(':id')
  @TenantFuncionalidadAuth('obtener-size')
  findOne(
    @GetTenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.sizeService.findOne(tenantId, id);
  }

  @Patch(':id')
  @TenantFuncionalidadAuth('actualizar-size')
  update(
    @GetTenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateSizeDto: UpdateSizeDto
  ) {
    return this.sizeService.update(tenantId, id, updateSizeDto);
  }

  @Delete(':id')
  @TenantFuncionalidadAuth('eliminar-size')
  remove(
    @GetTenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.sizeService.remove(tenantId, id);
  }
}
