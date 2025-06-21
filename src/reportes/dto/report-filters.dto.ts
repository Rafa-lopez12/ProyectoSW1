import { IsOptional, IsDateString, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ReportFilterDto {
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsString()
  categoriaId?: string;

  @IsOptional()
  @IsString()
  proveedorId?: string;

  @IsOptional()
  @IsString()
  clienteId?: string;

  @IsOptional()
  @IsString()
  usuarioId?: string;
}

export class TopProductosDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['cantidad', 'ingresos'])
  tipo?: 'cantidad' | 'ingresos' = 'ingresos';

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}

export class StockBajoDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  umbral?: number = 10;

  @IsOptional()
  @IsString()
  categoriaId?: string;
}

export class RotacionInventarioDto {
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsEnum(['rapida', 'lenta', 'todas'])
  tipo?: 'rapida' | 'lenta' | 'todas' = 'todas';

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
