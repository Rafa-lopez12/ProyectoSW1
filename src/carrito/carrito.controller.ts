import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { CarritoService } from './carrito.service';
import { AgregarCarritoDto } from './dto/create-carrito.dto';
import { ActualizarCantidadCarritoDto } from './dto/actualizar-cantidad-carrito.dto';
import { ClienteTenantAuth, TenantFuncionalidadAuth } from '../common/decorators/tenant-auth.decorator';
import { GetCliente } from '../cliente/decorators/get-cliente.decorator';
import { Cliente } from '../cliente/entities/cliente.entity';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';

@Controller('carrito')
export class CarritoController {
  constructor(private readonly carritoService: CarritoService) {}

  // =================== RUTAS PARA CLIENTES ===================

  @Post('agregar')
  @ClienteTenantAuth()
  agregarAlCarrito(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente,
    @Body() agregarCarritoDto: AgregarCarritoDto
  ) {
    return this.carritoService.agregarAlCarrito(tenantId, cliente.id, agregarCarritoDto);
  }

  @Get()
  @ClienteTenantAuth()
  obtenerCarrito(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente
  ) {
    return this.carritoService.obtenerCarrito(tenantId, cliente.id);
  }

  @Get('contador')
  @ClienteTenantAuth()
  contarItems(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente
  ) {
    return this.carritoService.contarItemsCarrito(tenantId, cliente.id);
  }

  @Patch('cantidad/:productoVariedadId')
  @ClienteTenantAuth()
  actualizarCantidad(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente,
    @Param('productoVariedadId', ParseUUIDPipe) productoVariedadId: string,
    @Body() actualizarCantidadDto: ActualizarCantidadCarritoDto
  ) {
    return this.carritoService.actualizarCantidad(tenantId, cliente.id, productoVariedadId, actualizarCantidadDto);
  }

  @Delete('producto/:productoVariedadId')
  @ClienteTenantAuth()
  removerProducto(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente,
    @Param('productoVariedadId', ParseUUIDPipe) productoVariedadId: string
  ) {
    return this.carritoService.removerProducto(tenantId, cliente.id, productoVariedadId);
  }

  @Delete('vaciar')
  @ClienteTenantAuth()
  vaciarCarrito(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente
  ) {
    return this.carritoService.vaciarCarrito(tenantId, cliente.id);
  }

  // =================== RUTAS ADMINISTRATIVAS ===================

  @Get('admin/todos')
  @TenantFuncionalidadAuth('obtener-carritos')
  obtenerTodosLosCarritos(@GetTenantId() tenantId: string) {
    return this.carritoService.obtenerCarritosPorTenant(tenantId);
  }

  @Get('admin/estadisticas')
  @TenantFuncionalidadAuth('obtener-estadisticas-carritos')
  obtenerEstadisticas(@GetTenantId() tenantId: string) {
    return this.carritoService.obtenerEstadisticasCarritos(tenantId);
  }

  @Get('admin/cliente/:clienteId')
  @TenantFuncionalidadAuth('obtener-carrito-cliente')
  obtenerCarritoCliente(
    @GetTenantId() tenantId: string,
    @Param('clienteId', ParseUUIDPipe) clienteId: string
  ) {
    return this.carritoService.obtenerCarrito(tenantId, clienteId);
  }

  @Delete('admin/cliente/:clienteId/vaciar')
  @TenantFuncionalidadAuth('vaciar-carrito-cliente')
  vaciarCarritoCliente(
    @GetTenantId() tenantId: string,
    @Param('clienteId', ParseUUIDPipe) clienteId: string
  ) {
    return this.carritoService.vaciarCarrito(tenantId, clienteId);
  }
}