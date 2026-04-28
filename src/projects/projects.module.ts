import { Module } from "@nestjs/common";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { NodesModule } from "../nodes/nodes.module";

@Module({
  imports: [NodesModule], // ProjectsService needs NodesService, so we import the whole module
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
