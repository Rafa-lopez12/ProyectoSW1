import { IsString, IsOptional, IsUUID, IsUrl, IsEnum } from 'class-validator';

export enum GarmentCategory {
  UPPER_BODY = 'upper_body',
  LOWER_BODY = 'lower_body',
  DRESSES = 'dresses'
}

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
  @IsEnum(GarmentCategory)
  category?: GarmentCategory;

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

export class CreateTryonWithCategoryDto extends CreateTryonFromBase64Dto {
  @IsEnum(GarmentCategory)
  category: GarmentCategory;
}
