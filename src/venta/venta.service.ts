import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { Venta } from './entities/venta.entity';
import { DetalleVenta } from './entities/detalleVenta.entity';
import { User } from '../auth/entities/auth.entity';
import { Cliente } from '../cliente/entities/cliente.entity';
import { ProductoVariedad } from '../producto/entities/productoVariedad.entity';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

@Injectable()
export class VentaService {
  constructor(
    @InjectRepository(Venta)
    private readonly ventaRepository: Repository<Venta>,
    
    @InjectRepository(DetalleVenta)
    private readonly detalleRepository: Repository<DetalleVenta>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    
    @InjectRepository(ProductoVariedad)
    private readonly productoVariedadRepository: Repository<ProductoVariedad>,
    
    private readonly dataSource: DataSource,
  ) {}

  async create(createVentaDto: CreateVentaDto) {
    try {
      const { usuarioId, clienteId, detalles, observaciones } = createVentaDto;

      // Buscar usuario y cliente
      let usuario: User | null = null;
      if (usuarioId) {
        usuario = await this.userRepository.findOne({ where: { id: usuarioId } });
        if (!usuario) {
          throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado`);
        }
      }


      const cliente = await this.clienteRepository.findOne({ where: { id: clienteId } });
      if (!cliente) {
        throw new NotFoundException(`Cliente con ID ${clienteId} no encontrado`);
      }

      // Verificar stock disponible antes de procesar la venta
      for (const detalleDto of detalles) {
        const productoVariedad = await this.productoVariedadRepository.findOne({
          where: { Id: detalleDto.productoVariedadId },
          relations: ['size', 'producto']
        });

        if (!productoVariedad) {
          throw new NotFoundException(`Variedad de producto con ID ${detalleDto.productoVariedadId} no encontrada`);
        }

        if (productoVariedad.quantity < detalleDto.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para ${productoVariedad.producto.name} talla ${productoVariedad.size.name}. ` +
            `Disponible: ${productoVariedad.quantity}, Solicitado: ${detalleDto.cantidad}`
          );
        }
      }

      // Usar transacción para asegurar que todo el proceso sea atómico
      return await this.dataSource.transaction(async manager => {
        // Calcular totales
        let subtotal = 0;
        const detallesCalculados = detalles.map(detalle => {
        
          const subtotalLinea = (detalle.cantidad * detalle.precioUnitario);
          subtotal += subtotalLinea;
          
          return {
            ...detalle,
            subtotal: subtotalLinea
          };
        });

        const total = subtotal

        // Crear la venta
        const venta = manager.create(Venta, {
          // usuario,
          cliente,
          subtotal,
          total,
          observaciones,
          estado: 'completada'
        });

        const savedVenta = await manager.save(Venta, venta);

        // Procesar cada detalle y actualizar stock
        for (let i = 0; i < detalles.length; i++) {
          const detalleDto = detalles[i];
          const detalleCalculado = detallesCalculados[i];

          // Buscar la variedad del producto dentro de la transacción
          const productoVariedad = await manager.findOne(ProductoVariedad, {
            where: { Id: detalleDto.productoVariedadId }
          });
          if (!productoVariedad) {
            throw new NotFoundException(`productoVariedad con id ${productoVariedad} no encontrado`);
          }



          // Crear el detalle de la venta
          const detalle = manager.create(DetalleVenta, {
            ventaId: savedVenta.id,
            productoVariedadId: productoVariedad.Id,
            venta: savedVenta,
            productoVariedad,
            cantidad: detalleDto.cantidad,
            precioUnitario: detalleDto.precioUnitario,
            subtotal: detalleCalculado.subtotal
          });

          await manager.save(DetalleVenta, detalle);

          // REDUCIR el stock de la variedad (diferencia clave con movimiento inventario)
          productoVariedad.quantity -= detalleDto.cantidad;
          await manager.save(ProductoVariedad, productoVariedad);
        }

        // Retornar datos básicos de la venta creada
        return {
          id: savedVenta.id,
          fechaVenta: savedVenta.fechaVenta,
          // usuario: { id: usuario.id, nombre: usuario.fullName },
          cliente: { id: cliente.id, nombre: cliente.fullName },
          subtotal: savedVenta.subtotal,
          total: savedVenta.total,
          estado: savedVenta.estado,
          cantidadItems: detalles.length,
          message: 'Venta registrada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error creating venta:', error);
      this.handleDBExceptions(error);
    }
  }

  async findAll() {
    const ventas = await this.ventaRepository.find({
      relations: [
        'usuario', 
        'cliente', 
        'detalles', 
        'detalles.productoVariedad', 
        'detalles.productoVariedad.size', 
        'detalles.productoVariedad.producto'
      ]
    });

    return ventas.map(venta => ({
      id: venta.id,
      fecha: venta.fechaVenta,
      //usuario: venta.usuario.fullName,
      cliente: venta.cliente.fullName,
      total: venta.total,
      estado: venta.estado,
      detalles: venta.detalles.map(detalle => ({
        nombreProducto: detalle.productoVariedad.producto.name,
        talla: detalle.productoVariedad.size.name,
        color: detalle.productoVariedad.color,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
      }))
    }));
  }

  async findOne(id: string) {
    const venta = await this.ventaRepository.findOne({
      where: { id },
      relations: [
        'usuario', 
        'cliente', 
        'detalles', 
        'detalles.productoVariedad', 
        'detalles.productoVariedad.size', 
        'detalles.productoVariedad.producto'
      ]
    });

    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    return {
      id: venta.id,
      fecha: venta.fechaVenta,
      subtotal: venta.subtotal,
 
      total: venta.total,
      estado: venta.estado,
      observaciones: venta.observaciones,
      //usuario: venta.usuario.fullName,
      cliente: venta.cliente.fullName,
      detalles: venta.detalles.map(detalle => ({
        nombreProducto: detalle.productoVariedad.producto.name,
        talla: detalle.productoVariedad.size.name,
        color: detalle.productoVariedad.color,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
      }))
    };
  }

  async updateEstado(id: string, nuevoEstado: string) {
    const venta = await this.ventaRepository.findOne({ where: { id } });
    
    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    venta.estado = nuevoEstado;
    await this.ventaRepository.save(venta);

    return { message: `Estado de venta actualizado a: ${nuevoEstado}` };
  }


  private handleDBExceptions(error: any) {
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error;
    }
    
    if (error.code === '23505') {
      throw new BadRequestException('Ya existe un detalle para esta combinación de venta y producto variedad');
    }
      
    console.error(error);
    throw new BadRequestException('Error inesperado, revisar logs del servidor');
  }
}
