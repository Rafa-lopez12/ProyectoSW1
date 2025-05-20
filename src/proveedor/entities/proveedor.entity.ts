import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

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

  @OneToMany(() => MovimientoInv, movimiento => movimiento.proveedor)
  movimientos: MovimientoInv[];
}


