import { Entity, ManyToOne, JoinColumn, Column, PrimaryColumn } from 'typeorm';
import { Venta } from './venta.entity'; 
import { ProductoVariedad } from '../../producto/entities/productoVariedad.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

@Entity('detalle_venta')
export class DetalleVenta {
  @PrimaryColumn()
  ventaId: string;

  @PrimaryColumn()
  productoVariedadId: string;

  @ManyToOne(() => Venta, venta => venta.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ventaId' })
  venta: Venta;

  @Column()
  tenantId: string;
  
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => ProductoVariedad, { eager: true })
  @JoinColumn({ name: 'productoVariedadId' })
  productoVariedad: ProductoVariedad;

  @Column('int')
  cantidad: number;

  @Column('float')
  precioUnitario: number;

//   @Column('float', { default: 0 })
//   descuentoLinea: number; // Descuento específico para esta línea

//   @Column('float')
//   subtotal: number; // cantidad * precioUnitario - descuentoLinea
}