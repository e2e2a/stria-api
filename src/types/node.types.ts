export type NodeType = "file" | "folder";

export interface ArchivedState {
  at: string;
  reason: string;
}

export interface FileNode {
  _id: string;
  projectId: string;
  parentId: string | null;
  type: NodeType;
  title: string;
  path: string;
  children: FileNode[];
  content: string | null;
  archived?: ArchivedState;
  createdAt: string;
}

export interface NodeView {
  _id: string;
  projectId: string;
  parentId: string | null;
  type: NodeType;
  title: string;
  path: string;
  children: NodeView[];
  content?: string | null;
  archived?: ArchivedState;
  createdAt?: string;
}

export interface Project {
  _id: string;
  title: string;
  nodes: FileNode[];
  archived?: ArchivedState;
}

export interface CreateNodeBody {
  projectId: string;
  parentId: string | null;
  type: NodeType;
  title: string;
}

export interface MoveNodeBody {
  _id: string;
  parentId: string | null;
}

export interface UpdateNodeBody {
  title?: string;
  content?: string | null;
}

export interface RestoreNodesBody {
  nodes: FileNode[];
}

export interface SearchMatch {
  line: number;
  lineContent: string;
  text: string;
  index: number;
  matchIndices: number[];
}

export interface SearchResult {
  nodeId: string;
  title: string;
  matches: SearchMatch[];
}

export interface Mention {
  excerpt: string;
  line: number;
  index: number;
  length: number;
}

export interface MentionedNode {
  _id: string;
  title: string;
  path: string;
  type: NodeType;
  mentions: Mention[];
}

export interface BacklinkResult {
  linked: MentionedNode[];
  unlinked: MentionedNode[];
}

export interface OutlineNode {
  text: string;
  level: number;
  children: OutlineNode[];
}

export interface PropertyCount {
  key: string;
  count: number;
}

export interface TagCount {
  name: string;
  count: number;
}

export interface GraphNode {
  _id: string;
  title: string;
  path: string;
  type: NodeType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null;
  fy: number | null;
  radius: number;
}

export interface GraphLink {
  source: string;
  target: string;
}
