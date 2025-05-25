import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Carrito } from './entities/carrito.entity';
import { Cliente } from '../cliente/entities/cliente.entity';
import { ProductoVariedad } from '../producto/entities/productoVariedad.entity';
import { AgregarCarritoDto } from './dto/create-carrito.dto';
import { ActualizarCantidadCarritoDto } from './dto/actualizar-cantidad-carrito.dto';

@Injectable()
export class CarritoService {
  constructor(
    @InjectRepository(Carrito)
    private readonly carritoRepository: Repository<Carrito>,
    
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    
    @InjectRepository(ProductoVariedad)
    private readonly productoVariedadRepository: Repository<ProductoVariedad>,
  ) {}

  async agregarAlCarrito(clienteId: string, agregarCarritoDto: AgregarCarritoDto) {
    const { productoVariedadId, cantidad } = agregarCarritoDto;

    // Verificar que el cliente existe
    const cliente = await this.clienteRepository.findOne({ where: { id: clienteId } });
    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${clienteId} no encontrado`);
    }

    // Verificar que la variedad del producto existe y tiene stock
    const productoVariedad = await this.productoVariedadRepository.findOne({
      where: { Id: productoVariedadId },
      relations: ['size', 'producto']
    });

    if (!productoVariedad) {
      throw new NotFoundException(`Variedad de producto con ID ${productoVariedadId} no encontrada`);
    }

    if (productoVariedad.quantity < cantidad) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${productoVariedad.quantity}, Solicitado: ${cantidad}`
      );
    }

    // Verificar si el producto ya está en el carrito
    const itemExistente = await this.carritoRepository.findOne({
      where: { clienteId, productoVariedadId }
    });

    if (itemExistente) {
      // Si ya existe, actualizar la cantidad
      const nuevaCantidad = itemExistente.cantidad + cantidad;
      
      // Verificar que no exceda el stock disponible
      if (productoVariedad.quantity < nuevaCantidad) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${productoVariedad.quantity}, Total en carrito sería: ${nuevaCantidad}`
        );
      }

      itemExistente.cantidad = nuevaCantidad;
      await this.carritoRepository.save(itemExistente);

      return {
        message: 'Cantidad actualizada en el carrito',
        item: {
          productoVariedadId: itemExistente.productoVariedadId,
          cantidad: itemExistente.cantidad,
          producto: productoVariedad.producto.name,
          talla: productoVariedad.size.name,
          color: productoVariedad.color
        }
      };
    } else {
      // Si no existe, crear nuevo item en carrito
      const nuevoItem = this.carritoRepository.create({
        clienteId,
        productoVariedadId,
        cliente,
        productoVariedad,
        cantidad
      });

      await this.carritoRepository.save(nuevoItem);

      return {
        message: 'Producto agregado al carrito',
        item: {
          productoVariedadId: nuevoItem.productoVariedadId,
          cantidad: nuevoItem.cantidad,
          producto: productoVariedad.producto.name,
          talla: productoVariedad.size.name,
          color: productoVariedad.color
        }
      };
    }
  }

  async obtenerCarrito(clienteId: string) {
    const itemsCarrito = await this.carritoRepository.find({
      where: { clienteId },
      relations: ['productoVariedad', 'productoVariedad.size', 'productoVariedad.producto'],
    });

    const items = itemsCarrito.map(item => ({
      productoVariedadId: item.productoVariedadId,
      producto: {
        id: item.productoVariedad.producto.id,
        nombre: item.productoVariedad.producto.name,
        descripcion: item.productoVariedad.producto.description
      },
      variedad: {
        talla: item.productoVariedad.size.name,
        color: item.productoVariedad.color,
        precio: item.productoVariedad.price,
        stockDisponible: item.productoVariedad.quantity
      },
      cantidad: item.cantidad,
      subtotal: item.cantidad * item.productoVariedad.price,
    }));

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

    return {
      clienteId,
      items,
      resumen: {
        totalItems,
        totalProductos: items.length,
        total
      }
    };
  }

  async actualizarCantidad(clienteId: string, productoVariedadId: string, actualizarCantidadDto: ActualizarCantidadCarritoDto) {
    const { cantidad } = actualizarCantidadDto;

    const itemCarrito = await this.carritoRepository.findOne({
      where: { clienteId, productoVariedadId },
      relations: ['productoVariedad', 'productoVariedad.size', 'productoVariedad.producto']
    });

    if (!itemCarrito) {
      throw new NotFoundException('Producto no encontrado en el carrito');
    }

    // Verificar stock disponible
    if (itemCarrito.productoVariedad.quantity < cantidad) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${itemCarrito.productoVariedad.quantity}, Solicitado: ${cantidad}`
      );
    }

    itemCarrito.cantidad = cantidad;
    await this.carritoRepository.save(itemCarrito);

    return {
      message: 'Cantidad actualizada',
      item: {
        productoVariedadId: itemCarrito.productoVariedadId,
        cantidad: itemCarrito.cantidad,
        producto: itemCarrito.productoVariedad.producto.name,
        talla: itemCarrito.productoVariedad.size.name,
        color: itemCarrito.productoVariedad.color,
        subtotal: itemCarrito.cantidad * itemCarrito.productoVariedad.price
      }
    };
  }

  async removerProducto(clienteId: string, productoVariedadId: string) {
    const result = await this.carritoRepository.delete({
      clienteId,
      productoVariedadId
    });

    if (result.affected === 0) {
      throw new NotFoundException('Producto no encontrado en el carrito');
    }

    return { message: 'Producto eliminado del carrito' };
  }

  async vaciarCarrito(clienteId: string, productosComprados?: string[]) {
    if (productosComprados && productosComprados.length > 0) {
      // Eliminar solo los productos específicos que se compraron
      await this.carritoRepository.delete({
        clienteId,
        productoVariedadId: In(productosComprados)
      });

      return { 
        message: `${productosComprados.length} productos eliminados del carrito después de la compra`
      };
    } else {
      // Eliminar todo el carrito
      const result = await this.carritoRepository.delete({ clienteId });
      
      return { 
        message: `Carrito vaciado. ${result.affected || 0} productos eliminados`
      };
    }
  }

  async contarItemsCarrito(clienteId: string): Promise<number> {
    return await this.carritoRepository.count({ where: { clienteId } });
  }

  // Método para obtener solo los IDs de productos en el carrito (útil para vaciar después de compra)
  async obtenerProductosDelCarrito(clienteId: string): Promise<string[]> {
    const items = await this.carritoRepository.find({
      where: { clienteId },
      select: ['productoVariedadId']
    });

    return items.map(item => item.productoVariedadId);
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException('Producto ya existe en el carrito');
    }
    
    console.error(error);
    throw new BadRequestException('Error inesperado, revisar logs del servidor');
  }
}