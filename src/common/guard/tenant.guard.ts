import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithTenant } from '../middleware/tenant.middleware';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request: RequestWithTenant = context.switchToHttp().getRequest();
    
    // Verificar si la ruta requiere tenant
    const requiresTenant = this.reflector.get<boolean>('requires-tenant', context.getHandler()) 
                        ?? this.reflector.get<boolean>('requires-tenant', context.getClass())
                        ?? true; // Por defecto, todas las rutas requieren tenant

    // Si no requiere tenant, permitir
    if (!requiresTenant) {
      return true;
    }

    // Verificar que existe tenantId en el request
    if (!request.tenantId) {
      throw new ForbiddenException('Acceso denegado: Tenant requerido');
    }

    return true;
  }
}