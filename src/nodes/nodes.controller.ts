import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import type {
  CreateNodeBody,
  MoveNodeBody,
  RestoreNodesBody,
  UpdateNodeBody,
} from "../types/node.types";
import { NodesService } from "./nodes.service";

@Controller("nodes")
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  @Post("move")
  move(@Body() body: MoveNodeBody) {
    return this.nodesService.move(body);
  }

  @Post("restore")
  restore(@Body() body: RestoreNodesBody) {
    return this.nodesService.restore(body);
  }

  @Post()
  create(@Body() body: CreateNodeBody) {
    return this.nodesService.create(body);
  }

  @Get(":nodeId")
  findOne(@Param("nodeId") nodeId: string) {
    return this.nodesService.findOne(nodeId);
  }

  @Patch(":nodeId")
  update(@Param("nodeId") nodeId: string, @Body() body: UpdateNodeBody) {
    return this.nodesService.update(nodeId, body);
  }

  @Delete(":nodeId")
  remove(@Param("nodeId") nodeId: string) {
    return this.nodesService.remove(nodeId);
  }

  @Get(":nodeId/backlinks")
  getBacklinks(@Param("nodeId") nodeId: string) {
    return this.nodesService.getBacklinks(nodeId);
  }

  @Get(":nodeId/outlines")
  getOutline(@Param("nodeId") nodeId: string) {
    return this.nodesService.getOutline(nodeId);
  }
}
