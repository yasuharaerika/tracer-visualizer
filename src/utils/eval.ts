// 规范化函数：将各种连字符/破折号统一为普通连字符
function normalizeKey(text: string): string {
  return text
    .replace(/[‐-―−]/g, '-')  // 各种连字符和破折号 -> 普通连字符
    .replace(/[  -   　]/g, ' ')  // 不间断空格和各种空格 -> 普通空格
    .replace(/\s+/g, ' ')  // 多个空格 -> 单个空格
    .trim();
}

// 评估数据 - 内联版本，确保打包进bundle
// 低匹配度Ideas (match_score >= 0.2 for bio/mat/chem or >= 5 for phy)
const DATA_LOW: string[] = [
  "Engineering a pre-organized energy landscape in de novo iron-sulfur",
  "iPSC-to-HSC differentiation fails to achieve durable",
  "Embedding an explicit, learnable side chain",
  "Ligand-binding affinity changes",
  "Carbon-number-resolved metabolite ion fingerprints",
  "Podocyte immaturity and phenotype blunting",
  "Engineering a pore-forming peptide",
  "Ulcerative colitis severity",
  "A glycoform-controlled Candida rugosa esterase",
  "A low-leak, quantitatively benchmarked membrane",
  "Embedding a thermophile-inspired",
  "Protein sequences designed by explicitly optimizing",
  "Plant-specialized cytochrome P450",
  "Temperature-sensitive phenotypes of Drosophila",
  "We hypothesize that an SH3-domain designer",
  "Surgical-stress ROS elevations",
  "We hypothesize that a structure-guided, affinity-coupled",
  "In primary biliary cholangitis",
  "Engineering a genetically encoded diiron-bacterioferritin",
  "We hypothesize that a kinetically gated",
  "We hypothesize that operationally defined limited pepsin",
  "A substrate-promiscuous, L-arginine-oxidase-like catalyst",
  "Chloroplast NDH activity",
  "Engineered, allosterically switchable PRC1",
  "A LOCKR fold-switching cage",
  "Endoglucanase thermostability",
  "Engineering a structurally constrained",
  "We hypothesize that surface- and pore-mouth",
  "A Rosetta-based protein design workflow",
  "A modular VEGFR-2-responsive gene-control",
  "A charge-programmable Fe/ZIF-8@cellulose aerogel",
  "Transient, pulse-width-controlled induction",
  "PSC-RANTES produces unusually durable CCR5",
  "Lineage-accelerated nonsynonymous substitutions",
  "A plasmon-gated, mixed-valence 2D CoFe-MOF",
  "We hypothesize that externally functionalized 2D zeolite",
  "A hydrolytically robust Zr6-node MOF",
  "We hypothesize that a flexible, single-crystal-to-single-crystal",
  "Creating hydroxyl-terminated node defect sites",
  "A porphyrin-sensitized, defect-engineered Hf12 MOF",
  "A BTC-based Cu(II) MOF",
  "A gas-tight, polymer-infiltrated Cu3",
  "Pressure-dependent hysteresis in H2 adsorption",
  "A covalently asymmetric Janus UiO-type Zr6O8-cluster MOF",
  "A truly hydrostatic, liquid-mediated pressure treatment",
  "Embedding sterically programmed, late-stage pore intrusions",
  "We hypothesize that MOF-520"
];

// 更低匹配度Ideas (match_score < 0.2 for bio/mat/chem or < 5 for phy)
const DATA_LOWER: string[] = [
  "A scalable, automated workflow that integrates machine learning",
  "Developing a computational framework to predict protein",
  "Creating a novel class of dynamic covalent chemistry",
  "Engineering synthetic organelles using liquid-liquid phase separation",
  "A multi-scale modeling approach to simulate cellular",
  "Design of stimuli-responsive polymeric nanoparticles",
  "Developing gene circuit models that predict",
  "Engineering enzyme cascades in vitro for sustainable",
  "A high-throughput platform for characterizing protein-protein",
  "Creating programmable RNA devices for cell-specific",
  "Developing synthetic metabolism in non-model organisms",
  "Engineering microbial consortia for robust",
  "A computational tool for designing de novo protein",
  "Creating biohybrid materials that combine",
  "Engineering light-controlled genetic circuits"
];

// 创建Set用于快速查找（使用规范化键）
const SET_LOW = new Set(DATA_LOW.map(normalizeKey));
const SET_LOWER = new Set(DATA_LOWER.map(normalizeKey));

// 类型定义
export type EvalCat = 'low' | 'lower' | null;

// 颜色配置
export const COLORS = {
  default: '#F5F0E8',
  low: '#A8D4E6',
  lower: '#E6B8A8',
};

// 图例
export const LABELS = {
  low: 'Hit Low',
  lower: 'Hit Lower',
};

/**
 * 获取单个idea的评估分类
 */
export function getEvalCategory(proposal: string): EvalCat {
  const key = normalizeKey(proposal.replace(/^Hypothesis:\s*/i, '').slice(0, 100));
  if (SET_LOWER.has(key)) return 'lower';
  if (SET_LOW.has(key)) return 'low';
  return null;
}

/**
 * 批量获取ideas的评估分类
 */
export function getBatchEvalCategories(ideas: Array<{ id: number; proposal_content: string }>): Map<number, EvalCat> {
  const result = new Map<number, EvalCat>();
  let low = 0, lower = 0, none = 0;

  for (const idea of ideas) {
    const cat = getEvalCategory(idea.proposal_content);
    result.set(idea.id, cat);
    if (cat === 'lower') lower++;
    else if (cat === 'low') low++;
    else none++;
  }

  console.log(`[eval] low=${low}, lower=${lower}, none=${none}`);
  return result;
}
