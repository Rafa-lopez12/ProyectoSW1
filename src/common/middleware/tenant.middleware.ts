import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../tenant/entities/tenant.entity';

export interface RequestWithTenant extends Request {
  tenantId?: string;
  tenant?: Tenant;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async use(req: RequestWithTenant, res: Response, next: NextFunction) {
    try {
      let tenantIdentifier: string | null = null;

      // Método 1: Extraer del subdominio
      const host = req.headers.host;
      if (host) {
        const subdomain = host.split('.')[0];
        // Evitar subdominios reservados
        if (!['www', 'api', 'admin', 'app'].includes(subdomain)) {
          tenantIdentifier = subdomain;
        }
      }

      // Método 2: Extraer del header X-Tenant-ID (backup)
      if (!tenantIdentifier) {
        tenantIdentifier = req.headers['x-tenant-id'] as string;
      }

      // Método 3: Extraer de query param (para desarrollo)
      if (!tenantIdentifier && req.query.tenant) {
        tenantIdentifier = req.query.tenant as string;
      }

      // Si no hay tenant, permitir rutas públicas
      const publicRoutes = ['/health', '/docs', '/api', '/super-admin'];
      const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
      
      if (!tenantIdentifier && !isPublicRoute) {
        throw new BadRequestException('Tenant no especificado. Accede via subdominio (ej: tienda1.tuapp.com)');
      }

      // Si hay tenant, validar que existe y está activo
      if (tenantIdentifier) {
        const tenant = await this.tenantRepository.findOne({
          where: [
            { subdominio: tenantIdentifier },
            { id: tenantIdentifier }
          ]
        });

        if (!tenant) {
          throw new BadRequestException(`Tenant '${tenantIdentifier}' no encontrado`);
        }

        if (!tenant.isActive) {
          throw new BadRequestException(`Tenant '${tenantIdentifier}' está inactivo`);
        }

        // Agregar tenant info al request
        req.tenantId = tenant.id;
        req.tenant = tenant;
      }

      next();
    } catch (error) {
      throw new BadRequestException(`Error de tenant: ${error.message}`);
    }
  }
}