import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  ParseUUIDPipe,
  UseInterceptors,
  BadRequestException,
  UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VirtualTryonService } from './virtual-tryon.service';
import { ClienteTenantAuth, TenantFuncionalidadAuth } from '../common/decorators/tenant-auth.decorator';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';
import { GetCliente } from '../cliente/decorators/get-cliente.decorator';
import { Cliente } from '../cliente/entities/cliente.entity';
import { CreateTryonDto, CreateTryonFromBase64Dto } from './dto/create-virtual-tryon.dto';

@Controller('virtual-tryon')
export class VirtualTryonController {
  constructor(private readonly virtualTryonService: VirtualTryonService) {}

  // =================== RUTAS PARA CLIENTES ===================

  @Get('verify-account')
@ClienteTenantAuth()
async verifyAccount(
  @GetTenantId() tenantId: string,
  @GetCliente() cliente: Cliente
) {
  return this.virtualTryonService.verifyReplicateAccount();
}

  @Post('create-from-urls')
  @ClienteTenantAuth()
  createFromUrls(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente,
    @Body() createTryonDto: CreateTryonDto
  ) {
    return this.virtualTryonService.createTryonFromUrls(tenantId, cliente.id, createTryonDto);
  }

  @Post('create-from-base64')
  @ClienteTenantAuth()
  createFromBase64(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente,
    @Body() createTryonDto: CreateTryonFromBase64Dto
  ) {
    return this.virtualTryonService.createTryonFromBase64(tenantId, cliente.id, createTryonDto);
  }

  @Post('upload-and-create')
  @ClienteTenantAuth()
  @UseInterceptors(FileInterceptor('images'))
  async uploadAndCreate(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente,
    @UploadedFile() images: Express.Multer.File,
    @Body('image') image: string,
    @Body('productoId') productoId?: string,
    @Body('metadata') metadata?: string
  ) {
    console.log(images)
    console.log(image)
    if (!images) {
      throw new BadRequestException('Se requiere la imagen de la persona');
    }

    if (!image) {
      throw new BadRequestException('Se requiere la URL de la imagen de la prenda');
    }

    // Convertir imagen de persona a base64
    const userImageBase64 = `data:${images.mimetype};base64,${images.buffer.toString('base64')}`;

    const createTryonDto: CreateTryonFromBase64Dto = {
      userImageBase64,
      garmentImageBase64: image, // Ahora es URL directa
      productoId,
      metadata: metadata ? JSON.parse(metadata) : undefined
    };

    return this.virtualTryonService.createTryonFromBase64(tenantId, cliente.id, createTryonDto);
  }

  @Get('session/:sessionId')
  @ClienteTenantAuth()
  getSession(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente,
    @Param('sessionId', ParseUUIDPipe) sessionId: string
  ) {
    return this.virtualTryonService.getSessionStatus(tenantId, cliente.id, sessionId);
  }

  @Get('my-sessions')
  @ClienteTenantAuth()
  getMySessions(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente
  ) {
    return this.virtualTryonService.getClientSessions(tenantId, cliente.id);
  }

  @Post('retry/:sessionId')
  @ClienteTenantAuth()
  retrySession(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente,
    @Param('sessionId', ParseUUIDPipe) sessionId: string
  ) {
    return this.virtualTryonService.retrySession(tenantId, cliente.id, sessionId);
  }

  // =================== RUTAS ADMINISTRATIVAS ===================

  @Get('admin/sessions')
  @TenantFuncionalidadAuth('obtener-tryon-sessions')
  getAllSessions(@GetTenantId() tenantId: string) {
    return this.virtualTryonService.getAllSessions(tenantId);
  }

  // @Get('admin/session/:sessionId')
  // @TenantFuncionalidadAuth('obtener-tryon-session')
  // getAdminSession(
  //   @GetTenantId() tenantId: string,
  //   @Param('sessionId', ParseUUIDPipe) sessionId: string
  // ) {
  //   return this.virtualTryonService.tryonSessionRepository.findOne({
  //     where: { id: sessionId, tenantId },
  //     relations: ['cliente', 'producto']
  //   });
  // }


}
