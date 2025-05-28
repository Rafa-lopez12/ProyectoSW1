import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { StripePayment } from './entities/stripe-payment.entity';
import { AuthModule } from '../auth/auth.module';
import { ClienteModule } from '../cliente/cliente.module';
import { VentaModule } from '../venta/venta.module';
import { CarritoModule } from '../carrito/carrito.module';

@Module({
  controllers: [StripeController],
  providers: [StripeService],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([StripePayment]),
    AuthModule,
    ClienteModule,
    VentaModule,
    CarritoModule
  ],
  exports: [StripeService]
})
export class StripeModule {}
