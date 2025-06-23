import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Producto } from './entities/producto.entity';
import { ProductoVariedad } from './entities/productoVariedad.entity';
import { CreateProductDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { CategoriaService } from '../categoria/categoria.service';

import { ProductoImage } from './entities/ProductoImagen.entity';
import { ProductFilterInterface } from './interface/product-filter.interface';
import { Size } from '../size/entities/size.entity';
import { TenantBaseService } from '../common/services/tenant-base.service';

@Injectable()
export class ProductoService extends TenantBaseService<Producto> {
  constructor(
    @InjectRepository(Producto)
    private readonly productRepository: Repository<Producto>,
    
    @InjectRepository(ProductoVariedad)
    private readonly productSizeRepository: Repository<ProductoVariedad>,
    
    @InjectRepository(ProductoImage)
    private readonly productImageRepository: Repository<ProductoImage>,
    
    private readonly categoriesService: CategoriaService,

    @InjectRepository(Size)
    private readonly sizeRepository: Repository<Size>,

    private readonly dataSource: DataSource,
  ) {
    super(productRepository)
  }

  async create(tenantId: string, createProductDto: CreateProductDto) {
    try {
      const { imageUrls = [], productSizes, categoryId, ...productDetails } = createProductDto;
      
      const category = await this.categoriesService.findOne(tenantId, categoryId);
      
      const productData = {
        ...productDetails,
        category,
        tenantId
      };
      
      const product = this.productRepository.create(productData);
      const savedProduct = await this.productRepository.save(product);
      
      const productSizeEntities: ProductoVariedad[] = [];
      
      for (const sizeData of productSizes) {
        const size = await this.sizeRepository.findOne({ 
          where: { id: sizeData.size, tenantId } 
        });
      
        if (!size) {
          throw new NotFoundException(`Size with ID ${sizeData.size} not found`);
        }
        
        const productSize = this.productSizeRepository.create({
          producto: savedProduct,
          size: size,
          color: sizeData.color,
          quantity: sizeData.quantity,
          price: sizeData.price,
          tenantId
        });
        
        productSizeEntities.push(productSize);
      }
      
      await this.productSizeRepository.save(productSizeEntities);
      
      if (imageUrls.length > 0) {
        const imageEntities = imageUrls.map(url => 
          this.productImageRepository.create({
            url,
            productId: savedProduct,
            tenantId
          })
        );
        
        await this.productImageRepository.save(imageEntities);
      }
      
      return this.findOne(tenantId, savedProduct.id);
      
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(tenantId: string, filters?: ProductFilterInterface) {
    const queryBuilder = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.productoVariedad', 'productoVariedad')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.tenantId = :tenantId', { tenantId });

    if (filters?.active !== undefined) {
      queryBuilder.andWhere('product.isActive = :active', { active: filters.active });
    } else {
      queryBuilder.andWhere('product.isActive = :active', { active: true });
    }
    
    if (filters) {
      if (filters.categoryId) {
        queryBuilder.andWhere('category.id = :categoryId', { categoryId: filters.categoryId });
      }
      
      if (filters.subcategory) {
        queryBuilder.andWhere('product.subcategory = :subcategory', { subcategory: filters.subcategory });
      }
      
      if (filters.search) {
        queryBuilder.andWhere('(product.name LIKE :search OR product.description LIKE :search)', 
          { search: `%${filters.search}%` });
      }
    }
    
    return queryBuilder.getMany();
  }


  async findAllProductVarieties(tenantId: string) {
    try {
      const productVarieties = await this.productSizeRepository.find({
        where: { tenantId },
        relations: [
          'producto',
          'size'
        ],
        select: {
          Id: true,
          color: true,
          price: true,
          producto: {
            id: true,
            name: true
          },
          size: {
            id: true,
            name: true
          }
        }
      });
  
      return productVarieties.map(variety => ({
        id: variety.Id,
        productoNombre: variety.producto.name,
        tallaNombre: variety.size.name,
        color: variety.color,
        precio: variety.price,
        productoId: variety.producto.id,
        tallaId: variety.size.id
      }));
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.productRepository.findOne({
      where: { id, tenantId },
      relations: [
        'category',
        'productoVariedad',
        'productoVariedad.size',
        'images'
      ]
    });
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    
    return product;
  }

  async update(tenantId: string, id: string, updateProductDto: UpdateProductoDto) {
    try {
      const { categoryId, productSizes, imageUrls, ...toUpdate } = updateProductDto;
      
      const producto = await this.findOne(tenantId, id);
      
      if (categoryId) {
        const category = await this.categoriesService.findOne(tenantId, categoryId);
        producto.category = category;
      }
      
      Object.assign(producto, toUpdate);
      await this.productRepository.save(producto);
      
      if (productSizes && productSizes.length > 0) {
        const variedadesActuales = await this.productSizeRepository.find({
          where: { producto: { id }, tenantId },
          relations: ['size']
        });
        
        const mapaVariedadesActuales = new Map();
        variedadesActuales.forEach(variedad => {
          const key = `${variedad.size.id}-${variedad.color}`;
          mapaVariedadesActuales.set(key, variedad);
        });
        
        const variedadesACrear: ProductoVariedad[] = [];
        const variedadesAActualizar: ProductoVariedad[] = [];
        const keysNuevasVariedades = new Set();
        
        for (const nuevaVariedad of productSizes) {
          const key = `${nuevaVariedad.size}-${nuevaVariedad.color}`;
          keysNuevasVariedades.add(key);

          const size = await this.sizeRepository.findOne({ 
            where: { id: nuevaVariedad.size, tenantId } 
          });
      
          if (!size) {
            throw new NotFoundException(`Size with ID ${nuevaVariedad.size} not found`);
          }
          
          if (mapaVariedadesActuales.has(key)) {
            const variedadExistente = mapaVariedadesActuales.get(key);
            variedadExistente.quantity = nuevaVariedad.quantity;
            variedadExistente.price = nuevaVariedad.price;
            variedadesAActualizar.push(variedadExistente);
          } else {
            variedadesACrear.push(
              this.productSizeRepository.create({
                size: size,
                color: nuevaVariedad.color,
                quantity: nuevaVariedad.quantity,
                price: nuevaVariedad.price,
                producto,
                tenantId
              })
            );
          }
        }
        
        const variedadesAEliminar = variedadesActuales.filter(variedad => {
          const key = `${variedad.size.id}-${variedad.color}`;
          return !keysNuevasVariedades.has(key);
        });
      
        await this.dataSource.transaction(async manager => {
          if (variedadesAEliminar.length > 0) {
            await manager.remove(variedadesAEliminar);
          }
          
          if (variedadesAActualizar.length > 0) {
            await manager.save(variedadesAActualizar);
          }
          
          if (variedadesACrear.length > 0) {
            await manager.save(variedadesACrear);
          }
        });
      }
      
      if (imageUrls) {
        if (producto.images?.length > 0) {
          await this.productImageRepository.remove(producto.images);
        }
        
        if (imageUrls.length > 0) {
          const imagenesNuevas = imageUrls.map(url => 
            this.productImageRepository.create({
              url,
              productId: producto,
              tenantId
            })
          );
          
          await this.productImageRepository.save(imagenesNuevas);
        }
      }
      
      return this.findOne(tenantId, id);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(tenantId: string, id: string) {
    try {
      const producto = await this.findOne(tenantId, id);
      producto.isActive = false;
      await this.productRepository.save(producto);
      
      return {
        message: `Producto con ID ${id} fue desactivado exitosamente`,
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
  
  async findByCategory(tenantId: string, categoryId: string) {
    return this.findAll(tenantId, { categoryId });
  }
  
  async findBySubcategory(tenantId: string, subcategory: string) {
    return this.findAll(tenantId, { subcategory });
  }
  
  private handleDBExceptions(error: any) {
    if (error.code === '23505')
      throw new BadRequestException(error.detail);
      
    console.error(error);
    throw new BadRequestException('Unexpected error, check server logs');
  }


}