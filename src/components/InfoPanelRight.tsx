import { useState, useEffect } from 'react';
import { useAppStore } from '../utils/store';
import { GraphNode, PaperLinks } from '../types/graph';
import '../styles/InfoPanel.css';
import '../styles/InfoPanelExtra.css';

// GitHub SVG 图标
const GitHubIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    style={{ verticalAlign: 'middle', marginRight: '4px' }}
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
  </svg>
);

interface InfoPanelRightProps {
  graphData: { nodes: GraphNode[]; edges: any[] } | null;
}

export default function InfoPanelRight({ graphData }: InfoPanelRightProps) {
  const { compareNodeId, setCompareNodeId, setSelectedNodeId, currentDomain } = useAppStore();

  const [paperLinks, setPaperLinks] = useState<PaperLinks | null>(null);
  const [paperLink, setPaperLink] = useState<string | null>(null);
  const [paperGithubLinks, setPaperGithubLinks] = useState<PaperLinks | null>(null);
  const [paperGithubLink, setPaperGithubLink] = useState<string | null>(null);

  const compareNode = graphData?.nodes.find((n) => n.id === compareNodeId);

  // 加载论文链接数据
  useEffect(() => {
    const loadLinks = async () => {
      try {
        const [paperResponse, githubResponse] = await Promise.all([
          fetch('./data/paper_links.json'),
          fetch('./data/paper_github_links.json'),
        ]);

        if (paperResponse.ok) {
          const data = await paperResponse.json();
          setPaperLinks(data);
        }

        if (githubResponse.ok) {
          const data = await githubResponse.json();
          setPaperGithubLinks(data);
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

    if (compareNode && compareNode.type === 'paper' && paperGithubLinks && currentDomain) {
      const paperId = compareNode.id.replace(/\.mmd$/, '');
      const githubLink = paperGithubLinks[currentDomain]?.[paperId] || null;
      setPaperGithubLink(githubLink);
    } else {
      setPaperGithubLink(null);
    }
  }, [compareNode, paperLinks, paperGithubLinks, currentDomain]);

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
          {compareNode.type === 'paper' && (paperLink || paperGithubLink) && (
            <div className="property-row">
              <span className="property-label">Links:</span>
              <div className="link-buttons">
                {paperLink && (
                  <a
                    href={paperLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="paper-link-btn"
                  >
                    🔗 Paper
                  </a>
                )}
                {paperGithubLink && (
                  <a
                    href={paperGithubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="paper-link-btn github-link"
                  >
                    <GitHubIcon size={14} /> GitHub
                  </a>
                )}
              </div>
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
