import { Column, Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { Funcionalidad } from '../../funcionalidad/entities/funcionalidad.entity';
import { User } from '../../auth/entities/auth.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

@Entity('rol')
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column()
  tenantId: string;
  
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @OneToMany(() => User, (user) => user.rol)
  user: User;

  @ManyToMany(() => Funcionalidad, (funcionalidad) => funcionalidad.roles, { cascade: true })
  @JoinTable() // Necesario para definir la tabla intermedia
  funcionalidades: Funcionalidad[];
}
