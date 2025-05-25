import { IsUUID, IsArray, IsDateString, IsNumber, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDetalleMovDto } from './createDetalleMot.dto';

export class CreateMovimientoInvDto {
  @IsUUID()
  usuarioId: string;

  @IsUUID()
  proveedorId: string;


  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleMovDto)
  detalles: CreateDetalleMovDto[];

  @IsDateString()
  @IsOptional()
  fechaRegistro?: string;

  @IsNumber()
  montoTotal: number;
}
