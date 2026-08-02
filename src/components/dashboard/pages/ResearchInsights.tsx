import { AlertCircle } from "lucide-react";

interface ResearchInsightsData {
  most_common_diagnosis: string;
  top_nutrition_issue: string;
  case_resolution_rate: number;
  disease_prevalence: Array<{ diagnosis: string; count: number }>;
  severity_distribution: Array<{ severity: string; count: number }>;
  recovery_trends: Array<{ month: string; resolved: number; total: number }>;
}

interface ResearchInsightsProps {
  data: ResearchInsightsData | null;
  isLoading?: boolean;
}

export default function ResearchInsights({ data, isLoading }: ResearchInsightsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg">Insufficient data for insights</p>
        <p className="text-gray-400 text-sm mt-1">More cases will enable better analytics</p>
      </div>
    );
  }

  const maxSeverityCount = Math.max(
    ...(data.severity_distribution.map((s) => s.count) || [1])
  );
  const maxPrevalenceCount = Math.max(
    ...(data.disease_prevalence.map((d) => d.count) || [1])
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-600 uppercase">Most Common Diagnosis</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{data.most_common_diagnosis}</p>
          <p className="text-sm text-blue-700 mt-2">Primary health concern across farms</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-600 uppercase">Top Nutrition Issue</p>
          <p className="text-3xl font-bold text-green-900 mt-2">{data.top_nutrition_issue}</p>
          <p className="text-sm text-green-700 mt-2">Primary nutrition concern</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
          <p className="text-sm font-medium text-purple-600 uppercase">Case Resolution Rate</p>
          <p className="text-3xl font-bold text-purple-900 mt-2">{data.case_resolution_rate}%</p>
          <p className="text-sm text-purple-700 mt-2">Of cases successfully resolved</p>
        </div>
      </div>

      {/* Severity Distribution */}
      <div className="p-6 border border-gray-200 rounded-lg bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Severity Distribution</h3>
        <div className="space-y-3">
          {data.severity_distribution.map((item, idx) => (
            <div key={idx}>
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
                    width: `${((item.count / maxSeverityCount) * 100) || 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disease Prevalence */}
      <div className="p-6 border border-gray-200 rounded-lg bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Disease Prevalence (Top 5)</h3>
        <div className="space-y-3">
          {data.disease_prevalence.map((item, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{item.diagnosis}</span>
                <span className="text-sm font-bold text-gray-900">{item.count} cases</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 bg-blue-600 transition-all"
                  style={{
                    width: `${((item.count / maxPrevalenceCount) * 100) || 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recovery Trends */}
      <div className="p-6 border border-gray-200 rounded-lg bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recovery Trends (Last 6 Months)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase">Month</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-600 uppercase">Resolved</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-600 uppercase">Total</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-600 uppercase">Resolution %</th>
              </tr>
            </thead>
            <tbody>
              {data.recovery_trends.map((item, idx) => {
                const rate = item.total > 0 ? Math.round((item.resolved / item.total) * 100) : 0;
                return (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.month}</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-700">
                      <span className="font-bold text-green-600">{item.resolved}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-700">{item.total}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 bg-green-600"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-900 w-12 text-right">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights Summary */}
      <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Insights</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold mt-1">•</span>
            <span>The most common diagnosis is <strong>{data.most_common_diagnosis}</strong>, affecting multiple farms. Consider targeted interventions.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold mt-1">•</span>
            <span>Recovery rate of <strong>{data.case_resolution_rate}%</strong> indicates {data.case_resolution_rate > 75 ? "strong" : "room for improvement in"} case management practices.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold mt-1">•</span>
            <span>
              {data.severity_distribution.some((s) => s.severity === "critical")
                ? `${data.severity_distribution.find((s) => s.severity === "critical")?.count || 0} critical cases require immediate attention.`
                : "No critical cases currently reported."}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
