import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { INestApplication } from "@nestjs/common";

let app: INestApplication;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    const frontendOrigin =
      configService.get<string>("VITE_FRONT_END_BASE_URL") ??
      "http://localhost:5173";

    app.setGlobalPrefix("api");
    app.enableCors({
      origin: frontendOrigin,
    });

    await app.init();
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return app.getHttpAdapter().getInstance();
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
export default async (req: any, res: any) => {
  const instance = await bootstrap();
  return instance(req, res);
};
