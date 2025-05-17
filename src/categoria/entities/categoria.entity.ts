import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Producto } from '../../producto/entities/producto.entity';

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

  @OneToMany(() => Producto, (product) => product.category)
  productos: Producto[];
}
