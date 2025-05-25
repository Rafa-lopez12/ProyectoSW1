import { Tenant } from '../../tenant/entities/tenant.entity';
import { MovimientoInv } from '../../movimiento_inv/entities/movimiento_inv.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, ManyToOne } from 'typeorm';

@Entity('proveedor')
export class Proveedor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: true })
  nombre: string;

  @Column('text', { nullable: true })
  telefono: string;

  @Column('text', { nullable: true })
  email: string;
  
  @Column('text', { nullable: true })
  direccion: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  tenantId: string;
  
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @OneToMany(() => MovimientoInv, movimiento => movimiento.proveedor)
  movimientos: MovimientoInv[];
}


