import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { createSwaggerDocument } from "./swagger/swagger.config";
import cookieParser from "cookie-parser";

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);

  const isDevelopment = process.env.NODE_ENV === "development";

  const allowedOrigins = ["https://nocta.site", "https://www.nocta.site"];

  app.enableCors({
    origin: (origin, callback) => {
      if (isDevelopment || !origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // 쿠키 전송을 위해 필수
    exposedHeaders: ["Authorization"],
  });

  app.use(cookieParser());
  app.setGlobalPrefix("api");

  createSwaggerDocument(app);

  await app.listen(process.env.PORT ?? 3000);
};
bootstrap();
