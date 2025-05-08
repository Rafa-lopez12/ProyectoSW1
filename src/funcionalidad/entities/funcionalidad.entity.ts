
import { Column, Entity, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { Rol } from '../../rol/entities/rol.entity';

@Entity('funcionalidad')
export class Funcionalidad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @ManyToMany(() => Rol, (rol) => rol.funcionalidades)
  roles: Rol[];
}

