import { AlertCircle } from "lucide-react";

interface AnalyticsData {
  total_farms: number;
  active_cases: number;
  avg_health_score: number;
  reports_this_week: number;
  case_severity_distribution: Array<{ severity: string; count: number }>;
  farm_health_trends: Array<{ farm: string; score: number }>;
  report_submission_pattern: Array<{ day: string; count: number }>;
}

interface AnalyticsProps {
  data: AnalyticsData | null;
  isLoading?: boolean;
}

export default function Analytics({ data, isLoading }: AnalyticsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg">No data available for selected period</p>
        <p className="text-gray-400 text-sm mt-1">Analytics will populate as data is collected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-600 uppercase">Total Farms</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{data.total_farms}</p>
          <p className="text-sm text-blue-700 mt-2">Active farms</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-600 uppercase">Active Cases</p>
          <p className="text-3xl font-bold text-red-900 mt-2">{data.active_cases}</p>
          <p className="text-sm text-red-700 mt-2">Ongoing health issues</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-600 uppercase">Avg Health Score</p>
          <p className="text-3xl font-bold text-green-900 mt-2">{data.avg_health_score}%</p>
          <p className="text-sm text-green-700 mt-2">Overall farm health</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
          <p className="text-sm font-medium text-purple-600 uppercase">Reports This Week</p>
          <p className="text-3xl font-bold text-purple-900 mt-2">{data.reports_this_week}</p>
          <p className="text-sm text-purple-700 mt-2">Submissions received</p>
        </div>
      </div>

      {/* Case Severity Distribution */}
      <div className="p-6 border border-gray-200 rounded-lg bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Severity Distribution</h3>
        <div className="space-y-3">
          {data.case_severity_distribution.map((item) => {
            const maxCount = Math.max(...data.case_severity_distribution.map((s) => s.count), 1);
            return (
              <div key={item.severity}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 transition-all ${
                      item.severity === "critical"
                        ? "bg-red-600"
                        : item.severity === "high"
                          ? "bg-orange-600"
                          : item.severity === "medium"
                            ? "bg-yellow-600"
                            : "bg-green-600"
                    }`}
                    style={{
                      width: `${((item.count / maxCount) * 100) || 0}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Report Submission Pattern */}
      <div className="p-6 border border-gray-200 rounded-lg bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Submission Pattern (Last 7 Days)</h3>
        <div className="flex items-end gap-3 h-40">
          {data.report_submission_pattern.map((item) => {
            const maxCount = Math.max(...data.report_submission_pattern.map((r) => r.count), 1);
            const percentage = (item.count / (maxCount || 1)) * 100;
            return (
              <div key={item.day} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-blue-200 rounded-t-lg relative" style={{ height: `${percentage || 5}%` }}>
                  {item.count > 0 && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-sm font-bold text-gray-900 whitespace-nowrap">
                      {item.count}
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-600 mt-2">{item.day}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Farm Health Trends */}
      <div className="p-6 border border-gray-200 rounded-lg bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Farm Health Scores</h3>
        <div className="space-y-3">
          {data.farm_health_trends.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{item.farm}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 transition-all ${
                      item.score >= 85 ? "bg-green-600" : item.score >= 70 ? "bg-yellow-600" : "bg-red-600"
                    }`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
                <span className={`text-sm font-bold w-12 text-right ${
                  item.score >= 85 ? "text-green-600" : item.score >= 70 ? "text-yellow-600" : "text-red-600"
                }`}>
                  {item.score}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
