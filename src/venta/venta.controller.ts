import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe } from '@nestjs/common';
import { VentaService } from './venta.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { FuncionalidadAuth } from '../auth/decorators/funcionalidad-auth.decorator';
import { ClienteAuth } from '../cliente/decorators/cliente-auth.decorator';
import { GetCliente } from '../cliente/decorators/get-cliente.decorator';
import { Cliente } from '../cliente/entities/cliente.entity';
import { CarritoService } from '../carrito/carrito.service';

@Controller('venta')
export class VentaController {
  constructor(
    private readonly ventaService: VentaService,
    private readonly carritoService: CarritoService
  ) {}

  @Post()
  @FuncionalidadAuth('crear-venta')
  create(@Body() createVentaDto: CreateVentaDto) {
    return this.ventaService.create(createVentaDto);
  }

  @Get()
  @FuncionalidadAuth('obtener-ventas')
  findAll() {
    return this.ventaService.findAll();
  }

  @Get(':id')
  @FuncionalidadAuth('obtener-venta')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ventaService.findOne(id);
  }

  @Patch('estado/:id/:nuevoEstado')
  @FuncionalidadAuth('actualizar-estado-venta')
  updateEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('nuevoEstado') nuevoEstado: string
  ) {
    return this.ventaService.updateEstado(id, nuevoEstado);
  }

  @Post('comprar')
  @ClienteAuth()
  async realizarCompra(
    @GetCliente() cliente: Cliente,
    // @Body() createVentaDto: Omit<CreateVentaDto, 'clienteId'>
  ) {
    const carrito = await this.carritoService.obtenerCarrito(cliente.id);
  
    if (carrito.items.length === 0) {
      throw new Error('El carrito está vacío');
    }
  
    const detalles = carrito.items.map(item => ({
      productoVariedadId: item.productoVariedadId,
      cantidad: item.cantidad,
      precioUnitario: item.variedad.precio,
      descuentoLinea: 0
    }));

    const ventaCompleta: CreateVentaDto = {
      clienteId: cliente.id,
      detalles,
    };
  
    const venta = await this.ventaService.create(ventaCompleta);
  
    await this.carritoService.vaciarCarrito(cliente.id);
  
    return {
      ...venta,
      mensaje: 'Compra realizada exitosamente desde el carrito.'
    };
  }
}
