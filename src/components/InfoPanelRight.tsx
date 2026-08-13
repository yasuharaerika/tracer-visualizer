import { useState, useEffect } from 'react';
import { useAppStore } from '../utils/store';
import { GraphNode, PaperLinks } from '../types/graph';
import '../styles/InfoPanel.css';
import '../styles/InfoPanelExtra.css';

interface InfoPanelRightProps {
  graphData: { nodes: GraphNode[]; edges: any[] } | null;
}

export default function InfoPanelRight({ graphData }: InfoPanelRightProps) {
  const { compareNodeId, setCompareNodeId, setSelectedNodeId, currentDomain } = useAppStore();

  const [paperLinks, setPaperLinks] = useState<PaperLinks | null>(null);
  const [paperLink, setPaperLink] = useState<string | null>(null);

  const compareNode = graphData?.nodes.find((n) => n.id === compareNodeId);

  // 加载论文链接数据
  useEffect(() => {
    const loadLinks = async () => {
      try {
        const response = await fetch('./data/paper_links.json');
        if (response.ok) {
          const data = await response.json();
          setPaperLinks(data);
        }
      } catch (err) {
        console.error('Error loading paper links:', err);
      }
    };
    loadLinks();
  }, []);

  // 获取选中论文的链接
  useEffect(() => {
    if (compareNode && compareNode.type === 'paper' && paperLinks && currentDomain) {
      // 去掉 .mmd 后缀来匹配
      const paperId = compareNode.id.replace(/\.mmd$/, '');
      const link = paperLinks[currentDomain]?.[paperId] || null;
      setPaperLink(link);
    } else {
      setPaperLink(null);
    }
  }, [compareNode, paperLinks, currentDomain]);

  if (!compareNode) {
    return null;
  }

  const handleSwitchToThis = () => {
    // 将当前对比节点设为主节点，关闭右侧面板
    setSelectedNodeId(compareNodeId);
    setCompareNodeId(null);
  };

  return (
    <div className="info-panel-right">
      <div className="panel-header">
        <h3>Compare Node</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleSwitchToThis}
            className="switch-btn"
            title="Switch to this node"
          >
            ⇄
          </button>
          <button
            onClick={() => setCompareNodeId(null)}
            className="close-btn"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* 只有上半部分：节点属性 */}
      <div className="panel-content">
        <section className="node-properties">
          <div className="property-row">
            <span className="property-label">ID:</span>
            <span className="property-value">{compareNode.id}</span>
          </div>
          <div className="property-row">
            <span className="property-label">Type:</span>
            <span className="property-value type-badge">{compareNode.type}</span>
          </div>
          {compareNode.type === 'paper' && paperLink && (
            <div className="property-row">
              <span className="property-label">Link:</span>
              <a
                href={paperLink}
                target="_blank"
                rel="noopener noreferrer"
                className="paper-link-btn"
              >
                🔗 Open Paper
              </a>
            </div>
          )}
          {compareNode.facet && (
            <div className="property-row">
              <span className="property-label">Facet:</span>
              <span className="property-value">{compareNode.facet}</span>
            </div>
          )}
          {compareNode.disciplines && (
            <div className="property-row">
              <span className="property-label">Disciplines:</span>
              <span className="property-value">{compareNode.disciplines}</span>
            </div>
          )}
          {compareNode.year && (
            <div className="property-row">
              <span className="property-label">Year:</span>
              <span className="property-value">{compareNode.year}</span>
            </div>
          )}
          {compareNode.description && (
            <div className="property-row">
              <span className="property-label">Description:</span>
              <span className="property-value description">{compareNode.description}</span>
            </div>
          )}
          {compareNode.abstract && (
            <div className="property-row">
              <span className="property-label">Abstract:</span>
              <span className="property-value description">{compareNode.abstract}</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
