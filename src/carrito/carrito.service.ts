import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Carrito } from './entities/carrito.entity';
import { Cliente } from '../cliente/entities/cliente.entity';
import { ProductoVariedad } from '../producto/entities/productoVariedad.entity';
import { AgregarCarritoDto } from './dto/create-carrito.dto';
import { ActualizarCantidadCarritoDto } from './dto/actualizar-cantidad-carrito.dto';
import { TenantBaseService } from '../common/services/tenant-base.service';

@Injectable()
export class CarritoService extends TenantBaseService<Carrito> {
  constructor(
    @InjectRepository(Carrito)
    private readonly carritoRepository: Repository<Carrito>,
    
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    
    @InjectRepository(ProductoVariedad)
    private readonly productoVariedadRepository: Repository<ProductoVariedad>,
  ) {
    super(carritoRepository);
  }

  async agregarAlCarrito(tenantId: string, clienteId: string, agregarCarritoDto: AgregarCarritoDto) {
    const { productoVariedadId, cantidad } = agregarCarritoDto;

    // Verificar que el cliente existe y pertenece al tenant
    const cliente = await this.clienteRepository.findOne({ 
      where: { id: clienteId, tenantId } 
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${clienteId} no encontrado en este tenant`);
    }

    // Verificar que la variedad del producto existe y pertenece al tenant
    const productoVariedad = await this.productoVariedadRepository.findOne({
      where: { Id: productoVariedadId, tenantId },
      relations: ['size', 'producto']
    });

    if (!productoVariedad) {
      throw new NotFoundException(`Variedad de producto con ID ${productoVariedadId} no encontrada en este tenant`);
    }

    if (productoVariedad.quantity < cantidad) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${productoVariedad.quantity}, Solicitado: ${cantidad}`
      );
    }

    // Verificar si el producto ya está en el carrito del cliente en este tenant
    const itemExistente = await this.carritoRepository.findOne({
      where: { clienteId, productoVariedadId, tenantId }
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
          color: productoVariedad.color,
          precioUnitario: productoVariedad.price,
          subtotal: itemExistente.cantidad * productoVariedad.price
        }
      };
    } else {
      // Si no existe, crear nuevo item en carrito
      const nuevoItem = this.carritoRepository.create({
        clienteId,
        productoVariedadId,
        cliente,
        productoVariedad,
        cantidad,
        tenantId
      });

      await this.carritoRepository.save(nuevoItem);

      return {
        message: 'Producto agregado al carrito',
        item: {
          productoVariedadId: nuevoItem.productoVariedadId,
          cantidad: nuevoItem.cantidad,
          producto: productoVariedad.producto.name,
          talla: productoVariedad.size.name,
          color: productoVariedad.color,
          precioUnitario: productoVariedad.price,
          subtotal: nuevoItem.cantidad * productoVariedad.price
        }
      };
    }
  }

  async obtenerCarrito(tenantId: string, clienteId: string) {
    // Verificar que el cliente pertenece al tenant
    const cliente = await this.clienteRepository.findOne({ 
      where: { id: clienteId, tenantId } 
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${clienteId} no encontrado en este tenant`);
    }

    const itemsCarrito = await this.carritoRepository.find({
      where: { clienteId, tenantId },
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
      tenantId,
      items,
      resumen: {
        totalItems,
        totalProductos: items.length,
        total: Math.round(total * 100) / 100
      }
    };
  }

  async actualizarCantidad(tenantId: string, clienteId: string, productoVariedadId: string, actualizarCantidadDto: ActualizarCantidadCarritoDto) {
    const { cantidad } = actualizarCantidadDto;

    // Verificar que el cliente pertenece al tenant
    const cliente = await this.clienteRepository.findOne({ 
      where: { id: clienteId, tenantId } 
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${clienteId} no encontrado en este tenant`);
    }

    const itemCarrito = await this.carritoRepository.findOne({
      where: { clienteId, productoVariedadId, tenantId },
      relations: ['productoVariedad', 'productoVariedad.size', 'productoVariedad.producto']
    });

    if (!itemCarrito) {
      throw new NotFoundException('Producto no encontrado en el carrito de este cliente');
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
        precioUnitario: itemCarrito.productoVariedad.price,
        subtotal: itemCarrito.cantidad * itemCarrito.productoVariedad.price
      }
    };
  }

  async removerProducto(tenantId: string, clienteId: string, productoVariedadId: string) {
    // Verificar que el cliente pertenece al tenant
    const cliente = await this.clienteRepository.findOne({ 
      where: { id: clienteId, tenantId } 
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${clienteId} no encontrado en este tenant`);
    }

    const result = await this.carritoRepository.delete({
      clienteId,
      productoVariedadId,
      tenantId
    });

    if (result.affected === 0) {
      throw new NotFoundException('Producto no encontrado en el carrito de este cliente');
    }

    return { message: 'Producto eliminado del carrito' };
  }

  async vaciarCarrito(tenantId: string, clienteId: string, productosComprados?: string[]) {
    // Verificar que el cliente pertenece al tenant
    const cliente = await this.clienteRepository.findOne({ 
      where: { id: clienteId, tenantId } 
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${clienteId} no encontrado en este tenant`);
    }

    if (productosComprados && productosComprados.length > 0) {
      // Eliminar solo los productos específicos que se compraron
      await this.carritoRepository.delete({
        clienteId,
        productoVariedadId: In(productosComprados),
        tenantId
      });

      return { 
        message: `${productosComprados.length} productos eliminados del carrito después de la compra`
      };
    } else {
      // Eliminar todo el carrito del cliente en este tenant
      const result = await this.carritoRepository.delete({ 
        clienteId, 
        tenantId 
      });
      
      return { 
        message: `Carrito vaciado. ${result.affected || 0} productos eliminados`
      };
    }
  }

  async contarItemsCarrito(tenantId: string, clienteId: string): Promise<number> {
    // Verificar que el cliente pertenece al tenant
    const cliente = await this.clienteRepository.findOne({ 
      where: { id: clienteId, tenantId } 
    });
    if (!cliente) {
      return 0;
    }

    return await this.carritoRepository.count({ 
      where: { clienteId, tenantId } 
    });
  }

  // Método para obtener solo los IDs de productos en el carrito (útil para vaciar después de compra)
  async obtenerProductosDelCarrito(tenantId: string, clienteId: string): Promise<string[]> {
    // Verificar que el cliente pertenece al tenant
    const cliente = await this.clienteRepository.findOne({ 
      where: { id: clienteId, tenantId } 
    });
    if (!cliente) {
      return [];
    }

    const items = await this.carritoRepository.find({
      where: { clienteId, tenantId },
      select: ['productoVariedadId']
    });

    return items.map(item => item.productoVariedadId);
  }

  // Métodos adicionales específicos para tenant
  async obtenerCarritosPorTenant(tenantId: string) {
    return this.carritoRepository
      .createQueryBuilder('carrito')
      .where('carrito.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('carrito.cliente', 'cliente')
      .leftJoinAndSelect('carrito.productoVariedad', 'productoVariedad')
      .leftJoinAndSelect('productoVariedad.producto', 'producto')
      .leftJoinAndSelect('productoVariedad.size', 'size')
      .getMany();
  }

  async obtenerEstadisticasCarritos(tenantId: string) {
    const result = await this.carritoRepository
      .createQueryBuilder('carrito')
      .select('COUNT(DISTINCT carrito.clienteId)', 'carritoActivos')
      .addSelect('COUNT(*)', 'totalItems')
      .addSelect('SUM(carrito.cantidad)', 'totalProductos')
      .where('carrito.tenantId = :tenantId', { tenantId })
      .getRawOne();

    return {
      carritoActivos: parseInt(result.carritoActivos) || 0,
      totalItems: parseInt(result.totalItems) || 0,
      totalProductos: parseInt(result.totalProductos) || 0,
      tenantId
    };
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException('Producto ya existe en el carrito');
    }
    
    console.error(error);
    throw new BadRequestException('Error inesperado, revisar logs del servidor');
  }
}