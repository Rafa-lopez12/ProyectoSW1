import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClienteAuthService } from './cliente.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { ClienteAuth } from './decorators/cliente-auth.decorator';
import { GetCliente } from './decorators/get-cliente.decorator';
import { LoginClienteDto } from './dto/loginCli.dto';
import { Cliente } from './entities/cliente.entity';

@Controller('cliente-auth')
export class ClienteAuthController {
  constructor(
    private readonly clienteAuthService: ClienteAuthService,
    //private readonly clienteService: ClienteService,
  ) {}

  @Post('register')
  register(@Body() createClienteDto: CreateClienteDto) {
    return this.clienteAuthService.register(createClienteDto);
  }

  @Post('login')
  login(@Body() loginClienteDto: LoginClienteDto) {
    return this.clienteAuthService.login(loginClienteDto);
  }

  @Get('profile')
  @ClienteAuth()
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

  // @Patch('profile')
  // @ClienteAuth()
  // updateProfile(
  //   @GetCliente() cliente: Cliente,
  //   @Body() updateClienteDto: UpdateClienteDto
  // ) {
  //   return this.clienteService.update(cliente.id, updateClienteDto);
  // }

  // @Get('check-status')
  // @ClienteAuth()
  // checkAuthStatus(@GetCliente() cliente: Cliente) {
  //   return this.clienteAuthService.checkAuthStatus(cliente);
  // }
}

