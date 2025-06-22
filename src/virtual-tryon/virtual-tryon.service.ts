import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VirtualTryonSession } from './entities/virtual-tryon-session.entity';
import { Cliente } from '../cliente/entities/cliente.entity';
import { Producto } from '../producto/entities/producto.entity';
import { CreateTryonDto, CreateTryonFromBase64Dto } from './dto/create-virtual-tryon.dto';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// IMPORT CORRECTO según documentación oficial
const Replicate = require("replicate");

@Injectable()
export class VirtualTryonService {
  private readonly logger = new Logger(VirtualTryonService.name);
  private readonly replicate: any;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(VirtualTryonSession)
    private readonly tryonSessionRepository: Repository<VirtualTryonSession>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
  ) {
    const replicateToken = this.configService.get<string>('REPLICATE_API_TOKEN');
    if (!replicateToken) {
      throw new Error('REPLICATE_API_TOKEN no encontrada en variables de entorno');
    }

    // Constructor oficial según documentación
    this.replicate = new Replicate({
      auth: replicateToken,
    });
  }

  async createTryonFromUrls(
    tenantId: string, 
    clienteId: string, 
    createTryonDto: CreateTryonDto
  ): Promise<VirtualTryonSession> {
    try {
      const { userImageUrl, garmentImageUrl, productoId, metadata } = createTryonDto;

      // Verificar cliente
      const cliente = await this.clienteRepository.findOne({
        where: { id: clienteId, tenantId }
      });
      if (!cliente) {
        throw new NotFoundException('Cliente no encontrado');
      }

      // Verificar producto si se proporciona
      let producto: Producto | null = null;
      if (productoId) {
        producto = await this.productoRepository.findOne({
          where: { id: productoId, tenantId }
        });
        if (!producto) {
          throw new NotFoundException('Producto no encontrado');
        }
      }

      // Crear sesión
      const session = this.tryonSessionRepository.create({
        userImageUrl,
        garmentImageUrl,
        cliente,
        producto: producto || undefined,
        tenantId,
        status: 'pending',
        metadata
      });

      const savedSession = await this.tryonSessionRepository.save(session);

      // Ejecutar try-on en Replicate de forma asíncrona
      this.processVirtualTryon(savedSession.id);

      return savedSession;

    } catch (error) {
      this.logger.error('Error creando sesión de try-on:', error);
      throw new BadRequestException(`Error procesando try-on: ${error.message}`);
    }
  }

  async createTryonFromBase64(
    tenantId: string, 
    clienteId: string, 
    createTryonDto: CreateTryonFromBase64Dto
  ): Promise<VirtualTryonSession> {
    try {
      const { userImageBase64, garmentImageBase64, productoId, metadata } = createTryonDto;
  
      // Verificar cliente
      const cliente = await this.clienteRepository.findOne({
        where: { id: clienteId, tenantId }
      });
      if (!cliente) {
        throw new NotFoundException('Cliente no encontrado');
      }
  
      // Verificar producto si se proporciona
      let producto: Producto | null = null;
      if (productoId) {
        producto = await this.productoRepository.findOne({
          where: { id: productoId, tenantId }
        });
        if (!producto) {
          throw new NotFoundException('Producto no encontrado');
        }
      }
  
      const uploadDir = this.configService.get<string>('UPLOAD_DIR') || './public/uploads';
      const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
  
      // Procesar imagen del usuario (siempre base64)
      const userImagePath = await this.saveBase64Image(userImageBase64, uploadDir, 'user');
      const userImageUrl = `${baseUrl}/uploads/${path.basename(userImagePath)}`;
  
      // Procesar imagen de la prenda (puede ser base64 o URL)
      let garmentImageUrl: string;
      
      if (garmentImageBase64.startsWith('http://') || garmentImageBase64.startsWith('https://')) {
        // Es una URL, usarla directamente
        garmentImageUrl = garmentImageBase64;
      } else {
        // Es base64, guardarla como archivo
        const garmentImagePath = await this.saveBase64Image(garmentImageBase64, uploadDir, 'garment');
        garmentImageUrl = `${baseUrl}/uploads/${path.basename(garmentImagePath)}`;
      }
  
      // Crear sesión
      const session = this.tryonSessionRepository.create({
        userImageUrl,
        garmentImageUrl,
        cliente,
        producto: producto || undefined,
        tenantId,
        status: 'pending',
        metadata
      });
  
      const savedSession = await this.tryonSessionRepository.save(session);
  
     
      this.processVirtualTryon(savedSession.id);
  
      return savedSession;
  
    } catch (error) {
      this.logger.error('Error creando sesión de try-on desde base64:', error);
      throw new BadRequestException(`Error procesando try-on: ${error.message}`);
    }
  }

  private async saveBase64Image(base64Data: string, uploadDir: string, prefix: string): Promise<string> {
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Extraer tipo de imagen y datos
    const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      throw new BadRequestException('Formato de imagen base64 inválido');
    }

    const imageType = matches[1];
    const imageData = matches[2];
    const fileName = `${prefix}_${uuidv4()}.${imageType}`;
    const filePath = path.join(uploadDir, fileName);

    // Guardar archivo
    fs.writeFileSync(filePath, imageData, 'base64');

    return filePath;
  }

  private async processVirtualTryon(sessionId: string): Promise<void> {
    try {
      this.logger.log(`Iniciando procesamiento de try-on para sesión ${sessionId}`);
  
      await this.tryonSessionRepository.update(sessionId, { 
        status: 'processing' 
      });
  
      const session = await this.tryonSessionRepository.findOne({
        where: { id: sessionId }
      });
  
      if (!session) {
        throw new Error('Sesión no encontrada');
      }
  
      // MÉTODO CORREGIDO para manejar streams
      try {
        const output = await this.replicate.run(
          "cuuupid/idm-vton:906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f",
          {
            input: {
              human_img: session.userImageUrl,
              garm_img: session.garmentImageUrl,
              garment_des: "high quality garment"
            }
          }
        );
  
        this.logger.log(`🔍 Tipo de output recibido:`, typeof output);
        this.logger.log(`🔍 Output es ReadableStream?:`, output instanceof ReadableStream);
  
        let resultUrl: string | null = null;
  
        // CASO 1: Si es un ReadableStream, procesarlo
        if (output instanceof ReadableStream) {
          this.logger.log(`📸 Procesando ReadableStream...`);
          
          // Convertir stream a buffer
          const reader = output.getReader();
          const chunks: Uint8Array[] = [];
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          
          // Combinar chunks
          const buffer = Buffer.concat(chunks);
          
          // Guardar como archivo temporal y crear URL pública
          const fileName = `result_${sessionId}_${Date.now()}.jpg`;
          const uploadDir = this.configService.get<string>('UPLOAD_DIR') || './public/uploads';
          const filePath = path.join(uploadDir, fileName);
          
          // Escribir archivo
          fs.writeFileSync(filePath, buffer);
          
          // Crear URL pública
          const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
          resultUrl = `${baseUrl}/uploads/${fileName}`;
          
          this.logger.log(`✅ Imagen guardada como: ${resultUrl}`);
        }
        // CASO 2: Si es un array con URLs
        else if (Array.isArray(output)) {
          resultUrl = output[0];
          this.logger.log(`📸 URL desde array: ${resultUrl}`);
        }
        // CASO 3: Si es string directo
        else if (typeof output === 'string') {
          resultUrl = output;
          this.logger.log(`📸 URL directa: ${resultUrl}`);
        }
        // CASO 4: Formato desconocido
        else {
          this.logger.warn(`⚠️ Formato no reconocido:`, output);
          resultUrl = null;
        }
  
        if (resultUrl) {
          await this.tryonSessionRepository.update(sessionId, {
            status: 'completed',
            resultImageUrl: resultUrl,
            replicateId: 'completed'
          });
          
          this.logger.log(`🎉 Try-on completado exitosamente! URL: ${resultUrl}`);
        } else {
          throw new Error('No se pudo extraer URL del resultado');
        }
  
      } catch (replicateError) {
        this.logger.error('Error con Replicate:', replicateError);
        
        // Fallback: usar predictions.create
        const prediction = await this.replicate.predictions.create({
          version: "906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f",
          input: {
            human_img: session.userImageUrl,
            garm_img: session.garmentImageUrl,
            garment_des: "high quality garment"
          }
        });
  
        await this.tryonSessionRepository.update(sessionId, {
          replicateId: prediction.id
        });
  
        // Polling para verificar estado
        await this.pollPredictionStatus(sessionId, prediction.id);
      }
  
    } catch (error) {
      this.logger.error(`Error procesando try-on para sesión ${sessionId}:`, error);
      
      await this.tryonSessionRepository.update(sessionId, {
        status: 'failed',
        errorMessage: error.message
      });
    }
  }

  // Método helper para manejar errores de forma segura
  private getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error && typeof error.message === 'string') return error.message;
    if (error && typeof error.toString === 'function') return error.toString();
    return 'Procesamiento falló en Replicate';
  }

  private async pollPredictionStatus(sessionId: string, predictionId: string): Promise<void> {
    const maxAttempts = 60; // 5 minutos máximo (60 intentos * 5 segundos)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const prediction = await this.replicate.predictions.get(predictionId);
        
        this.logger.log(`Estado de predicción ${predictionId}: ${prediction.status}`);

        if (prediction.status === 'succeeded') {
          await this.tryonSessionRepository.update(sessionId, {
            status: 'completed',
            resultImageUrl: Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
          });
          return;
        }

        if (prediction.status === 'failed') {
          await this.tryonSessionRepository.update(sessionId, {
            status: 'failed',
            errorMessage: this.getErrorMessage(prediction.error)
          });
          return;
        }

        if (prediction.status === 'canceled') {
          await this.tryonSessionRepository.update(sessionId, {
            status: 'failed',
            errorMessage: 'Procesamiento cancelado'
          });
          return;
        }

        // Esperar 5 segundos antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;

      } catch (error) {
        this.logger.error(`Error verificando estado de predicción ${predictionId}:`, error);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Si llegamos aquí, se agotaron los intentos
    await this.tryonSessionRepository.update(sessionId, {
      status: 'failed',
      errorMessage: 'Timeout: El procesamiento tomó demasiado tiempo'
    });
  }

  async getSessionStatus(tenantId: string, clienteId: string, sessionId: string): Promise<VirtualTryonSession> {
    const session = await this.tryonSessionRepository.findOne({
      where: { 
        id: sessionId, 
        tenantId,
        cliente: { id: clienteId }
      },
      relations: ['cliente', 'producto']
    });

    if (!session) {
      throw new NotFoundException('Sesión no encontrada');
    }

    return session;
  }

  async getClientSessions(tenantId: string, clienteId: string): Promise<VirtualTryonSession[]> {
    return this.tryonSessionRepository.find({
      where: { 
        tenantId,
        cliente: { id: clienteId }
      },
      relations: ['producto'],
      order: { createdAt: 'DESC' }
    });
  }

  async getAllSessions(tenantId: string): Promise<VirtualTryonSession[]> {
    return this.tryonSessionRepository.find({
      where: { tenantId },
      relations: ['cliente', 'producto'],
      order: { createdAt: 'DESC' }
    });
  }

  async retrySession(tenantId: string, clienteId: string, sessionId: string): Promise<VirtualTryonSession> {
    const session = await this.getSessionStatus(tenantId, clienteId, sessionId);

    if (session.status === 'processing') {
      throw new BadRequestException('La sesión ya está en procesamiento');
    }

    if (session.status === 'completed') {
      throw new BadRequestException('La sesión ya fue completada exitosamente');
    }

    // Reiniciar procesamiento
    await this.tryonSessionRepository.update(sessionId, {
      status: 'pending',
      errorMessage: undefined,
      resultImageUrl: undefined
    });

    this.processVirtualTryon(sessionId);

    return this.getSessionStatus(tenantId, clienteId, sessionId);
  }


  async verifyReplicateAccount(): Promise<any> {
    try {
      this.logger.log('🔍 Verificando estado de cuenta Replicate...');
      
      // Verificar que el token funciona
      const account = await this.replicate.accounts.current();
      this.logger.log('✅ Cuenta verificada:', account);
  
      // Probar con una predicción simple y barata
      const testPrediction = await this.replicate.predictions.create({
        version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4", // modelo muy barato para pruebas
        input: {
          prompt: "test"
        }
      });
  
      this.logger.log('✅ Test prediction creada:', testPrediction.id);
  
      return {
        accountVerified: true,
        username: account.username,
        testPredictionId: testPrediction.id,
        message: 'Cuenta Replicate funcionando correctamente'
      };
  
    } catch (error) {
      this.logger.error('❌ Error verificando cuenta Replicate:', error);
  
      // Analizar el tipo de error
      if (error.message?.includes('402')) {
        return {
          accountVerified: false,
          error: 'Billing still not enabled - wait 5-15 more minutes',
          message: 'La facturación aún no está activa. Espera unos minutos más.'
        };
      }
  
      if (error.message?.includes('401')) {
        return {
          accountVerified: false,
          error: 'Invalid API token',
          message: 'Token de API inválido. Verifica tu REPLICATE_API_TOKEN'
        };
      }
  
      return {
        accountVerified: false,
        error: error.message,
        message: 'Error desconocido verificando cuenta'
      };
    }
  }


}