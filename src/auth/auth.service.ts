import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
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
}
