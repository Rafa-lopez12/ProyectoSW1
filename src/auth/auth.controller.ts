import { Controller, Get, Post, Body, UseGuards, Req, Headers, SetMetadata, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
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

  @Get('users')
  @TenantFuncionalidadAuth('obtener-usuarios')
  getAllUsers(@GetTenantId() tenantId: string) {
    return this.authService.getAll(tenantId);
  }

  @Get('users/:id')
  @TenantFuncionalidadAuth('obtener-usuario')
  getUser(
    @GetTenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.authService.findOne(tenantId, id);
  }

  @Patch('users/:id')
  @TenantFuncionalidadAuth('actualizar-usuario')
  updateUser(
    @GetTenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<CreateUserDto>
  ) {
    return this.authService.update(tenantId, id, updateData);
  }

  @Patch('users/:id/deactivate')
  @TenantFuncionalidadAuth('desactivar-usuario')
  deactivateUser(
    @GetTenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.authService.deactivate(tenantId, id);
  }

  @Patch('users/:id/activate')
  @TenantFuncionalidadAuth('activar-usuario')
  activateUser(
    @GetTenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.authService.activate(tenantId, id);
  }


}

