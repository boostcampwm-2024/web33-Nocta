import { Test, TestingModule } from "@nestjs/testing";
import { WorkspaceController } from "./workspace.controller";
import { WorkSpaceService } from "./workspace.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ExecutionContext } from "@nestjs/common";

describe("WorkspaceController", () => {
  let controller: WorkspaceController;

  beforeEach(async () => {
    const mockJwtAuthGuard = {
      canActivate: (context: ExecutionContext) => true,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceController],
      providers: [
        {
          provide: WorkSpaceService,
          useValue: {}, // 필요한 경우 모의 서비스 구현
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<WorkspaceController>(WorkspaceController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
