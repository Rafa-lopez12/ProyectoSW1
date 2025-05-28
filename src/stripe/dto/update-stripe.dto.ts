import { PartialType } from '@nestjs/swagger';
import { PaymentItemDto } from './create-payment-intent.dto';

export class UpdateStripeDto extends PartialType(PaymentItemDto) {}
