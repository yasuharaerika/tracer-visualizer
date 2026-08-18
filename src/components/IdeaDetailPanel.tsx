import { useState, useEffect } from 'react';
import { useAppStore } from '../utils/store';
import { IdeaWithPapers } from '../types/graph';
import '../styles/IdeaDetailPanel.css';

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

interface IdeaDetailPanelProps {
  idea: IdeaWithPapers;
}

// 论文链接数据结构
interface PaperLinks {
  [domain: string]: {
    [paperId: string]: string | null;
  };
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
  const [paperGithubLinks, setPaperGithubLinks] = useState<PaperLinks | null>(null);
  const [paperLinksMap, setPaperLinksMap] = useState<Record<string, string | null>>({});
  const [paperGithubLinksMap, setPaperGithubLinksMap] = useState<Record<string, string | null>>({});

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
          const githubData = await githubResponse.json();
          setPaperGithubLinks(githubData);
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
      const links: Record<string, string | null> = {};
      for (const paper of idea.related_papers) {
        // 去掉 .mmd 后缀来匹配
        const paperId = paper.replace(/\.mmd$/, '');
        links[paper] = paperLinks[currentDomain]?.[paperId] || null;
      }
      setPaperLinksMap(links);
    }

    if (paperGithubLinks && currentDomain && idea.related_papers) {
      const githubLinks: Record<string, string | null> = {};
      for (const paper of idea.related_papers) {
        const paperId = paper.replace(/\.mmd$/, '');
        githubLinks[paper] = paperGithubLinks[currentDomain]?.[paperId] || null;
      }
      setPaperGithubLinksMap(githubLinks);
    }
  }, [paperLinks, paperGithubLinks, currentDomain, idea.related_papers]);

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
        {/* 1. 概念链 */}
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

        {/* 2. 相关论文 */}
        {idea.related_papers && idea.related_papers.length > 0 && (
          <section className="detail-section">
            <h4>Related Papers ({idea.related_papers.length})</h4>
            <ul className="papers-list">
              {idea.related_papers.map((paper, index) => {
                const link = paperLinksMap[paper];
                const githubLink = paperGithubLinksMap[paper];
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
                    <div className="paper-links">
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
                      {githubLink && (
                        <a
                          href={githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="paper-link-btn github-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GitHubIcon size={14} />
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* 3. 最终评分 */}
        <section className="detail-section score-section">
          <h4>Final Score</h4>
          <div className="score-display">{idea.final_score?.toFixed(2) ?? 'N/A'}</div>
        </section>

        {/* 4. 提案内容 */}
        {idea.proposal_content && (
          <section className="detail-section">
            <h4>Proposal</h4>
            <div className="proposal-text">{idea.proposal_content}</div>
          </section>
        )}

        {/* 5. 最终评价 */}
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
