import { IsString, MinLength } from 'class-validator';

export class CreateSizeDto {
  @IsString()
  @MinLength(1)
  name: string;
}
