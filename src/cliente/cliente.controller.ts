import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query } from '@nestjs/common';
import { ClienteAuthService } from './cliente.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { GetCliente } from './decorators/get-cliente.decorator';
import { LoginClienteDto } from './dto/loginCli.dto';
import { Cliente } from './entities/cliente.entity';
import { TenantFuncionalidadAuth, ClienteTenantAuth } from '../common/decorators/tenant-auth.decorator';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';

@Controller('cliente-auth')
export class ClienteAuthController {
  constructor(
    private readonly clienteAuthService: ClienteAuthService,
  ) {}

  // =================== RUTAS PÚBLICAS PARA CLIENTES ===================
  
  @Post('register')
  register(
    @GetTenantId() tenantId: string,
    @Body() createClienteDto: CreateClienteDto
  ) {
    return this.clienteAuthService.register(tenantId, createClienteDto);
  }

  @Post('login')
  login(
    @GetTenantId() tenantId: string,
    @Body() loginClienteDto: LoginClienteDto
  ) {
    return this.clienteAuthService.login(tenantId, loginClienteDto);
  }

  @Get('profile')
  @ClienteTenantAuth()
  getProfile(@GetCliente() cliente: Cliente) {
    return {
      id: cliente.id,
      email: cliente.email,
      firstName: cliente.firstName,
      lastName: cliente.lastName,
      fullName: cliente.fullName,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
    };
  }

  @Patch('profile')
  @ClienteTenantAuth()
  updateProfile(
    @GetCliente() cliente: Cliente,
    @Body() updateClienteDto: UpdateClienteDto
  ) {
    return this.clienteAuthService.update(cliente.tenantId, cliente.id, updateClienteDto);
  }

  @Get('check-status')
  @ClienteTenantAuth()
  checkAuthStatus(@GetCliente() cliente: Cliente) {
    return this.clienteAuthService.checkAuthStatus(cliente);
  }




  // =================== RUTAS ADMINISTRATIVAS ===================

  // @Get('admin/all')
  // @TenantFuncionalidadAuth('obtener-clientes')
  // findAllClients(@GetTenantId() tenantId: string) {
  //   return this.clienteAuthService.findAll(tenantId);
  // }

  // @Get('admin/:id')
  // @TenantFuncionalidadAuth('obtener-cliente')
  // findOneClient(
  //   @GetTenantId() tenantId: string,
  //   @Param('id', ParseUUIDPipe) id: string
  // ) {
  //   return this.clienteAuthService.findOne(tenantId, id);
  // }

  // @Patch('admin/:id')
  // @TenantFuncionalidadAuth('actualizar-cliente')
  // updateClient(
  //   @GetTenantId() tenantId: string,
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @Body() updateClienteDto: UpdateClienteDto
  // ) {
  //   return this.clienteAuthService.update(tenantId, id, updateClienteDto);
  // }

  // @Patch('admin/:id/deactivate')
  // @TenantFuncionalidadAuth('desactivar-cliente')
  // deactivateClient(
  //   @GetTenantId() tenantId: string,
  //   @Param('id', ParseUUIDPipe) id: string
  // ) {
  //   return this.clienteAuthService.deactivate(tenantId, id);
  // }

  // @Patch('admin/:id/activate')
  // @TenantFuncionalidadAuth('activar-cliente')
  // activateClient(
  //   @GetTenantId() tenantId: string,
  //   @Param('id', ParseUUIDPipe) id: string
  // ) {
  //   return this.clienteAuthService.activate(tenantId, id);
  // }
}

