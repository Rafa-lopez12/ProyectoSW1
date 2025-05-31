import { IsString, IsOptional, IsUUID, IsUrl } from 'class-validator';

export class CreateTryonDto {
  @IsString()
  @IsUrl()
  userImageUrl: string;

  @IsString()
  @IsUrl()
  garmentImageUrl: string;

  @IsOptional()
  @IsUUID()
  productoId?: string;

  @IsOptional()
  metadata?: any;
}

export class CreateTryonFromBase64Dto {
  @IsString()
  userImageBase64: string;

  @IsString()
  garmentImageBase64: string;

  @IsOptional()
  @IsUUID()
  productoId?: string;

  @IsOptional()
  metadata?: any;
}
