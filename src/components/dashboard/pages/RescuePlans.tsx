import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronDown, AlertCircle } from "lucide-react";

interface RescuePlan {
  id: string;
  farm: string;
  risk_level: string;
  intervention: string;
  status: string;
  created_at: string;
}

interface RescuePlansProps {
  data: RescuePlan[];
  isLoading?: boolean;
}

const riskColor = (risk: string) => {
  switch (risk?.toLowerCase()) {
    case "critical":
      return "bg-red-500 text-white";
    case "high":
      return "bg-orange-500 text-white";
    default:
      return "bg-yellow-500 text-white";
  }
};

export default function RescuePlans({ data, isLoading }: RescuePlansProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // Separate urgent from others
  const urgent = data.filter((item) => item.risk_level === "critical");
  const highRisk = data.filter((item) => item.risk_level === "high");
  const displayed = showAll ? data : [...urgent.slice(0, 3), ...highRisk.slice(0, 2)];

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg">No rescue plans needed</p>
        <p className="text-gray-400 text-sm mt-1">Emergency response plans will appear when critical cases are identified</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      {urgent.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">{urgent.length} Critical case(s) requiring immediate action</p>
            <p className="text-sm text-red-700 mt-1">Review and respond to emergency cases immediately</p>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {displayed.length} of {data.length} rescue plans
      </div>

      {/* List */}
      <div className="space-y-2">
        {displayed.map((item) => (
          <div
            key={item.id}
            className={`border rounded-lg overflow-hidden bg-white hover:shadow-md transition ${
              item.risk_level === "critical" ? "border-red-300 bg-red-50" : "border-gray-200"
            }`}
          >
            {/* Header Row */}
            <button
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className="w-full p-4 flex items-center gap-4 hover:bg-opacity-80 text-left"
            >
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition flex-shrink-0 ${expandedId === item.id ? "rotate-180" : ""}`}
              />

              {/* Risk Badge */}
              <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${riskColor(item.risk_level)}`}>
                {item.risk_level === "critical" ? "CRITICAL" : "HIGH RISK"}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.farm}</p>
                <p className="text-sm text-gray-600 truncate">{item.intervention}</p>
              </div>

              {/* Status */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium text-gray-900">
                  {item.status === "in_progress" ? "In Progress" : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </p>
                <p className="text-xs text-gray-500">{item.created_at}</p>
              </div>
            </button>

            {/* Expanded Details */}
            {expandedId === item.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Farm</p>
                    <p className="text-sm font-medium mt-1">{item.farm}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Risk Level</p>
                    <p className={`text-sm font-bold mt-1 ${item.risk_level === "critical" ? "text-red-600" : "text-orange-600"}`}>
                      {item.risk_level.toUpperCase()}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">Intervention Required</p>
                    <p className="text-sm mt-1">{item.intervention}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    Respond Now
                  </Button>
                  <Button variant="outline" size="sm">
                    View Case
                  </Button>
                  <Button variant="outline" size="sm">
                    Escalate
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show More */}
      {!showAll && data.length > displayed.length && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-2 text-center text-sm font-medium text-gray-600 hover:bg-gray-50 rounded border border-gray-200"
        >
          Show all {data.length} rescue plans
        </button>
      )}

      {showAll && data.length > displayed.length && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full py-2 text-center text-sm font-medium text-gray-600 hover:bg-gray-50 rounded border border-gray-200"
        >
          Show urgent only
        </button>
      )}
    </div>
  );
}
