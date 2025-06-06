// src/cliente/entities/cliente.entity.ts
import { Tenant } from '../../tenant/entities/tenant.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne } from 'typeorm';

@Entity('clientes')
export class Cliente {
    
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', {
        unique: true
    })
    email: string;

    @Column('text', {
        select: false
    })
    password: string;

    @Column('text')
    firstName: string;

    @Column('text')
    lastName: string;

    @Column('text', { nullable: true })
    telefono: string;

    @Column('text', { nullable: true })
    direccion: string;

    @Column('bool', {
        default: true
    })
    isActive: boolean;

    @Column()
    tenantId: string;
  
    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;  


    // Campo virtual para nombre completo
    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    @BeforeInsert()
    checkFieldsBeforeInsert() {
        this.email = this.email.toLowerCase().trim();
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate() {
        this.checkFieldsBeforeInsert();   
    }
}
