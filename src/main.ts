import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { json, urlencoded } from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT") ?? 3000;
  const frontendOrigin =
    configService.get<string>("VITE_FRONT_END_BASE_URL") ??
    "http://localhost:5173";

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: frontendOrigin,
  });

  app.use(json({ limit: "5mb" }));
  app.use(urlencoded({ extended: true, limit: "5mb" }));
  await app.listen(port);
  console.log(`Stria API running on http://localhost:${port}/api`);
}

void bootstrap();
