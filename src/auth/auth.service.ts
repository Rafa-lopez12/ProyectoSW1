import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/auth.entity';
import { CreateUserDto } from './dto/create-auth.dto';
import { LoginUserDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Rol } from 'src/rol/entities/rol.entity';
import { TenantBaseService } from 'src/common/services/tenant-base.service';
import { UpdateUserDto } from './dto/updateUser.dto';

@Injectable()
export class AuthService extends TenantBaseService<User> {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,

    private readonly jwtService: JwtService,
  ) {
    super(userRepository)
  }

  async create(tenantId: string, createUserDto: CreateUserDto) {
    try {
      const { password, rolId, ...userData } = createUserDto;
      
      const rol = await this.rolRepository.findOne({ 
        where: { id: rolId, tenantId } 
      });
      if (!rol) {
        throw new Error('El rol especificado no existe');
      }

      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
        rol,
        tenantId
      });

      await this.userRepository.save(user)
      delete user[password];

      return {
        ...user,
        token: this.getJwtToken({ id: user.id, fullName: user.fullName })
      };

    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async login(tenantId: string, loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email, tenantId },
      select: { email: true, password: true, id: true, fullName: true, isActive: true },
      relations: ['rol']
    });

    if (!user) 
      throw new UnauthorizedException('Credentials are not valid (email)');
      
    if (!user.isActive) 
      throw new UnauthorizedException('User is inactive, talk with an admin');
      
    if (!bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException('Credentials are not valid (password)');

    delete user[password];

    return {
      ...user,
      token: this.getJwtToken({ id: user.id, fullName: user.fullName })
    };
  }

  async checkAuthStatus(user: User) {
    return {
      ...user,
      token: this.getJwtToken({ id: user.id, fullName: user.fullName })
    };
  }
  
  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private handleDBErrors(error: any): never {
    if (error.code === '23505') 
      throw new BadRequestException(error.detail);

    console.log(error)
    throw new InternalServerErrorException('Please check server logs');
  }


  async getAll(tenantId: string) {
    const users = await this.userRepository.find({
      where: { tenantId },
      relations: ['rol'],
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        rol: {
          id: true,
          nombre: true
        }
      }
    });

    return users.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      rolNombre: user.rol?.nombre || 'Sin rol',
      rolId: user.rol?.id || null
    }));
  }


  async findOne(tenantId: string, id: string) {
    const user = await this.userRepository.findOne({
      where: { id, tenantId },
      relations: ['rol'],
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        rol: {
          id: true,
          nombre: true
        }
      }
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      rolNombre: user.rol?.nombre || 'Sin rol',
      rolId: user.rol?.id || null
    };
  }

  async update(tenantId: string, id: string, updateData: UpdateUserDto) {
    try {
      const user = await this.userRepository.findOne({
        where: { id, tenantId },
        relations: ['rol']
      });

      if (!user) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      const { password, rolId, ...otherData } = updateData;

      // Actualizar datos básicos
      Object.assign(user, otherData);

      // Si se proporciona una nueva contraseña, encriptarla
      if (password) {
        user.password = bcrypt.hashSync(password, 10);
      }

      // Si se proporciona un nuevo rol, verificar que existe en el tenant
      if (rolId) {
        const rol = await this.rolRepository.findOne({ 
          where: { id: rolId, tenantId } 
        });
        if (!rol) {
          throw new BadRequestException('El rol especificado no existe en este tenant');
        }
        user.rol = rol;
      }

      const updatedUser = await this.userRepository.save(user);

      // Retornar sin la contraseña
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      return {
        ...userWithoutPassword,
        rolNombre: updatedUser.rol?.nombre || 'Sin rol',
        message: 'Usuario actualizado exitosamente'
      };

    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  /**
   * Desactivar un usuario (soft delete)
   */
  async deactivate(tenantId: string, id: string) {
    const user = await this.userRepository.findOne({
      where: { id, tenantId },
      relations: ['rol']
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    if (!user.isActive) {
      throw new BadRequestException('El usuario ya está desactivado');
    }

    user.isActive = false;
    await this.userRepository.save(user);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      rolNombre: user.rol?.nombre || 'Sin rol',
      message: 'Usuario desactivado exitosamente'
    };
  }

  /**
   * Reactivar un usuario
   */
  async activate(tenantId: string, id: string) {
    const user = await this.userRepository.findOne({
      where: { id, tenantId },
      relations: ['rol']
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    if (user.isActive) {
      throw new BadRequestException('El usuario ya está activo');
    }

    user.isActive = true;
    await this.userRepository.save(user);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      rolNombre: user.rol?.nombre || 'Sin rol',
      message: 'Usuario activado exitosamente'
    };
  }
}
