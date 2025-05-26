import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query } from '@nestjs/common';
import { ProveedorService } from './proveedor.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { FuncionalidadAuth } from 'src/auth/decorators/funcionalidad-auth.decorator';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';
import { TenantFuncionalidadAuth } from '../common/decorators/tenant-auth.decorator';

@Controller('proveedor')
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Post()
  @TenantFuncionalidadAuth('crear-proveedor')
  create(@GetTenantId() tenantId: string, @Body() createProveedorDto: CreateProveedorDto ) {
    return this.proveedorService.create(tenantId, createProveedorDto);
  }
  
  @Get()
  @TenantFuncionalidadAuth('obtener-proveedores')
  findAll(@GetTenantId() tenantId: string) {
    return this.proveedorService.findAll(tenantId);
  }
  
  @Get('active')
  @TenantFuncionalidadAuth('obtener-proveedores')
  findAllActive(@GetTenantId() tenantId: string) {
    return this.proveedorService.findAllActive(tenantId);
  }
  
  @Get(':id')
  @TenantFuncionalidadAuth('obtener-proveedor')
  findOne(@GetTenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.proveedorService.findOne(tenantId, id);
  }
  
  @Get('buscar/nombre')
  @TenantFuncionalidadAuth('obtener-proveedor')
  findByName(@GetTenantId() tenantId: string, @Query('nombre') nombre: string) {
    return this.proveedorService.findByName(tenantId, nombre);
  }
  
  @Patch(':id')
  @TenantFuncionalidadAuth('actualizar-proveedor')
  update(
    @GetTenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProveedorDto: UpdateProveedorDto,
  ) {
    return this.proveedorService.update(tenantId, id, updateProveedorDto);
  }
  
  @Delete(':id')
  @TenantFuncionalidadAuth('desactivar-proveedor')
  remove(@GetTenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.proveedorService.remove(tenantId,id);
  }
  
  @Patch('activate/:id')
  @TenantFuncionalidadAuth('activar-proveedor')
  activate(@GetTenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.proveedorService.activate(tenantId, id);
  }
}
