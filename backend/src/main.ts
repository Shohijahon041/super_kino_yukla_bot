import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  const origStringify = JSON.stringify;
  (JSON as any).stringify = function (value: any, replacer?: any, space?: number) {
    return origStringify(value, (key: string, val: any) => {
      if (typeof val === 'bigint') return val.toString();
      return replacer ? replacer(key, val) : val;
    }, space);
  };

  app.use(helmet());
  app.setGlobalPrefix('api/v1');
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  app.enableCors({
    origin: process.env.ADMIN_URL || 'http://localhost:3001',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('CinemaHub AI Ultimate')
    .setDescription('Enterprise Movie Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication')
    .addTag('users', 'User Management')
    .addTag('movies', 'Movie CRUD')
    .addTag('series', 'Series Management')
    .addTag('search', 'Search Engine')
    .addTag('ai', 'AI Features')
    .addTag('social', 'Social Features')
    .addTag('admin', 'Admin Panel')
    .addTag('bot', 'Telegram Bot')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`🚀 CinemaHub AI running on port ${port}`);
  console.log(`📚 API Docs: http://localhost:${port}/docs`);
}
bootstrap();
