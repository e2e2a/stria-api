import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import type { SearchRequestBody } from "../types/project.types";
import { ProjectsService } from "./projects.service";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get(":projectId")
  findOne(@Param("projectId") projectId: string) {
    return this.projectsService.findOne(projectId);
  }

  @Get(":projectId/nodes")
  getNodes(
    @Param("projectId") projectId: string,
    @Query("exclude") exclude?: string,
  ) {
    return this.projectsService.getNodes(projectId, exclude);
  }

  @Post(":projectId/search")
  search(
    @Param("projectId") projectId: string,
    @Body() body: SearchRequestBody,
  ) {
    return this.projectsService.search(projectId, body.query);
  }

  @Get(":projectId/properties")
  getProperties(@Param("projectId") projectId: string) {
    return this.projectsService.getProperties(projectId);
  }

  @Get(":projectId/tags")
  getTags(@Param("projectId") projectId: string) {
    return this.projectsService.getTags(projectId);
  }

  @Get(":projectId/graph-view")
  getGraphView(@Param("projectId") projectId: string) {
    return this.projectsService.getGraphView(projectId);
  }
}
