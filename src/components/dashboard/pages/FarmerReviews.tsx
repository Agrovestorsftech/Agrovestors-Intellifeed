import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, AlertCircle, TrendingUp } from "lucide-react";

interface FarmerReview {
  id: string;
  farm: string;
  farmer_name: string;
  species: string;
  last_review: string;
  report_count: number;
  health_score: number;
}

interface FarmerReviewsProps {
  data: FarmerReview[];
  isLoading?: boolean;
}

const healthScoreBg = (score: number) => {
  if (score >= 85) return "bg-green-100";
  if (score >= 70) return "bg-yellow-100";
  return "bg-red-100";
};

const healthScoreText = (score: number) => {
  if (score >= 85) return "text-green-700";
  if (score >= 70) return "text-yellow-700";
  return "text-red-700";
};

export default function FarmerReviews({ data, isLoading }: FarmerReviewsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg">No farms assigned yet</p>
        <p className="text-gray-400 text-sm mt-1">Farms will appear here when assignments are made</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Reviewing {data.length} farm(s)
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1 rounded text-sm transition ${
              viewMode === "table"
                ? "bg-gray-900 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode("card")}
            className={`px-3 py-1 rounded text-sm transition ${
              viewMode === "card"
                ? "bg-gray-900 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Cards
          </button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden md:grid md:grid-cols-6 gap-4 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 uppercase">
            <div>Farm</div>
            <div>Farmer</div>
            <div>Species</div>
            <div>Last Review</div>
            <div>Reports</div>
            <div>Health</div>
          </div>

          {data.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition"
            >
              <button
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 text-left md:grid md:grid-cols-6 md:gap-4"
              >
                <div className="min-w-0 flex-1 md:flex-none">
                  <p className="font-medium text-gray-900 truncate">{item.farm}</p>
                  <p className="text-sm text-gray-500 md:hidden">{item.farmer_name}</p>
                </div>
                <div className="hidden md:block truncate">{item.farmer_name}</div>
                <div className="hidden md:block">{item.species}</div>
                <div className="hidden md:block">{item.last_review}</div>
                <div className="hidden md:flex items-center justify-between">
                  <span className="text-sm">{item.report_count}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition ${expandedId === item.id ? "rotate-180" : ""}`}
                  />
                </div>
                <div className="hidden md:block">
                  <div className={`px-3 py-1 rounded-full font-medium text-sm w-fit ${healthScoreBg(item.health_score)} ${healthScoreText(item.health_score)}`}>
                    {item.health_score}%
                  </div>
                </div>
                <ChevronDown
                  className={`md:hidden w-5 h-5 text-gray-400 transition flex-shrink-0 ${expandedId === item.id ? "rotate-180" : ""}`}
                />
              </button>

              {/* Expanded */}
              {expandedId === item.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Farm</p>
                      <p className="text-sm font-medium mt-1">{item.farm}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Farmer</p>
                      <p className="text-sm mt-1">{item.farmer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Species</p>
                      <p className="text-sm mt-1">{item.species}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Reports</p>
                      <p className="text-sm font-medium mt-1">{item.report_count}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Last Review</p>
                      <p className="text-sm mt-1">{item.last_review}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Health Score</p>
                      <div className={`px-3 py-1 rounded-full font-bold text-sm w-fit mt-1 ${healthScoreBg(item.health_score)} ${healthScoreText(item.health_score)}`}>
                        {item.health_score}%
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button variant="default" size="sm">
                      View Farm Dashboard
                    </Button>
                    <Button variant="outline" size="sm">
                      View Reports
                    </Button>
                    <Button variant="outline" size="sm">
                      Create Task
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Card View */}
      {viewMode === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition cursor-pointer"
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              {/* Card Header */}
              <div className="mb-4">
                <p className="font-semibold text-gray-900 truncate">{item.farm}</p>
                <p className="text-sm text-gray-600 truncate">{item.farmer_name}</p>
              </div>

              {/* Card Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Species</p>
                  <p className="text-sm font-medium mt-1">{item.species}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Reports</p>
                  <p className="text-sm font-medium mt-1">{item.report_count}</p>
                </div>
              </div>

              {/* Health Score */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500 uppercase">Health Score</p>
                  <div className={`px-3 py-1 rounded-full font-bold text-sm ${healthScoreBg(item.health_score)} ${healthScoreText(item.health_score)}`}>
                    {item.health_score}%
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition ${
                      item.health_score >= 85
                        ? "bg-green-600"
                        : item.health_score >= 70
                          ? "bg-yellow-600"
                          : "bg-red-600"
                    }`}
                    style={{ width: `${item.health_score}%` }}
                  />
                </div>
              </div>

              {/* Last Review */}
              <p className="text-xs text-gray-500 mb-4">Last reviewed {item.last_review}</p>

              {/* Button */}
              <Button variant="outline" size="sm" className="w-full">
                View Details
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
