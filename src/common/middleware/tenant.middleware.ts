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
      // Rutas públicas que no requieren tenant
      const publicRoutes = ['/api/tenant', '/api/health', '/api/docs', '/api'];
      const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
      
      if (isPublicRoute) {
        return next();
      }

      // Obtener identificador del tenant
      const tenantIdentifier = this.extractTenantIdentifier(req);
      
      if (!tenantIdentifier) {
        throw new BadRequestException(
          'Tenant requerido. Usa header X-Tenant-ID: tu-subdominio'
        );
      }

      // Buscar y validar tenant
      const tenant = await this.findAndValidateTenant(tenantIdentifier);

      // Agregar al request
      req.tenantId = tenant.id;
      req.tenant = tenant;

      
      next();
      
    } catch (error) {
     
      throw new BadRequestException(`Error de tenant: ${error.message}`);
    }
  }

  private extractTenantIdentifier(req: Request): string | null {
    // Helper para detectar si es una IP
    const isIpAddress = (hostname: string): boolean => {
      const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
      return ipRegex.test(hostname.split(':')[0]); // Remover puerto si existe
    };

    const isNgrokDomain = (hostname: string): boolean => {
      return hostname.includes('.ngrok.io') || hostname.includes('.ngrok-free.app');
    };
  
    // 1. Desde subdominio (producción)
    const host = req.headers.host;
    if (host) {
      const hostname = host.split(':')[0]; // Remover puerto
      
      // Skip si es IP, localhost, o nombres reservados
      if (!hostname.includes('localhost') && 
        !hostname.includes('127.0.0.1') &&
        !isIpAddress(hostname) &&
        !hostname.startsWith('192.168.') &&
        !hostname.startsWith('10.') &&
        !hostname.startsWith('172.') &&
        !isNgrokDomain(hostname)){
        
        const subdomain = hostname.split('.')[0];
        if (!['www', 'api', 'admin', 'app'].includes(subdomain)) {
          
          return subdomain;
        }
      }
    }
  
    // 2. Desde header (desarrollo) - PRIORIDAD PARA DESARROLLO
    const headerTenant = req.headers['x-tenant-id'] as string;
    if (headerTenant) {
    
      return headerTenant;
    }
  
    // 3. Desde query param (backup)
    const queryTenant = req.query.tenant as string;
    if (queryTenant) {
    
      return queryTenant;
    }
  
   
    return null;
  }

  private async findAndValidateTenant(identifier: string): Promise<Tenant> {
    

    // Detectar si es UUID o subdominio
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    const tenant = await this.tenantRepository.findOne({
      where: isUUID 
        ? { id: identifier }
        : { subdominio: identifier }
    });

    if (!tenant) {
      throw new BadRequestException(
        `Tenant '${identifier}' no encontrado. ${isUUID ? 'UUID inválido' : 'Subdominio no existe'}`
      );
    }

    if (!tenant.isActive) {
      throw new BadRequestException(`Tenant '${tenant.nombre}' está inactivo`);
    }

    return tenant; // TypeScript sabe que NO es null aquí
  }
}