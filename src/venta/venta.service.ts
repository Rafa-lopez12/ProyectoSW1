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
import { TenantBaseService } from '../common/services/tenant-base.service';

@Injectable()
export class VentaService extends TenantBaseService<Venta> {
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
  ) {
    super(ventaRepository);
  }

  async create(tenantId: string, createVentaDto: CreateVentaDto) {
    try {
      const { usuarioId, clienteId, detalles, observaciones } = createVentaDto;

      // Buscar usuario (opcional, puede ser venta de autoservicio)
      let usuario: User | null = null;
      if (usuarioId) {
        usuario = await this.userRepository.findOne({ 
          where: { id: usuarioId, tenantId } 
        });
        if (!usuario) {
          throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado en este tenant`);
        }
      }

      // Buscar cliente (debe pertenecer al tenant)
      const cliente = await this.clienteRepository.findOne({ 
        where: { id: clienteId, tenantId } 
      });
      if (!cliente) {
        throw new NotFoundException(`Cliente con ID ${clienteId} no encontrado en este tenant`);
      }

      // Verificar stock disponible antes de procesar la venta
      for (const detalleDto of detalles) {
        const productoVariedad = await this.productoVariedadRepository.findOne({
          where: { Id: detalleDto.productoVariedadId, tenantId },
          relations: ['size', 'producto']
        });

        if (!productoVariedad) {
          throw new NotFoundException(
            `Variedad de producto con ID ${detalleDto.productoVariedadId} no encontrada en este tenant`
          );
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

        const total = subtotal;

        // Crear la venta con tenantId
        const venta = manager.create(Venta, {
          usuario,
          cliente,
          subtotal,
          total,
          observaciones,
          estado: 'completada',
          tenantId
        });

        const savedVenta = await manager.save(Venta, venta);

        // Procesar cada detalle y actualizar stock
        for (let i = 0; i < detalles.length; i++) {
          const detalleDto = detalles[i];
          const detalleCalculado = detallesCalculados[i];

          // Buscar la variedad del producto dentro de la transacción
          const productoVariedad = await manager.findOne(ProductoVariedad, {
            where: { Id: detalleDto.productoVariedadId, tenantId }
          });
          
          if (!productoVariedad) {
            throw new NotFoundException(`ProductoVariedad con ID ${detalleDto.productoVariedadId} no encontrado`);
          }

          // Crear el detalle de la venta con tenantId
          const detalle = manager.create(DetalleVenta, {
            ventaId: savedVenta.id,
            productoVariedadId: productoVariedad.Id,
            venta: savedVenta,
            productoVariedad,
            cantidad: detalleDto.cantidad,
            precioUnitario: detalleDto.precioUnitario,
            tenantId
          });

          await manager.save(DetalleVenta, detalle);

          // REDUCIR el stock de la variedad
          productoVariedad.quantity -= detalleDto.cantidad;
          await manager.save(ProductoVariedad, productoVariedad);
        }

        // Retornar datos básicos de la venta creada
        return {
          id: savedVenta.id,
          fechaVenta: savedVenta.fechaVenta,
          usuario: usuario ? { id: usuario.id, nombre: usuario.fullName } : null,
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

  async findAll(tenantId: string) {
    const ventas = await this.ventaRepository.find({
      where: { tenantId },
      relations: [
        'usuario', 
        'cliente', 
        'detalles', 
        'detalles.productoVariedad', 
        'detalles.productoVariedad.size', 
        'detalles.productoVariedad.producto'
      ],
      order: { fechaVenta: 'DESC' }
    });

    return ventas.map(venta => ({
      id: venta.id,
      fecha: venta.fechaVenta,
      usuario: venta.usuario ? venta.usuario.fullName : 'Autoservicio',
      cliente: venta.cliente.fullName,
      total: venta.total,
      estado: venta.estado,
      cantidadItems: venta.detalles.length,
      detalles: venta.detalles.map(detalle => ({
        nombreProducto: detalle.productoVariedad.producto.name,
        talla: detalle.productoVariedad.size.name,
        color: detalle.productoVariedad.color,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
        subtotal: detalle.cantidad * detalle.precioUnitario
      }))
    }));
  }

  async findOne(tenantId: string, id: string) {
    const venta = await this.ventaRepository.findOne({
      where: { id, tenantId },
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
      throw new NotFoundException(`Venta con ID ${id} no encontrada en este tenant`);
    }

    return {
      id: venta.id,
      fecha: venta.fechaVenta,
      subtotal: venta.subtotal,
      total: venta.total,
      estado: venta.estado,
      observaciones: venta.observaciones,
      usuario: venta.usuario ? venta.usuario.fullName : 'Autoservicio',
      cliente: {
        id: venta.cliente.id,
        nombre: venta.cliente.fullName,
        email: venta.cliente.email
      },
      detalles: venta.detalles.map(detalle => ({
        productoVariedadId: detalle.productoVariedadId,
        nombreProducto: detalle.productoVariedad.producto.name,
        talla: detalle.productoVariedad.size.name,
        color: detalle.productoVariedad.color,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
        subtotal: detalle.cantidad * detalle.precioUnitario
      }))
    };
  }

  async updateEstado(tenantId: string, id: string, nuevoEstado: string) {
    const venta = await this.ventaRepository.findOne({ 
      where: { id, tenantId } 
    });
    
    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada en este tenant`);
    }

    venta.estado = nuevoEstado;
    await this.ventaRepository.save(venta);

    return { 
      message: `Estado de venta actualizado a: ${nuevoEstado}`,
      venta: {
        id: venta.id,
        estado: venta.estado,
        fechaVenta: venta.fechaVenta
      }
    };
  }

  // Métodos adicionales específicos para tenant
  async findByCliente(tenantId: string, clienteId: string) {
    return this.ventaRepository.find({
      where: { 
        tenantId,
        cliente: { id: clienteId }
      },
      relations: ['usuario', 'cliente', 'detalles'],
      order: { fechaVenta: 'DESC' }
    });
  }

  async findByUsuario(tenantId: string, usuarioId: string) {
    return this.ventaRepository.find({
      where: { 
        tenantId,
        usuario: { id: usuarioId }
      },
      relations: ['usuario', 'cliente', 'detalles'],
      order: { fechaVenta: 'DESC' }
    });
  }

  async findByDateRange(tenantId: string, fechaInicio: Date, fechaFin: Date) {
    return this.ventaRepository
      .createQueryBuilder('venta')
      .where('venta.tenantId = :tenantId', { tenantId })
      .andWhere('venta.fechaVenta BETWEEN :fechaInicio AND :fechaFin', {
        fechaInicio,
        fechaFin
      })
      .leftJoinAndSelect('venta.usuario', 'usuario')
      .leftJoinAndSelect('venta.cliente', 'cliente')
      .leftJoinAndSelect('venta.detalles', 'detalles')
      .leftJoinAndSelect('detalles.productoVariedad', 'productoVariedad')
      .leftJoinAndSelect('productoVariedad.producto', 'producto')
      .leftJoinAndSelect('productoVariedad.size', 'size')
      .orderBy('venta.fechaVenta', 'DESC')
      .getMany();
  }

  async getVentasResumen(tenantId: string, fechaInicio?: Date, fechaFin?: Date) {
    let query = this.ventaRepository
      .createQueryBuilder('venta')
      .where('venta.tenantId = :tenantId', { tenantId })
      .andWhere('venta.estado = :estado', { estado: 'completada' });

    if (fechaInicio && fechaFin) {
      query = query.andWhere('venta.fechaVenta BETWEEN :fechaInicio AND :fechaFin', {
        fechaInicio,
        fechaFin
      });
    }

    const ventas = await query.getMany();

    const totalVentas = ventas.length;
    const montoTotal = ventas.reduce((sum, venta) => sum + venta.total, 0);
    const promedioVenta = totalVentas > 0 ? montoTotal / totalVentas : 0;

    return {
      totalVentas,
      montoTotal,
      promedioVenta: Math.round(promedioVenta * 100) / 100,
      periodo: fechaInicio && fechaFin ? 
        `${fechaInicio.toISOString().split('T')[0]} a ${fechaFin.toISOString().split('T')[0]}` : 
        'Histórico'
    };
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