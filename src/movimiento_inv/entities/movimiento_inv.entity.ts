import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/auth.entity';
import { Proveedor } from '../../proveedor/entities/proveedor.entity';
import { DetalleMov } from './detalle-mov.entity';

@Entity('movimiento_inventario')
export class MovimientoInv {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @ManyToOne(() => Proveedor, { eager: true })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Proveedor;

//   @ManyToOne(() => Sucursal, { eager: true })
//   @JoinColumn({ name: 'sucursal_id' })
//   sucursal: Sucursal;

  @Column('date')
  fechaRegistro: Date;

  @Column('float')
  montoTotal: number;

  @OneToMany(() => DetalleMov, detalleMov => detalleMov.movimientoInv, {
    cascade: true,
    eager: true
  })
  detalles: DetalleMov[];

  addDetalle(detalle: DetalleMov) {
    if (!this.detalles) this.detalles = [];
    this.detalles.push(detalle);
    detalle.movimientoInv = this;
  }
}
