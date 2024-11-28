import { Test, TestingModule } from "@nestjs/testing";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";
import { AuthController } from "../auth.controller";
import { JwtStrategy } from "../strategies/jwt.strategy";
import { JwtRefreshTokenStrategy } from "../strategies/jwt-refresh-token.strategy";
import { User, UserSchema } from "../schemas/user.schema";
import { AuthModule } from "../auth.module";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { JwtRefreshTokenAuthGuard } from "../guards/jwt-refresh-token-auth.guard";

jest.setTimeout(30000);

jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "mockNanoId123"),
}));

describe("AuthModule", () => {
  let testingModule: TestingModule;

  beforeAll(async () => {
    process.env.MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/test";
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = "test-secret";
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      process.env.JWT_REFRESH_SECRET = "test-secret";
    }

    testingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              JWT_SECRET: process.env.JWT_SECRET,
            }),
          ],
        }),
        MongooseModule.forRoot(process.env.MONGO_URI),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        PassportModule,
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.get<string>("JWT_SECRET"),
            signOptions: { expiresIn: "1h" },
          }),
        }),
        AuthModule,
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        JwtRefreshTokenStrategy,
        JwtAuthGuard,
        JwtRefreshTokenAuthGuard,
      ],
    }).compile();
  });

  afterAll(async () => {
    if (testingModule) {
      await testingModule.close();
    }
  });

  it("should be defined", () => {
    expect(testingModule).toBeDefined();
  });

  it("should have AuthService defined", () => {
    const authService = testingModule.get<AuthService>(AuthService);
    expect(authService).toBeDefined();
  });

  it("should have AuthController defined", () => {
    const authController = testingModule.get<AuthController>(AuthController);
    expect(authController).toBeDefined();
  });

  it("should have JwtStrategy defined", () => {
    const jwtStrategy = testingModule.get<JwtStrategy>(JwtStrategy);
    expect(jwtStrategy).toBeDefined();
  });

  it("should have JwtRefreshTokenStrategy defined", () => {
    const jwtRefreshTokenStrategy =
      testingModule.get<JwtRefreshTokenStrategy>(JwtRefreshTokenStrategy);
    expect(jwtRefreshTokenStrategy).toBeDefined();
  });

  it("should have JwtAuthGuard defined", () => {
    const jwtAuthGuard = testingModule.get<JwtAuthGuard>(JwtAuthGuard);
    expect(jwtAuthGuard).toBeDefined();
  });

  it("should have JwtRefreshTokenAuthGuard defined", () => {
    const jwtRefreshTokenAuthGuard =
      testingModule.get<JwtRefreshTokenAuthGuard>(JwtRefreshTokenAuthGuard);
    expect(jwtRefreshTokenAuthGuard).toBeDefined();
  });
});
