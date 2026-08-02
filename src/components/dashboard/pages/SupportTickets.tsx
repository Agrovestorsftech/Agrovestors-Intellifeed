import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, AlertCircle, MessageSquare } from "lucide-react";

interface SupportTicket {
  id: string;
  ticket_id: string;
  subject: string;
  priority: string;
  status: string;
  created_at: string;
  assigned_to: string;
}

interface SupportTicketsProps {
  data: SupportTicket[];
  isLoading?: boolean;
}

const statusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "closed":
      return "text-gray-600 bg-gray-50";
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

export default function SupportTickets({ data, isLoading }: SupportTicketsProps) {
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

  const openCount = data.filter((d) => d.status === "open").length;
  const resolvedCount = data.filter((d) => d.status === "resolved").length;

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg">No support tickets</p>
        <p className="text-gray-400 text-sm mt-1">No tickets match your selected filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-medium text-red-600 uppercase">Open</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{openCount}</p>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-medium text-blue-600 uppercase">In Progress</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{data.filter((d) => d.status === "in_progress").length}</p>
        </div>
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs font-medium text-green-600 uppercase">Resolved</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{resolvedCount}</p>
        </div>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs font-medium text-gray-600 uppercase">Total</p>
          <p className="text-2xl font-bold text-gray-700 mt-1">{data.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-600 self-center">Status:</span>
        {["open", "in_progress", "resolved", "closed"].map((st) => (
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

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {filtered.length} of {data.length} tickets
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

              {/* Ticket Icon */}
              <div className="flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-gray-400" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-4 justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-medium text-gray-600">{item.ticket_id}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{item.subject}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex gap-2 justify-end mb-1">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityColor(item.priority)}`}>
                        {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(item.status)}`}>
                        {item.status === "in_progress" ? "In Progress" : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{item.created_at}</p>
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded Details */}
            {expandedId === item.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Ticket ID</p>
                    <p className="text-sm font-mono font-medium mt-1">{item.ticket_id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Subject</p>
                    <p className="text-sm mt-1">{item.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Assigned To</p>
                    <p className="text-sm mt-1">{item.assigned_to}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Priority</p>
                    <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium mt-1 ${priorityColor(item.priority)}`}>
                      {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${statusColor(item.status)}`}>
                      {item.status === "in_progress" ? "In Progress" : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Created</p>
                    <p className="text-sm mt-1">{item.created_at}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-2 border-t border-gray-300">
                  {item.status === "open" && (
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Take Assignment
                      </Button>
                      <Button variant="outline" size="sm">
                        Add Note
                      </Button>
                    </div>
                  )}
                  {item.status === "in_progress" && (
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Mark Resolved
                      </Button>
                      <Button variant="outline" size="sm">
                        Add Note
                      </Button>
                    </div>
                  )}
                  {(item.status === "resolved" || item.status === "closed") && (
                    <Button variant="outline" size="sm" className="w-full">
                      View Conversation
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
