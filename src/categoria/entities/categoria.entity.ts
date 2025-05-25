import { Column, Entity, PrimaryGeneratedColumn, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { Producto } from '../../producto/entities/producto.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

@Entity('categoria')
export class Categoria {
  
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  name: string;


  @Column('simple-array', { nullable: true })
  subcategories: string[];

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @OneToMany(() => Producto, (product) => product.category)
  productos: Producto[];
}
