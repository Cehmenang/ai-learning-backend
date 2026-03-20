import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser({ secret: process.env.COOKIE_SECRET! }))
  app.enableCors({ origin: 'https://cehwin-ai-learning.vercel.app', credentials: true });
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
