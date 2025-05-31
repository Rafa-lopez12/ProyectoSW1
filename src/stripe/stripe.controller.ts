import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  ParseUUIDPipe,
  Headers,
  RawBody,
  BadRequestException
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ClienteTenantAuth, TenantFuncionalidadAuth } from '../common/decorators/tenant-auth.decorator';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';
import { GetCliente } from '../cliente/decorators/get-cliente.decorator';
import { Cliente } from '../cliente/entities/cliente.entity';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  // =================== RUTAS PARA CLIENTES ===================

  @Post('create-payment-intent')
  @ClienteTenantAuth()
  createPaymentIntent(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente,
    @Body() createPaymentIntentDto: CreatePaymentIntentDto
  ) {
    return this.stripeService.createPaymentIntent(tenantId, cliente.id, createPaymentIntentDto);
  }

  @Post('create-payment-from-cart')
  @ClienteTenantAuth()
  createPaymentFromCart(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente
  ) {
    return this.stripeService.createPaymentFromCarrito(tenantId, cliente.id);
  }

  @Post('confirm-payment')
  @ClienteTenantAuth()
  confirmPayment(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente,
    @Body() confirmPaymentDto: ConfirmPaymentDto
  ) {
    console.log(confirmPaymentDto)
    return this.stripeService.confirmPayment(tenantId, cliente.id, confirmPaymentDto);
  }

  @Get('my-payments')
  @ClienteTenantAuth()
  getMyPayments(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente
  ) {
    return this.stripeService.getPaymentHistory(tenantId, cliente.id);
  }

  @Get('payment/:id')
  @ClienteTenantAuth()
  getPaymentDetails(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente,
    @Param('id', ParseUUIDPipe) paymentId: string
  ) {
    return this.stripeService.getPaymentDetails(tenantId, paymentId);
  }

  // =================== RUTAS ADMINISTRATIVAS ===================

  @Get('admin/payments')
  @TenantFuncionalidadAuth('obtener-pagos')
  getAllPayments(@GetTenantId() tenantId: string) {
    // Implementar método en service para obtener todos los pagos del tenant
    return { message: 'Funcionalidad administrativa pendiente' };
  }

  @Get('admin/payment/:id')
  @TenantFuncionalidadAuth('obtener-pago')
  getAdminPaymentDetails(
    @GetTenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) paymentId: string
  ) {
    return this.stripeService.getPaymentDetails(tenantId, paymentId);
  }
}
