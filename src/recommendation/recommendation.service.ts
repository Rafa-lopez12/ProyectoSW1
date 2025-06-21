// src/recommendations/recommendations.service.ts
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';
import axios from 'axios';

import { Producto } from '../producto/entities/producto.entity';
import { ProductoVariedad } from '../producto/entities/productoVariedad.entity';
import { Venta } from '../venta/entities/venta.entity';
import { DetalleVenta } from '../venta/entities/detalleVenta.entity';
import { Cliente } from '../cliente/entities/cliente.entity';

import { 
  ProductRecommendation, 
  RecommendationAnalysis, 
  ClienteBehaviorInsight, 
  RecommendationContext 
} from './interface/recommendation.interfaces';
import { GetRecommendationsDto, RecommendationType, AnalyzeClientBehaviorDto } from './dto/get-recommendations.dto';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
  private readonly openaiApiKey: string;
  private readonly openaiApiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(ProductoVariedad)
    private readonly productoVariedadRepository: Repository<ProductoVariedad>,
    @InjectRepository(Venta)
    private readonly ventaRepository: Repository<Venta>,
    @InjectRepository(DetalleVenta)
    private readonly detalleVentaRepository: Repository<DetalleVenta>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  async getRecommendations(
    tenantId: string,
    clienteId: string | null,
    dto: GetRecommendationsDto
  ): Promise<RecommendationAnalysis> {
    this.logger.log(`Generando recomendaciones tipo ${dto.type} para tenant ${tenantId}`);

    const context: RecommendationContext = {
      clienteId: clienteId || undefined,
      categoryId: dto.categoryId,
      subcategory: dto.subcategory,
      priceRange: dto.minPrice || dto.maxPrice ? {
        min: dto.minPrice || 0,
        max: dto.maxPrice || Number.MAX_SAFE_INTEGER
      } : undefined,
      excludeProductIds: dto.excludeProductIds,
      includeOutOfStock: dto.includeOutOfStock
    };

    switch (dto.type) {
      case RecommendationType.BESTSELLER:
        return this.getBestsellerRecommendations(tenantId, context, dto.limit!);
      
      case RecommendationType.SIMILAR:
        if (!dto.basedOnProductId) {
          throw new BadRequestException('basedOnProductId es requerido para recomendaciones similares');
        }
        return this.getSimilarProductRecommendations(tenantId, dto.basedOnProductId, context, dto.limit!);
      
      case RecommendationType.PERSONALIZED:
        if (!clienteId) {
          // Si no hay cliente, usar bestsellers como fallback
          return this.getBestsellerRecommendations(tenantId, context, dto.limit!);
        }
        return this.getPersonalizedRecommendations(tenantId, clienteId, context, dto.limit!);
      
      case RecommendationType.NEW_ARRIVALS:
        return this.getNewArrivalsRecommendations(tenantId, context, dto.limit!);
      
      default:
        return this.getBestsellerRecommendations(tenantId, context, dto.limit!);
    }
  }

  private async getBestsellerRecommendations(
    tenantId: string, 
    context: RecommendationContext, 
    limit: number
  ): Promise<RecommendationAnalysis> {
    // Obtener productos más vendidos basado en cantidad vendida
    const query = this.detalleVentaRepository
      .createQueryBuilder('detalle')
      .select('detalle.productoVariedadId', 'productoVariedadId')
      .addSelect('SUM(detalle.cantidad)', 'totalVendido')
      .addSelect('COUNT(DISTINCT detalle.ventaId)', 'numeroVentas')
      .leftJoin('detalle.venta', 'venta')
      .leftJoin('detalle.productoVariedad', 'variedad')
      .leftJoin('variedad.producto', 'producto')
      .where('detalle.tenantId = :tenantId', { tenantId })
      .andWhere('venta.estado = :estado', { estado: 'completada' })
      .andWhere('producto.isActive = true');

    // Aplicar filtros de contexto
    this.applyContextFilters(query, context);

    const ventas = await query
      .groupBy('detalle.productoVariedadId')
      .orderBy('totalVendido', 'DESC')
      .addOrderBy('numeroVentas', 'DESC')
      .limit(limit * 2) // Obtenemos más para tener opciones
      .getRawMany();

    const recommendations = await this.buildRecommendationsFromSalesData(
      tenantId, 
      ventas, 
      'bestseller', 
      limit
    );

    return {
      totalProducts: recommendations.length,
      categoriesAnalyzed: await this.countCategories(tenantId, context),
      salesDataPoints: ventas.length,
      analysisDate: new Date(),
      recommendations,
      insights: await this.generateInsights(tenantId, recommendations)
    };
  }

  private async getPersonalizedRecommendations(
    tenantId: string, 
    clienteId: string, 
    context: RecommendationContext, 
    limit: number
  ): Promise<RecommendationAnalysis> {
    // Analizar comportamiento del cliente
    const clienteBehavior = await this.analyzeClientBehavior(tenantId, clienteId);
    
    // Obtener productos que compró antes
    const productosComprados = await this.detalleVentaRepository
      .createQueryBuilder('detalle')
      .select('DISTINCT producto.id', 'id')
      .leftJoin('detalle.venta', 'venta')
      .leftJoin('detalle.productoVariedad', 'variedad')
      .leftJoin('variedad.producto', 'producto')
      .where('venta.cliente.id = :clienteId', { clienteId })
      .andWhere('detalle.tenantId = :tenantId', { tenantId })
      .andWhere('venta.estado = :estado', { estado: 'completada' })
      .getRawMany();

    const productosCompradosIds = productosComprados.map(p => p.id);

    // Buscar productos similares basados en categorías preferidas
    const query = this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.category', 'category')
      .leftJoinAndSelect('producto.productoVariedad', 'variedad')
      .leftJoinAndSelect('variedad.size', 'size')
      .leftJoinAndSelect('producto.images', 'images')
      .where('producto.tenantId = :tenantId', { tenantId })
      .andWhere('producto.isActive = true')
      .andWhere('producto.id NOT IN (:...excludeIds)', { 
        excludeIds: [...productosCompradosIds, ...(context.excludeProductIds || [])]
      });

    // Filtrar por categorías preferidas del cliente
    if (clienteBehavior.preferredCategories.length > 0) {
      query.andWhere('category.name IN (:...categories)', { 
        categories: clienteBehavior.preferredCategories 
      });
    }

    // Filtrar por rango de precio preferido del cliente
    if (clienteBehavior.pricePreference !== 'budget') {
      const priceFilter = this.getPriceRangeForPreference(clienteBehavior.pricePreference);
      query.andWhere('variedad.price BETWEEN :minPrice AND :maxPrice', priceFilter);
    }

    this.applyContextFilters(query, context, 'producto');

    const productos = await query
      .limit(limit * 2)
      .getMany();

    // Usar IA para rankear recomendaciones personalizadas
    const recommendations = await this.rankPersonalizedRecommendations(
      productos, 
      clienteBehavior, 
      limit
    );

    return {
      totalProducts: recommendations.length,
      categoriesAnalyzed: await this.countCategories(tenantId, context),
      salesDataPoints: productosComprados.length,
      analysisDate: new Date(),
      recommendations,
      insights: await this.generateInsights(tenantId, recommendations)
    };
  }

  private async getSimilarProductRecommendations(
    tenantId: string, 
    productId: string, 
    context: RecommendationContext, 
    limit: number
  ): Promise<RecommendationAnalysis> {
    // Obtener el producto base
    const baseProduct = await this.productoRepository.findOne({
      where: { id: productId, tenantId },
      relations: ['category', 'productoVariedad', 'productoVariedad.size']
    });

    if (!baseProduct) {
      throw new NotFoundException('Producto base no encontrado');
    }

    // Buscar productos similares
    const query = this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.category', 'category')
      .leftJoinAndSelect('producto.productoVariedad', 'variedad')
      .leftJoinAndSelect('variedad.size', 'size')
      .leftJoinAndSelect('producto.images', 'images')
      .where('producto.tenantId = :tenantId', { tenantId })
      .andWhere('producto.isActive = true')
      .andWhere('producto.id != :baseProductId', { baseProductId: productId });

    // Priorizar misma categoría
    query.andWhere('producto.categoryId = :categoryId', { 
      categoryId: baseProduct.category.id 
    });

    // Priorizar misma subcategoría
    if (baseProduct.subcategory) {
      query.andWhere('producto.subcategory = :subcategory', { 
        subcategory: baseProduct.subcategory 
      });
    }

    // Rango de precio similar (+/- 30%)
    const avgPrice = baseProduct.productoVariedad.reduce((sum, v) => sum + v.price, 0) / baseProduct.productoVariedad.length;
    const priceMargin = avgPrice * 0.3;
    query.andWhere('variedad.price BETWEEN :minPrice AND :maxPrice', {
      minPrice: avgPrice - priceMargin,
      maxPrice: avgPrice + priceMargin
    });

    this.applyContextFilters(query, context, 'producto');

    const productos = await query
      .limit(limit * 2)
      .getMany();

    // Usar IA para análisis de similitud
    const recommendations = await this.rankSimilarProducts(baseProduct, productos, limit);

    return {
      totalProducts: recommendations.length,
      categoriesAnalyzed: 1, // Solo una categoría
      salesDataPoints: productos.length,
      analysisDate: new Date(),
      recommendations,
      insights: await this.generateInsights(tenantId, recommendations)
    };
  }

  private async getNewArrivalsRecommendations(
    tenantId: string, 
    context: RecommendationContext, 
    limit: number
  ): Promise<RecommendationAnalysis> {
    // Productos creados en los últimos 30 días
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 30);

    const query = this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.category', 'category')
      .leftJoinAndSelect('producto.productoVariedad', 'variedad')
      .leftJoinAndSelect('variedad.size', 'size')
      .leftJoinAndSelect('producto.images', 'images')
      .where('producto.tenantId = :tenantId', { tenantId })
      .andWhere('producto.isActive = true');
      // .andWhere('producto.createdAt >= :fechaInicio', { fechaInicio }); // Descomenta si tienes campo createdAt

    this.applyContextFilters(query, context, 'producto');

    const productos = await query
      .orderBy('producto.id', 'DESC') // Más recientes primero
      .limit(limit)
      .getMany();

    const recommendations = await this.convertProductsToRecommendations(
      productos, 
      'new_arrivals',
      'Producto recién agregado'
    );

    return {
      totalProducts: recommendations.length,
      categoriesAnalyzed: await this.countCategories(tenantId, context),
      salesDataPoints: productos.length,
      analysisDate: new Date(),
      recommendations,
      insights: await this.generateInsights(tenantId, recommendations)
    };
  }

  private async buildRecommendationsFromSalesData(
    tenantId: string,
    salesData: any[],
    tag: string,
    limit: number,
    defaultReason?: string
  ): Promise<ProductRecommendation[]> {
    const productIds = salesData.map(s => s.productoVariedadId);
    
    if (productIds.length === 0) {
      return [];
    }

    const productos = await this.productoVariedadRepository.find({
      where: { 
        Id: In(productIds),
        tenantId 
      },
      relations: ['producto', 'producto.category', 'producto.images', 'size']
    });

    return productos.slice(0, limit).map((variedad, index) => {
      const salesInfo = salesData.find(s => s.productoVariedadId === variedad.Id);
      const score = Math.max(0.1, Math.min(1, (salesData.length - index) / salesData.length));
      
      return {
        id: variedad.producto.id,
        name: variedad.producto.name,
        description: variedad.producto.description || '',
        images: variedad.producto.images?.map(img => img.url) || [],
        category: variedad.producto.category.name,
        subcategory: variedad.producto.subcategory,
        price: {
          min: variedad.price,
          max: variedad.price
        },
        score,
        reason: defaultReason || this.generateReasonForTag(tag, salesInfo),
        confidence: score,
        tags: [tag]
      };
    });
  }

  private async convertProductsToRecommendations(
    productos: Producto[],
    tag: string,
    defaultReason: string
  ): Promise<ProductRecommendation[]> {
    return productos.map((producto, index) => {
      const precios = producto.productoVariedad.map(v => v.price);
      const score = Math.max(0.1, Math.min(1, (productos.length - index) / productos.length));
      
      return {
        id: producto.id,
        name: producto.name,
        description: producto.description || '',
        images: producto.images?.map(img => img.url) || [],
        category: producto.category.name,
        subcategory: producto.subcategory,
        price: {
          min: Math.min(...precios),
          max: Math.max(...precios)
        },
        score,
        reason: defaultReason,
        confidence: score,
        tags: [tag]
      };
    });
  }

  private async rankPersonalizedRecommendations(
    productos: Producto[],
    clienteBehavior: ClienteBehaviorInsight,
    limit: number
  ): Promise<ProductRecommendation[]> {
    if (!this.openaiApiKey) {
      // Fallback sin IA
      return this.convertProductsToRecommendations(
        productos.slice(0, limit),
        'personalized',
        'Recomendado basado en tu historial de compras'
      );
    }

    try {
      const productData = productos.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category.name,
        subcategory: p.subcategory,
        description: p.description,
        prices: p.productoVariedad.map(v => v.price),
        colors: [...new Set(p.productoVariedad.map(v => v.color))],
        sizes: [...new Set(p.productoVariedad.map(v => v.size.name))]
      }));

      const prompt = `
      Analiza estos productos y rankéalos para un cliente con este perfil:
      
      Cliente:
      - Categorías preferidas: ${clienteBehavior.preferredCategories.join(', ')}
      - Valor promedio de compra: $${clienteBehavior.averageOrderValue}
      - Tallas frecuentes: ${clienteBehavior.frequentSizes.join(', ')}
      - Colores frecuentes: ${clienteBehavior.frequentColors.join(', ')}
      - Preferencia de precio: ${clienteBehavior.pricePreference}
      - Frecuencia de compra: ${clienteBehavior.purchaseFrequency}
      
      Productos disponibles:
      ${JSON.stringify(productData, null, 2)}
      
      Devuelve un JSON con los top ${limit} productos rankeados así:
      {
        "recommendations": [
          {
            "productId": "uuid",
            "score": 0.95,
            "reason": "Explicación específica de por qué encaja con el cliente",
            "confidence": 0.90
          }
        ]
      }
      
      Criterios de ranking:
      1. Match con categorías preferidas (30%)
      2. Match con rango de precio habitual (25%)
      3. Match con tallas/colores frecuentes (20%)
      4. Compatibilidad con frecuencia de compra (15%)
      5. Valor percibido vs presupuesto (10%)
      `;

      const response = await axios.post(this.openaiApiUrl, {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Eres un experto en recomendaciones de productos de moda. Analiza el perfil del cliente y rankea productos de forma personalizada."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
        response_format: { type: "json_object" }
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiRecommendations = JSON.parse(response.data.choices[0].message.content);
      
      // Convertir respuesta de IA a formato de recomendaciones
      const recommendations: ProductRecommendation[] = [];
      
      for (const aiRec of aiRecommendations.recommendations) {
        const producto = productos.find(p => p.id === aiRec.productId);
        if (producto) {
          const precios = producto.productoVariedad.map(v => v.price);
          
          recommendations.push({
            id: producto.id,
            name: producto.name,
            description: producto.description || '',
            images: producto.images?.map(img => img.url) || [],
            category: producto.category.name,
            subcategory: producto.subcategory,
            price: {
              min: Math.min(...precios),
              max: Math.max(...precios)
            },
            score: aiRec.score,
            reason: aiRec.reason,
            confidence: aiRec.confidence,
            tags: ['personalized', 'ai-powered']
          });
        }
      }

      return recommendations;

    } catch (error) {
      this.logger.warn('Error con IA, usando fallback:', error.message);
      return this.convertProductsToRecommendations(
        productos.slice(0, limit),
        'personalized',
        'Recomendado basado en tu historial de compras'
      );
    }
  }

  private async rankSimilarProducts(
    baseProduct: Producto,
    productos: Producto[],
    limit: number
  ): Promise<ProductRecommendation[]> {
    if (!this.openaiApiKey) {
      return this.convertProductsToRecommendations(
        productos.slice(0, limit),
        'similar',
        `Similar a ${baseProduct.name}`
      );
    }

    try {
      const baseProductData = {
        name: baseProduct.name,
        category: baseProduct.category.name,
        subcategory: baseProduct.subcategory,
        description: baseProduct.description,
        avgPrice: baseProduct.productoVariedad.reduce((sum, v) => sum + v.price, 0) / baseProduct.productoVariedad.length,
        colors: [...new Set(baseProduct.productoVariedad.map(v => v.color))],
        sizes: [...new Set(baseProduct.productoVariedad.map(v => v.size.name))]
      };

      const candidateProducts = productos.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category.name,
        subcategory: p.subcategory,
        description: p.description,
        avgPrice: p.productoVariedad.reduce((sum, v) => sum + v.price, 0) / p.productoVariedad.length,
        colors: [...new Set(p.productoVariedad.map(v => v.color))],
        sizes: [...new Set(p.productoVariedad.map(v => v.size.name))]
      }));

      const prompt = `
      Encuentra los productos más similares al producto base:
      
      Producto Base:
      ${JSON.stringify(baseProductData, null, 2)}
      
      Candidatos:
      ${JSON.stringify(candidateProducts, null, 2)}
      
      Devuelve los top ${limit} productos más similares en este formato:
      {
        "recommendations": [
          {
            "productId": "uuid",
            "score": 0.95,
            "reason": "Específico sobre por qué es similar",
            "confidence": 0.90
          }
        ]
      }
      
      Criterios de similitud:
      1. Misma categoría/subcategoría (40%)
      2. Rango de precio similar (25%)
      3. Colores similares (15%)
      4. Tallas compatibles (10%)
      5. Descripción/estilo similar (10%)
      `;

      const response = await axios.post(this.openaiApiUrl, {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system", 
            content: "Eres un experto en productos de moda. Analiza similitudes entre productos basándote en características objetivas."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.2,
        response_format: { type: "json_object" }
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiRecommendations = JSON.parse(response.data.choices[0].message.content);
      
      const recommendations: ProductRecommendation[] = [];
      
      for (const aiRec of aiRecommendations.recommendations) {
        const producto = productos.find(p => p.id === aiRec.productId);
        if (producto) {
          const precios = producto.productoVariedad.map(v => v.price);
          
          recommendations.push({
            id: producto.id,
            name: producto.name,
            description: producto.description || '',
            images: producto.images?.map(img => img.url) || [],
            category: producto.category.name,
            subcategory: producto.subcategory,
            price: {
              min: Math.min(...precios),
              max: Math.max(...precios)
            },
            score: aiRec.score,
            reason: aiRec.reason,
            confidence: aiRec.confidence,
            tags: ['similar', 'ai-powered']
          });
        }
      }

      return recommendations;

    } catch (error) {
      this.logger.warn('Error con IA para similitud, usando fallback:', error.message);
      return this.convertProductsToRecommendations(
        productos.slice(0, limit),
        'similar',
        `Similar a ${baseProduct.name}`
      );
    }
  }

  async analyzeClientBehavior(
    tenantId: string, 
    clienteId: string, 
    daysPeriod: number = 90
  ): Promise<ClienteBehaviorInsight> {
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - daysPeriod);

    // Obtener historial de compras
    const ventas = await this.ventaRepository.find({
      where: {
        tenantId,
        cliente: { id: clienteId },
        estado: 'completada',
        fechaVenta: MoreThanOrEqual(fechaInicio)
      },
      relations: [
        'detalles',
        'detalles.productoVariedad',
        'detalles.productoVariedad.producto',
        'detalles.productoVariedad.producto.category',
        'detalles.productoVariedad.size'
      ]
    });

    if (ventas.length === 0) {
      // Cliente nuevo o sin compras recientes
      return {
        clienteId,
        preferredCategories: [],
        averageOrderValue: 0,
        frequentSizes: [],
        frequentColors: [],
        lastPurchaseDate: new Date(),
        purchaseFrequency: 'low',
        pricePreference: 'budget'
      };
    }

    // Análisis de categorías
    const categoryCount = new Map<string, number>();
    const sizeCount = new Map<string, number>();
    const colorCount = new Map<string, number>();
    let totalAmount = 0;

    ventas.forEach(venta => {
      totalAmount += venta.total;
      
      venta.detalles.forEach(detalle => {
        const category = detalle.productoVariedad.producto.category.name;
        const size = detalle.productoVariedad.size.name;
        const color = detalle.productoVariedad.color;
        
        categoryCount.set(category, (categoryCount.get(category) || 0) + detalle.cantidad);
        sizeCount.set(size, (sizeCount.get(size) || 0) + detalle.cantidad);
        colorCount.set(color, (colorCount.get(color) || 0) + detalle.cantidad);
      });
    });

    // Top 3 de cada categoría
    const preferredCategories = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    const frequentSizes = Array.from(sizeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([size]) => size);

    const frequentColors = Array.from(colorCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([color]) => color);

    const averageOrderValue = totalAmount / ventas.length;
    const lastPurchaseDate = new Date(Math.max(...ventas.map(v => v.fechaVenta.getTime())));

    // Frecuencia de compra
    const daysSinceFirst = (Date.now() - Math.min(...ventas.map(v => v.fechaVenta.getTime()))) / (1000 * 60 * 60 * 24);
    const purchaseFrequency = ventas.length / daysSinceFirst > 0.1 ? 'high' : 
                             ventas.length / daysSinceFirst > 0.05 ? 'medium' : 'low';

    // Preferencia de precio
    const pricePreference = averageOrderValue > 200 ? 'premium' :
                           averageOrderValue > 80 ? 'mid-range' : 'budget';

    return {
      clienteId,
      preferredCategories,
      averageOrderValue,
      frequentSizes,
      frequentColors,
      lastPurchaseDate,
      purchaseFrequency,
      pricePreference
    };
  }

  // Métodos auxiliares
  private applyContextFilters(query: any, context: RecommendationContext, alias: string = 'producto'): void {
    if (context.categoryId) {
      query.andWhere(`${alias}.categoryId = :categoryId`, { categoryId: context.categoryId });
    }
    if (context.subcategory) {
      query.andWhere(`${alias}.subcategory = :subcategory`, { subcategory: context.subcategory });
    }
    if (context.priceRange) {
      if (alias === 'variedad') {
        query.andWhere(`${alias}.price BETWEEN :minPrice AND :maxPrice`, context.priceRange);
      } else {
        query.andWhere('variedad.price BETWEEN :minPrice AND :maxPrice', context.priceRange);
      }
    }
    if (!context.includeOutOfStock) {
      if (alias === 'variedad') {
        query.andWhere(`${alias}.quantity > 0`);
      } else {
        query.andWhere('variedad.quantity > 0');
      }
    }
    if (context.excludeProductIds?.length) {
      query.andWhere(`${alias}.id NOT IN (:...excludeIds)`, { excludeIds: context.excludeProductIds });
    }
  }

  private async countCategories(tenantId: string, context: RecommendationContext): Promise<number> {
    const query = this.productoRepository
      .createQueryBuilder('producto')
      .select('COUNT(DISTINCT producto.categoryId)', 'count')
      .where('producto.tenantId = :tenantId', { tenantId })
      .andWhere('producto.isActive = true');

    this.applyContextFilters(query, context);
    
    const result = await query.getRawOne();
    return parseInt(result.count) || 0;
  }

  private async generateInsights(
    tenantId: string, 
    recommendations: ProductRecommendation[]
  ): Promise<any> {
    if (recommendations.length === 0) {
      return {
        trendingCategories: [],
        popularPriceRange: { min: 0, max: 0 },
        topColors: [],
        topSizes: []
      };
    }

    const categories = [...new Set(recommendations.map(r => r.category))];
    const prices = recommendations.flatMap(r => [r.price.min, r.price.max]);
    
    // Obtener más insights de la base de datos
    const recentSalesData = await this.detalleVentaRepository
      .createQueryBuilder('detalle')
      .select('variedad.color', 'color')
      .addSelect('size.name', 'sizeName')
      .addSelect('COUNT(*)', 'frequency')
      .leftJoin('detalle.venta', 'venta')
      .leftJoin('detalle.productoVariedad', 'variedad')
      .leftJoin('variedad.size', 'size')
      .leftJoin('variedad.producto', 'producto')
      .where('detalle.tenantId = :tenantId', { tenantId })
      .andWhere('venta.estado = :estado', { estado: 'completada' })
      .andWhere('venta.fechaVenta >= :fechaInicio', { 
        fechaInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // últimos 30 días
      })
      .groupBy('variedad.color, size.name')
      .orderBy('frequency', 'DESC')
      .limit(10)
      .getRawMany();

    const topColors = [...new Set(recentSalesData.map(item => item.color))].slice(0, 5);
    const topSizes = [...new Set(recentSalesData.map(item => item.sizeName))].slice(0, 5);
    
    return {
      trendingCategories: categories.slice(0, 5),
      popularPriceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      },
      topColors,
      topSizes
    };
  }

  private generateReasonForTag(tag: string, salesInfo?: any): string {
    const reasons = {
      'bestseller': `Producto más vendido con ${salesInfo?.totalVendido || 'múltiples'} unidades vendidas`,
      'new_arrivals': 'Producto recién agregado a nuestro catálogo',
      'similar': 'Características similares al producto que estás viendo',
      'personalized': 'Recomendado especialmente para ti basado en tu historial'
    };
    
    return reasons[tag] || 'Recomendado para ti';
  }

  private getPriceRangeForPreference(preference: string): { minPrice: number; maxPrice: number } {
    const ranges = {
      'budget': { minPrice: 0, maxPrice: 80 },
      'mid-range': { minPrice: 50, maxPrice: 200 },
      'premium': { minPrice: 150, maxPrice: Number.MAX_SAFE_INTEGER }
    };
    
    return ranges[preference] || ranges['budget'];
  }

  // Método adicional para obtener estadísticas generales del tenant
  async getTenantInsights(tenantId: string): Promise<any> {
    const [
      totalProducts,
      totalSales,
      avgOrderValue,
      topCategories
    ] = await Promise.all([
      // Total productos activos
      this.productoRepository.count({
        where: { tenantId, isActive: true }
      }),

      // Total ventas completadas
      this.ventaRepository.count({
        where: { tenantId, estado: 'completada' }
      }),

      // Valor promedio de orden
      this.ventaRepository
        .createQueryBuilder('venta')
        .select('AVG(venta.total)', 'avg')
        .where('venta.tenantId = :tenantId', { tenantId })
        .andWhere('venta.estado = :estado', { estado: 'completada' })
        .getRawOne(),

      // Top categorías por ventas
      this.detalleVentaRepository
        .createQueryBuilder('detalle')
        .select('categoria.name', 'categoryName')
        .addSelect('SUM(detalle.cantidad)', 'totalSold')
        .leftJoin('detalle.venta', 'venta')
        .leftJoin('detalle.productoVariedad', 'variedad')
        .leftJoin('variedad.producto', 'producto')
        .leftJoin('producto.category', 'categoria')
        .where('detalle.tenantId = :tenantId', { tenantId })
        .andWhere('venta.estado = :estado', { estado: 'completada' })
        .groupBy('categoria.name')
        .orderBy('totalSold', 'DESC')
        .limit(5)
        .getRawMany()
    ]);

    return {
      totalProducts,
      totalSales,
      averageOrderValue: parseFloat(avgOrderValue?.avg || '0'),
      topCategories: topCategories.map(cat => ({
        name: cat.categoryName,
        totalSold: parseInt(cat.totalSold)
      })),
      analysisDate: new Date()
    };
  }
}
