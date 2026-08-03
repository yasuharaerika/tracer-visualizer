import { useNavigate } from 'react-router-dom';
import { Domain, DOMAIN_LABELS } from '../types/graph';
import '../styles/HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();

  const handleDomainSelect = (domain: Domain) => {
    navigate(`/graph/${domain}`);
  };

  const domains: Domain[] = ['phy', 'bio', 'mat', 'chem'];

  return (
    <div className="home-page">
      {/* 纸质纹理背景 */}
      <div className="home-background" />

      {/* 主内容 */}
      <div className="home-container">
        <div className="home-content">
          {/* Logo / 标题 */}
          <div className="home-header">
            <h1 className="home-title">
              TRACER
            </h1>
            <p className="home-subtitle">
              Knowledge Graph & Research Ideas Visualization
            </p>
            <p className="home-description">
              Explore the interconnected landscape of scientific concepts,
              papers, and AI-generated research proposals across four domains.
            </p>
          </div>

          {/* 领域选择卡片 */}
          <div className="domain-grid">
            {domains.map((domain) => (
              <button
                key={domain}
                className="domain-card"
                onClick={() => handleDomainSelect(domain)}
              >
                <div className="domain-card-content">
                  <h2 className="domain-title">{DOMAIN_LABELS[domain]}</h2>
                  <div className="domain-icon">{getDomainIcon(domain)}</div>
                  <p className="domain-description">
                    {getDomainDescription(domain)}
                  </p>
                  <div className="domain-arrow">→</div>
                </div>
              </button>
            ))}
          </div>

          {/* 底部说明 */}
          <div className="home-footer">
            <p>
              Choose a domain to explore its knowledge graph,
              browse research ideas, and discover connections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 获取领域图标（简单的emoji/文字）
function getDomainIcon(domain: Domain): string {
  const icons: Record<Domain, string> = {
    phy: '⚛️',
    bio: '🧬',
    mat: '⚗️',
    chem: '🔬',
  };
  return icons[domain];
}

// 获取领域描述
function getDomainDescription(domain: Domain): string {
  const descriptions: Record<Domain, string> = {
    phy: 'Gravitation, Quantum Physics, Astrophysics',
    bio: 'Molecular Biology, Genetics, Biophysics',
    mat: 'Materials Science, Nanomaterials, Polymers',
    chem: 'Organic Chemistry, Catalysis, Computational Chemistry',
  };
  return descriptions[domain];
}
