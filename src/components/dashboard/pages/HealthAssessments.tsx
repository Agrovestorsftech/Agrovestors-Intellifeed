import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, AlertCircle, TrendingUp } from "lucide-react";

interface HealthAssessment {
  id: string;
  farm: string;
  diagnosis: string;
  severity: string;
  status: string;
  date: string;
  assigned_to: string;
}

interface HealthAssessmentsProps {
  data: HealthAssessment[];
  isLoading?: boolean;
}

const severityColor = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "bg-red-500";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-500";
    default:
      return "bg-green-500";
  }
};

const statusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "resolved":
      return "text-green-600 bg-green-50";
    case "in_progress":
      return "text-blue-600 bg-blue-50";
    case "open":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

export default function HealthAssessments({ data, isLoading }: HealthAssessmentsProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
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
    if (selectedSeverity && item.severity !== selectedSeverity) return false;
    if (selectedStatus && item.status !== selectedStatus) return false;
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg">No health cases recorded</p>
        <p className="text-gray-400 text-sm mt-1">Assessments will appear here when cases are created</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-2">
          <span className="text-sm font-medium text-gray-600 self-center">Severity:</span>
          {["critical", "high", "medium", "low"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(selectedSeverity === sev ? null : sev)}
              className={`px-3 py-1 rounded text-sm transition ${
                selectedSeverity === sev
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {sev.charAt(0).toUpperCase() + sev.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <span className="text-sm font-medium text-gray-600 self-center">Status:</span>
          {["open", "in_progress", "resolved"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(selectedStatus === st ? null : st)}
              className={`px-3 py-1 rounded text-sm transition ${
                selectedStatus === st
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {st === "in_progress" ? "In Progress" : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {filtered.length} of {data.length} cases
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition"
          >
            {/* Header Row */}
            <button
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 text-left"
            >
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition ${expandedId === item.id ? "rotate-180" : ""}`}
              />

              {/* Severity Badge */}
              <div className="flex-shrink-0">
                <div className={`w-3 h-3 rounded-full ${severityColor(item.severity)}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-4 justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{item.farm}</p>
                    <p className="text-sm text-gray-600 truncate">{item.diagnosis}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(item.status)}`}>
                      {item.status === "in_progress" ? "In Progress" : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{item.date}</p>
                      <p className="text-xs text-gray-500">{item.assigned_to}</p>
                    </div>
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded Details */}
            {expandedId === item.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Severity</p>
                    <p className="text-sm font-medium mt-1">
                      {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                    <p className="text-sm font-medium mt-1">
                      {item.status === "in_progress" ? "In Progress" : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Farm</p>
                    <p className="text-sm font-medium mt-1">{item.farm}</p>
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
                    Update Status
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
