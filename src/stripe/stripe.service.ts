import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import Stripe from 'stripe';

import { StripePayment } from './entities/stripe-payment.entity';
import { Cliente } from '../cliente/entities/cliente.entity';
import { VentaService } from '../venta/venta.service';
import { CarritoService } from '../carrito/carrito.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { CreateVentaDto } from '../venta/dto/create-venta.dto';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(StripePayment)
    private readonly stripePaymentRepository: Repository<StripePayment>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    private readonly ventaService: VentaService,
    private readonly carritoService: CarritoService,
    private readonly dataSource: DataSource
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY no encontrada en variables de entorno');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-04-30.basil',
    });
  }

  async createOrGetCustomer(tenantId: string, clienteId: string): Promise<string> {
    const cliente = await this.clienteRepository.findOne({
      where: { id: clienteId, tenantId }
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Verificar si ya tiene un customer en Stripe
    const existingPayment = await this.stripePaymentRepository.findOne({
      where: { cliente: { id: clienteId }, tenantId },
      order: { createdAt: 'DESC' }
    });

    if (existingPayment?.stripeCustomerId) {
      try {
        // Verificar que el customer existe en Stripe
        await this.stripe.customers.retrieve(existingPayment.stripeCustomerId);
        return existingPayment.stripeCustomerId;
      } catch (error) {
        this.logger.warn(`Customer ${existingPayment.stripeCustomerId} no encontrado en Stripe, creando nuevo`);
      }
    }

    // Crear nuevo customer en Stripe
    const customer = await this.stripe.customers.create({
      email: cliente.email,
      name: cliente.fullName,
      metadata: {
        clienteId: cliente.id,
        tenantId: tenantId
      }
    });

    return customer.id;
  }

  async createPaymentIntent(
    tenantId: string, 
    clienteId: string, 
    createPaymentIntentDto: CreatePaymentIntentDto
  ): Promise<any> {
    try {
      const { amount, currency = 'usd', items, description, metadata } = createPaymentIntentDto;

      const cliente = await this.clienteRepository.findOne({
        where: { id: clienteId, tenantId }
      });

      if (!cliente) {
        throw new NotFoundException('Cliente no encontrado');
      }

      // Crear o obtener customer de Stripe
      const customerId = await this.createOrGetCustomer(tenantId, clienteId);

      // Crear PaymentIntent en Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount), // Stripe requiere enteros
        currency,
        customer: customerId,
        description: description || `Pago de ${cliente.fullName}`,
        metadata: {
          tenantId,
          clienteId,
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Guardar registro en BD
      const stripePayment = this.stripePaymentRepository.create({
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: customerId,
        amount: amount / 100, // Convertir de centavos a unidades
        currency,
        status: paymentIntent.status,
        cliente,
        tenantId,
        metadata: {
          items,
          description,
          ...metadata
        }
      });

      await this.stripePaymentRepository.save(stripePayment);

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        customerId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      };

    } catch (error) {
      this.logger.error('Error creando PaymentIntent:', error);
      throw new BadRequestException(`Error procesando pago: ${error.message}`);
    }
  }

  async createPaymentFromCarrito(tenantId: string, clienteId: string): Promise<any> {
    // Obtener carrito del cliente
    const carrito = await this.carritoService.obtenerCarrito(tenantId, clienteId);

    if (carrito.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    // Preparar items para el pago
    const items = carrito.items.map(item => ({
      productoVariedadId: item.productoVariedadId,
      cantidad: item.cantidad,
      precio: item.variedad.precio * 100, // Convertir a centavos
      nombre: `${item.producto.nombre} - ${item.variedad.talla} - ${item.variedad.color}`
    }));

    const totalAmount = carrito.resumen.total * 100; // Convertir a centavos

    return this.createPaymentIntent(tenantId, clienteId, {
      amount: totalAmount,
      currency: 'usd',
      items,
      description: `Compra de carrito - ${carrito.resumen.totalItems} productos`,
      metadata: {
        source: 'carrito',
        itemCount: carrito.resumen.totalItems
      }
    });
  }

  async confirmPayment(
    tenantId: string, 
    clienteId: string, 
    confirmPaymentDto: ConfirmPaymentDto
  ): Promise<any> {
    return await this.dataSource.transaction(async manager => {
      try {
        const { paymentIntentId, paymentMethodId } = confirmPaymentDto;

        // Buscar el pago en nuestra BD
        const stripePayment = await this.stripePaymentRepository.findOne({
          where: { 
            stripePaymentIntentId: paymentIntentId, 
            tenantId,
            cliente: { id: clienteId }
          },
          relations: ['cliente']
        });

        if (!stripePayment) {
          throw new NotFoundException('PaymentIntent no encontrado');
        }

        // Confirmar el pago en Stripe
        const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
          payment_method: paymentMethodId,
          return_url: `${this.configService.get('FRONTEND_URL')}/payment/success`,
          expand: ['charges']
        });

        // Actualizar estado en BD
        stripePayment.status = paymentIntent.status;
        if (paymentMethodId) {
          stripePayment.paymentMethodId = paymentMethodId;
        }
        
        // Type assertion para acceder a charges expandidos
        const expandedPaymentIntent = paymentIntent as unknown as Stripe.PaymentIntent & {
          charges: {
            data: Array<{ receipt_url?: string }>;
          };
        };
        
        if (expandedPaymentIntent.charges?.data?.[0]?.receipt_url) {
          stripePayment.receiptUrl = expandedPaymentIntent.charges.data[0].receipt_url;
        }

        await manager.save(StripePayment, stripePayment);

        // Si el pago fue exitoso, crear la venta
        if (paymentIntent.status === 'succeeded') {
          const venta = await this.procesarVentaExitosa(tenantId, stripePayment, manager);
          stripePayment.venta = venta;
          await manager.save(StripePayment, stripePayment);

          return {
            success: true,
            paymentStatus: paymentIntent.status,
            ventaId: venta.id,
            receiptUrl: stripePayment.receiptUrl,
            message: 'Pago procesado exitosamente y venta creada'
          };
        }

        return {
          success: false,
          paymentStatus: paymentIntent.status,
          message: 'El pago requiere acción adicional',
          nextAction: paymentIntent.next_action
        };

      } catch (error) {
        this.logger.error('Error confirmando pago:', error);
        throw new BadRequestException(`Error confirmando pago: ${error.message}`);
      }
    });
  }

  private async procesarVentaExitosa(
    tenantId: string, 
    stripePayment: StripePayment, 
    manager: any
  ): Promise<any> {
    const metadata = stripePayment.metadata;
    
    if (metadata?.source === 'carrito') {
      // Obtener items del carrito y crear venta
      const carrito = await this.carritoService.obtenerCarrito(tenantId, stripePayment.cliente.id);
      
      const detalles = carrito.items.map(item => ({
        productoVariedadId: item.productoVariedadId,
        cantidad: item.cantidad,
        precioUnitario: item.variedad.precio
      }));

      const ventaDto: CreateVentaDto = {
        clienteId: stripePayment.cliente.id,
        detalles,
        observaciones: `Pago procesado con Stripe - PaymentIntent: ${stripePayment.stripePaymentIntentId}`
      };

      const venta = await this.ventaService.create(tenantId, ventaDto);
      
      // Vaciar carrito después de venta exitosa
      await this.carritoService.vaciarCarrito(tenantId, stripePayment.cliente.id);
      
      return venta;
    } else if (metadata?.items) {
      // Crear venta desde items específicos
      const detalles = metadata.items.map((item: any) => ({
        productoVariedadId: item.productoVariedadId,
        cantidad: item.cantidad,
        precioUnitario: item.precio / 100 // Convertir de centavos
      }));

      const ventaDto: CreateVentaDto = {
        clienteId: stripePayment.cliente.id,
        detalles,
        observaciones: `Pago procesado con Stripe - PaymentIntent: ${stripePayment.stripePaymentIntentId}`
      };

      return await this.ventaService.create(tenantId, ventaDto);
    }

    throw new BadRequestException('No se pudo determinar los productos para la venta');
  }

  async getPaymentHistory(tenantId: string, clienteId: string): Promise<StripePayment[]> {
    return this.stripePaymentRepository.find({
      where: { 
        tenantId,
        cliente: { id: clienteId }
      },
      relations: ['cliente', 'venta'],
      order: { createdAt: 'DESC' }
    });
  }

  async getPaymentDetails(tenantId: string, paymentId: string): Promise<any> {
    const payment = await this.stripePaymentRepository.findOne({
      where: { id: paymentId, tenantId },
      relations: ['cliente', 'venta']
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    // Obtener detalles actualizados de Stripe
    const stripePaymentIntent = await this.stripe.paymentIntents.retrieve(
      payment.stripePaymentIntentId
    );

    return {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: stripePaymentIntent.status,
      createdAt: payment.createdAt,
      cliente: {
        id: payment.cliente.id,
        nombre: payment.cliente.fullName,
        email: payment.cliente.email
      },
      venta: payment.venta ? {
        id: payment.venta.id,
        fecha: payment.venta.fechaVenta
      } : null,
      receiptUrl: payment.receiptUrl,
      metadata: payment.metadata
    };
  }
}