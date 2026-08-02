import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import KnowledgeBase from "@/components/dashboard/pages/KnowledgeBase";
import { useArticles } from "@/hooks/useDashboard";

export const Route = createFileRoute("/agent/knowledge-base")({
  component: () => {
    const { data = [], isLoading, error } = useArticles(100);

    if (error) {
      return (
        <>
          <DashboardHeader title="Knowledge Base" subtitle="Research library, nutrition references and disease protocols" />
          <div className="p-6 text-center text-red-600">
            <p>Failed to load articles. Please try again later.</p>
          </div>
        </>
      );
    }

    return (
      <>
        <DashboardHeader title="Knowledge Base" subtitle="Research library, nutrition references and disease protocols" />
        <div className="p-6">
          <KnowledgeBase data={data} isLoading={isLoading} />
        </div>
      </>
    );
  },
});
