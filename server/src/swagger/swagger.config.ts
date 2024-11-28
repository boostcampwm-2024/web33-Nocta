import { INestApplication } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

export const createSwaggerDocument = (app: INestApplication): void => {
  if (process.env.NODE_ENV !== "development") {
    return; // 개발 환경이 아니면 Swagger 비활성화
  }

  const config = new DocumentBuilder()
    .setTitle("Nocta API Docs")
    .setDescription("Nocta API description")
    .setVersion("1.0.0")
    .addBearerAuth()
    .addCookieAuth("refreshToken")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-docs", app, document);
};
