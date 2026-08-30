import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Ip,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email: string;

  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @MinLength(6, { message: 'كلمة المرور يجب أن لا تقل عن 6 خانات' })
  password: string;
}

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'رمز التحديث مطلوب' })
  refreshToken: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل دخول الأدمن' })
  @ApiResponse({ status: 200, description: 'تم تسجيل الدخول بنجاح' })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تحديث الـ Access Token' })
  async refresh(@Body() refreshDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshDto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'جلب بيانات الأدمن الحالي' })
  async getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }
}
