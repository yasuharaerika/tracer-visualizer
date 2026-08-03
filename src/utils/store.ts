import { create } from 'zustand';
import { Domain, GraphData, Idea } from '../types/graph';

interface AppState {
  // 当前选中的领域
  currentDomain: Domain | null;
  setCurrentDomain: (domain: Domain | null) => void;

  // 图谱数据
  graphData: GraphData | null;
  setGraphData: (data: GraphData | null) => void;

  // Ideas数据
  ideasData: Idea[];
  setIdeasData: (data: Idea[]) => void;

  // 当前选中的节点
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  // 对比节点（右侧简化面板）
  compareNodeId: string | null;
  setCompareNodeId: (id: string | null) => void;

  // 当前选中的Idea
  selectedIdeaId: number | null;
  setSelectedIdeaId: (id: number | null) => void;

  // Idea是否固定（显示路径模式）
  isIdeaPinned: boolean;
  setIsIdeaPinned: (pinned: boolean) => void;

  // 加载状态
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // 搜索词
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentDomain: null,
  setCurrentDomain: (domain) => set({ currentDomain: domain }),

  graphData: null,
  setGraphData: (data) => set({ graphData: data }),

  ideasData: [],
  setIdeasData: (data) => set({ ideasData: data }),

  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  compareNodeId: null,
  setCompareNodeId: (id) => set({ compareNodeId: id }),

  selectedIdeaId: null,
  setSelectedIdeaId: (id) => set({ selectedIdeaId: id }),

  isIdeaPinned: false,
  setIsIdeaPinned: (pinned) => set({ isIdeaPinned: pinned }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
