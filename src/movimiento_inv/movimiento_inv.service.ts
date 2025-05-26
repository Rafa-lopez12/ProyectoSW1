import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovimientoInvDto } from './dto/create-movimiento_inv.dto';
import { UpdateMovimientoInvDto } from './dto/update-movimiento_inv.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/auth.entity';
import { ProductoVariedad } from 'src/producto/entities/productoVariedad.entity';
import { Proveedor } from 'src/proveedor/entities/proveedor.entity';
import { Repository, DataSource } from 'typeorm';
import { DetalleMov } from './entities/detalle_mov_inv.entity';
import { MovimientoInv } from './entities/movimiento_inv.entity';
import { TenantBaseService } from '../common/services/tenant-base.service';

@Injectable()
export class MovimientoInvService extends TenantBaseService<MovimientoInv> {
  
  constructor(
    @InjectRepository(MovimientoInv)
    private readonly movimientoRepository: Repository<MovimientoInv>,
    
    @InjectRepository(DetalleMov)
    private readonly detalleRepository: Repository<DetalleMov>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,
    
    @InjectRepository(ProductoVariedad)
    private readonly productoVariedadRepository: Repository<ProductoVariedad>,
    
    private readonly dataSource: DataSource,
  ) {
    super(movimientoRepository);
  }
  
  async create(tenantId: string, createMovimientoInvDto: CreateMovimientoInvDto) {
    const { usuarioId, proveedorId, detalles, fechaRegistro, montoTotal } = createMovimientoInvDto;
  
    // Verificar que el usuario pertenece al tenant
    const usuario = await this.userRepository.findOne({ 
      where: { id: usuarioId, tenantId } 
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado en este tenant`);
    }
  
    // Verificar que el proveedor pertenece al tenant
    const proveedor = await this.proveedorRepository.findOne({ 
      where: { id: proveedorId, tenantId } 
    });
    if (!proveedor) {
      throw new NotFoundException(`Proveedor con ID ${proveedorId} no encontrado en este tenant`);
    }
  
    return await this.dataSource.transaction(async manager => {
      // Crear movimiento con tenantId
      const movimiento = manager.create(MovimientoInv, {
        usuario,
        proveedor,
        fechaRegistro: fechaRegistro ? new Date(fechaRegistro) : new Date(),
        montoTotal,
        tenantId
      });
  
      const savedMovimiento = await manager.save(MovimientoInv, movimiento);
      console.log('Movimiento guardado:', savedMovimiento);
  
      for (const detalleDto of detalles) {
        // Verificar que la variedad del producto pertenece al tenant
        const productoVariedad = await manager.findOne(ProductoVariedad, {
          where: { Id: detalleDto.productoVariedadId, tenantId },
          relations: ['size', 'producto']
        });
      
        if (!productoVariedad) {
          throw new NotFoundException(
            `Variedad de producto con ID ${detalleDto.productoVariedadId} no encontrada en este tenant`
          );
        }
      
        const detalle = manager.create(DetalleMov, {
          movimientoId: savedMovimiento.id,
          productoVariedadId: productoVariedad.Id,
          movimientoInv: savedMovimiento,
          productoVariedad,
          cantidad: detalleDto.cantidad,
          precio: detalleDto.precio,
          tenantId
        });
      
        await manager.save(DetalleMov, detalle);
        
        // Incrementar stock
        productoVariedad.quantity += detalleDto.cantidad;
        await manager.save(ProductoVariedad, productoVariedad);
      }
  
      return {
        id: savedMovimiento.id,
        usuario: {
          id: usuario.id,
          fullName: usuario.fullName
        },
        proveedor: {
          id: proveedor.id,
          nombre: proveedor.nombre
        },
        fechaRegistro: savedMovimiento.fechaRegistro,
        montoTotal: savedMovimiento.montoTotal,
        cantidadDetalles: detalles.length,
        message: 'Movimiento de inventario creado exitosamente'
      };
    });
  }

  async findAll(tenantId: string) {
    const movimientos = await this.movimientoRepository.find({
      where: { tenantId },
      relations: [
        'usuario', 
        'proveedor', 
        'detalles', 
        'detalles.productoVariedad', 
        'detalles.productoVariedad.size', 
        'detalles.productoVariedad.producto'
      ]
    });
  
    return movimientos.map(movimiento => ({
      id: movimiento.id,
      fecha: movimiento.fechaRegistro,
      montoTotal: movimiento.montoTotal,
      usuario: movimiento.usuario.fullName,
      proveedor: movimiento.proveedor.nombre,
      detalles: movimiento.detalles.map(detalle => ({
        producto: detalle.productoVariedad.producto.name,
        talla: detalle.productoVariedad.size.name,
        color: detalle.productoVariedad.color,
        precio: detalle.precio,
        cantidad: detalle.cantidad
      }))
    }));
  }

  async findOne(tenantId: string, id: string) {
    const movimiento = await this.movimientoRepository.findOne({
      where: { id, tenantId },
      relations: [
        'usuario', 
        'proveedor', 
        'detalles', 
        'detalles.productoVariedad', 
        'detalles.productoVariedad.size', 
        'detalles.productoVariedad.producto'
      ]
    });
  
    if (!movimiento) {
      throw new NotFoundException(`Movimiento con ID ${id} no encontrado en este tenant`);
    }
  
    return {
      id: movimiento.id,
      fecha: movimiento.fechaRegistro,
      montoTotal: movimiento.montoTotal,
      usuario: movimiento.usuario.fullName,
      proveedor: movimiento.proveedor.nombre,
      detalles: movimiento.detalles.map(detalle => ({
        producto: detalle.productoVariedad.producto.name,
        talla: detalle.productoVariedad.size.name,
        color: detalle.productoVariedad.color,
        precio: detalle.precio,
        cantidad: detalle.cantidad
      }))
    };
  }

  // Métodos adicionales específicos para tenant
  async findByProveedor(tenantId: string, proveedorId: string) {
    return this.movimientoRepository.find({
      where: { 
        tenantId,
        proveedor: { id: proveedorId }
      },
      relations: ['usuario', 'proveedor', 'detalles']
    });
  }

  async findByUsuario(tenantId: string, usuarioId: string) {
    return this.movimientoRepository.find({
      where: { 
        tenantId,
        usuario: { id: usuarioId }
      },
      relations: ['usuario', 'proveedor', 'detalles']
    });
  }

  async findByDateRange(tenantId: string, fechaInicio: Date, fechaFin: Date) {
    return this.movimientoRepository
      .createQueryBuilder('movimiento')
      .where('movimiento.tenantId = :tenantId', { tenantId })
      .andWhere('movimiento.fechaRegistro BETWEEN :fechaInicio AND :fechaFin', {
        fechaInicio,
        fechaFin
      })
      .leftJoinAndSelect('movimiento.usuario', 'usuario')
      .leftJoinAndSelect('movimiento.proveedor', 'proveedor')
      .leftJoinAndSelect('movimiento.detalles', 'detalles')
      .getMany();
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505')
      throw new BadRequestException(error.detail);
      
    console.error(error);
    throw new BadRequestException('Error inesperado, revisar logs del servidor');
  }
}
