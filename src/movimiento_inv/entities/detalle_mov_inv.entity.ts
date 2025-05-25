import { Entity, ManyToOne, JoinColumn, Column, PrimaryColumn } from 'typeorm';
import { MovimientoInv } from './movimiento_inv.entity'; 
import { ProductoVariedad } from '../../producto/entities/productoVariedad.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

@Entity('detalle_movimiento')
export class DetalleMov {
  @PrimaryColumn()
  movimientoId: string;

  @PrimaryColumn()
  productoVariedadId: string;

  @ManyToOne(() => MovimientoInv, movimientoInv => movimientoInv.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movimientoid' })
  movimientoInv: MovimientoInv;

  @ManyToOne(() => ProductoVariedad, { eager: true })
  @JoinColumn({ name: 'productoVariedadId' })
  productoVariedad: ProductoVariedad;

  @Column()
  tenantId: string;
  
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column('int')
  cantidad: number;

  @Column('float')
  precio: number;
}