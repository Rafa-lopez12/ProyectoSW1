import { 
    IsInt, 
    IsNumber, 
    IsPositive, 
    Min, 
    IsOptional,
    ValidateIf,
    IsUUID,
    IsString
  } from 'class-validator';
  import { Type } from 'class-transformer';
  
  export class ProductSizeDto {
    @IsString()
    @Type(() => String)
    size: string;
  
    @IsString()
    @Type(() => String)
    color: string;
  
    @IsInt()
    @IsPositive()
    @Type(() => Number)
    quantity: number;
  
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    @Type(() => Number)
    price: number;
  
    @IsInt()
    @Min(0)
    @IsOptional()
    @Type(() => Number)
    stock?: number;
  
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    @IsOptional()
    @ValidateIf(o => o.salePrice !== undefined)
    @Type(() => Number)
    salePrice?: number;
  
    // @IsOptional()
    // @IsUUID()
    // @Type(() => Number)
    // productId?: string;
  }