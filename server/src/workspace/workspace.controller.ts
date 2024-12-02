import { Controller, Post, Delete, Get, Body, Req, UseGuards } from "@nestjs/common";
import { WorkSpaceService } from "./workspace.service";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Request as ExpressRequest } from "express";
import { Workspace } from "./schemas/workspace.schema";
import { WorkspaceListItem } from "@noctaCrdt/Interfaces";

@ApiTags("workspace")
@UseGuards(JwtAuthGuard)
@Controller("workspace")
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkSpaceService) {}

  // 워크스페이스 생성
  @Post("create")
  async createWorkspace(
    @Req() req: ExpressRequest,
    @Body("name") name?: string,
  ): Promise<Workspace> {
    const userId = req.user.id;
    return this.workspaceService.createWorkspace(userId, name);
  }

  // 워크스페이스 삭제
  // 삭제한 워크스페이스에서 작업중인 사람들을 내쫓기
  @Delete("delete")
  async deleteWorkspace(
    @Req() req: ExpressRequest,
    @Body("workspaceId") workspaceId: string,
  ): Promise<void> {
    const userId = req.user.id;
    return this.workspaceService.deleteWorkspace(userId, workspaceId);
  }

  // 유저의 워크스페이스 목록 조회
  @Get("findAll")
  async getUserWorkspaces(@Req() req: ExpressRequest): Promise<WorkspaceListItem[]> {
    const userId = req.user.id;
    return this.workspaceService.getUserWorkspaces(userId);
  }

  // 워크스페이스에 유저 초대
  @Post("invite")
  async inviteUser(
    @Req() req: ExpressRequest,
    @Body("workspaceId") workspaceId: string,
    @Body("invitedUserId") invitedUserId: string,
  ): Promise<void> {
    const ownerId = req.user.id;
    return this.workspaceService.inviteUserToWorkspace(ownerId, workspaceId, invitedUserId);
  }

  // 소켓에 관여해야 하는 부분
  // 삭제할 워크스페이스에 있는 사람들 내쫓기
  // 워크스페이스 권한이 생기면 접속중인 사람에게 알리기
}
