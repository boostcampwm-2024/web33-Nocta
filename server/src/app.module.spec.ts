import { Test, TestingModule } from "@nestjs/testing";
import { MongooseModule } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { AppModule } from "./app.module";

jest.setTimeout(20000);

jest.mock("nanoid", () => ({
  nanoid: () => "mockNanoId123",
}));

describe("AppModule", () => {
  let testingModule: TestingModule;

  beforeAll(async () => {
    // jest-mongodb가 설정한 MONGO_URL을 MONGO_URI로 설정
    process.env.MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/test";
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = "test-secret";
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      process.env.JWT_REFRESH_SECRET = "test-secret";
    }

    testingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(process.env.MONGO_URI), AppModule],
    }).compile();

    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (testingModule) {
      await testingModule.close();
    }
  });

  it("should connect to the MongoDB instance provided by jest-mongodb", async () => {
    expect(mongoose.connection.readyState).toBe(1); // 연결 상태가 'connected'인지 확인
  });

  it("should load AppModule without errors", async () => {
    expect(AppModule).toBeDefined(); // AppModule이 정의되었는지 확인
  });

  it("should have a valid MongoDB URI", async () => {
    const uri = process.env.MONGO_URI;
    expect(uri).toBeDefined();
    expect(uri).toMatch(/^mongodb:\/\/.+/); // MongoDB URI 형식인지 확인
  });
});
