import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from '../producto/entities/producto.entity';
import { ProductoImage } from '../producto/entities/ProductoImagen.entity';
import { ClothingAnalysis, SearchResult, SimilarProduct } from './interfaces/ai-search.interfaces';
import axios from 'axios';



@Injectable()
export class AiSearchService {
  private readonly logger = new Logger(AiSearchService.name);
  private readonly openaiApiKey: string;
  private readonly openaiApiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(ProductoImage)
    private readonly productoImageRepository: Repository<ProductoImage>,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY no encontrada en variables de entorno');
    }
  }

  async searchSimilarProducts(
    tenantId: string,
    imageFile: Express.Multer.File,
    limit: number = 10,
    minSimilarity: number = 0.3
  ): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Iniciando búsqueda para tenant ${tenantId}`);

      // 1. Analizar la imagen con OpenAI
      const analysis = await this.analyzeImageWithOpenAI(imageFile.buffer);
      
      // 2. Buscar productos similares
      const similarProducts = await this.findSimilarProducts(
        tenantId, 
        analysis, 
        limit, 
        minSimilarity
      );

      const searchTime = Date.now() - startTime;

      return {
        success: true,
        analysis,
        results: similarProducts,
      };

    } catch (error) {
      this.logger.error('Error en búsqueda:', error);
      throw new BadRequestException(`Error procesando búsqueda: ${error.message}`);
    }
  }

  async searchSimilarProductsByUrl(
    tenantId: string,
    imageUrl: string,
    limit: number = 10,
    minSimilarity: number = 0.3
  ): Promise<SearchResult> {
    try {
      // Descargar imagen desde URL
      const response = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 10000 // 10 segundos timeout
      });
      
      const imageBuffer = Buffer.from(response.data);
      
      // Simular objeto file
      const mockFile: Express.Multer.File = {
        buffer: imageBuffer,
        size: imageBuffer.length,
        mimetype: response.headers['content-type'] || 'image/jpeg'
      } as Express.Multer.File;

      return await this.searchSimilarProducts(tenantId, mockFile, limit, minSimilarity);

    } catch (error) {
      this.logger.error('Error descargando imagen:', error);
      throw new BadRequestException('No se pudo procesar la imagen desde la URL');
    }
  }

  private async analyzeImageWithOpenAI(imageBuffer: Buffer): Promise<ClothingAnalysis> {
    try {
      const base64Image = imageBuffer.toString('base64');
      
      const requestPayload = {
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analiza esta imagen de ropa y extrae información detallada. 
                Responde ÚNICAMENTE en formato JSON válido con esta estructura:
                {
                  "tipo": "tipo específico de prenda (camisa, pantalón, vestido, chaqueta, etc.)",
                  "colores": ["color1", "color2", "color3"],
                  "estilo": "estilo específico (casual, formal, deportivo, elegante, bohemio, etc.)",
                  "material": "material aparente (algodón, denim, seda, lana, poliéster, etc.)",
                  "patron": "patrón o diseño (liso, rayas, cuadros, floral, geométrico, etc.)",
                  "confianza": 0.95
                }
                
                Sé específico y preciso. Incluye todos los colores visibles ordenados por predominancia.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "low" // Optimizar costo
                }
              }
            ]
          }
        ],
        max_tokens: 200,
        temperature: 0.1,
        response_format: { type: "json_object" }
      };

      this.logger.log('Enviando solicitud a OpenAI...');
      
      const response = await axios.post(this.openaiApiUrl, requestPayload, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 segundos timeout
      });

      const content = response.data.choices[0].message.content;
      const usage = response.data.usage;
      
      this.logger.log(`OpenAI response - Tokens: ${usage.total_tokens}, Cost: ~$${this.estimateTokenCost(usage)}`);

      try {
        const analysis = JSON.parse(content);
        
        // Validar estructura
        return {
          tipo: analysis.tipo || 'prenda',
          colores: Array.isArray(analysis.colores) ? analysis.colores : ['neutro'],
          estilo: analysis.estilo || 'casual',
          material: analysis.material || 'algodón',
          patron: analysis.patron || 'liso',
        };
        
      } catch (parseError) {
        this.logger.warn('Error parsing JSON, usando fallback:', content);
        return this.parseAnalysisManually(content);
      }

    } catch (error) {
      this.logger.error('Error llamando OpenAI:', error);
      
      if (error.response?.status === 429) {
        throw new BadRequestException('Límite de requests excedido. Intenta en unos minutos.');
      }
      
      if (error.response?.status === 401) {
        throw new BadRequestException('API Key de OpenAI inválida');
      }
      
      throw new BadRequestException('Error analizando imagen con IA');
    }
  }

  private async findSimilarProducts(
    tenantId: string,
    analysis: ClothingAnalysis,
    limit: number,
    minSimilarity: number
  ): Promise<SimilarProduct[]> {
    
    this.logger.log(`Buscando productos similares para: ${analysis.tipo} ${analysis.colores.join(', ')}`);
    
    // Obtener todos los productos activos del tenant
    const productos = await this.productoRepository.find({
      where: { 
        tenantId,
        isActive: true 
      },
      relations: [
        'category',
        'productoVariedad',
        'productoVariedad.size',
        'images'
      ]
    });

    const results: SimilarProduct[] = [];

    for (const producto of productos) {
      const similarity = this.calculateProductSimilarity(producto, analysis);
      
      if (similarity >= minSimilarity) {
        const precios = producto.productoVariedad.map(v => v.price);
        
        results.push({
          id: producto.id,
          name: producto.name,
          description: producto.description,
          images: producto.images.map(img => img.url),
          category: producto.category.name,
          subcategory: producto.subcategory,
          similarity: Number(similarity.toFixed(3)),
          price: {
            min: Math.min(...precios),
            max: Math.max(...precios)
          },
          
          variants: producto.productoVariedad.length,
          matchReasons: this.getMatchReasons(producto, analysis)
        });
      }
    }

    // Ordenar por similitud descendente
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  private calculateProductSimilarity(producto: any, analysis: ClothingAnalysis): number {
    let score = 0;
    const weights = {
      tipo: 0.35,      // Más importante
      colores: 0.25,   // Muy importante
      estilo: 0.20,    // Importante
      material: 0.15,  // Moderado
      patron: 0.05     // Menos importante
    };

    const searchText = `${producto.name} ${producto.description} ${producto.subcategory} ${producto.category.name}`.toLowerCase();

    // Evaluar tipo de prenda
    if (this.containsWord(searchText, analysis.tipo)) {
      score += weights.tipo;
    }

    // Evaluar colores (puede haber múltiples matches)
    const colorMatches = analysis.colores.filter(color => 
      this.containsWord(searchText, color)
    ).length;
    
    if (colorMatches > 0) {
      score += weights.colores * (colorMatches / analysis.colores.length);
    }

    // Evaluar estilo
    if (this.containsWord(searchText, analysis.estilo)) {
      score += weights.estilo;
    }

    // Evaluar material
    if (this.containsWord(searchText, analysis.material)) {
      score += weights.material;
    }

    // Evaluar patrón
    if (this.containsWord(searchText, analysis.patron)) {
      score += weights.patron;
    }

    // Bonus por matches parciales
    const allTerms = [analysis.tipo, ...analysis.colores, analysis.estilo, analysis.material, analysis.patron];
    const partialMatches = allTerms.filter(term => 
      searchText.includes(term.toLowerCase().substring(0, 4))
    ).length;

    score += (partialMatches * 0.02); // Pequeño bonus

    return Math.min(score, 1.0); // Máximo 1.0
  }

  private containsWord(text: string, word: string): boolean {
    if (!word || word.length < 2) return false;
    
    const normalizedWord = word.toLowerCase().trim();
    const normalizedText = text.toLowerCase();
    
    // Buscar palabra completa o como parte de otra palabra
    return normalizedText.includes(normalizedWord);
  }

  private getMatchReasons(producto: any, analysis: ClothingAnalysis): string[] {
    const reasons: string[] = [];
    const searchText = `${producto.name} ${producto.description} ${producto.subcategory}`.toLowerCase();

    if (this.containsWord(searchText, analysis.tipo)) {
      reasons.push(`Mismo tipo: ${analysis.tipo}`);
    }

    analysis.colores.forEach(color => {
      if (this.containsWord(searchText, color)) {
        reasons.push(`Color: ${color}`);
      }
    });

    if (this.containsWord(searchText, analysis.estilo)) {
      reasons.push(`Estilo: ${analysis.estilo}`);
    }

    if (this.containsWord(searchText, analysis.material)) {
      reasons.push(`Material: ${analysis.material}`);
    }

    if (this.containsWord(searchText, analysis.patron)) {
      reasons.push(`Patrón: ${analysis.patron}`);
    }

    return reasons;
  }

  private parseAnalysisManually(content: string): ClothingAnalysis {
    // Fallback parser si JSON falla
    return {
      tipo: this.extractValue(content, 'tipo') || 'prenda',
      colores: this.extractArray(content, 'colores') || ['neutro'],
      estilo: this.extractValue(content, 'estilo') || 'casual',
      material: this.extractValue(content, 'material') || 'algodón',
      patron: this.extractValue(content, 'patron') || 'liso',
    };
  }

  private extractValue(text: string, key: string): string {
    const patterns = [
      new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, 'i'),
      new RegExp(`${key}\\s*[:=]\\s*([^,\\n}]+)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    
    return '';
  }

  private extractArray(text: string, key: string): string[] {
    const regex = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*)\\]`, 'i');
    const match = text.match(regex);
    
    if (match) {
      return match[1]
        .split(',')
        .map(item => item.replace(/["\s]/g, ''))
        .filter(item => item.length > 0);
    }
    
    return [];
  }

  private calculateCost(imageSize: number, confidence: number) {
    // Estimación de costos basada en tamaños típicos
    const baseTokens = 1000; // Tokens base para imagen en detail: "low"
    const responseTokens = 150; // Tokens promedio de respuesta
    
    const inputCost = (baseTokens / 1000) * 0.01;   // $0.01 per 1K input tokens
    const outputCost = (responseTokens / 1000) * 0.03; // $0.03 per 1K output tokens
    
    return {
      estimated: Number((inputCost + outputCost).toFixed(5)),
      tokens: {
        input: baseTokens,
        output: responseTokens,
        total: baseTokens + responseTokens
      }
    };
  }

  private estimateTokenCost(usage: any): string {
    const inputCost = (usage.prompt_tokens / 1000) * 0.01;
    const outputCost = (usage.completion_tokens / 1000) * 0.03;
    return (inputCost + outputCost).toFixed(5);
  }
}
