import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, AlertCircle } from "lucide-react";

interface NutritionPlan {
  id: string;
  farm: string;
  plan_name: string;
  status: string;
  created_at: string;
  assigned_to: string;
}

interface NutritionPlansProps {
  data: NutritionPlan[];
  isLoading?: boolean;
}

const statusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "text-green-600 bg-green-50";
    case "active":
      return "text-blue-600 bg-blue-50";
    case "archived":
      return "text-gray-600 bg-gray-50";
    case "draft":
      return "text-yellow-600 bg-yellow-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

export default function NutritionPlans({ data, isLoading }: NutritionPlansProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const filtered = data.filter((item) => {
    if (selectedStatus && item.status !== selectedStatus) return false;
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg">No nutrition plans yet</p>
        <p className="text-gray-400 text-sm mt-1">Create a new nutrition plan to get started</p>
      </div>
    );
  }

  const statusOptions = ["draft", "active", "approved", "archived"];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-600 self-center">Status:</span>
        {statusOptions.map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(selectedStatus === st ? null : st)}
            className={`px-3 py-1 rounded text-sm transition ${
              selectedStatus === st
                ? "bg-gray-900 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {st.charAt(0).toUpperCase() + st.slice(1)}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {filtered.length} of {data.length} plans
      </div>

      {/* Table Header */}
      <div className="hidden md:grid md:grid-cols-5 gap-4 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 uppercase">
        <div>Farm</div>
        <div>Plan Name</div>
        <div>Status</div>
        <div>Created</div>
        <div>Assigned To</div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition"
          >
            {/* Mobile & Desktop Row */}
            <button
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 text-left md:grid md:grid-cols-5 md:gap-4"
            >
              <div className="min-w-0 flex-1 md:flex-none">
                <p className="font-medium text-gray-900 truncate">{item.farm}</p>
                <p className="text-sm text-gray-500 md:hidden">{item.plan_name}</p>
              </div>
              <div className="hidden md:block min-w-0">
                <p className="truncate">{item.plan_name}</p>
              </div>
              <div className="hidden md:block">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(item.status)}`}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm">{item.created_at}</p>
              </div>
              <div className="hidden md:flex md:items-center md:justify-between">
                <p className="text-sm">{item.assigned_to}</p>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition ml-2 ${expandedId === item.id ? "rotate-180" : ""}`}
                />
              </div>
              <ChevronDown
                className={`md:hidden w-5 h-5 text-gray-400 transition flex-shrink-0 ${expandedId === item.id ? "rotate-180" : ""}`}
              />
            </button>

            {/* Expanded Details */}
            {expandedId === item.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Farm</p>
                    <p className="text-sm font-medium mt-1">{item.farm}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Plan Name</p>
                    <p className="text-sm font-medium mt-1">{item.plan_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${statusColor(item.status)}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Assigned To</p>
                    <p className="text-sm font-medium mt-1">{item.assigned_to}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    Edit Plan
                  </Button>
                  <Button variant="outline" size="sm">
                    Archive
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
