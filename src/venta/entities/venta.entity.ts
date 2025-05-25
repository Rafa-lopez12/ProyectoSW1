import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/auth.entity';
import { Cliente } from '../../cliente/entities/cliente.entity';
import { DetalleVenta } from './detalleVenta.entity';

@Entity('ventas')
export class Venta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User | null;

  @ManyToOne(() => Cliente, { eager: true })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente; 

  @CreateDateColumn()
  fechaVenta: Date;

  @Column('float')
  subtotal: number;

  @Column('float')
  total: number;

  @Column('text', { default: 'completada' })
  estado: string; // completada, cancelada, pendiente

  @Column('text', { nullable: true })
  observaciones: string;

  @OneToMany(() => DetalleVenta, detalleVenta => detalleVenta.venta, {
    cascade: true,
    eager: true
  })
  detalles: DetalleVenta[];
}
