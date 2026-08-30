import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('MasajidBootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Ensure upload directories exist
  const uploadsDir = join(process.cwd(), 'uploads');
  const mediaDir = join(uploadsDir, 'media');
  const receiptsDir = join(uploadsDir, 'receipts');

  [uploadsDir, mediaDir, receiptsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Serve static public media uploads
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  // Security Middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());

  // CORS Configuration
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in local dev
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
  });

  // Global Prefix
  const globalPrefix = process.env.API_PREFIX || 'api';
  app.setGlobalPrefix(globalPrefix);

  // Global Pipes & Interceptors & Filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger Documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('🕌 منصة مساجد - Masajid API')
      .setDescription('التوثيق الرسمي لواجهة برمجة تطبيقات مساجد لخدمة بيوت الله')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs/swagger', app, document);
    logger.log(`📚 Swagger documentation available at http://localhost:${process.env.PORT || 4000}/docs/swagger`);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 Masajid API server is running on http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
