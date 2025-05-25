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

@Injectable()
export class ProductoService {
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
  ) {}

  async create(createProductDto: CreateProductDto) {
    console.log(createProductDto)
    try {
      const { imageUrls = [], productSizes, categoryId, ...productDetails } = createProductDto;
      
      const category = await this.categoriesService.findOne(categoryId);
      

      
      const product = this.productRepository.create({
        ...productDetails,
        category,
      });
      console.log(product, "hola")
      const savedProduct = await this.productRepository.save(product);
      
      
      const productSizeEntities: ProductoVariedad[]=[]
      
      for (const sizeData of productSizes) {

        const size = await this.sizeRepository.findOne({ where: { id: sizeData.size } });
      
        if (!size) {
          throw new NotFoundException(`Size with ID ${sizeData.size} not found`);
        }
        
        const productSize = this.productSizeRepository.create({
          producto: savedProduct,
          size: size,
          color:sizeData.color,
          quantity: sizeData.quantity,
          price: sizeData.price,
        });
        
        productSizeEntities.push(productSize);
      }
      console.log(productSizeEntities, "holaaa")
      
      await this.productSizeRepository.save(productSizeEntities);
      
      
      if (imageUrls.length > 0) {
        const imageEntities = imageUrls.map(url => 
          this.productImageRepository.create({
            url,
            productId: savedProduct
          })
        );
        
        await this.productImageRepository.save(imageEntities);
      }
      
    
      return this.findOne(savedProduct.id);
      
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(filters?: ProductFilterInterface) {
    const queryBuilder = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.productoVariedad', 'productoVariedad')
      .leftJoinAndSelect('product.images', 'images');

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
      
      if (filters.active !== undefined) {
        queryBuilder.andWhere('product.isActive = :active', { active: filters.active });
      }
      
      if (filters.search) {
        queryBuilder.andWhere('product.name LIKE :search OR product.description LIKE :search', 
          { search: `%${filters.search}%` });
      }
    }
    
    return queryBuilder.getMany();
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: [
        'category',
        'productoVariedad',
        'images'
      ]
    });
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductoDto) {
    try {
      const { categoryId, productSizes, imageUrls, ...toUpdate } = updateProductDto;
      
      const producto = await this.productRepository.findOne({
        where: { id },
        relations: ['productoVariedad', 'category', 'images']
      });
      
      if (!producto) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }
    
      if (categoryId) {
        const category = await this.categoriesService.findOne(categoryId);
        producto.category = category;
      }
      
      Object.assign(producto, toUpdate);
      
     
      await this.productRepository.save(producto);
      
      if (productSizes && productSizes.length > 0) {
    
        const variedadesActuales = await this.productSizeRepository.find({
          where: { producto: { id } }
        });
        
        const mapaVariedadesActuales = new Map();
        variedadesActuales.forEach(variedad => {
          const key = `${variedad.size}-${variedad.color}`;
          mapaVariedadesActuales.set(key, variedad);
        });
        
        const variedadesACrear: ProductoVariedad[] = []
        const variedadesAActualizar: ProductoVariedad[] = [];
        const keysNuevasVariedades = new Set();
        
        for (const nuevaVariedad of productSizes) {
          const key = `${nuevaVariedad.size}-${nuevaVariedad.color}`;
          keysNuevasVariedades.add(key);

          const size = await this.sizeRepository.findOne({ where: { id: nuevaVariedad.size } });
      
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
                Id: id,
                size: size,
                color: nuevaVariedad.color,
                quantity: nuevaVariedad.quantity,
                price: nuevaVariedad.price,
                producto
              })
            );
          }
        }
        
        const variedadesAEliminar = variedadesActuales.filter(variedad => {
          const key = `${variedad.size}-${variedad.color}`;
          return !keysNuevasVariedades.has(key);
        });
      
        await this.dataSource.transaction(async manager => {
          if (variedadesAEliminar.length > 0) {
            await manager.remove(variedadesAEliminar);
          }
          
          // Actualizar variantes existentes
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
              productId: producto
            })
          );
          
          await this.productImageRepository.save(imagenesNuevas);
        }
      }
      
      return this.findOne(id);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    try {
   
      const producto = await this.findOne(id);
  
      if (!producto) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }
  
      producto.isActive = false;
  
      await this.productRepository.save(producto);
      
      return {
        message: `Producto con ID ${id} fue desactivado exitosamente`,
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
  
  async findByCategory(categoryId: string) {
    return this.findAll({ categoryId });
  }
  
  async findBySubcategory(subcategory: string) {
    return this.findAll({ subcategory });
  }
  
  private handleDBExceptions(error: any) {
    if (error.code === '23505')
      throw new BadRequestException(error.detail);
      
    console.error(error);
    throw new BadRequestException('Unexpected error, check server logs');
  }
}