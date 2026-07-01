export type CollegeSummarySnapshot = {
  code: string;
  name: string;
  city: string;
  bestDept: string;
  bestCutoff: number;
  margin: number;
  eligibleDepts: number;
  hasEstimated: boolean;
};

export type DeptRowSnapshot = {
  dept: string;
  minCutoff: number;
  maxCutoff: number;
  collegeCount: number;
};

export type RankContextSnapshot = {
  year: number;
  totalStudents: number;
  genMin: number;
  genMax: number;
  commMin: number | null;
  commMax: number | null;
  percentile: number;
  studentsAbove: number;
};

export type ReportSnapshot = {
  cutoffScore: number;
  category: string;
  rank?: number | null;
  uniqueColleges: number;
  uniqueDepts: number;
  totalCollegesInDataset: number;
  bestMargin: number;
  estimatedCount: number;
  chennaiPicks: number;
  preferredDept?: string | null;
  rankContext?: RankContextSnapshot | null;
  industrySegments: { label: string; value: number }[];
  cityDistribution: { city: string; count: number }[];
  deptTable: DeptRowSnapshot[];
  chennaiTop: CollegeSummarySnapshot[];
  tnTop: CollegeSummarySnapshot[];
};
