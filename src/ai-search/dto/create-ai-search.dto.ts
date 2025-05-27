import { IsOptional, IsNumber, IsUrl, Min, Max, IsString } from 'class-validator';

export class SearchByImageDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1)
  minSimilarity?: number = 0.3;
}

export class SearchByUrlDto {
  @IsUrl()
  imageUrl: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1)
  minSimilarity?: number = 0.3;
}
