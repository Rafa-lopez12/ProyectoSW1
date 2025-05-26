import { Controller, Get, Post, Body, UseGuards, Req, Headers, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IncomingHttpHeaders } from 'http';

import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { RawHeaders } from './decorators/raw-headers.decorator';
import { RoleProtected } from './decorators/role.protected.decorator';

import { CreateUserDto } from './dto/create-auth.dto';
import { LoginUserDto } from './dto/login.dto';
import { User } from './entities/auth.entity';
import { UserRoleGuard } from './guards/user-role.guard';
import { ValidRoles } from './interfaces/valid-roles';
import { FuncionalidadAuth } from './decorators/funcionalidad-auth.decorator';
import { TenantFuncionalidadAuth } from '../common/decorators/tenant-auth.decorator';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  //@TenantFuncionalidadAuth('crear-usuario') // Solo usuarios con permisos pueden crear otros usuarios
  createUser(
    @GetTenantId() tenantId: string,
    @Body() createUserDto: CreateUserDto
  ) {
    return this.authService.create(tenantId, createUserDto);
  }

  @Post('login')
  loginUser(
    @GetTenantId() tenantId: string,
    @Body() loginUserDto: LoginUserDto
  ) {
    return this.authService.login(tenantId, loginUserDto);
  }

  @Get('check-status')
  @Auth()
  checkAuthStatus(
    @GetUser() user: User
  ) {
    return this.authService.checkAuthStatus(user);
  }

  @Get('private')
  @UseGuards(AuthGuard())
  testingPrivateRoute(
    @Req() request: Express.Request,
    @GetUser() user: User,
    @GetUser('email') userEmail: string,
    @RawHeaders() rawHeaders: string[],
    @Headers() headers: IncomingHttpHeaders,
  ) {
    return {
      ok: true,
      message: 'Hola Mundo Private',
      user,
      userEmail,
      rawHeaders,
      headers
    }
  }

  @Get('private2')
  @RoleProtected(ValidRoles.superUser, ValidRoles.admin)
  @UseGuards(AuthGuard(), UserRoleGuard)
  privateRoute2(
    @GetUser() user: User
  ) {
    return {
      ok: true,
      user
    }
  }

  @Get('private3')
  privateRoute3(
    @GetUser() user: User
  ) {
    return {
      ok: true,
      user
    }
  }

  @Get('prueba')
  @FuncionalidadAuth('prueba')
  prueba(){
    return 'ok'
  }
}

