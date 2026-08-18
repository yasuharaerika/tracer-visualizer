import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../utils/store';
import { Domain, DOMAIN_LABELS, IdeaWithPapers } from '../types/graph';
import { getBatchEvalCategories, EvalCat, COLORS, LABELS } from '../utils/eval';
import '../styles/IdeasView.css';

// GitHub SVG 图标
const GitHubIcon = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    style={{ verticalAlign: 'middle' }}
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
  </svg>
);

// 论文链接数据结构
interface PaperLinks {
  [domain: string]: {
    [paperId: string]: string | null;
  };
}

export default function IdeasView() {
  const { domain } = useParams<{ domain: string }>();
  const navigate = useNavigate();

  const {
    currentDomain,
    setCurrentDomain,
    ideasData,
    setIdeasData,
    isLoading,
    setIsLoading,
    setSelectedNodeId,
    setSelectedIdeaId,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'chain'>('score');
  const [selectedIdea, setSelectedIdea] = useState<IdeaWithPapers | null>(null);
  const [ideaCategories, setIdeaCategories] = useState<Map<number, EvalCat>>(new Map());
  const [filterCategory, setFilterCategory] = useState<'all' | 'low' | 'lower'>('all');
  const [paperLinks, setPaperLinks] = useState<PaperLinks | null>(null);
  const [paperGithubLinks, setPaperGithubLinks] = useState<PaperLinks | null>(null);

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

  // 加载评估分类数据
  useEffect(() => {
    if (!currentDomain || ideasData.length === 0) {
      return;
    }

    const loadCategories = () => {
      try {
        const categories = getBatchEvalCategories(
          ideasData.map(idea => ({ id: idea.id, proposal_content: idea.proposal_content }))
        );
        setIdeaCategories(categories);
      } catch (err) {
        console.error('Error loading evaluation categories:', err);
      }
    };

    loadCategories();
  }, [currentDomain, ideasData]);

  // 获取Idea的颜色
  const getIdeaColor = (idea: IdeaWithPapers): string => {
    const category = ideaCategories.get(idea.id);
    return COLORS[category || 'default'];
  };

  // 验证并设置领域
  useEffect(() => {
    if (!domain || !['phy', 'bio', 'mat', 'chem'].includes(domain)) {
      navigate('/');
      return;
    }

    if (currentDomain !== domain) {
      setCurrentDomain(domain as Domain);
    }
  }, [domain, currentDomain, setCurrentDomain, navigate]);

  // 加载Ideas数据（使用带 hypothesis_summary 的文件）
  useEffect(() => {
    if (!currentDomain) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // 优先加载带 hypothesis_summary 的数据
        const response = await fetch(`./data/${currentDomain}_ideas_with_hypothesis_summary.json`);
        if (!response.ok) {
          // 如果不存在，回退到原始文件
          const fallbackResponse = await fetch(`./data/${currentDomain}_ideas_with_papers.json`);
          if (!fallbackResponse.ok) {
            throw new Error(`Failed to load ${currentDomain} ideas`);
          }
          const fallbackData = await fallbackResponse.json();
          setIdeasData(fallbackData);
        } else {
          const data = await response.json();
          setIdeasData(data);
        }
      } catch (err) {
        console.error('Error loading ideas:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentDomain, setIdeasData, setIsLoading]);

  // 过滤和排序
  const filteredAndSortedIdeas = useMemo(() => {
    let filtered = ideasData;

    // 分类过滤
    if (filterCategory !== 'all') {
      filtered = filtered.filter(idea => {
        const category = ideaCategories.get(idea.id);
        return category === filterCategory;
      });
    }

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(idea =>
        idea.original_chain.toLowerCase().includes(query) ||
        idea.proposal_content?.toLowerCase().includes(query) ||
        idea.final_critique?.toLowerCase().includes(query)
      );
    }

    // 排序
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'score') {
        return (b.final_score || 0) - (a.final_score || 0);
      } else {
        return a.original_chain.localeCompare(b.original_chain);
      }
    });

    return sorted;
  }, [ideasData, searchQuery, sortBy, filterCategory, ideaCategories]);

  // 跳转到图谱并高亮此Idea的路径
  const jumpToGraph = (idea: IdeaWithPapers) => {
    setSelectedIdeaId(idea.id);
    setSelectedNodeId(idea.concept_chain[0]);
    navigate(`/graph/${currentDomain}`);
  };

  if (!currentDomain) {
    return null;
  }

  return (
    <div className="ideas-view">
      {/* 顶部导航栏 */}
      <header className="ideas-header">
        <div className="header-left">
          <Link to="/" className="back-button">
            ← Back
          </Link>
          <h1 className="domain-title">{DOMAIN_LABELS[currentDomain]}</h1>
          <span className="domain-subtitle">Research Ideas</span>
        </div>

        <div className="header-right">
          <Link
            to={`/graph/${currentDomain}`}
            className="button button-secondary"
          >
            View Graph →
          </Link>
        </div>
      </header>

      {/* 控制栏 */}
      <div className="ideas-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="search-clear"
            >
              ×
            </button>
          )}
        </div>

        <div className="sort-buttons">
          <button
            className={`sort-btn ${sortBy === 'score' ? 'active' : ''}`}
            onClick={() => setSortBy('score')}
          >
            Sort by Score
          </button>
          <button
            className={`sort-btn ${sortBy === 'chain' ? 'active' : ''}`}
            onClick={() => setSortBy('chain')}
          >
            Sort by Chain
          </button>
        </div>

        <div className="stats">
          <span>{filteredAndSortedIdeas.length} ideas</span>
        </div>
      </div>

      {/* 图例和筛选 */}
      <div className="ideas-legend-container">
        <div className="ideas-legend">
          <span className="legend-label">Filter:</span>
          <button
            className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            All ({ideasData.length})
          </button>
          <button
            className={`filter-btn ${filterCategory === 'low' ? 'active' : ''}`}
            onClick={() => setFilterCategory('low')}
            style={{ backgroundColor: filterCategory === 'low' ? COLORS['low'] : undefined }}
          >
            {LABELS['low']} ({Array.from(ideaCategories.values()).filter(v => v === 'low').length})
          </button>
          <button
            className={`filter-btn ${filterCategory === 'lower' ? 'active' : ''}`}
            onClick={() => setFilterCategory('lower')}
            style={{ backgroundColor: filterCategory === 'lower' ? COLORS['lower'] : undefined }}
          >
            {LABELS['lower']} ({Array.from(ideaCategories.values()).filter(v => v === 'lower').length})
          </button>
        </div>

        {/* 右侧图例 */}
        <div className="ideas-legend-right">
          <span
            className="legend-color"
            style={{ backgroundColor: COLORS['low'] }}
          />
          <span className="legend-text">{LABELS['low']}</span>
          <span
            className="legend-color"
            style={{ backgroundColor: COLORS['lower'] }}
          />
          <span className="legend-text">{LABELS['lower']}</span>
        </div>
      </div>

      {/* 主内容 - 网格 + 侧边面板 */}
      <main className={`ideas-main ${selectedIdea ? 'with-sidebar' : ''}`}>
        {isLoading ? (
          <div className="loading-container">
            <div className="loading" />
            <p>Loading ideas...</p>
          </div>
        ) : (
          <>
            {/* 网格区域 */}
            <div className="ideas-grid-container">
              <div className="ideas-grid">
                {filteredAndSortedIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className={`idea-grid-card ${selectedIdea?.id === idea.id ? 'selected' : ''}`}
                    style={{ backgroundColor: getIdeaColor(idea) }}
                    onClick={() => setSelectedIdea(idea)}
                  >
                    <div className="grid-card-score">
                      {idea.final_score?.toFixed(2) || 'N/A'}
                    </div>
                    <div className="grid-card-chain">
                      {idea.hypothesis_summary || idea.original_chain}
                    </div>
                  </div>
                ))}

                {filteredAndSortedIdeas.length === 0 && (
                  <div className="empty-state">
                    <p>No ideas found</p>
                  </div>
                )}
              </div>
            </div>

            {/* 侧边详情面板 */}
            {selectedIdea && (
              <aside className="ideas-sidebar">
                <div className="sidebar-header">
                  <h3>Idea Details</h3>
                  <div className="sidebar-actions">
                    <button
                      onClick={() => jumpToGraph(selectedIdea)}
                      className="sidebar-action-btn"
                      title="Jump to graph view"
                    >
                      🗺️
                    </button>
                    <button
                      onClick={() => setSelectedIdea(null)}
                      className="sidebar-close-btn"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="sidebar-body">
                  {/* 1. 概念链 */}
                  <section className="sidebar-section">
                    <h4>Concept Chain</h4>
                    <div className="chain-display">
                      {selectedIdea.original_chain}
                    </div>
                  </section>

                  {/* 2. 相关论文 */}
                  {selectedIdea.related_papers && selectedIdea.related_papers.length > 0 && (
                    <section className="sidebar-section">
                      <h4>Related Papers ({selectedIdea.related_papers.length})</h4>
                      <div className="papers-list">
                        {selectedIdea.related_papers.map((paper, idx) => {
                          const paperId = paper.replace(/\.mmd$/, '');
                          const link = paperLinks?.[currentDomain!]?.[paperId];
                          const githubLink = paperGithubLinks?.[currentDomain!]?.[paperId];
                          return (
                            <div key={idx} className="paper-item">
                              <span className="paper-icon">📄</span>
                              <span className="paper-id">{paper}</span>
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
                                    <GitHubIcon size={12} />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* 3. 评分 */}
                  <section className="sidebar-section">
                    <h4>Final Score</h4>
                    <div className="score-display">
                      {selectedIdea.final_score?.toFixed(2) || 'N/A'}
                    </div>
                  </section>

                  {/* 4. 提案内容 */}
                  {selectedIdea.proposal_content && (
                    <section className="sidebar-section">
                      <h4>Proposal</h4>
                      <div className="critique-text">
                        {selectedIdea.proposal_content}
                      </div>
                    </section>
                  )}

                  {/* 5. 评价 */}
                  {selectedIdea.final_critique && (
                    <section className="sidebar-section">
                      <h4>Critique</h4>
                      <div className="critique-text">
                        {selectedIdea.final_critique}
                      </div>
                    </section>
                  )}
                </div>
              </aside>
            )}
          </>
        )}
      </main>
    </div>
  );
}
