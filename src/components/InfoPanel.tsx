import { useAppStore } from '../utils/store';
import { useState, useMemo } from 'react';
import '../styles/InfoPanel.css';

type TabType = 'properties' | 'concepts' | 'papers' | 'ideas';

export default function InfoPanel() {
  const {
    selectedNodeId,
    graphData,
    ideasData,
    setSelectedNodeId,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('properties');

  if (!selectedNodeId || !graphData) {
    return null;
  }

  const node = graphData.nodes.find(n => n.id === selectedNodeId);

  if (!node) {
    return (
      <div className="info-panel">
        <div className="panel-header">
          <h3>Node not found</h3>
          <button onClick={() => setSelectedNodeId(null)}>×</button>
        </div>
      </div>
    );
  }

  // 找到相连的概念节点
  const connectedConcepts = useMemo(() => {
    if (!graphData) return [];
    const connected = new Set<string>();

    graphData.edges.forEach(edge => {
      if (edge.source === selectedNodeId) {
        const target = graphData.nodes.find(n => n.id === edge.target);
        if (target && target.type === 'concept') {
          connected.add(edge.target);
        }
      }
      if (edge.target === selectedNodeId) {
        const source = graphData.nodes.find(n => n.id === edge.source);
        if (source && source.type === 'concept') {
          connected.add(edge.source);
        }
      }
    });

    return Array.from(connected).map(id => graphData.nodes.find(n => n.id === id)!);
  }, [selectedNodeId, graphData]);

  // 找到相连的论文节点
  const connectedPapers = useMemo(() => {
    if (!graphData) return [];
    const connected = new Set<string>();

    graphData.edges.forEach(edge => {
      if (edge.source === selectedNodeId) {
        const target = graphData.nodes.find(n => n.id === edge.target);
        if (target && target.type === 'paper') {
          connected.add(edge.target);
        }
      }
      if (edge.target === selectedNodeId) {
        const source = graphData.nodes.find(n => n.id === edge.source);
        if (source && source.type === 'paper') {
          connected.add(edge.source);
        }
      }
    });

    return Array.from(connected).map(id => graphData.nodes.find(n => n.id === id)!);
  }, [selectedNodeId, graphData]);

  // 找到包含此节点的Ideas
  const relatedIdeas = useMemo(() => {
    return ideasData.filter(idea =>
      idea.original_chain.includes(selectedNodeId) ||
      (idea.related_papers && idea.related_papers.includes(selectedNodeId))
    );
  }, [selectedNodeId, ideasData]);

  return (
    <div className="info-panel">
      {/* 面板头部 */}
      <div className="panel-header">
        <div className="panel-title-group">
          <span className={`node-type-badge ${node.type}`}>
            {node.type === 'concept' ? '💡' : '📄'}
          </span>
          <h3 className="panel-title">{node.id}</h3>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="panel-close"
          aria-label="Close panel"
        >
          ×
        </button>
      </div>

      {/* 节点属性 */}
      <div className="panel-content">
        <section className="panel-section">
          <h4>Properties</h4>
          <div className="properties-list">
            <div className="property-item">
              <span className="property-label">Type</span>
              <span className="property-value">{node.type}</span>
            </div>

            {node.type === 'concept' && (
              <>
                <div className="property-item">
                  <span className="property-label">Facet</span>
                  <span className="property-value">{node.facet}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">Disciplines</span>
                  <span className="property-value">{node.disciplines}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">Year</span>
                  <span className="property-value">{node.year}</span>
                </div>
                {node.description && (
                  <div className="property-item description">
                    <span className="property-label">Description</span>
                    <p className="property-value">{node.description}</p>
                  </div>
                )}
              </>
            )}

            {node.type === 'paper' && (
              <>
                <div className="property-item">
                  <span className="property-label">Year</span>
                  <span className="property-value">{node.year}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">Focus Count</span>
                  <span className="property-value">{node.focus_count}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">Context Count</span>
                  <span className="property-value">{node.context_count}</span>
                </div>
                {node.abstract && (
                  <div className="property-item description">
                    <span className="property-label">Abstract</span>
                    <p className="property-value">{node.abstract}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Tabs */}
        <section className="panel-section">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'properties' ? 'active' : ''}`}
              onClick={() => setActiveTab('properties')}
            >
              Properties
            </button>
            <button
              className={`tab ${activeTab === 'concepts' ? 'active' : ''}`}
              onClick={() => setActiveTab('concepts')}
            >
              Connected Concepts ({connectedConcepts.length})
            </button>
            <button
              className={`tab ${activeTab === 'papers' ? 'active' : ''}`}
              onClick={() => setActiveTab('papers')}
            >
              Connected Papers ({connectedPapers.length})
            </button>
            <button
              className={`tab ${activeTab === 'ideas' ? 'active' : ''}`}
              onClick={() => setActiveTab('ideas')}
            >
              Related Ideas ({relatedIdeas.length})
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'properties' && (
              <div className="properties-list">
                <div className="property-item">
                  <span className="property-label">Type</span>
                  <span className="property-value">{node.type}</span>
                </div>

                {node.type === 'concept' && (
                  <>
                    <div className="property-item">
                      <span className="property-label">Facet</span>
                      <span className="property-value">{node.facet}</span>
                    </div>
                    <div className="property-item">
                      <span className="property-label">Disciplines</span>
                      <span className="property-value">{node.disciplines}</span>
                    </div>
                    <div className="property-item">
                      <span className="property-label">Year</span>
                      <span className="property-value">{node.year}</span>
                    </div>
                    {node.description && (
                      <div className="property-item description">
                        <span className="property-label">Description</span>
                        <p className="property-value">{node.description}</p>
                      </div>
                    )}
                  </>
                )}

                {node.type === 'paper' && (
                  <>
                    <div className="property-item">
                      <span className="property-label">Year</span>
                      <span className="property-value">{node.year}</span>
                    </div>
                    <div className="property-item">
                      <span className="property-label">Focus Count</span>
                      <span className="property-value">{node.focus_count}</span>
                    </div>
                    <div className="property-item">
                      <span className="property-label">Context Count</span>
                      <span className="property-value">{node.context_count}</span>
                    </div>
                    {node.abstract && (
                      <div className="property-item description">
                        <span className="property-label">Abstract</span>
                        <p className="property-value">{node.abstract}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'concepts' && (
              <div className="connected-list">
                {connectedConcepts.length === 0 ? (
                  <p className="placeholder-text">No connected concepts</p>
                ) : (
                  connectedConcepts.map((concept, idx) => (
                    <div
                      key={idx}
                      className="connected-item"
                      onClick={() => setSelectedNodeId(concept.id)}
                    >
                      <span className="item-icon">💡</span>
                      <div className="item-content">
                        <div className="item-name">{concept.id}</div>
                        {concept.facet && (
                          <div className="item-meta">{concept.facet}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'papers' && (
              <div className="connected-list">
                {connectedPapers.length === 0 ? (
                  <p className="placeholder-text">No connected papers</p>
                ) : (
                  connectedPapers.map((paper, idx) => (
                    <div
                      key={idx}
                      className="connected-item"
                      onClick={() => setSelectedNodeId(paper.id)}
                    >
                      <span className="item-icon">📄</span>
                      <div className="item-content">
                        <div className="item-name">{paper.id}</div>
                        {paper.year && (
                          <div className="item-meta">Year: {paper.year}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'ideas' && (
              <div className="ideas-list-panel">
                {relatedIdeas.length === 0 ? (
                  <p className="placeholder-text">No related ideas</p>
                ) : (
                  relatedIdeas.map((idea, idx) => (
                    <div key={idx} className="idea-item">
                      <div className="idea-item-header">
                        <span className="idea-score">
                          {idea.final_score?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                      <div className="idea-chain-short">
                        {idea.original_chain}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
