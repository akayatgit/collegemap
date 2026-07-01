import { getCollegeData, getUniqueCollegeCount, getTotalBranchCount } from "@/lib/parseCSV";
import Navbar from "@/components/Navbar";
import CutoffFinder from "@/components/CutoffFinder";
import DepartmentsSection from "@/components/DepartmentsSection";
import CollegeTable from "@/components/CollegeTable";
import MarqueeStrip from "@/components/MarqueeStrip";
import QuestionsSection from "@/components/QuestionsSection";
import Footer from "@/components/Footer";
import AdminWrapper from "@/components/AdminWrapper";

export default function Home() {
  const data = getCollegeData();
  const totalColleges = getUniqueCollegeCount(data);
  const totalBranches = getTotalBranchCount(data);

  return (
    <>
      <Navbar />
      <main>
        <CutoffFinder data={data} />
        <DepartmentsSection data={data} />
        <CollegeTable data={data} />
        <MarqueeStrip branches={totalBranches} colleges={totalColleges} />
        <QuestionsSection branches={totalBranches} />
        <MarqueeStrip dark branches={totalBranches} colleges={totalColleges} />
      </main>
      <Footer />
      <AdminWrapper />
    </>
  );
}
