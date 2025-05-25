import { 
    Entity, 
    Column, 
    PrimaryGeneratedColumn,
    OneToMany
  } from 'typeorm';
  import { ProductoVariedad } from '../../producto/entities/productoVariedad.entity'; 
  
  @Entity('sizes')
  export class Size {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column('text', { unique: true })
    name: string;
  
    @OneToMany(() => ProductoVariedad, (productoVariedad) => productoVariedad.size)
    productoVariedades: ProductoVariedad[];
  }