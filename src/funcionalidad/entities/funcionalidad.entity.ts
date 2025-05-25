
import { Column, Entity, PrimaryGeneratedColumn, ManyToMany, JoinColumn, ManyToOne } from 'typeorm';
import { Rol } from '../../rol/entities/rol.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

@Entity('funcionalidad')
export class Funcionalidad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @ManyToMany(() => Rol, (rol) => rol.funcionalidades)
  roles: Rol[];

  @Column()
  tenantId: string;
  
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}

