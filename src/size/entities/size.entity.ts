import { 
    Entity, 
    Column, 
    PrimaryGeneratedColumn,
    OneToMany,
    JoinColumn,
    ManyToOne
  } from 'typeorm';
  import { ProductoVariedad } from '../../producto/entities/productoVariedad.entity'; 
import { Tenant } from 'src/tenant/entities/tenant.entity';
  
  @Entity('sizes')
  export class Size {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column('text', { unique: true })
    name: string;

    @Column()
    tenantId: string;
    
    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;
  
    @OneToMany(() => ProductoVariedad, (productoVariedad) => productoVariedad.size)
    productoVariedades: ProductoVariedad[];
  }