import { IsOptional, IsUUID, IsString, IsNumber, Min, Max, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum RecommendationType {
  BESTSELLER = 'bestseller',
  SIMILAR = 'similar',
  PERSONALIZED = 'personalized',
  NEW_ARRIVALS = 'new_arrivals'
}

export class GetRecommendationsDto {
  @IsOptional()
  @IsEnum(RecommendationType)
  type?: RecommendationType = RecommendationType.PERSONALIZED;

  @IsOptional()
  @IsUUID()
  basedOnProductId?: string; // Para recomendaciones "similar"

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  excludeProductIds?: string[];

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeOutOfStock?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  minConfidence?: number = 0.3;
}

export class AnalyzeClientBehaviorDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  daysPeriod?: number = 90; // Analizar últimos 90 días por defecto
}