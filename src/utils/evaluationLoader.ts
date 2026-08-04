import { Domain } from '../types/graph';

// 静态导入 JSON 数据
import evaluationData from '../data/evaluation_data.json';

// 评估结果类型
export type EvaluationCategory = 'low' | 'lower' | null;

// 颜色配置 - 高对比度配色方案
export const EVALUATION_COLORS = {
  default: '#F5F0E8',        // 暖米白 - 默认
  low: '#A8D4E6',           // 柔和蓝 - 冷静，专业
  lower: '#E6B8A8',         // 柔和红 - 警示、热度
};

// 图例标签
export const EVALUATION_LABELS = {
  low: 'Hit Low',
  lower: 'Hit Lower',
};

// 评估数据缓存 - 使用 Set 提高查找效率
interface EvaluationDataCache {
  low: Set<string>;
  lower: Set<string>;
}

let evaluationCache: EvaluationDataCache | null = null;

/**
 * 解析 JSON 数据并缓存
 */
function parseEvaluationData(): EvaluationDataCache {
  if (evaluationCache) {
    return evaluationCache;
  }

  evaluationCache = {
    low: new Set(evaluationData.low as string[]),
    lower: new Set(evaluationData.lower as string[]),
  };

  console.log(`[evaluationLoader] Loaded ${evaluationCache.low.size} low, ${evaluationCache.lower.size} lower`);
  return evaluationCache;
}

/**
 * 判断一个 idea 属于哪个评估类别
 */
export function getIdeaEvaluationCategory(
  proposalContent: string,
  _domain: Domain
): EvaluationCategory {
  // 移除 "Hypothesis:" 前缀
  const contentKey = proposalContent.replace(/^Hypothesis:\s*/i, '').slice(0, 100).trim();

  const data = parseEvaluationData();

  // 先检查 lower
  if (data.lower.has(contentKey)) {
    return 'lower';
  }

  // 再检查 low
  if (data.low.has(contentKey)) {
    return 'low';
  }

  return null;
}

/**
 * 批量获取多个 idea 的评估类别（更高效）
 */
export function getIdeasEvaluationCategories(
  ideas: Array<{ id: number; proposal_content: string }>,
  _domain: Domain
): Map<number, EvaluationCategory> {
  const result = new Map<number, EvaluationCategory>();
  const data = parseEvaluationData();

  for (const idea of ideas) {
    // 移除 "Hypothesis:" 前缀
    const contentKey = idea.proposal_content.replace(/^Hypothesis:\s*/i, '').slice(0, 100).trim();

    if (data.lower.has(contentKey)) {
      result.set(idea.id, 'lower');
    } else if (data.low.has(contentKey)) {
      result.set(idea.id, 'low');
    } else {
      result.set(idea.id, null);
    }
  }

  // 统计结果
  const lowCount = Array.from(result.values()).filter(v => v === 'low').length;
  const lowerCount = Array.from(result.values()).filter(v => v === 'lower').length;
  console.log(`[getIdeasEvaluationCategories] Matching: low=${lowCount}, lower=${lowerCount}, none=${ideas.length - lowCount - lowerCount}`);

  return result;
}

/**
 * 清除评估数据缓存
 */
export function clearEvaluationCache(): void {
  evaluationCache = null;
}
