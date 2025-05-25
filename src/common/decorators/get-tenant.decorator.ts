import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { RequestWithTenant } from '../middleware/tenant.middleware';

export const GetTenant = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const req: RequestWithTenant = ctx.switchToHttp().getRequest();
    
    if (!req.tenant && !req.tenantId) {
      throw new InternalServerErrorException('Tenant no encontrado en request');
    }

    // Si se especifica un campo específico del tenant
    if (data) {
      return req.tenant ? req.tenant[data] : req.tenantId;
    }

    // Retornar objeto tenant completo o solo el ID
    return req.tenant || { id: req.tenantId };
  }
);

// Versión específica para obtener solo el ID
export const GetTenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req: RequestWithTenant = ctx.switchToHttp().getRequest();
    
    if (!req.tenantId) {
      throw new InternalServerErrorException('TenantId no encontrado en request');
    }

    return req.tenantId;
  }
);