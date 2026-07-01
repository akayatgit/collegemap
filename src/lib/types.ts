export interface CollegeRow {
  page: string;
  code: string;
  collegeName: string;
  branch: string;
  oc: string;
  bc: string;
  bcm: string;
  mbc: string;
  sc: string;
  sca: string;
  st: string;
}

export type CategoryKey = "oc" | "bc" | "bcm" | "mbc" | "sc" | "sca" | "st";

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  oc: "OC",
  bc: "BC",
  bcm: "BCM",
  mbc: "MBC",
  sc: "SC",
  sca: "SCA",
  st: "ST",
};
