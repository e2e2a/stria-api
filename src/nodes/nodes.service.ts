import { Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import nodesData from "../data/nodes.json";
import {
  ArchivedState,
  BacklinkResult,
  CreateNodeBody,
  FileNode,
  Mention,
  MoveNodeBody,
  NodeView,
  OutlineNode,
  RestoreNodesBody,
  SearchResult,
  UpdateNodeBody,
} from "../types/node.types";

@Injectable()
export class NodesService {
  private nodes: FileNode[] = [...(nodesData as FileNode[])];

  findAll(projectId?: string, exclude?: string): NodeView[] {
    const scopedNodes = projectId
      ? this.nodes.filter((node) => node.projectId === projectId)
      : [...this.nodes];

    const tree = this.buildTree(scopedNodes);
    if (!exclude) {
      return tree;
    }

    const fields = exclude
      .split(",")
      .map((field) => field.trim())
      .filter(Boolean);

    return tree.map((node) => this.excludeFields(node, fields));
  }

  findOne(nodeId: string): FileNode {
    const node = this.nodes.find((candidate) => candidate._id === nodeId);
    if (!node) throw new NotFoundException(`Node ${nodeId} not found`);

    return this.attachChildren(node);
  }

  create(body: CreateNodeBody): FileNode {
    const newNode: FileNode = {
      _id: uuidv4(),
      projectId: body.projectId,
      parentId: body.parentId,
      type: body.type,
      title: body.title,
      path: this.buildPath(body.parentId, body.title),
      children: [],
      content: null,
      createdAt: new Date().toISOString(),
    };

    this.nodes.push(newNode);
    return newNode;
  }

  update(nodeId: string, body: UpdateNodeBody): FileNode {
    const index = this.nodes.findIndex((candidate) => candidate._id === nodeId);
    if (index === -1) throw new NotFoundException(`Node ${nodeId} not found`);

    this.nodes[index] = { ...this.nodes[index], ...body };
    return this.nodes[index];
  }

  move(body: MoveNodeBody): FileNode {
    const index = this.nodes.findIndex(
      (candidate) => candidate._id === body._id,
    );
    if (index === -1) throw new NotFoundException(`Node ${body._id} not found`);

    this.nodes[index].parentId = body.parentId;
    this.nodes[index].path = this.buildPath(
      body.parentId,
      this.nodes[index].title,
    );
    return this.nodes[index];
  }

  remove(nodeId: string): {
    _id: string;
    archived: ArchivedState | undefined;
    message: string;
  } {
    const index = this.nodes.findIndex((candidate) => candidate._id === nodeId);
    if (index === -1) throw new NotFoundException(`Node ${nodeId} not found`);

    const deleted = this.nodes[index];
    this.nodes[index] = {
      ...deleted,
      archived: { at: new Date().toISOString(), reason: "deleted" },
    };

    return {
      _id: nodeId,
      archived: this.nodes[index].archived,
      message: "Node deleted",
    };
  }

  restore(body: RestoreNodesBody): { nodes: FileNode[]; message: string } {
    body.nodes.forEach((incoming) => {
      const index = this.nodes.findIndex(
        (candidate) => candidate._id === incoming._id,
      );
      if (index !== -1) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { archived, ...rest } = this.nodes[index];
        this.nodes[index] = rest;
        return;
      }

      this.nodes.push({
        ...incoming,
        children: incoming.children ?? [],
      });
    });

    return { nodes: body.nodes, message: "Nodes restored" };
  }

  search(projectId: string, query: string): SearchResult[] {
    const lowerQuery = query.toLowerCase();
    const matches: SearchResult[] = [];

    this.nodes
      .filter(
        (node) =>
          node.projectId === projectId &&
          node.type === "file" &&
          !node.archived,
      )
      .forEach((node) => {
        const titleMatch = node.title.toLowerCase().includes(lowerQuery);
        const contentLines = (node.content ?? "").split("\n");
        const lineMatches = contentLines
          .map((line, lineNumber) => {
            const index = line.toLowerCase().indexOf(lowerQuery);
            if (index === -1) return null;

            return {
              line: lineNumber + 1,
              lineContent: line,
              text: query,
              index,
              matchIndices: [index],
            };
          })
          .filter(
            (match): match is SearchResult["matches"][number] => match !== null,
          );

        if (titleMatch || lineMatches.length > 0) {
          matches.push({
            nodeId: node._id,
            title: node.title,
            matches: lineMatches,
          });
        }
      });

    return matches;
  }

  getBacklinks(nodeId: string): BacklinkResult {
    const target = this.nodes.find((candidate) => candidate._id === nodeId);
    if (!target) throw new NotFoundException(`Node ${nodeId} not found`);

    const linked: BacklinkResult["linked"] = [];
    const unlinked: BacklinkResult["unlinked"] = [];
    const wikiLinkPattern = new RegExp(
      `\\[\\[${this.escapeRegExp(target.title)}\\]\\]`,
      "gi",
    );
    const plainPattern = new RegExp(this.escapeRegExp(target.title), "gi");

    this.nodes
      .filter(
        (node) => node._id !== nodeId && node.type === "file" && node.content,
      )
      .forEach((node) => {
        if (!node.content) {
          return;
        }

        const lines = node.content.split("\n");
        const linkedMentions: Mention[] = [];
        const unlinkedMentions: Mention[] = [];

        lines.forEach((line, lineNumber) => {
          if (wikiLinkPattern.test(line)) {
            linkedMentions.push({
              excerpt: line,
              line: lineNumber + 1,
              index: 0,
              length: line.length,
            });
          } else if (plainPattern.test(line)) {
            unlinkedMentions.push({
              excerpt: line,
              line: lineNumber + 1,
              index: 0,
              length: line.length,
            });
          }

          wikiLinkPattern.lastIndex = 0;
          plainPattern.lastIndex = 0;
        });

        if (linkedMentions.length > 0) {
          linked.push({
            _id: node._id,
            title: node.title,
            path: node.path,
            type: node.type,
            mentions: linkedMentions,
          });
        }

        if (unlinkedMentions.length > 0) {
          unlinked.push({
            _id: node._id,
            title: node.title,
            path: node.path,
            type: node.type,
            mentions: unlinkedMentions,
          });
        }
      });

    return { linked, unlinked };
  }

  getOutline(nodeId: string): OutlineNode[] {
    const node = this.findOne(nodeId);
    if (!node.content) return [];

    const headingRegex = /^(#{1,6})\s+(.+)/;
    const outlineNodes: OutlineNode[] = [];

    node.content.split("\n").forEach((line) => {
      const match = line.match(headingRegex);
      if (match) {
        outlineNodes.push({
          text: match[2],
          level: match[1].length,
          children: [],
        });
      }
    });

    return this.buildOutlineTree(outlineNodes);
  }

  private buildTree(nodes: FileNode[]): NodeView[] {
    const map = new Map<string, NodeView>();
    nodes.forEach((node) => {
      map.set(node._id, { ...node, children: [] });
    });

    const roots: NodeView[] = [];
    map.forEach((node) => {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)?.children.push(node);
        return;
      }

      if (!node.parentId) {
        roots.push(node);
      }
    });

    return roots;
  }

  private attachChildren(node: FileNode): FileNode {
    return {
      ...node,
      children: this.nodes
        .filter((candidate) => candidate.parentId === node._id)
        .map((child) => this.attachChildren(child)),
    };
  }

  private buildPath(parentId: string | null, title: string): string {
    if (!parentId) return `/${title}`;

    const parent = this.nodes.find((candidate) => candidate._id === parentId);
    return parent ? `${parent.path}/${title}` : `/${title}`;
  }

  private excludeFields(node: NodeView, fields: string[]): NodeView {
    const clone: NodeView & Record<string, unknown> = {
      ...node,
      children: node.children.map((child) => this.excludeFields(child, fields)),
    };

    fields.forEach((field) => {
      if (field in clone) {
        delete clone[field];
      }
    });

    return clone;
  }

  private buildOutlineTree(flat: OutlineNode[]): OutlineNode[] {
    const result: OutlineNode[] = [];
    const stack: OutlineNode[] = [];

    flat.forEach((item) => {
      const node: OutlineNode = { ...item, children: [] };
      while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        result.push(node);
      } else {
        stack[stack.length - 1].children.push(node);
      }

      stack.push(node);
    });

    return result;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
