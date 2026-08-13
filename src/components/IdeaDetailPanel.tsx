import { useState, useEffect } from 'react';
import { useAppStore } from '../utils/store';
import { IdeaWithPapers, PaperLinks } from '../types/graph';
import '../styles/IdeaDetailPanel.css';

interface IdeaDetailPanelProps {
  idea: IdeaWithPapers;
}

export default function IdeaDetailPanel({ idea }: IdeaDetailPanelProps) {
  const {
    setSelectedIdeaId,
    isIdeaPinned,
    setIsIdeaPinned,
    selectedNodeId,
    setSelectedNodeId,
    currentDomain,
  } = useAppStore();

  const [paperLinks, setPaperLinks] = useState<PaperLinks | null>(null);
  const [paperLinksMap, setPaperLinksMap] = useState<Record<string, string>>({});

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

  // 获取所有论文的链接
  useEffect(() => {
    if (paperLinks && currentDomain && idea.related_papers) {
      const links: Record<string, string> = {};
      for (const paper of idea.related_papers) {
        // 去掉 .mmd 后缀来匹配
        const paperId = paper.replace(/\.mmd$/, '');
        links[paper] = paperLinks[currentDomain]?.[paperId] || null;
      }
      setPaperLinksMap(links);
    }
  }, [paperLinks, currentDomain, idea.related_papers]);

  const handleNodeClick = (nodeId: string) => {
    if (isIdeaPinned) {
      // 固定模式：只切换左侧属性窗口，不改变右侧
      setSelectedNodeId(nodeId);
    }
  };

  return (
    <div className="idea-detail-panel">
      <div className="panel-header">
        <h3>Idea Details</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setIsIdeaPinned(!isIdeaPinned)}
            className={`pin-btn ${isIdeaPinned ? 'pinned' : ''}`}
            title={isIdeaPinned ? 'Unpin path' : 'Pin path'}
          >
            📌
          </button>
          <button
            onClick={() => setSelectedIdeaId(null)}
            className="close-btn"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      <div className="panel-content">
        {/* 概念链 */}
        <section className="detail-section">
          <h4>Concept Chain</h4>
          <div className="concept-chain-list">
            {idea.concept_chain.map((concept, index) => (
              <div
                key={index}
                className={`chain-node ${selectedNodeId === concept ? 'active' : ''}`}
                onClick={() => handleNodeClick(concept)}
              >
                <span className="node-index">{index + 1}</span>
                <span className="node-name">{concept}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 相关论文 - 移到分数前面 */}
        {idea.related_papers && idea.related_papers.length > 0 && (
          <section className="detail-section">
            <h4>Related Papers ({idea.related_papers.length})</h4>
            <ul className="papers-list">
              {idea.related_papers.map((paper, index) => {
                const link = paperLinksMap[paper];
                return (
                  <li
                    key={index}
                    className="paper-item"
                    onClick={() => handleNodeClick(paper)}
                  >
                    <div className="paper-item-content">
                      <span className="paper-type">Paper</span>
                      <span className="paper-name">{paper}</span>
                    </div>
                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="paper-link-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        🔗
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* 最终评分 */}
        <section className="detail-section score-section">
          <h4>Final Score</h4>
          <div className="score-display">{idea.final_score?.toFixed(2) ?? 'N/A'}</div>
        </section>

        {/* 提案内容 */}
        {idea.proposal_content && (
          <section className="detail-section">
            <h4>Proposal</h4>
            <div className="proposal-text">{idea.proposal_content}</div>
          </section>
        )}

        {/* 最终评价 */}
        {idea.final_critique && (
          <section className="detail-section">
            <h4>Final Critique</h4>
            <div className="critique-text">{idea.final_critique}</div>
          </section>
        )}
      </div>
    </div>
  );
}
