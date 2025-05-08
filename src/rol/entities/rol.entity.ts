import { Column, Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Funcionalidad } from '../../funcionalidad/entities/funcionalidad.entity';
import { User } from '../../auth/entities/auth.entity';

@Entity('rol')
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string;

  @OneToMany(() => User, (user) => user.rol)
  user: User;

  @ManyToMany(() => Funcionalidad, (funcionalidad) => funcionalidad.roles, { cascade: true })
  @JoinTable() // Necesario para definir la tabla intermedia
  funcionalidades: Funcionalidad[];
}
