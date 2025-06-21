import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFiles,
  BadRequestException
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(FilesInterceptor('images', 2))
  async uploadAndCreate(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('productoId') productoId?: string,
    @Body('metadata') metadata?: string
  ) {
    if (!files || files.length !== 2) {
      throw new BadRequestException('Se requieren exactamente 2 imágenes');
    }

    // Convertir archivos a base64
    const userImageBase64 = `data:${files[0].mimetype};base64,${files[0].buffer.toString('base64')}`;
    const garmentImageBase64 = `data:${files[1].mimetype};base64,${files[1].buffer.toString('base64')}`;

    const createTryonDto: CreateTryonFromBase64Dto = {
      userImageBase64,
      garmentImageBase64,
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
