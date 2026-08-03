import { Domain } from '../types/graph';

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

// 评估数据缓存
interface EvaluationData {
  low: Set<string>;    // 匹配分 >= 0.2 (bio/mat/chem) 或 >= 5 (phy)
  lower: Set<string>;  // 匹配分 < 0.2 (bio/mat/chem) 或 < 5 (phy)
}

let evaluationCache: EvaluationData | null = null;

/**
 * 加载评估数据文件
 */
async function loadEvaluationData(): Promise<EvaluationData> {
  if (evaluationCache) {
    console.log('[evaluationLoader] Using cached data');
    return evaluationCache;
  }

  const data: EvaluationData = {
    low: new Set<string>(),
    lower: new Set<string>(),
  };

  try {
    const response = await fetch('/data/evaluation_data.csv');
    if (!response.ok) {
      throw new Error(`Failed to load evaluation_data.csv: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());

    // 跳过表头
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // 解析CSV - 处理引号包裹的字段
      const parts: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') {
            current += '"';
            j++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim());

      // 解析各列
      // domain, pass_exc, score, low_level, match_score, hypothesis
      if (parts.length >= 6) {
        const lowLevel = parts[3]; // 'low' 或 'lower'
        const hypothesis = parts[5];

        // 移除 "Hypothesis:" 前缀
        const cleanHypothesis = hypothesis.replace(/^Hypothesis:\s*/i, '').slice(0, 100).trim();

        if (cleanHypothesis) {
          if (lowLevel === 'low') {
            data.low.add(cleanHypothesis);
          } else if (lowLevel === 'lower') {
            data.lower.add(cleanHypothesis);
          }
        }
      }
    }

    console.log(`[evaluationLoader] Loaded ${data.low.size} low, ${data.lower.size} lower`);
    console.log('[evaluationLoader] Sample low keys:', Array.from(data.low).slice(0, 3));
    evaluationCache = data;
    return data;

  } catch (err) {
    console.error('[evaluationLoader] Error loading evaluation data:', err);
    return data;
  }
}

/**
 * 判断一个 idea 属于哪个评估类别
 */
export async function getIdeaEvaluationCategory(
  proposalContent: string,
  _domain: Domain
): Promise<EvaluationCategory> {
  // 移除 "Hypothesis:" 前缀
  const contentKey = proposalContent.replace(/^Hypothesis:\s*/i, '').slice(0, 100).trim();

  console.log('[getIdeaEvaluationCategory] Checking:', contentKey.substring(0, 50));

  const data = await loadEvaluationData();

  // 先检查 lower
  if (data.lower.has(contentKey)) {
    console.log('[getIdeaEvaluationCategory] Found in lower');
    return 'lower';
  }

  // 再检查 low
  if (data.low.has(contentKey)) {
    console.log('[getIdeaEvaluationCategory] Found in low');
    return 'low';
  }

  console.log('[getIdeaEvaluationCategory] Not found');
  return null;
}

/**
 * 批量获取多个 idea 的评估类别（更高效）
 */
export async function getIdeasEvaluationCategories(
  ideas: Array<{ id: number; proposal_content: string }>,
  _domain: Domain
): Promise<Map<number, EvaluationCategory>> {
  const result = new Map<number, EvaluationCategory>();

  // 预加载评估数据集
  const data = await loadEvaluationData();

  console.log('[getIdeasEvaluationCategories] Checking', ideas.length, 'ideas');
  
  // 调试：检查前几个ideas的内容
  for (let i = 0; i < Math.min(3, ideas.length); i++) {
    const idea = ideas[i];
    const contentKey = idea.proposal_content.replace(/^Hypothesis:\s*/i, '').slice(0, 100).trim();
    console.log(`[getIdeasEvaluationCategories] Idea ${idea.id} key: "${contentKey.substring(0, 50)}..."`);
    console.log(`[getIdeasEvaluationCategories] Is in data.low: ${data.low.has(contentKey)}`);
  }

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
  console.log(`[getIdeasEvaluationCategories] Matching results: low=${lowCount}, lower=${lowerCount}, none=${ideas.length - lowCount - lowerCount}`);

  return result;
}

/**
 * 清除评估数据缓存
 */
export function clearEvaluationCache(): void {
  evaluationCache = null;
}
