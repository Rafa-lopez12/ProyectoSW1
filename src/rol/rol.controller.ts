import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { RolService } from './rol.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { TenantFuncionalidadAuth } from '../common/decorators/tenant-auth.decorator';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';

@Controller('rol')
export class RolController {
  constructor(private readonly rolService: RolService) {}

  @Post()
  @TenantFuncionalidadAuth('crear-rol')
  create(
    @GetTenantId() tenantId: string,
    @Body() createRolDto: CreateRolDto
  ) {
    return this.rolService.create(tenantId, createRolDto);
  }

  @Get()
  @TenantFuncionalidadAuth('obtener-roles')
  findAll(@GetTenantId() tenantId: string) {
    return this.rolService.findAll(tenantId);
  }

  @Get('active')
  @TenantFuncionalidadAuth('obtener-roles')
  findAllActive(@GetTenantId() tenantId: string) {
    return this.rolService.findAllActive(tenantId);
  }

  @Get(':id')
  @TenantFuncionalidadAuth('obtener-rol')
  findOne(
    @GetTenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.rolService.findOne(tenantId, id);
  }

  @Get('buscar/:nombre')
  @TenantFuncionalidadAuth('obtener-rol')
  findByName(
    @GetTenantId() tenantId: string,
    @Param('nombre') nombre: string
  ) {
    return this.rolService.findByName(tenantId, nombre);
  }

  @Patch(':id')
  @TenantFuncionalidadAuth('actualizar-rol')
  update(
    @GetTenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateRolDto: UpdateRolDto
  ) {
    return this.rolService.update(tenantId, id, updateRolDto);
  }

  @Delete(':id')
  @TenantFuncionalidadAuth('eliminar-rol')
  remove(
    @GetTenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.rolService.remove(tenantId, id);
  }
}
