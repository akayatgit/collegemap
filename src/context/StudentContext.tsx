"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { CategoryKey } from "@/lib/types";
import type { ReportSnapshot } from "@/lib/types/reportSnapshot";

type StudentInfo = {
  score: number | null;
  quota: string | null;
  categoryKey: CategoryKey | null;
  rank: number | null;
  collegesOpen: number;
  deptCount: number;
  preferredDept: string | null;
  reportSnapshot: ReportSnapshot | null;
};

type StudentContextType = StudentInfo & {
  setStudentInfo: (info: Omit<StudentInfo, "preferredDept" | "reportSnapshot">) => void;
  setPreferredDept: (dept: string | null) => void;
  setReportSnapshot: (snapshot: ReportSnapshot | null) => void;
  clearAll: () => void;
};

const defaultInfo: StudentInfo = {
  score: null,
  quota: null,
  categoryKey: null,
  rank: null,
  collegesOpen: 0,
  deptCount: 0,
  preferredDept: null,
  reportSnapshot: null,
};

const StudentContext = createContext<StudentContextType>({
  ...defaultInfo,
  setStudentInfo: () => {},
  setPreferredDept: () => {},
  setReportSnapshot: () => {},
  clearAll: () => {},
});

export function StudentProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<StudentInfo>(defaultInfo);

  const setStudentInfo = useCallback(
    (next: Omit<StudentInfo, "preferredDept" | "reportSnapshot">) =>
      setInfo((prev) => ({ ...prev, ...next })),
    []
  );

  const setPreferredDept = useCallback(
    (dept: string | null) =>
      setInfo((prev) => ({ ...prev, preferredDept: dept })),
    []
  );

  const setReportSnapshot = useCallback(
    (snapshot: ReportSnapshot | null) =>
      setInfo((prev) => ({ ...prev, reportSnapshot: snapshot })),
    []
  );

  const clearAll = useCallback(() => setInfo(defaultInfo), []);

  return (
    <StudentContext.Provider
      value={{ ...info, setStudentInfo, setPreferredDept, setReportSnapshot, clearAll }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  return useContext(StudentContext);
}
