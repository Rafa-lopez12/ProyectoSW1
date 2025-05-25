import { IsUUID, IsArray, IsNumber, ValidateNested, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDetalleVentaDto } from './create-detalle-venta.dto';

export class CreateVentaDto {
  @IsUUID()
  @IsOptional() // Opcional para compras de cliente autoservicio
  usuarioId?: string; // Empleado que registra la venta

  @IsUUID()
  clienteId: string; // Cliente que compra

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleVentaDto)
  detalles: CreateDetalleVentaDto[];

  @IsString()
  @IsOptional()
  observaciones?: string;
}
