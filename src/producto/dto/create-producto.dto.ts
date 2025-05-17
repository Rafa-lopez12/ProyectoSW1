import { IsString, IsNumber, IsArray, IsOptional, ValidateNested, IsInt, IsPositive, IsBoolean, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductSizeDto } from './ProductoSize.dto';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  subcategory: string;

  @IsUUID()
  categoryId: string;

  @IsArray()
  @IsOptional()
  imageUrls?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSizeDto)
  productSizes: ProductSizeDto[];
  
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

