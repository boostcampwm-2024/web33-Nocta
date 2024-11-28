import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../auth.service";
import { JwtService } from "@nestjs/jwt";
import { getModelToken } from "@nestjs/mongoose";
import { User } from "../schemas/user.schema";
import * as bcrypt from "bcrypt";
import { Response as ExpressResponse } from "express";

// Mock modules
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashedPassword"),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock("nanoid", () => ({
  nanoid: () => "mockNanoId123",
}));

describe("AuthService", () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockUser = {
    id: "mockNanoId123",
    email: "test@example.com",
    password: "hashedPassword",
    name: "Test User",
    tokenVersion: 0,
  };

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue("test-token"),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should create a new user with hashed password", async () => {
      const dto = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      mockUserModel.create.mockResolvedValue(mockUser);

      const result = await service.register(dto.email, dto.password, dto.name);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(mockUserModel.create).toHaveBeenCalledWith({
        email: dto.email,
        password: "hashedPassword",
        name: dto.name,
      });
      expect(result).toEqual(mockUser);
    });

    it("should throw an error if user creation fails", async () => {
      const dto = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      mockUserModel.create.mockRejectedValue(new Error("Database error"));

      await expect(service.register(dto.email, dto.password, dto.name)).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("validateUser", () => {
    it("should return user if email and password are valid", async () => {
      const dto = {
        email: "test@example.com",
        password: "password123",
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValueOnce(true);

      const result = await service.validateUser(dto.email, dto.password);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: dto.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, mockUser.password);
      expect(result).toEqual(mockUser);
    });

    it("should return null if user is not found", async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await service.validateUser("wrong@email.com", "password123");

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: "wrong@email.com" });
      expect(result).toBeNull();
    });

    it("should return null if password is invalid", async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValueOnce(false);

      const result = await service.validateUser("test@example.com", "wrongpassword");

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(bcrypt.compare).toHaveBeenCalledWith("wrongpassword", mockUser.password);
      expect(result).toBeNull();
    });
  });

  describe("login", () => {
    it("should return JWT token", async () => {
      const user = {
        id: "mockNanoId123",
        email: "test@example.com",
        name: "Test User",
        tokenVersion: 0,
      };

      const mockResponse = {
        cookie: jest.fn(),
        header: jest.fn(),
      };

      const result = await service.login(user as User, mockResponse as unknown as ExpressResponse);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        tokenVersion: user.tokenVersion + 1,
      });
      expect(mockResponse.cookie).toHaveBeenCalledWith("refreshToken", expect.any(String), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        name: "Test User",
      });
    });
  });

  describe("getProfile", () => {
    it("should return user profile if user exists", async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile("mockNanoId123");

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ id: "mockNanoId123" });
      expect(result).toEqual(mockUser);
    });

    it("should return null if user does not exist", async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await service.getProfile("nonexistentId");

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ id: "nonexistentId" });
      expect(result).toBeNull();
    });
  });

  describe("removeRefreshToken", () => {
    it("should remove refresh token from user", async () => {
      await service.removeRefreshToken(mockUser as User);

      expect(mockUserModel.updateOne).toHaveBeenCalledWith(
        { id: mockUser.id },
        { refreshToken: null },
      );
    });
  });

  describe("clearCookie", () => {
    it("should clear refresh token cookie", () => {
      const res = {
        clearCookie: jest.fn(),
      } as unknown as ExpressResponse;

      service.clearCookie(res);

      expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
    });
  });

  describe("refresh", () => {
    it("should return new access token if refresh token is valid", async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const mockResponse = {
        header: jest.fn(),
      };

      const result = await service.refresh(
        "valid-refresh-token",
        mockResponse as unknown as ExpressResponse,
      );

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ refreshToken: "valid-refresh-token" });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        tokenVersion: 1,
      });
      expect(mockResponse.header).toHaveBeenCalledWith("Authorization", `Bearer test-token`);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
    });

    it("should return null if refresh token is invalid", async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const mockResponse = {
        header: jest.fn(),
      };

      const result = await service.refresh(
        "invalid-refresh-token",
        mockResponse as unknown as ExpressResponse,
      );

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ refreshToken: "invalid-refresh-token" });
      expect(result).toBeNull();
    });
  });
});
