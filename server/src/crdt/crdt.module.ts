import { Module } from "@nestjs/common";
import { workSpaceService } from "./crdt.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Workspace, WorkspaceSchema } from "./schemas/workspace.schema";
import { CrdtGateway } from "./crdt.gateway";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: Workspace.name, schema: WorkspaceSchema }]),
  ],
  providers: [workSpaceService, CrdtGateway],
  exports: [workSpaceService],
})
export class CrdtModule {}
