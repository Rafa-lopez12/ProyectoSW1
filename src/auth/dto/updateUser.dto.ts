import { IsEmail, IsString, IsUUID, Matches, MaxLength, MinLength, IsOptional } from 'class-validator';

export class UpdateUserDto {
    @IsString()
    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @MinLength(6)
    @MaxLength(50)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'The password must have a Uppercase, lowercase letter and a number'
    })
    @IsOptional()
    password?: string;

    @IsString()
    @MinLength(1)
    @IsOptional()
    fullName?: string;

    @IsUUID()
    @IsOptional()
    rolId?: string;
}