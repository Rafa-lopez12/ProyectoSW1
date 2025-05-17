import { 
    Entity, 
    Column, 
    PrimaryGeneratedColumn, 
    ManyToOne, 
    JoinColumn 
  } from 'typeorm';
  import { Producto } from './producto.entity';
  
  @Entity('product_images')
  export class ProductoImage {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    url: string;
  
    @ManyToOne(() => Producto, (product) => product.images, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    productId: Producto;
  }