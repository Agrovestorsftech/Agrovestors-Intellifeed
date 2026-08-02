import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, AlertCircle, Clock, CheckCircle } from "lucide-react";

interface Report {
  id: string;
  farm: string;
  report_type: string;
  submitted_by: string;
  status: string;
  date: string;
  priority: string;
}

interface ReportsReviewProps {
  data: Report[];
  isLoading?: boolean;
}

const statusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "text-green-600 bg-green-50";
    case "rejected":
      return "text-red-600 bg-red-50";
    case "under_review":
      return "text-blue-600 bg-blue-50";
    case "pending":
      return "text-yellow-600 bg-yellow-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

const priorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function ReportsReview({ data, isLoading }: ReportsReviewProps) {
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
    if (selectedStatus) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No {selectedStatus} reports</p>
          <p className="text-gray-400 text-sm mt-1">Try selecting a different status</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle className="w-12 h-12 text-green-300 mb-4" />
        <p className="text-gray-500 text-lg">All reports reviewed</p>
        <p className="text-gray-400 text-sm mt-1">Great work! No pending reviews.</p>
      </div>
    );
  }

  const pendingCount = data.filter((d) => d.status === "pending" || d.status === "under_review").length;

  return (
    <div className="space-y-4">
      {/* Alert if pending */}
      {pendingCount > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">{pendingCount} report(s) awaiting review</p>
            <p className="text-sm text-yellow-700 mt-1">Review and approve submitted reports to complete the workflow</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-600 self-center">Status:</span>
        {["pending", "under_review", "approved", "rejected"].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(selectedStatus === st ? null : st)}
            className={`px-3 py-1 rounded text-sm transition ${
              selectedStatus === st
                ? "bg-gray-900 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {st === "under_review" ? "Under Review" : st.charAt(0).toUpperCase() + st.slice(1)}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {filtered.length} of {data.length} reports
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
                className={`w-5 h-5 text-gray-400 transition flex-shrink-0 ${expandedId === item.id ? "rotate-180" : ""}`}
              />

              {/* Priority Badge */}
              <div className={`px-2.5 py-1 rounded text-xs font-medium flex-shrink-0 ${priorityColor(item.priority)}`}>
                {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-4 justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{item.farm}</p>
                    <p className="text-sm text-gray-600 truncate">{item.report_type}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-block ${statusColor(item.status)}`}>
                      {item.status === "under_review" ? "Under Review" : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded Details */}
            {expandedId === item.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Farm</p>
                    <p className="text-sm font-medium mt-1">{item.farm}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Submitted By</p>
                    <p className="text-sm mt-1">{item.submitted_by}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Report Type</p>
                    <p className="text-sm mt-1">{item.report_type}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Priority</p>
                    <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium mt-1 ${priorityColor(item.priority)}`}>
                      {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Review Actions */}
                {(item.status === "pending" || item.status === "under_review") && (
                  <div className="space-y-3 pt-2 border-t border-gray-300">
                    <p className="text-sm font-medium text-gray-700">Review Actions:</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Approve
                      </Button>
                      <Button size="sm" variant="outline">
                        Request Changes
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600">
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {item.status === "approved" && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    Approved on {item.date}
                  </div>
                )}

                {item.status === "rejected" && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    Rejected on {item.date}
                  </div>
                )}

                {/* View Detail */}
                {item.status !== "approved" && item.status !== "rejected" && (
                  <Button variant="outline" size="sm" className="w-full">
                    View Full Report
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
