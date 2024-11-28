import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "../auth.controller";
import { AuthService } from "../auth.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { JwtRefreshTokenAuthGuard } from "../guards/jwt-refresh-token-auth.guard";
import { UnauthorizedException, ConflictException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Response as ExpressResponse, Request as ExpressRequest } from "express";

jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "mockNanoId123"),
}));

describe("AuthController", () => {
  let authController: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    removeRefreshToken: jest.fn(),
    clearCookie: jest.fn(),
    generateAccessToken: jest.fn(),
    validateRefreshToken: jest.fn(),
    findByEmail: jest.fn(),
    validateUser: jest.fn(),
    getProfile: jest.fn(),
    refresh: jest.fn(),
    increaseTokenVersion: jest.fn(),
    isValidEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue("test-token"),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: mockJwtService },
        JwtAuthGuard,
        JwtRefreshTokenAuthGuard,
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
  });

  it("should be defined", () => {
    expect(authController).toBeDefined();
  });

  describe("register", () => {
    it("should call authService.register and return the result", async () => {
      const dto = { email: "test@example.com", password: "password", name: "Test User" };
      mockAuthService.isValidEmail.mockReturnValue(true);
      mockAuthService.findByEmail.mockResolvedValue(null);
      mockAuthService.register.mockResolvedValue(undefined);

      await authController.register(dto);

      expect(mockAuthService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto.email, dto.password, dto.name);
    });

    it("should throw BadRequestException if email format is invalid", async () => {
      const dto = { email: "invalid-email", password: "password", name: "Test User" };
      mockAuthService.isValidEmail.mockReturnValue(false);

      await expect(authController.register(dto)).rejects.toThrow(BadRequestException);
    });

    it("should throw ConflictException if email already exists", async () => {
      const dto = { email: "test@example.com", password: "password", name: "Test User" };
      mockAuthService.isValidEmail.mockReturnValue(true);
      mockAuthService.findByEmail.mockResolvedValue({ id: "mockNanoId123", email: dto.email });

      await expect(authController.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe("login", () => {
    it("should call authService.validateUser and return the result", async () => {
      const dto = { email: "test@example.com", password: "password" };
      const user = { id: "mockNanoId123", email: dto.email, name: "Test User" };
      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockResolvedValue(user);

      const result = await authController.login(dto, {
        setHeader: jest.fn(),
      } as unknown as ExpressResponse);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(dto.email, dto.password);
      expect(mockAuthService.login).toHaveBeenCalledWith(user, expect.any(Object));
      expect(result).toEqual(user);
    });

    it("should throw UnauthorizedException if credentials are invalid", async () => {
      const dto = { email: "test@example.com", password: "password" };
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(
        authController.login(dto, { setHeader: jest.fn() } as unknown as ExpressResponse),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("logout", () => {
    it("should call authService.removeRefreshToken and clearCookie", async () => {
      const req = {
        user: { id: "mockNanoId123" },
        headers: { authorization: "Bearer token" },
        res: { setHeader: jest.fn() },
      } as unknown as ExpressRequest;
      mockAuthService.removeRefreshToken.mockResolvedValue(undefined);
      mockAuthService.clearCookie.mockResolvedValue(undefined);

      await authController.logout(req);

      expect(mockAuthService.removeRefreshToken).toHaveBeenCalledWith(req.user.id);
      expect(mockAuthService.clearCookie).toHaveBeenCalledWith(req.res);
    });

    it("should throw UnauthorizedException if user is not found", async () => {
      const req = { user: null } as ExpressRequest;

      await expect(authController.logout(req)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("getProfile", () => {
    it("should call authService.getProfile and return the result", async () => {
      const req = { user: { id: "mockNanoId123" } } as ExpressRequest;
      const user = { id: "mockNanoId123", email: "test@example.com", name: "Test User" };
      mockAuthService.getProfile.mockResolvedValue(user);

      const result = await authController.getProfile(req);

      expect(mockAuthService.getProfile).toHaveBeenCalledWith(req.user.id);
      expect(result).toEqual(user);
    });

    it("should throw UnauthorizedException if user is not found", async () => {
      const req = { user: { id: "mockNanoId123" } } as ExpressRequest;
      mockAuthService.getProfile.mockResolvedValue(null);

      await expect(authController.getProfile(req)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("refresh", () => {
    it("should call authService.refresh and return the result", async () => {
      const req = { cookies: { refreshToken: "valid-refresh-token" } } as unknown as ExpressRequest;
      const res = { setHeader: jest.fn() } as unknown as ExpressResponse;
      const newAccessToken = { accessToken: "new-access-token" };
      mockAuthService.refresh.mockResolvedValue(newAccessToken);

      const result = await authController.refresh(req, res);

      expect(mockAuthService.refresh).toHaveBeenCalledWith("valid-refresh-token", res);
      expect(result).toEqual(newAccessToken);
    });

    it("should throw UnauthorizedException if refresh token is invalid", async () => {
      const req = {
        cookies: { refreshToken: "invalid-refresh-token" },
      } as unknown as ExpressRequest;
      const res = { setHeader: jest.fn() } as unknown as ExpressResponse;
      mockAuthService.refresh.mockRejectedValue(new UnauthorizedException("Invalid refresh token"));

      await expect(authController.refresh(req, res)).rejects.toThrow(UnauthorizedException);
    });
  });
});
