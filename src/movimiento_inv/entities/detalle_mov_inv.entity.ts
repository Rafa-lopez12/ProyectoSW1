import { Entity, ManyToOne, JoinColumn, Column, PrimaryGeneratedColumn } from 'typeorm';
import { MovimientoInv } from './movimiento_inv.entity'; 
import { Producto } from '../../producto/entities/producto.entity';
import { ProductoVariedad } from '../../producto/entities/productoVariedad.entity';

@Entity('detalle_movimiento')
export class DetalleMov {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MovimientoInv, movimientoInv => movimientoInv.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movimiento_id' })
  movimientoInv: MovimientoInv;

  @ManyToOne(() => ProductoVariedad, { eager: true })
  @JoinColumn({ name: 'producto_variedad_id' })
  productoVariedad: ProductoVariedad;

  @Column('int')
  cantidad: number;

  @Column('float')
  precio: number;
}