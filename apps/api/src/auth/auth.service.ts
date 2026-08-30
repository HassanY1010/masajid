import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { AuditAction } from '@masajid/shared-types';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async login(loginDto: { email: string; password: string }, ip?: string, userAgent?: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { email: loginDto.email.toLowerCase().trim() },
    });

    if (!admin) {
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('الحساب غير نشط. يرجى التواصل مع الإدارة');
    }

    const isMatch = await bcrypt.compare(loginDto.password, admin.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    // Update last login
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = { sub: admin.id, email: admin.email };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET') || 'masajid_super_secret_jwt_key_change_in_production_32char',
      expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'masajid_refresh_token_super_secret_key_change_in_production',
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
    });

    await this.auditService.log({
      adminId: admin.id,
      action: AuditAction.ADMIN_LOGIN,
      entity: 'Admin',
      entityId: admin.id,
      ipAddress: ip,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'masajid_refresh_token_super_secret_key_change_in_production',
      });

      const admin = await this.prisma.admin.findUnique({
        where: { id: payload.sub },
      });

      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('جلسة العمل غير صالحة');
      }

      const newAccessToken = this.jwtService.sign(
        { sub: admin.id, email: admin.email },
        {
          secret: this.configService.get<string>('JWT_SECRET') || 'masajid_super_secret_jwt_key_change_in_production_32char',
          expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '1h',
        },
      );

      return { accessToken: newAccessToken };
    } catch {
      throw new UnauthorizedException('انتهت صلاحية رمز التحديث، يرجى تسجيل الدخول مجدداً');
    }
  }

  async getMe(adminId: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!admin) {
      throw new UnauthorizedException('المستخدم غير موجود');
    }

    return admin;
  }
}
