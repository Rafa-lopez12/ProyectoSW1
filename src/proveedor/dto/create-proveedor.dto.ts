import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class CreateProveedorDto {
  @IsString()
  @MinLength(3)
  nombre: string;
  
  
  @IsString()
  @IsOptional()
  telefono?: string;
  
  @IsEmail()
  @IsOptional()
  email?: string;
  
  @IsString()
  @IsOptional()
  direccion?: string;
}
