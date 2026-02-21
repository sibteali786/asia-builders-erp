import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  // --- Swagger Setup ---
  // DocumentBuilder constructs the OpenAPI metadata (title, version, etc.)
  const config = new DocumentBuilder()
    .setTitle('Asia Builders ERP API')
    .setDescription('Construction ERP system API documentation')
    .setVersion('1.0')
    .addBearerAuth() // Adds JWT auth input to the UI
    .build();
  // SwaggerModule.createDocument scans your entire app for decorators
  // and builds the OpenAPI JSON spec
  const document = SwaggerModule.createDocument(app, config);

  // Mounts the interactive UI at /api/docs
  SwaggerModule.setup('api/docs', app, document);
  // ---
  await app.listen(process.env.API_PORT ?? 3001);
}
bootstrap();
