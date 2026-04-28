import { Module } from "@nestjs/common";
import { NodesModule } from "./nodes/nodes.module";
import { ProjectsModule } from "./projects/projects.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    NodesModule,
    ProjectsModule,
  ],
})
export class AppModule {}
