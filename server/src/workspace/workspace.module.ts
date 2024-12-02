import { Module } from "@nestjs/common";
import { WorkSpaceService } from "./workspace.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Workspace, WorkspaceSchema } from "./schemas/workspace.schema";
import { WorkspaceGateway } from "./workspace.gateway";
import { AuthModule } from "../auth/auth.module";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtStrategy } from "../auth/strategies/jwt.strategy";
import { JwtRefreshTokenStrategy } from "../auth/strategies/jwt-refresh-token.strategy";
import { JwtRefreshTokenAuthGuard } from "../auth/guards/jwt-refresh-token-auth.guard";
import { User, UserSchema } from "../auth/schemas/user.schema";

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "1h" },
      }),
    }),
  ],
  exports: [WorkSpaceService, JwtModule],
  providers: [
    WorkSpaceService,
    WorkspaceGateway,
    JwtStrategy,
    JwtRefreshTokenStrategy,
    JwtAuthGuard,
    JwtRefreshTokenAuthGuard,
  ],
})
export class WorkspaceModule {}
