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

@Injectable()
export class MovimientoInvService {
  
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
  ) {}
  
  
  async create(createMovimientoInvDto: CreateMovimientoInvDto) {
    const { usuarioId, proveedorId, detalles, fechaRegistro, montoTotal } = createMovimientoInvDto;
  
    const usuario = await this.userRepository.findOne({ where: { id: usuarioId } });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado`);
    }
  
    const proveedor = await this.proveedorRepository.findOne({ where: { id: proveedorId } });
    if (!proveedor) {
      throw new NotFoundException(`Proveedor con ID ${proveedorId} no encontrado`);
    }
  
    return await this.dataSource.transaction(async manager => {
      const movimiento = manager.create(MovimientoInv, {
        usuario,
        proveedor,
        fechaRegistro: fechaRegistro ? new Date(fechaRegistro) : new Date(),
        montoTotal,
      });
  
      const savedMovimiento = await manager.save(MovimientoInv, movimiento);
      console.log('Movimiento guardado:', savedMovimiento);
  
      for (const detalleDto of detalles) {
        const productoVariedad = await manager.findOne(ProductoVariedad, {
          where: { Id: detalleDto.productoVariedadId },
          relations: ['size', 'producto']
        });
      
        if (!productoVariedad) {
          throw new NotFoundException(`Variedad de producto con ID ${detalleDto.productoVariedadId} no encontrada`);
        }
      
        const detalle = manager.create(DetalleMov, {
          movimientoId: savedMovimiento.id,
          productoVariedadId: productoVariedad.Id,
          movimientoInv: savedMovimiento,
          productoVariedad,
          cantidad: detalleDto.cantidad,
          precio: detalleDto.precio
        });
      
        await manager.save(DetalleMov, detalle);
        productoVariedad.quantity += detalleDto.cantidad;
        await manager.save(ProductoVariedad, productoVariedad);
      
      }
  
      // Retornar datos simples en lugar de llamar findOne
      return {
        // id: savedMovimiento.id,
        // usuario: {
        //   id: usuario.id,
        //   fullName: usuario.fullName
        // },
        // proveedor: {
        //   id: proveedor.id,
        //   nombre: proveedor.nombre
        // },
        // fechaRegistro: savedMovimiento.fechaRegistro,
        // montoTotal: savedMovimiento.montoTotal,
        // cantidadDetalles: detalles.length,
        message: 'Movimiento de inventario creado exitosamente'
      };
    });
  }

  async findAll() {
    const movimientos = await this.movimientoRepository.find({
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

  async findOne(id: string) {
    const movimiento = await this.movimientoRepository.findOne({
      where: { id },
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
      throw new NotFoundException(`Movimiento con ID ${id} no encontrado`);
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


  private handleDBExceptions(error: any) {
    if (error.code === '23505')
      throw new BadRequestException(error.detail);
      
    console.error(error);
    throw new BadRequestException('Error inesperado, revisar logs del servidor');
  }

}
