import { 
    Entity, 
    Column, 
    ManyToOne, 
    JoinColumn,
    PrimaryGeneratedColumn
  } from 'typeorm';
  import { Producto } from './producto.entity';
import { Size } from '../../size/entities/size.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';

  
  @Entity('product_sizes')
  export class ProductoVariedad {
    @PrimaryGeneratedColumn('uuid')
    Id: string;
  
    @Column('text')
    color: string;
  
    @Column('int')
    quantity: number;
  
    @Column('float')
    price: number;
  
    @ManyToOne(() => Producto, (product) => product.productoVariedad, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'productId' })
    producto: Producto;

    @Column()
    tenantId: string;
    
    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;

    @ManyToOne(() => Size, (size) => size.productoVariedades, { eager: true })
    @JoinColumn({ name: 'sizeId' })
    size: Size;

  
    // @ManyToOne(() => Size, (size) => size.productSizes, { eager: true })
    // @JoinColumn({ name: 'sizeId' })
    // size: Size;
  
    // @ManyToOne(() => Color, (color) => color.productSizes, { eager: true })
    // @JoinColumn({ name: 'colorId' })
    // color: Color;
  }