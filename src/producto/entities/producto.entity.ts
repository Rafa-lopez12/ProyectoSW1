import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Categoria } from '../../categoria/entities/categoria.entity';
import { ProductoVariedad } from "./productoVariedad.entity";
import { ProductoImage } from "./ProductoImagen.entity";
import { Tenant } from "../../tenant/entities/tenant.entity";


@Entity('producto')
export class Producto {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    name: string;
  
    @Column('text', { nullable: true })
    description: string;
  
    @Column()
    subcategory: string;
  
    @Column('boolean', { default: true })
    isActive: boolean;
    
    @ManyToOne(() => Categoria, (category) => category.productos)
    @JoinColumn({ name: 'category_id' })
    category: Categoria;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;
    
    @OneToMany(() => ProductoVariedad, (productSize) => productSize.producto, { cascade: true })
    productoVariedad: ProductoVariedad[];
  
    @OneToMany(() => ProductoImage, (productImage) => productImage.productId, { cascade: true })
    images: ProductoImage[];
}
