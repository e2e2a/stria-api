import { Injectable, NotFoundException } from "@nestjs/common";
import projectsData from "../data/projects.json";
import {
  GraphLink,
  GraphNode,
  NodeView,
  Project,
  PropertyCount,
  TagCount,
} from "../types/node.types";
import { NodesService } from "../nodes/nodes.service";

@Injectable()
export class ProjectsService {
  private projects: Project[] = [...(projectsData as Project[])];

  constructor(private readonly nodesService: NodesService) {}

  findOne(projectId: string): { project: Project } {
    const project = this.projects.find(
      (candidate) => candidate._id === projectId,
    );
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    return { project };
  }

  getNodes(projectId: string, exclude?: string): { nodes: NodeView[] } {
    const nodes = this.nodesService.findAll(projectId, exclude);
    return { nodes };
  }

  search(projectId: string, query: string): ReturnType<NodesService["search"]> {
    return this.nodesService.search(projectId, query);
  }

  getProperties(projectId: string): PropertyCount[] {
    const nodes = this.nodesService.findAll(projectId);
    const counts: Record<string, number> = {};

    const scan = (nodeList: NodeView[]) => {
      nodeList.forEach((node) => {
        if (node.type === "file" && node.content) {
          const frontmatter = node.content.match(/^---\n([\s\S]*?)\n---/);
          if (frontmatter) {
            frontmatter[1].split("\n").forEach((line) => {
              const key = line.split(":")[0].trim();
              if (key) counts[key] = (counts[key] ?? 0) + 1;
            });
          }
        }

        if (node.children.length > 0) {
          scan(node.children);
        }
      });
    };

    scan(nodes);

    return Object.entries(counts).map(([key, count]) => ({ key, count }));
  }

  getTags(projectId: string): TagCount[] {
    const nodes = this.nodesService.findAll(projectId);
    const counts: Record<string, number> = {};

    const scan = (nodeList: NodeView[]) => {
      nodeList.forEach((node) => {
        if (node.type === "file" && node.content) {
          const tags = node.content.match(/#[\w-]+/g) ?? [];
          tags.forEach((tag) => {
            const name = tag.slice(1);
            counts[name] = (counts[name] ?? 0) + 1;
          });
        }

        if (node.children.length > 0) {
          scan(node.children);
        }
      });
    };

    scan(nodes);

    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }

  getGraphView(projectId: string): {
    d3Nodes: GraphNode[];
    d3Links: GraphLink[];
  } {
    const nodes = this.nodesService.findAll(projectId);
    const d3Nodes: GraphNode[] = [];
    const d3Links: GraphLink[] = [];

    const flatten = (nodeList: NodeView[]) => {
      nodeList.forEach((node) => {
        d3Nodes.push({
          _id: node._id,
          title: node.title,
          path: node.path,
          type: node.type,
          x: Math.random() * 500,
          y: Math.random() * 500,
          vx: 0,
          vy: 0,
          fx: null,
          fy: null,
          radius: 8,
        });

        if (node.children.length > 0) {
          flatten(node.children);
        }
      });
    };

    flatten(nodes);

    d3Nodes.forEach((graphNode) => {
      const fullNode = this.nodesService.findOne(graphNode._id);
      if (!fullNode.content) {
        return;
      }

      const wikiLinks = fullNode.content.match(/\[\[(.+?)\]\]/g) ?? [];
      wikiLinks.forEach((link) => {
        const title = link.slice(2, -2);
        const target = d3Nodes.find((candidate) => candidate.title === title);
        if (target) {
          d3Links.push({ source: graphNode._id, target: target._id });
        }
      });
    });

    return { d3Nodes, d3Links };
  }
}
