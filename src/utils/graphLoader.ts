import { Domain, GraphData, Idea } from '../types/graph';

// 加载图谱数据
export async function loadGraphData(domain: Domain): Promise<GraphData> {
  try {
    const response = await fetch(`./data/${domain}_graph.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${domain} graph data`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${domain} graph:`, error);
    throw error;
  }
}

// 加载Ideas数据
export async function loadIdeasData(domain: Domain): Promise<Idea[]> {
  try {
    const response = await fetch(`./data/${domain}_ideas_with_papers.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${domain} ideas data`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${domain} ideas:`, error);
    throw error;
  }
}

// 搜索节点（模糊匹配）
export function searchNodes(graphData: GraphData, query: string): string[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  return graphData.nodes
    .filter(node => node.id.toLowerCase().includes(lowerQuery))
    .map(node => node.id)
    .slice(0, 20); // 限制最多20个结果
}

// 查找节点的所有相连节点
export function getConnectedNodes(
  graphData: GraphData,
  nodeId: string,
  nodeType?: 'concept' | 'paper'
): string[] {
  const connectedIds = new Set<string>();

  // 查找所有相连的边
  for (const edge of graphData.edges) {
    if (edge.source === nodeId) {
      connectedIds.add(edge.target);
    } else if (edge.target === nodeId) {
      connectedIds.add(edge.source);
    }
  }

  // 如果指定了节点类型，过滤结果
  if (nodeType) {
    const filtered: string[] = [];
    for (const id of connectedIds) {
      const node = graphData.nodes.find(n => n.id === id);
      if (node && node.type === nodeType) {
        filtered.push(id);
      }
    }
    return filtered;
  }

  return Array.from(connectedIds);
}

// 查找包含指定节点的Ideas
export function getIdeasContainingNode(ideas: Idea[], nodeId: string): Idea[] {
  return ideas.filter(idea =>
    idea.concept_chain.includes(nodeId) ||
    idea.related_papers.includes(nodeId)
  );
}

// 根据概念链高亮路径上的所有节点
export function getIdeaPathNodes(idea: Idea): string[] {
  // 合并概念链和相关论文
  return [...idea.concept_chain, ...idea.related_papers];
}
