// 图谱节点和边的类型定义

export type NodeType = 'concept' | 'paper';

export type EdgeType = 'hasNarrower' | 'related' | 'weak' | 'strong';

// 节点联合类型（放宽定义，所有字段可选以支持联合类型）
export interface GraphNode {
  id: string;
  type?: NodeType;
  facet?: string;
  disciplines?: string;
  year?: number;
  description?: string;
  abstract?: string;
  strong_count?: number;
  weak_count?: number;
  focus_count?: number;
  context_count?: number;
}

// 边
export interface GraphEdge {
  source: string;
  target: string;
  type?: EdgeType;
}

// 完整图谱数据
export interface GraphData {
  directed: boolean;
  multigraph: boolean;
  graph: Record<string, unknown>;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Ideas数据
export interface Idea {
  id: number;
  original_chain: string;
  concept_chain: string[];
  related_papers: string[];
  final_score: number | null;
  proposal_content: string;
  final_critique: string;
  status: string;
}

// Idea with papers (用于兼容)
export type IdeaWithPapers = Idea;

// 领域类型
export type Domain = 'phy' | 'bio' | 'mat' | 'chem';

export const DOMAIN_LABELS: Record<Domain, string> = {
  phy: 'Physics',
  bio: 'Biology',
  mat: 'Materials',
  chem: 'Chemistry',
};

// 节点显示属性（用于Sigma.js）
export interface NodeDisplayData {
  key: string;
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  type?: NodeType;
  hidden?: boolean;
}

// 边显示属性
export interface EdgeDisplayData {
  key: string;
  source: string;
  target: string;
  color: string;
  size: number;
  hidden?: boolean;
}
