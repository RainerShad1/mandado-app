import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private sign(user: { id: string; role: string }) {
    return this.jwt.sign({ sub: user.id, role: user.role });
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('El teléfono ya está registrado');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { name: dto.name, phone: dto.phone, email: dto.email, passwordHash, role: dto.role || 'CLIENT' },
    });
    return { token: this.sign(user), user: this.publicUser(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    return { token: this.sign(user), user: this.publicUser(user) };
  }

  private publicUser(u: any) {
    return { id: u.id, name: u.name, phone: u.phone, email: u.email, role: u.role };
  }
}
