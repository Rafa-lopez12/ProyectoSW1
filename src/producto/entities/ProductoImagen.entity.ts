import { 
    Entity, 
    Column, 
    PrimaryGeneratedColumn, 
    ManyToOne, 
    JoinColumn 
  } from 'typeorm';
  import { Producto } from './producto.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
  
  @Entity('product_images')
  export class ProductoImage {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    url: string;
  
    @ManyToOne(() => Producto, (product) => product.images, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    productId: Producto;

    @Column()
    tenantId: string;
    
    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;
  }