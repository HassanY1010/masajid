import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import { join } from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('MasajidBootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable HTTP Compression (Gzip / Deflate) for all API JSON & responses
  app.use(
    compression({
      threshold: 512, // Compress any response above 512 bytes
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );

  // Ensure upload directories exist
  const uploadsDir = join(process.cwd(), 'uploads');
  const mediaDir = join(uploadsDir, 'media');
  const receiptsDir = join(uploadsDir, 'receipts');

  [uploadsDir, mediaDir, receiptsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Serve static public media uploads with long-term immutable caching
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
    maxAge: '365d',
    immutable: true,
    setHeaders: (res, path) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  });

  // Security Middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());

  // CORS Configuration
  const isProduction = process.env.NODE_ENV === 'production';
  const defaultDevOrigins = ['http://localhost:5173', 'http://localhost:3000'];
  const configuredOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  const allowedOrigins = isProduction
    ? configuredOrigins // In production, must be explicitly declared
    : (configuredOrigins.length > 0 ? configuredOrigins : defaultDevOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Flutter mobile app, server-to-server, cURL)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin) || (!isProduction && allowedOrigins.includes('*'))) {
        return callback(null, true);
      }

      if (!isProduction) {
        // In local development, permit localhost variants with warning
        logger.warn(`Permitting development origin: ${origin}`);
        return callback(null, true);
      }

      // In production, block unauthorized origins strictly
      logger.error(`🚫 Blocked by CORS policy: Origin '${origin}' is not allowed`);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With', 'If-None-Match'],
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
