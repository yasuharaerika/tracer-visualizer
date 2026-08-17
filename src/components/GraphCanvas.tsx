import { useEffect, useRef, useState } from 'react';
import Graph from 'graphology';
import Sigma from 'sigma';
import { useAppStore } from '../utils/store';
import { GraphNode } from '../types/graph';
import '../styles/GraphCanvas.css';

export default function GraphCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);

  const {
    currentDomain,
    graphData,
    setGraphData,
    selectedNodeId,
    setSelectedNodeId,
    compareNodeId,
    searchQuery,
    isIdeaPinned,
    selectedIdeaId,
    ideasData,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);

  // 节点颜色方案 - 使用高级配色
  const getNodeColor = (node: GraphNode): string => {
    if (node.type === 'paper') {
      return '#D4AF37'; // 金色 - 论文节点更突出
    }

    // 概念节点按facet着色 - 统一的高级配色方案
    // 顺序很重要：先列出的优先匹配
    const facetColors: { [key: string]: string } = {
      // ==================== Mat 领域 ====================
      'Mechanisms & Phenomena': '#BC8F8F', // 玫瑰褐
      'Materials & Composition': '#A0522D',  // 赭色
      'Fabrication Methods': '#DAA520', // 金麒麟色
      'Device Architecture': '#708090', // 石板灰

      // ==================== Chem 领域 ====================
      'Materials': '#8B4513',         // 赭石色
      'Chemistry Method': '#CD5C5C',  // 印度红
      'Theoretical & Computational Methods': '#4169E1', // 皇家蓝
      'Synthesis Methods': '#20B2AA',  // 浅海洋绿
      'Characterization Techniques': '#CD853F', // 秘鲁色
      'Components': '#FF8C00',         // 暗橙色
      'Structures': '#9370DB',        // 中紫色
      'Mechanisms': '#DB7093',        // 弱火砖红
      'Data Sources': '#87CEEB',      // 天蓝色
      'Database': '#5F9EA0',          // 军蓝色
      'Kinetic model': '#6B8E23',     // 橄榄绿
      'Method': '#B8860B',             // 暗金黄色

      // ==================== Bio 领域 ====================
      'Biomolecules': '#2E86AB',       // 深青色
      'Targets': '#A23B72',            // 玫瑰红
      'Methods': '#F18F01',           // 琥珀橙
      'Applications': '#6B8E23',       // 橄榄绿

      // ==================== Phy 领域 ====================
      'Properties': '#E74C3C',         // 红色
      'Physical Systems': '#3498DB',   // 蓝色
      'Techniques': '#9B59B6',         // 紫色
      'Research Areas': '#1ABC9C',     // 青色
      'Topics': '#F39C12',             // 橙色
      'Processes': '#E67E22',         // 深橙色
      'Interdisciplinary': '#2ECC71',  // 绿色
    };

    const facet = node.facet || '';
    if (!facet || facet === 'default') {
      return '#95A5A6'; // 默认灰蓝色
    }

    // 精确匹配
    if (facetColors[facet]) {
      return facetColors[facet];
    }

    // 部分匹配（用于处理带描述的长facet名称）
    for (const key of Object.keys(facetColors)) {
      if (facet.includes(key) || key.includes(facet.split('(')[0].trim())) {
        return facetColors[key];
      }
    }

    return '#95A5A6'; // 默认灰蓝色
  };

  // 加载图谱数据
  useEffect(() => {
    if (!currentDomain) return;

    const loadGraph = async () => {
      setIsLoading(true);
      setError(null);
      setLoadProgress(0);

      try {
        const response = await fetch(`./data/${currentDomain}_graph.json`);
        if (!response.ok) {
          throw new Error(`Failed to load ${currentDomain} graph`);
        }

        // 模拟进度（fetch不支持真实进度）
        setLoadProgress(30);

        const data = await response.json();
        setLoadProgress(60);

        setGraphData(data);
        setLoadProgress(100);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load graph');
        console.error('Error loading graph:', err);
      } finally {
        setTimeout(() => setIsLoading(false), 300);
      }
    };

    loadGraph();
  }, [currentDomain, setGraphData]);

  // 初始化Sigma.js图谱
  useEffect(() => {
    if (!containerRef.current || !graphData || isLoading) return;

    // 清理旧的实例
    if (sigmaRef.current) {
      sigmaRef.current.kill();
      sigmaRef.current = null;
    }

    try {
      // 创建Graphology图实例
      const graph = new Graph();
      graphRef.current = graph;

      // 添加节点 - 使用圆形均匀分布
      graphData.nodes.forEach((node: GraphNode) => {
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.sqrt(Math.random()) * 1500;

        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        const baseSize = node.type === 'paper' ? 8 : 4;

        graph.addNode(node.id, {
          label: node.id,
          size: baseSize,
          color: getNodeColor(node),
          x: x,
          y: y,
        });
      });

      // 添加边
      graphData.edges.forEach((edge, index) => {
        try {
          if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
            const edgeKey = `${edge.source}->${edge.target}`;
            if (!graph.hasEdge(edgeKey)) {
              graph.addEdgeWithKey(edgeKey, edge.source, edge.target, {
                size: 0.5,
                color: '#e7e1d7',
              });
            }
          }
        } catch (err) {
          console.warn(`Skipping edge ${index}:`, err);
        }
      });

      // 创建Sigma实例
      const sigma = new Sigma(graph, containerRef.current, {
        renderEdgeLabels: false,
        defaultNodeColor: '#5c635d',
        defaultEdgeColor: '#e7e1d7',
        labelSize: 14,
        labelWeight: 'normal',
        labelColor: { color: '#1f2421' },
        labelRenderedSizeThreshold: 15,
      });

      sigmaRef.current = sigma;

      // 相机事件：自适应标签
      sigma.getCamera().on('updated', () => {
        const camera = sigma.getCamera();
        const ratio = camera.ratio;

        graph.forEachNode((node) => {
          const nodeData = graphData?.nodes.find(n => n.id === node);
          if (!nodeData) return;

          const degree = graph.degree(node);

          if (ratio > 2) {
            graph.setNodeAttribute(node, 'label', '');
          } else if (ratio > 0.8) {
            graph.setNodeAttribute(node, 'label', degree > 20 ? node : '');
          } else if (ratio > 0.3) {
            graph.setNodeAttribute(node, 'label', degree > 10 ? node : '');
          } else {
            graph.setNodeAttribute(node, 'label', node);
          }
        });
      });

      // 点击节点事件
      sigma.on('clickNode', ({ node }) => {
        setSelectedNodeId(node);
      });

      // 点击背景取消选择 - 移除此功能，保持选中状态
      // sigma.on('clickStage', () => {
      //   setSelectedNodeId(null);
      // });

      console.log(`Graph loaded: ${graph.order} nodes, ${graph.size} edges`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render graph');
      console.error('Error rendering graph:', err);
    }

    // 清理函数
    return () => {
      if (sigmaRef.current) {
        sigmaRef.current.kill();
        sigmaRef.current = null;
      }
    };
  }, [graphData, isLoading, setSelectedNodeId]);

  // 高亮选中节点和对比节点（双节点模式）+ Ideas游走链模式
  useEffect(() => {
    if (!sigmaRef.current || !graphRef.current) return;

    const graph = graphRef.current;
    const sigma = sigmaRef.current;

    // 获取当前Idea的路径节点和游走链边
    let pathNodes: Set<string> = new Set();
    let walkChainEdges: Set<string> = new Set(); // 只包含游走链相邻节点的边
    let hasIdeaPath = false;

    if (selectedIdeaId !== null) {
      const selectedIdea = ideasData.find(i => i.id === selectedIdeaId);
      if (selectedIdea) {
        hasIdeaPath = true;
        const conceptChain = selectedIdea.concept_chain;
        const relatedPapers = selectedIdea.related_papers;

        // 收集所有路径节点
        pathNodes = new Set([...conceptChain, ...relatedPapers]);

        // ========================================
        // 重建游走顺序：确保 concept-paper-concept-paper 交替
        // ========================================

        // 第一步：建立概念到论文的连接关系（基于图中实际存在的边）
        const conceptToPapersMap = new Map<string, string[]>();
        const paperToConceptMap = new Map<string, string[]>();

        for (const concept of conceptChain) {
          conceptToPapersMap.set(concept, []);
        }
        for (const paper of relatedPapers) {
          paperToConceptMap.set(paper, []);
        }

        // 遍历图中的边，建立映射
        // 注意：边是单向的 (concept -> paper)，所以需要检查两个方向
        graph.forEachEdge((_edge, _attrs, source, target) => {
          // source -> target 的情况
          if (conceptChain.includes(source) && relatedPapers.includes(target)) {
            conceptToPapersMap.get(source)?.push(target);
            paperToConceptMap.get(target)?.push(source);
          }
          // target -> source 的情况（边的反向）
          if (conceptChain.includes(target) && relatedPapers.includes(source)) {
            conceptToPapersMap.get(target)?.push(source);
            paperToConceptMap.get(source)?.push(target);
          }
        });

        // 第二步：根据concept_chain的顺序，重建完整游走路径
        // 策略：一篇论文可以被多次使用（用于连接多个概念），但必须按顺序
        const fullWalkPath: string[] = [];

        for (let i = 0; i < conceptChain.length; i++) {
          const concept = conceptChain[i];

          // 添加当前概念
          if (!fullWalkPath.includes(concept)) {
            fullWalkPath.push(concept);
          }

          // 找论文来连接当前概念和下一个概念
          if (i < conceptChain.length - 1) {
            const nextConcept = conceptChain[i + 1];
            const connectedPapers = conceptToPapersMap.get(concept) || [];

            // 找到能连接到下一个概念的论文
            let targetPaper: string | null = null;

            for (const paper of connectedPapers) {
              const paperConnections = paperToConceptMap.get(paper) || [];
              if (paperConnections.includes(nextConcept)) {
                targetPaper = paper;
                break;
              }
            }

            // 如果没找到，就找任意连接的论文
            if (!targetPaper) {
              targetPaper = connectedPapers.length > 0 ? connectedPapers[0] : null;
            }

            if (targetPaper) {
              fullWalkPath.push(targetPaper);
            }
          }
        }

        console.log('Reconstructed walk path:', fullWalkPath);
        console.log('Concept chain:', conceptChain);
        console.log('Related papers:', relatedPapers);

        // 第三步：构建边的集合
        // 只有在fullWalkPath中相邻的节点之间才画边
        // 注意：边是单向的 (source -> target)，需要检查正确的方向
        for (let i = 0; i < fullWalkPath.length - 1; i++) {
          const a = fullWalkPath[i];
          const b = fullWalkPath[i + 1];

          // 检查是否存在从 a 指向 b 的边
          // 由于边是单向的，需要按正确的方向检查
          let hasEdgeAB = false;

          // 直接检查图中是否存在这条边
          if (graph.hasEdge(a, b)) {
            hasEdgeAB = true;
            walkChainEdges.add(`${a}->${b}`);
          }
          // 如果不存在，检查反向（可能边在图中是反方向的）
          if (graph.hasEdge(b, a)) {
            hasEdgeAB = true;
            walkChainEdges.add(`${b}->${a}`);
          }

          if (!hasEdgeAB) {
            console.warn(`Edge not found between ${a} and ${b}`);
          }
        }

        console.log('Walk chain edges:', Array.from(walkChainEdges));
      }
    }

    // 处理节点显示和高亮
    graph.forEachNode((node) => {
      const nodeData = graphData?.nodes.find(n => n.id === node);
      if (!nodeData) return;

      const baseSize = nodeData.type === 'paper' ? 8 : 4;

      if (hasIdeaPath) {
        // Ideas模式：显示游走链节点
        if (pathNodes.has(node)) {
          const isSelected = node === selectedNodeId;
          graph.setNodeAttribute(node, 'color', getNodeColor(nodeData));
          graph.setNodeAttribute(node, 'size', isSelected ? baseSize * 1.5 : baseSize * 1.2);
          graph.setNodeAttribute(node, 'hidden', false);
          // 强制显示游走链节点的标签
          graph.setNodeAttribute(node, 'label', node);
          // 游走链节点置于最上层
          graph.setNodeAttribute(node, 'zIndex', 1000);
          // 提升节点确保在最上层
          graph.setNodeAttribute(node, 'forceLabel', true);
        } else {
          // 固定模式：隐藏非游走链节点；非固定模式：变灰
          if (isIdeaPinned) {
            graph.setNodeAttribute(node, 'hidden', true);
          } else {
            graph.setNodeAttribute(node, 'color', '#d4d0c8');
            graph.setNodeAttribute(node, 'size', baseSize * 0.5);
            graph.setNodeAttribute(node, 'hidden', false);
            graph.setNodeAttribute(node, 'label', ''); // 非游走链节点不显示标签
            graph.setNodeAttribute(node, 'zIndex', 0);
          }
        }
      } else {
        // 非Ideas模式：双节点高亮逻辑
        const isSelected = node === selectedNodeId;
        const isCompare = node === compareNodeId;
        const shouldHighlight = isSelected || isCompare;

        if (selectedNodeId || compareNodeId) {
          if (shouldHighlight) {
            graph.setNodeAttribute(node, 'color', getNodeColor(nodeData));
            graph.setNodeAttribute(node, 'size', baseSize * 1.5);
            graph.setNodeAttribute(node, 'highlighted', true);
            // 选中节点强制显示标签
            graph.setNodeAttribute(node, 'label', node);
            graph.setNodeAttribute(node, 'zIndex', 100);
          } else {
            graph.setNodeAttribute(node, 'color', '#d4d0c8');
            graph.setNodeAttribute(node, 'size', baseSize * 0.8);
            graph.setNodeAttribute(node, 'highlighted', false);
          }
        } else {
          graph.setNodeAttribute(node, 'color', getNodeColor(nodeData));
          graph.setNodeAttribute(node, 'size', baseSize);
          graph.setNodeAttribute(node, 'highlighted', false);
        }
        graph.setNodeAttribute(node, 'hidden', false);
      }
    });

    // 处理边显示和高亮
    if (hasIdeaPath) {
      // Ideas模式：只显示游走链的边（游走过程中经过的边）
      graph.forEachEdge((edge, _attributes, source, target) => {
        const edgeKey = `${source}->${target}`;

        // 只有当这条边在游走链边集合中时才显示
        if (walkChainEdges.has(edgeKey)) {
          graph.setEdgeAttribute(edge, 'color', '#c4612f');
          graph.setEdgeAttribute(edge, 'size', 3);
          graph.setEdgeAttribute(edge, 'hidden', false);
          graph.setEdgeAttribute(edge, 'zIndex', 999);
        } else {
          // 其他边：完全隐藏
          graph.setEdgeAttribute(edge, 'hidden', true);
        }
      });

      console.log('Walk chain edges:', Array.from(walkChainEdges));
    } else if (selectedNodeId && compareNodeId) {
      // 双节点模式：高亮连接边
      graph.forEachEdge((edge, _attributes, source, target) => {
        const connectsSelected =
          (source === selectedNodeId && target === compareNodeId) ||
          (source === compareNodeId && target === selectedNodeId);

        if (connectsSelected) {
          graph.setEdgeAttribute(edge, 'color', '#c4612f');
          graph.setEdgeAttribute(edge, 'size', 2);
        } else {
          graph.setEdgeAttribute(edge, 'color', '#e7e1d7');
          graph.setEdgeAttribute(edge, 'size', 0.5);
        }
        graph.setEdgeAttribute(edge, 'hidden', false);
      });
    } else {
      // 普通模式：显示所有边
      graph.forEachEdge((edge) => {
        graph.setEdgeAttribute(edge, 'color', '#e7e1d7');
        graph.setEdgeAttribute(edge, 'size', 0.5);
        graph.setEdgeAttribute(edge, 'hidden', false);
      });
    }

    sigma.refresh();
  }, [selectedNodeId, compareNodeId, graphData, isIdeaPinned, selectedIdeaId, ideasData]);

  // 搜索高亮
  useEffect(() => {
    if (!sigmaRef.current || !graphRef.current || !searchQuery) return;

    const graph = graphRef.current;
    const sigma = sigmaRef.current;

    graph.forEachNode((node) => {
      if (node.toLowerCase().includes(searchQuery.toLowerCase())) {
        graph.setNodeAttribute(node, 'highlighted', true);
      } else {
        graph.setNodeAttribute(node, 'highlighted', false);
      }
    });

    sigma.refresh();
  }, [searchQuery]);

  if (error) {
    return (
      <div className="graph-error">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading graph...</div>
          <div className="loading-progress-container">
            <div className="loading-progress-bar" style={{ width: `${loadProgress}%` }}></div>
          </div>
          <div className="loading-percentage">{loadProgress}%</div>
        </div>
      )}
      <div ref={containerRef} className="sigma-container" />
    </>
  );
}
