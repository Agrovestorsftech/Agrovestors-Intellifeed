import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import NutritionPlans from "@/components/dashboard/pages/NutritionPlans";
import { useNutritionPlans } from "@/hooks/useDashboard";

export const Route = createFileRoute("/agent/nutrition-plans")({
  component: () => {
    const { data = [], isLoading, error } = useNutritionPlans(50);

    if (error) {
      return (
        <>
          <DashboardHeader title="Nutrition Plans" subtitle="Create, update and manage nutrition plans" />
          <div className="p-6 text-center text-red-600">
            <p>Failed to load nutrition plans. Please try again later.</p>
          </div>
        </>
      );
    }

    return (
      <>
        <DashboardHeader title="Nutrition Plans" subtitle="Create, update and manage nutrition plans" />
        <div className="p-6">
          <NutritionPlans data={data} isLoading={isLoading} />
        </div>
      </>
    );
  },
});
