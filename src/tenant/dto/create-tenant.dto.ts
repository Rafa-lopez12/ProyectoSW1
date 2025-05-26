import { IsString, IsIn, MinLength, Matches } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MinLength(3)
  nombre: string;

  @IsString()
  @MinLength(3)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El subdominio solo puede contener letras minúsculas, números y guiones'
  })
  subdominio: string;

  @IsString()
  @IsIn(['basic', 'premium', 'enterprise'])
  plan: string;
}
