import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../utils/store';
import { loadIdeasData } from '../utils/graphLoader';
import { Domain, DOMAIN_LABELS } from '../types/graph';
import GraphCanvas from '../components/GraphCanvas';
import InfoPanelLeft from '../components/InfoPanelLeft';
import InfoPanelRight from '../components/InfoPanelRight';
import IdeaDetailPanel from '../components/IdeaDetailPanel';
import SearchBar from '../components/SearchBar';
import '../styles/GraphView.css';

export default function GraphView() {
  const { domain } = useParams<{ domain: string }>();
  const navigate = useNavigate();

  const {
    currentDomain,
    setCurrentDomain,
    graphData,
    ideasData,
    setIdeasData,
    isLoading,
    setIsLoading,
    selectedNodeId,
    setCompareNodeId,
    compareNodeId,
    selectedIdeaId,
    setSelectedIdeaId,
    isIdeaPinned,
  } = useAppStore();

  const [error, setError] = useState<string | null>(null);

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
      setError(null);

      try {
        const ideas = await loadIdeasData(currentDomain);
        setIdeasData(ideas);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentDomain, setIdeasData, setIsLoading]);

  // 当左侧节点改变时，关闭右侧面板（除非是固定的Idea）
  const prevSelectedNodeRef = useRef(selectedNodeId);

  useEffect(() => {
    // 只有当selectedNodeId真正改变时才执行清理
    const nodeChanged = prevSelectedNodeRef.current !== selectedNodeId;

    if (nodeChanged) {
      console.log('Node changed from', prevSelectedNodeRef.current, 'to', selectedNodeId);
      prevSelectedNodeRef.current = selectedNodeId;

      // 关闭对比节点
      setCompareNodeId(null);

      // 关闭Idea面板（除非是固定状态）
      if (selectedIdeaId !== null && !isIdeaPinned) {
        console.log('Closing Idea panel because node changed and not pinned');
        setSelectedIdeaId(null);
      }
    }
  }, [selectedNodeId]); // 移除其他依赖避免无限循环

  if (!currentDomain) {
    return null;
  }

  return (
    <div className="graph-view">
      {/* 顶部导航栏 */}
      <header className="graph-header">
        <div className="header-left">
          <Link to="/" className="back-button">
            ← Back
          </Link>
          <h1 className="domain-title">{DOMAIN_LABELS[currentDomain]}</h1>
          <span className="domain-subtitle">Knowledge Graph</span>
        </div>

        <div className="header-center">
          <SearchBar />
        </div>

        <div className="header-right">
          <Link
            to={`/ideas/${currentDomain}`}
            className="button button-secondary"
          >
            View Ideas →
          </Link>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="graph-main">
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading" />
            <p>Loading {DOMAIN_LABELS[currentDomain]} data...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
            <button onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* 图谱画布 */}
            <div className="graph-container">
              <GraphCanvas />
            </div>

            {/* 左侧信息面板（主节点） */}
            {selectedNodeId && (
              <div className="info-panel-left-container">
                <InfoPanelLeft graphData={graphData} />
              </div>
            )}

            {/* 右侧面板：Idea详情优先，然后是对比节点 */}
            {selectedIdeaId !== null && (
              <div className="info-panel-right-container">
                <IdeaDetailPanel idea={ideasData.find(i => i.id === selectedIdeaId)!} />
              </div>
            )}

            {!selectedIdeaId && compareNodeId && (
              <div className="info-panel-right-container">
                <InfoPanelRight graphData={graphData} />
              </div>
            )}
          </>
        )}
      </main>

      {/* 状态栏 */}
      <footer className="graph-footer">
        <span className="stat">
          {graphData ? `${graphData.nodes.length} nodes, ${graphData.edges.length} edges` : 'No data'}
        </span>
        <span className="stat">
          {ideasData.length} research ideas
        </span>
        {selectedNodeId && (
          <span className="stat selected">
            Selected: {selectedNodeId}
          </span>
        )}
      </footer>
    </div>
  );
}
