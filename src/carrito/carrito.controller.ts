import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { CarritoService } from './carrito.service';
import { AgregarCarritoDto } from './dto/create-carrito.dto';
import { ActualizarCantidadCarritoDto } from './dto/actualizar-cantidad-carrito.dto';
import { ClienteAuth } from '../cliente/decorators/cliente-auth.decorator';
import { GetCliente } from '../cliente/decorators/get-cliente.decorator';
import { Cliente } from '../cliente/entities/cliente.entity';

@Controller('carrito')
export class CarritoController {
  constructor(private readonly carritoService: CarritoService) {}

  @Post('agregar')
  @ClienteAuth()
  agregarAlCarrito(
    @GetCliente() cliente: Cliente,
    @Body() agregarCarritoDto: AgregarCarritoDto
  ) {
    return this.carritoService.agregarAlCarrito(cliente.id, agregarCarritoDto);
  }

  @Get()
  @ClienteAuth()
  obtenerCarrito(@GetCliente() cliente: Cliente) {
    return this.carritoService.obtenerCarrito(cliente.id);
  }

  @Get('contador')
  @ClienteAuth()
  contarItems(@GetCliente() cliente: Cliente) {
    return this.carritoService.contarItemsCarrito(cliente.id);
  }

  @Patch('cantidad/:productoVariedadId')
  @ClienteAuth()
  actualizarCantidad(
    @GetCliente() cliente: Cliente,
    @Param('productoVariedadId', ParseUUIDPipe) productoVariedadId: string,
    @Body() actualizarCantidadDto: ActualizarCantidadCarritoDto
  ) {
    return this.carritoService.actualizarCantidad(cliente.id, productoVariedadId, actualizarCantidadDto);
  }

  @Delete('producto/:productoVariedadId')
  @ClienteAuth()
  removerProducto(
    @GetCliente() cliente: Cliente,
    @Param('productoVariedadId', ParseUUIDPipe) productoVariedadId: string
  ) {
    return this.carritoService.removerProducto(cliente.id, productoVariedadId);
  }

  @Delete('vaciar')
  @ClienteAuth()
  vaciarCarrito(@GetCliente() cliente: Cliente) {
    return this.carritoService.vaciarCarrito(cliente.id);
  }
}