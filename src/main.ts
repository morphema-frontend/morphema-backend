import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { validateRequiredEnv } from './config/env'

async function bootstrap() {
  validateRequiredEnv()
  if (!process.env.BUILD_TIME) {
    process.env.BUILD_TIME = new Date().toISOString()
  }
  const app = await NestFactory.create(AppModule, { cors: true })

  app.setGlobalPrefix('api')

  app.useGlobalFilters(new HttpExceptionFilter())

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  )

  const port = Number(process.env.PORT ?? 3000)
  await app.listen(port, '0.0.0.0')
}

bootstrap()
