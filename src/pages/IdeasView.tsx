import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../utils/store';
import { Domain, DOMAIN_LABELS, IdeaWithPapers } from '../types/graph';
import { getBatchEvalCategories, EvalCat, COLORS, LABELS } from '../utils/eval';
import '../styles/IdeasView.css';

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

  // 加载评估分类数据
  useEffect(() => {
    if (!currentDomain || ideasData.length === 0) {
      console.log('[IdeasView] Skipping category load:', { currentDomain, ideasCount: ideasData.length });
      return;
    }

    const loadCategories = () => {
      try {
        console.log('[IdeasView] Loading categories for', ideasData.length, 'ideas in', currentDomain);
        const categories = getBatchEvalCategories(
          ideasData.map(idea => ({ id: idea.id, proposal_content: idea.proposal_content }))
        );
        console.log('[IdeasView] Loaded categories:', categories);
        setIdeaCategories(categories);
      } catch (err) {
        console.error('[IdeasView] Error loading evaluation categories:', err);
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

  // 加载Ideas数据
  useEffect(() => {
    if (!currentDomain) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`./data/${currentDomain}_ideas_with_papers.json`);
        if (!response.ok) {
          throw new Error(`Failed to load ${currentDomain} ideas`);
        }
        const data = await response.json();
        setIdeasData(data);
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
    // 设置Idea和第一个节点
    setSelectedIdeaId(idea.id);
    setSelectedNodeId(idea.concept_chain[0]);

    // 跳转到图谱页面
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

      {/* 主内容 */}
      <main className="ideas-main">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading" />
            <p>Loading ideas...</p>
          </div>
        ) : (
          <div className="ideas-layout">
            {/* Ideas列表 */}
            <div className="ideas-list">
              {filteredAndSortedIdeas.map((idea, index) => (
                <div
                  key={index}
                  className={`idea-card ${selectedIdea === idea ? 'selected' : ''}`}
                  style={{ backgroundColor: getIdeaColor(idea) }}
                  onClick={() => setSelectedIdea(idea)}
                >
                  <div className="idea-header">
                    <span className="idea-number">#{index + 1}</span>
                    <span className="idea-score">
                      {idea.final_score?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <div className="idea-chain">
                    {idea.original_chain}
                  </div>
                  <div className="idea-meta">
                    <span className="paper-count">
                      📄 {idea.related_papers?.length || 0} papers
                    </span>
                  </div>
                </div>
              ))}

              {filteredAndSortedIdeas.length === 0 && !isLoading && (
                <div className="empty-state">
                  <p>No ideas found</p>
                </div>
              )}
            </div>

            {/* 详情面板 */}
            {selectedIdea && (
              <div className="idea-detail">
                <div className="detail-header">
                  <h3>Idea Details</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => jumpToGraph(selectedIdea)}
                      className="jump-to-graph-btn"
                      title="Jump to graph view"
                    >
                      🗺️
                    </button>
                    <button
                      onClick={() => setSelectedIdea(null)}
                      className="close-btn"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="detail-content">
                  {/* 概念链 */}
                  <section className="detail-section">
                    <h4>Concept Chain</h4>
                    <div className="chain-display">
                      {selectedIdea.original_chain}
                    </div>
                  </section>

                  {/* 评分 */}
                  <section className="detail-section">
                    <h4>Final Score</h4>
                    <div className="score-display">
                      {selectedIdea.final_score?.toFixed(2) || 'N/A'}
                    </div>
                  </section>

                  {/* 提案内容 */}
                  {selectedIdea.proposal_content && (
                    <section className="detail-section">
                      <h4>Proposal</h4>
                      <div className="critique-text">
                        {selectedIdea.proposal_content}
                      </div>
                    </section>
                  )}

                  {/* 评价 */}
                  {selectedIdea.final_critique && (
                    <section className="detail-section">
                      <h4>Critique</h4>
                      <div className="critique-text">
                        {selectedIdea.final_critique}
                      </div>
                    </section>
                  )}

                  {/* 相关论文 */}
                  {selectedIdea.related_papers && selectedIdea.related_papers.length > 0 && (
                    <section className="detail-section">
                      <h4>Related Papers ({selectedIdea.related_papers.length})</h4>
                      <div className="papers-list">
                        {selectedIdea.related_papers.map((paper, idx) => (
                          <div key={idx} className="paper-item">
                            <span className="paper-icon">📄</span>
                            <span className="paper-id">{paper}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
