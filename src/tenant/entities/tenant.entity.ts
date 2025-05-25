import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ unique: true })
  subdominio: string; // tienda1.tuapp.com

  @Column()
  plan: string; // basic, premium, enterprise

  @Column()
  fechaCreacion: Date;

  @Column({ default: true })
  isActive: boolean;
}
