import { useState, useEffect } from 'react';
import { useAppStore } from '../utils/store';
import { GraphNode, IdeaWithPapers, PaperLinks } from '../types/graph';
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

interface InfoPanelLeftProps {
  graphData: { nodes: GraphNode[]; edges: any[] } | null;
}

type TabType = 'concepts' | 'papers' | 'ideas';

export default function InfoPanelLeft({ graphData }: InfoPanelLeftProps) {
  const { selectedNodeId, setSelectedNodeId, ideasData, setCompareNodeId, compareNodeId, setSelectedIdeaId, currentDomain } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('concepts');
  const [paperLinks, setPaperLinks] = useState<PaperLinks | null>(null);
  const [paperLink, setPaperLink] = useState<string | null>(null);
  const [paperGithubLinks, setPaperGithubLinks] = useState<PaperLinks | null>(null);
  const [paperGithubLink, setPaperGithubLink] = useState<string | null>(null);

  // 获取选中节点的详细信息
  const selectedNode = graphData?.nodes.find(n => n.id === selectedNodeId);

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
    if (selectedNode && selectedNode.type === 'paper' && paperLinks && currentDomain) {
      // 去掉 .mmd 后缀来匹配
      const paperId = selectedNode.id.replace(/\.mmd$/, '');
      const link = paperLinks[currentDomain]?.[paperId] || null;
      setPaperLink(link);
    } else {
      setPaperLink(null);
    }

    if (selectedNode && selectedNode.type === 'paper' && paperGithubLinks && currentDomain) {
      const paperId = selectedNode.id.replace(/\.mmd$/, '');
      const githubLink = paperGithubLinks[currentDomain]?.[paperId] || null;
      setPaperGithubLink(githubLink);
    } else {
      setPaperGithubLink(null);
    }
  }, [selectedNode, paperLinks, paperGithubLinks, currentDomain]);

  if (!selectedNodeId || !selectedNode) {
    return null;
  }

  // 节点ID转为string（已知不为null）
  const nodeIdStr: string = selectedNodeId;

  // 调试
  console.log('selectedNode:', selectedNode);
  console.log('nodeType:', selectedNode.type);

  // 获取连接的概念节点
  const connectedConcepts = graphData?.edges
    .filter(e => (e.source === nodeIdStr || e.target === nodeIdStr))
    .map(e => e.source === nodeIdStr ? e.target : e.source)
    .map(id => graphData.nodes.find(n => n.id === id))
    .filter(n => n && n.type === 'concept') || [];

  // 获取连接的论文节点
  const connectedPapers = graphData?.edges
    .filter(e => (e.source === nodeIdStr || e.target === nodeIdStr))
    .map(e => e.source === nodeIdStr ? e.target : e.source)
    .map(id => graphData.nodes.find(n => n.id === id))
    .filter(n => n && n.type === 'paper') || [];

  // 获取相关Ideas
  const relatedIdeas = ideasData.filter((idea: IdeaWithPapers) => {
    return (
      idea.concept_chain.includes(nodeIdStr) ||
      idea.related_papers.includes(nodeIdStr)
    );
  });

  const handleConceptClick = (nodeId: string) => {
    setCompareNodeId(nodeId); // 设置对比节点，会在右侧显示
  };

  const handlePaperClick = (nodeId: string) => {
    setCompareNodeId(nodeId);
  };

  const handleIdeaClick = (ideaId: number) => {
    const idea = ideasData.find((i: IdeaWithPapers) => i.id === ideaId);
    if (idea) {
      // 设置Idea但不改变当前选中节点
      setSelectedIdeaId(ideaId);
      setCompareNodeId(null); // 关闭对比面板
    }
  };

  return (
    <div className="info-panel-left">
      <div className="panel-header">
        <h3>Node Details</h3>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="close-btn"
          title="Close"
        >
          ×
        </button>
      </div>

      {/* 上半部分：节点属性 */}
      <div className="panel-content">
        <section className="node-properties">
          <div className="property-row">
            <span className="property-label">ID:</span>
            <span className="property-value">{selectedNode.id}</span>
          </div>
          <div className="property-row">
            <span className="property-label">Type:</span>
            <span className="property-value type-badge">{selectedNode.type || 'unknown'}</span>
          </div>
          {selectedNode.type === 'paper' && (paperLink || paperGithubLink) && (
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
          {selectedNode.facet && (
            <div className="property-row">
              <span className="property-label">Facet:</span>
              <span className="property-value">{selectedNode.facet}</span>
            </div>
          )}
          {selectedNode.disciplines && (
            <div className="property-row">
              <span className="property-label">Disciplines:</span>
              <span className="property-value">{selectedNode.disciplines}</span>
            </div>
          )}
          {selectedNode.year && (
            <div className="property-row">
              <span className="property-label">Year:</span>
              <span className="property-value">{selectedNode.year}</span>
            </div>
          )}
          {selectedNode.description && (
            <div className="property-row">
              <span className="property-label">Description:</span>
              <span className="property-value description">{selectedNode.description}</span>
            </div>
          )}
          {selectedNode.abstract && (
            <div className="property-row">
              <span className="property-label">Abstract:</span>
              <span className="property-value description">{selectedNode.abstract}</span>
            </div>
          )}
        </section>

        {/* 下半部分：3个Tab */}
        <div className="tabs-section">
          <div className="tabs-header">
            <button
              className={`tab-btn ${activeTab === 'concepts' ? 'active' : ''}`}
              onClick={() => setActiveTab('concepts')}
            >
              <span>Connected</span>
              <span>Concepts</span>
              <span>({connectedConcepts.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'papers' ? 'active' : ''}`}
              onClick={() => setActiveTab('papers')}
            >
              <span>Connected</span>
              <span>Papers</span>
              <span>({connectedPapers.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'ideas' ? 'active' : ''}`}
              onClick={() => setActiveTab('ideas')}
            >
              <span>Related</span>
              <span>Ideas</span>
              <span>({relatedIdeas.length})</span>
            </button>
          </div>

          <div className="tabs-content">
            {activeTab === 'concepts' && (
              <div className="tab-panel">
                {connectedConcepts.length > 0 ? (
                  <ul className="connected-list">
                    {connectedConcepts.map((node) => (
                      <li
                        key={node!.id}
                        onClick={() => handleConceptClick(node!.id)}
                        className={compareNodeId === node!.id ? 'active' : ''}
                      >
                        <div className="node-name">{node!.id}</div>
                        {node!.facet && (
                          <div className="node-facet">{node!.facet}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">No connected concepts</p>
                )}
              </div>
            )}

            {activeTab === 'papers' && (
              <div className="tab-panel">
                {connectedPapers.length > 0 ? (
                  <ul className="connected-list">
                    {connectedPapers.map((node) => (
                      <li
                        key={node!.id}
                        onClick={() => handlePaperClick(node!.id)}
                        className={compareNodeId === node!.id ? 'active' : ''}
                      >
                        <div className="node-name">{node!.id}</div>
                        {node!.year && (
                          <div className="node-year">Year: {node!.year}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">No connected papers</p>
                )}
              </div>
            )}

            {activeTab === 'ideas' && (
              <div className="tab-panel">
                {relatedIdeas.length > 0 ? (
                  <ul className="ideas-list">
                    {relatedIdeas.map((idea: IdeaWithPapers) => (
                      <li key={idea.id} onClick={() => handleIdeaClick(idea.id)}>
                        <div className="idea-header">
                          <span className="idea-chain">{idea.original_chain}</span>
                          <span className="idea-score">{idea.final_score?.toFixed(2) ?? 'N/A'}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">No related ideas</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
