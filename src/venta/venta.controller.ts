import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { VentaService } from './venta.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { TenantFuncionalidadAuth, ClienteTenantAuth } from '../common/decorators/tenant-auth.decorator';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';
import { GetCliente } from '../cliente/decorators/get-cliente.decorator';
import { Cliente } from '../cliente/entities/cliente.entity';
import { CarritoService } from '../carrito/carrito.service';

@Controller('venta')
export class VentaController {
  constructor(
    private readonly ventaService: VentaService,
    private readonly carritoService: CarritoService
  ) {}

  // =================== RUTAS ADMINISTRATIVAS ===================

  @Post()
  @TenantFuncionalidadAuth('crear-venta')
  create(
    @GetTenantId() tenantId: string,
    @Body() createVentaDto: CreateVentaDto
  ) {
    return this.ventaService.create(tenantId, createVentaDto);
  }

  @Get()
  @TenantFuncionalidadAuth('obtener-ventas')
  findAll(@GetTenantId() tenantId: string) {
    return this.ventaService.findAll(tenantId);
  }

  @Get('resumen')
  @TenantFuncionalidadAuth('obtener-reportes-ventas')
  getResumen(
    @GetTenantId() tenantId: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string
  ) {
    const inicio = fechaInicio ? new Date(fechaInicio) : undefined;
    const fin = fechaFin ? new Date(fechaFin) : undefined;
    
    return this.ventaService.getVentasResumen(tenantId, inicio, fin);
  }

  @Get('cliente/:clienteId')
  @TenantFuncionalidadAuth('obtener-ventas')
  findByCliente(
    @GetTenantId() tenantId: string,
    @Param('clienteId', ParseUUIDPipe) clienteId: string
  ) {
    return this.ventaService.findByCliente(tenantId, clienteId);
  }

  @Get('usuario/:usuarioId')
  @TenantFuncionalidadAuth('obtener-ventas')
  findByUsuario(
    @GetTenantId() tenantId: string,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string
  ) {
    return this.ventaService.findByUsuario(tenantId, usuarioId);
  }

  @Get('fecha-rango')
  @TenantFuncionalidadAuth('obtener-ventas')
  findByDateRange(
    @GetTenantId() tenantId: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string
  ) {
    return this.ventaService.findByDateRange(
      tenantId,
      new Date(fechaInicio),
      new Date(fechaFin)
    );
  }

  @Get(':id')
  @TenantFuncionalidadAuth('obtener-venta')
  findOne(
    @GetTenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.ventaService.findOne(tenantId, id);
  }

  @Patch('estado/:id/:nuevoEstado')
  @TenantFuncionalidadAuth('actualizar-estado-venta')
  updateEstado(
    @GetTenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('nuevoEstado') nuevoEstado: string
  ) {
    return this.ventaService.updateEstado(tenantId, id, nuevoEstado);
  }

  // =================== RUTAS PARA CLIENTES ===================

  @Post('comprar')
  @ClienteTenantAuth()
  async realizarCompra(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente
  ) {
    // Obtener carrito del cliente en el tenant específico
    const carrito = await this.carritoService.obtenerCarrito(tenantId, cliente.id);
  
    if (carrito.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }
  
    const detalles = carrito.items.map(item => ({
      productoVariedadId: item.productoVariedadId,
      cantidad: item.cantidad,
      precioUnitario: item.variedad.precio
    }));

    const ventaCompleta: CreateVentaDto = {
      clienteId: cliente.id,
      detalles,
      observaciones: 'Compra realizada desde carrito'
    };
  
    const venta = await this.ventaService.create(tenantId, ventaCompleta);
  
    // Vaciar carrito después de la compra exitosa
    await this.carritoService.vaciarCarrito(tenantId, cliente.id);
  
    return {
      ...venta,
      mensaje: 'Compra realizada exitosamente desde el carrito.'
    };
  }

  @Get('mis-compras')
  @ClienteTenantAuth()
  getMyPurchases(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente
  ) {
    return this.ventaService.findByCliente(tenantId, cliente.id);
  }

  @Get('mi-compra/:id')
  @ClienteTenantAuth()
  getMyPurchase(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    // Primero verificar que la venta pertenece al cliente
    return this.ventaService.findOne(tenantId, id).then(venta => {
      if (venta.cliente.id !== cliente.id) {
        throw new NotFoundException('Venta no encontrada');
      }
      return venta;
    });
  }
}