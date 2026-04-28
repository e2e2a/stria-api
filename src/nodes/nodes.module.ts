import { Module } from "@nestjs/common";
import { NodesController } from "./nodes.controller";
import { NodesService } from "./nodes.service";

@Module({
  controllers: [NodesController], // Who handles the HTTP routes?
  providers: [NodesService], // Who provides the business logic?
  exports: [NodesService], // Allow other modules to use NodesService
})
export class NodesModule {}
