import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../utils/store';
import '../styles/SearchBar.css';

export default function SearchBar() {
  const { searchQuery, setSearchQuery, graphData, setSelectedNodeId } = useAppStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredNodes, setFilteredNodes] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() && graphData) {
      // 过滤匹配的节点
      const matches = graphData.nodes
        .filter(n => n.id.toLowerCase().includes(query.toLowerCase()))
        .map(n => n.id)
        .slice(0, 20); // 最多显示20个
      setFilteredNodes(matches);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleSelectNode = (nodeId: string) => {
    setSearchQuery(nodeId);
    setSelectedNodeId(nodeId);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    setShowDropdown(false);
  };

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="search-bar" ref={dropdownRef}>
      <input
        type="text"
        placeholder="Search nodes..."
        value={searchQuery}
        onChange={handleSearch}
        onFocus={() => {
          if (searchQuery.trim() && filteredNodes.length > 0) {
            setShowDropdown(true);
          }
        }}
        className="search-input"
      />
      {searchQuery && (
        <button
          onClick={handleClear}
          className="search-clear"
          aria-label="Clear search"
        >
          ×
        </button>
      )}

      {showDropdown && filteredNodes.length > 0 && (
        <div className="search-dropdown">
          {filteredNodes.map((nodeId) => (
            <div
              key={nodeId}
              className="search-item"
              onClick={() => handleSelectNode(nodeId)}
            >
              {nodeId}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
