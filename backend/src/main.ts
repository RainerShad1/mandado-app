import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // CORS: acepta la URL del frontend (y previews de Vercel del mismo proyecto)
  const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // apps móviles / curl
      const allowed = origin === frontend || origin.endsWith('.vercel.app');
      cb(null, allowed);
    },
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0'); // 0.0.0.0 = imprescindible en la nube
  console.log(`Backend corriendo en el puerto ${port}`);
}
bootstrap();
