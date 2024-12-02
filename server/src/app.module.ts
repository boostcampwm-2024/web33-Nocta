import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./auth/auth.module";
import { WorkspaceModule } from "./workspace/workspace.module";
import { WorkspaceController } from "./workspace/workspace.controller";

@Module({
  imports: [
    // ConfigModule 설정
    ConfigModule.forRoot({
      isGlobal: true, // 전역 모듈로 설정
      envFilePath: process.env.NODE_ENV === "production" ? undefined : ".env", // 배포 환경에서는 .env 파일 무시
    }),
    // MongooseModule 설정
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>("MONGO_URI"), // 환경 변수에서 MongoDB URI 가져오기
      }),
    }),
    AuthModule,
    WorkspaceModule,
  ],
  controllers: [AppController, WorkspaceController],
  providers: [AppService],
})
export class AppModule {}
