import { IsString, IsOptional } from 'class-validator';

export class ConfirmPaymentDto {
  @IsString()
  paymentIntentId: string;

  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}