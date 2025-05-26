import { IsString, MinLength, IsOptional, IsArray, IsUUID } from "class-validator";

export class CreateRolDto {
    @IsString()
    @MinLength(3)
    nombre: string;

    @IsOptional()
    @IsArray()
    @IsUUID(4, { each: true })
    funcionalidadIds?: string[]; // IDs de funcionalidades a asignar al rol
}

