import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { MovimientoInvService } from './movimiento_inv.service';
import { CreateMovimientoInvDto } from './dto/create-movimiento_inv.dto';
import { UpdateMovimientoInvDto } from './dto/update-movimiento_inv.dto';
import { TenantFuncionalidadAuth } from '../common/decorators/tenant-auth.decorator';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';

@Controller('movimiento-inv')
export class MovimientoInvController {
  constructor(private readonly movimientoInvService: MovimientoInvService) {}

  @Post()
  @TenantFuncionalidadAuth('crear-movimientoInv')
  create(
    @GetTenantId() tenantId: string,
    @Body() createMovimientoInvDto: CreateMovimientoInvDto
  ) {
    return this.movimientoInvService.create(tenantId, createMovimientoInvDto);
  }

  @Get()
  @TenantFuncionalidadAuth('obtener-movimientosInv')
  findAll(@GetTenantId() tenantId: string) {
    return this.movimientoInvService.findAll(tenantId);
  }

  @Get('proveedor/:proveedorId')
  @TenantFuncionalidadAuth('obtener-movimientosInv')
  findByProveedor(
    @GetTenantId() tenantId: string,
    @Param('proveedorId', ParseUUIDPipe) proveedorId: string
  ) {
    return this.movimientoInvService.findByProveedor(tenantId, proveedorId);
  }

  @Get('usuario/:usuarioId')
  @TenantFuncionalidadAuth('obtener-movimientosInv')
  findByUsuario(
    @GetTenantId() tenantId: string,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string
  ) {
    return this.movimientoInvService.findByUsuario(tenantId, usuarioId);
  }

  @Get('fecha-rango')
  @TenantFuncionalidadAuth('obtener-movimientosInv')
  findByDateRange(
    @GetTenantId() tenantId: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string
  ) {
    return this.movimientoInvService.findByDateRange(
      tenantId,
      new Date(fechaInicio),
      new Date(fechaFin)
    );
  }

  @Get(':id')
  @TenantFuncionalidadAuth('obtener-movimientoInv')
  findOne(
    @GetTenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.movimientoInvService.findOne(tenantId, id);
  }
}
