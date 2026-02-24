import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Allow cross-origin requests from the frontend dev server and production origin
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  });

  // Global validation pipe — enforces class-validator DTOs on all endpoints
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter — standardised error response shape
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger / OpenAPI setup
  const config = new DocumentBuilder()
    .setTitle('Freelancer-Client Dashboard API')
    .setDescription('REST API for managing projects, bids, milestones, files, and time entries')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
