import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Cliente } from '../../cliente/entities/cliente.entity';
import { Venta } from '../../venta/entities/venta.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

@Entity('stripe_payments')
export class StripePayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  stripePaymentIntentId: string;

  @Column()
  stripeCustomerId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column()
  status: string; // requires_payment_method, requires_confirmation, requires_action, processing, requires_capture, canceled, succeeded

  @Column({ nullable: true })
  paymentMethodId: string;

  @Column({ nullable: true })
  receiptUrl: string;

  @Column({ nullable: true })
  failureReason: string;

  @Column()
  tenantId: string;
  
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;

  @ManyToOne(() => Venta, { nullable: true })
  @JoinColumn({ name: 'ventaId' })
  venta: Venta;

  @Column('json', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}