import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  Param, 
  ParseUUIDPipe 
} from '@nestjs/common';
import { RecommendationsService } from './recommendation.service';
import { ClienteTenantAuth, TenantFuncionalidadAuth } from '../common/decorators/tenant-auth.decorator';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';
import { GetCliente } from '../cliente/decorators/get-cliente.decorator';
import { Cliente } from '../cliente/entities/cliente.entity';
import { 
  GetRecommendationsDto, 
  AnalyzeClientBehaviorDto
} from './dto/get-recommendations.dto';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  // =================== RUTAS PÚBLICAS (SIN AUTENTICACIÓN) ===================

  @Get('public/bestsellers')
  getPublicBestsellers(
    @GetTenantId() tenantId: string,
    @Query() dto: GetRecommendationsDto
  ) {
    dto.type = 'bestseller' as any;
    return this.recommendationsService.getRecommendations(tenantId, null, dto);
  }

  @Get('public/similar/:productId')
  getPublicSimilar(
    @GetTenantId() tenantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() dto: GetRecommendationsDto
  ) {
    dto.type = 'similar' as any;
    dto.basedOnProductId = productId;
    return this.recommendationsService.getRecommendations(tenantId, null, dto);
  }

  @Get('public/new-arrivals')
  getPublicNewArrivals(
    @GetTenantId() tenantId: string,
    @Query() dto: GetRecommendationsDto
  ) {
    dto.type = 'new_arrivals' as any;
    return this.recommendationsService.getRecommendations(tenantId, null, dto);
  }

  // =================== RUTAS PARA CLIENTES AUTENTICADOS ===================

  @Get('personalized')
  @ClienteTenantAuth()
  getPersonalizedRecommendations(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente,
    @Query() dto: GetRecommendationsDto
  ) {
    dto.type = 'personalized' as any;
    return this.recommendationsService.getRecommendations(tenantId, cliente.id, dto);
  }

  @Get('for-you')
  @ClienteTenantAuth()
  getRecommendationsForUser(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente,
    @Query() dto: GetRecommendationsDto
  ) {
    return this.recommendationsService.getRecommendations(tenantId, cliente.id, dto);
  }

  @Get('similar/:productId')
  @ClienteTenantAuth()
  getSimilarProducts(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() dto: GetRecommendationsDto
  ) {
    dto.type = 'similar' as any;
    dto.basedOnProductId = productId;
    return this.recommendationsService.getRecommendations(tenantId, cliente.id, dto);
  }

  @Get('my-behavior')
  @ClienteTenantAuth()
  getMyBehaviorAnalysis(
    @GetTenantId() tenantId: string,
    @GetCliente() cliente: Cliente,
    @Query() dto: AnalyzeClientBehaviorDto
  ) {
    return this.recommendationsService.analyzeClientBehavior(
      tenantId, 
      cliente.id, 
      dto.daysPeriod
    );
  }

  // =================== RUTAS ADMINISTRATIVAS ===================

  @Get('admin/client-behavior/:clienteId')
  @TenantFuncionalidadAuth('obtener-analisis-clientes')
  getClientBehaviorAnalysis(
    @GetTenantId() tenantId: string,
    @Param('clienteId', ParseUUIDPipe) clienteId: string,
    @Query() dto: AnalyzeClientBehaviorDto
  ) {
    return this.recommendationsService.analyzeClientBehavior(
      tenantId, 
      clienteId, 
      dto.daysPeriod
    );
  }

  @Get('admin/analytics')
  @TenantFuncionalidadAuth('obtener-reportes-ventas')
  getRecommendationAnalytics(
    @GetTenantId() tenantId: string,
    @Query() dto: GetRecommendationsDto
  ) {
    dto.type = 'bestseller' as any;
    return this.recommendationsService.getRecommendations(tenantId, null, dto);
  }

  @Get('admin/insights')
  @TenantFuncionalidadAuth('obtener-reportes-ventas')
  getTenantInsights(@GetTenantId() tenantId: string) {
    return this.recommendationsService.getTenantInsights(tenantId);
  }

  @Post('admin/bulk-analysis')
  @TenantFuncionalidadAuth('obtener-analisis-clientes')
  async getBulkClientAnalysis(
    @GetTenantId() tenantId: string,
    @Body('clienteIds') clienteIds: string[],
    @Body() dto: AnalyzeClientBehaviorDto
  ) {
    const analyses = await Promise.all(
      clienteIds.map(clienteId => 
        this.recommendationsService.analyzeClientBehavior(
          tenantId, 
          clienteId, 
          dto.daysPeriod
        )
      )
    );

    return {
      totalClients: clienteIds.length,
      analyses,
      summary: {
        averageOrderValue: analyses.reduce((sum, a) => sum + a.averageOrderValue, 0) / analyses.length,
        mostPreferredCategories: this.getMostFrequentCategories(analyses),
        commonSizes: this.getMostFrequentSizes(analyses),
        commonColors: this.getMostFrequentColors(analyses)
      }
    };
  }

  // =================== MÉTODOS AUXILIARES ===================

  private getMostFrequentCategories(analyses: any[]): string[] {
    const categoryCount = new Map<string, number>();
    
    analyses.forEach(analysis => {
      analysis.preferredCategories.forEach((category: string) => {
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      });
    });

    return Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category);
  }

  private getMostFrequentSizes(analyses: any[]): string[] {
    const sizeCount = new Map<string, number>();
    
    analyses.forEach(analysis => {
      analysis.frequentSizes.forEach((size: string) => {
        sizeCount.set(size, (sizeCount.get(size) || 0) + 1);
      });
    });

    return Array.from(sizeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([size]) => size);
  }

  private getMostFrequentColors(analyses: any[]): string[] {
    const colorCount = new Map<string, number>();
    
    analyses.forEach(analysis => {
      analysis.frequentColors.forEach((color: string) => {
        colorCount.set(color, (colorCount.get(color) || 0) + 1);
      });
    });

    return Array.from(colorCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => color);
  }
}
