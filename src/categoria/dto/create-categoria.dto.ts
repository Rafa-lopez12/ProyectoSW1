import { IsString, IsArray, IsOptional, IsBoolean } from "class-validator";

export class CreateCategoriaDto {
    @IsString()
    name: string;
  
    @IsArray()
    @IsOptional()
    subcategories?: string[];
  
    @IsBoolean()
    @IsOptional()
    isActive?: boolean = true;
  
}
