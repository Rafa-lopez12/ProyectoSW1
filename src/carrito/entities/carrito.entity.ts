import { Entity, ManyToOne, JoinColumn, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Cliente } from '../../cliente/entities/cliente.entity';
import { ProductoVariedad } from '../../producto/entities/productoVariedad.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

@Entity('carrito')
export class Carrito {
  @PrimaryColumn()
  clienteId: string;

  @PrimaryColumn()
  productoVariedadId: string;

  @ManyToOne(() => Cliente, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;

  @ManyToOne(() => ProductoVariedad, { eager: true })
  @JoinColumn({ name: 'productoVariedadId' })
  productoVariedad: ProductoVariedad;

  @Column('int')
  cantidad: number;

  @Column()
  tenantId: string;
  
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;


}
