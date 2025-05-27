import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  ParseFilePipe, 
  MaxFileSizeValidator, 
  FileTypeValidator,
  Body,
  Query,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiSearchService } from './ai-search.service';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';
import { TenantFuncionalidadAuth } from '../common/decorators/tenant-auth.decorator';

@Controller('ai-search')
export class AiSearchController {
  constructor(private readonly aiSearchService: AiSearchService) {}

  @Post('search-by-image')
  @UseInterceptors(FileInterceptor('image'))
  @TenantFuncionalidadAuth('buscar-productos-ia')
  async searchByImage(
    @GetTenantId() tenantId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/i }),
        ],
      }),
    ) image: Express.Multer.File,
    @Query('limit') limit?: string,
    @Query('minSimilarity') minSimilarity?: string
  ) {
    const searchLimit = Math.min(parseInt(limit || '10') || 50); // Máximo 50
    const similarity = Math.max(parseFloat(minSimilarity|| '0.3') || 0.1); // Mínimo 0.1

    return await this.aiSearchService.searchSimilarProducts(
      tenantId,
      image,
      searchLimit,
      similarity
    );
  }

  @Post('search-by-url')
  @TenantFuncionalidadAuth('buscar-productos-ia')
  async searchByUrl(
    @GetTenantId() tenantId: string,
    @Body('imageUrl') imageUrl: string,
    @Body('limit') limit: number = 10,
    @Body('minSimilarity') minSimilarity: number = 0.3
  ) {
    if (!imageUrl) {
      throw new BadRequestException('imageUrl es requerida');
    }

    const searchLimit = Math.min(limit, 50);
    const similarity = Math.max(minSimilarity, 0.1);

    return await this.aiSearchService.searchSimilarProductsByUrl(
      tenantId,
      imageUrl,
      searchLimit,
      similarity
    );
  }
}
