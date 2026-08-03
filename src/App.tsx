import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GraphView from './pages/GraphView';
import IdeasView from './pages/IdeasView';
import './styles/hive-mind.css';

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* 主页 - 领域选择 */}
        <Route path="/" element={<HomePage />} />

        {/* 图谱视图 */}
        <Route path="/graph/:domain" element={<GraphView />} />

        {/* Ideas列表视图 */}
        <Route path="/ideas/:domain" element={<IdeasView />} />

        {/* 默认重定向 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
