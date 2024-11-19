import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "./schemas/user.schema";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { Response } from "express";
import { BlacklistedToken, BlacklistedTokenDocument } from "./schemas/blacklisted-token.schema";
import { UserDto } from "./dto/user.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(BlacklistedToken.name)
    private blacklistedTokenModel: Model<BlacklistedTokenDocument>,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.userModel.create({
      email,
      password: hashedPassword,
      name,
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findOne({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email });
  }

  async findByRefreshToken(token: string): Promise<User | null> {
    return this.userModel.findOne({ refreshToken: token });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async validateRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      const decoded = await this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      const user = await this.findByRefreshToken(refreshToken);
      if (!user) {
        return false;
      }
      return !!decoded;
    } catch (error) {
      return false;
    }
  }

  generateAccessToken(payload: { sub: string; email: string }): string {
    return this.jwtService.sign(payload);
  }

  async generateRefreshToken(id: string): Promise<string> {
    const refreshToken = this.jwtService.sign(
      {},
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: "7d",
      },
    );
    await this.userModel.updateOne({ id }, { refreshToken });
    return refreshToken;
  }

  async blacklistToken(token: string, expiresAt: Date): Promise<void> {
    await this.blacklistedTokenModel.create({ token, expiresAt });
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistedToken = await this.blacklistedTokenModel.findOne({ token });
    return !!blacklistedToken;
  }

  async login(user: { id: string; name: string; email: string }, res: Response): Promise<UserDto> {
    const accessToken = this.generateAccessToken({ sub: user.id, email: user.email });
    const refreshToken = await this.generateRefreshToken(user.id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      accessToken,
    };
  }

  async getProfile(id: string): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }
    return user;
  }

  public async removeRefreshToken(user: User) {
    await this.userModel.updateOne({ id: user.id }, { refreshToken: null });
  }

  public clearCookie(res: Response): void {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
  }

  async refresh(refreshToken: string): Promise<UserDto | null> {
    const user = await this.findByRefreshToken(refreshToken);
    if (!user) {
      return null;
    }

    const accessToken = this.generateAccessToken({ sub: user.id, email: user.email });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      accessToken,
    };
  }
}
