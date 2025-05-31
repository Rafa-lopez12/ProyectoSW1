import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToOne, 
    JoinColumn, 
    CreateDateColumn, 
    UpdateDateColumn 
  } from 'typeorm';
  import { Cliente } from '../../cliente/entities/cliente.entity';
  import { Producto } from '../../producto/entities/producto.entity';
  import { Tenant } from '../../tenant/entities/tenant.entity';
  
  @Entity('virtual_tryon_sessions')
  export class VirtualTryonSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    userImageUrl: string;
  
    @Column()
    garmentImageUrl: string;
  
    @Column({ nullable: true })
    resultImageUrl: string;
  
    @Column({ nullable: true })
    replicateId: string;
  
    @Column({ 
      type: 'enum',
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    })
    status: string;
  
    @Column({ nullable: true })
    errorMessage: string;
  
    @Column('json', { nullable: true })
    metadata: any;
  
    @Column()
    tenantId: string;
  
    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;
  
    @ManyToOne(() => Cliente)
    @JoinColumn({ name: 'clienteId' })
    cliente: Cliente;
  
    @ManyToOne(() => Producto, { nullable: true })
    @JoinColumn({ name: 'productoId' })
    producto: Producto | null;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
