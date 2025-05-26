"use client"

import { useState, useMemo } from "react"
import { useReport, type Report } from "@/contexts/report-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, BarChart3, Calendar, ChevronRight, Clock, FileText, Shield, Target } from "lucide-react"

interface DashboardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Helper function to get date ranges
const getDateRanges = () => {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
  const thisYear = new Date(now.getFullYear(), 0, 1)

  return {
    "all-time": { label: "All Time", date: new Date(0) },
    "this-month": { label: "This Month", date: thisMonth },
    "last-month": { label: "Last Month", date: lastMonth },
    "last-3-months": { label: "Last 3 Months", date: threeMonthsAgo },
    "last-6-months": { label: "Last 6 Months", date: sixMonthsAgo },
    "this-year": { label: "This Year", date: thisYear },
  }
}

export default function Dashboard({ open, onOpenChange }: DashboardProps) {
  const { reports } = useReport()
  const [timeRange, setTimeRange] = useState<string>("all-time")
  const [selectedTarget, setSelectedTarget] = useState<string>("all")
  const dateRanges = getDateRanges()

  // Get unique targets from all reports
  const targets = useMemo(() => {
    const uniqueTargets = new Set<string>()
    reports.forEach((report) => uniqueTargets.add(report.target))
    return Array.from(uniqueTargets)
  }, [reports])

  // Filter reports based on selected time range and target
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const reportDate = new Date(report.timestamp)
      const rangeDate = dateRanges[timeRange as keyof typeof dateRanges].date
      const targetMatch = selectedTarget === "all" || report.target === selectedTarget
      return reportDate >= rangeDate && targetMatch
    })
  }, [reports, timeRange, selectedTarget, dateRanges])

  // Calculate metrics
  const metrics = useMemo(() => {
    if (filteredReports.length === 0) {
      return {
        totalReports: 0,
        totalFindings: 0,
        criticalFindings: 0,
        highFindings: 0,
        mediumFindings: 0,
        lowFindings: 0,
        avgFindingsPerReport: 0,
        mostVulnerableTarget: "",
        mostCommonVulnerability: "",
        securityTrend: "neutral",
        totalTargets: 0,
        totalTools: 0,
        avgDuration: 0,
        findingsByMonth: {},
        findingsBySeverity: {},
        topVulnerabilities: [],
        recentReports: [],
      }
    }

    // Count findings by severity
    let totalFindings = 0
    let criticalFindings = 0
    let highFindings = 0
    let mediumFindings = 0
    let lowFindings = 0

    // Track findings by target
    const findingsByTarget: Record<string, number> = {}

    // Track vulnerability types
    const vulnerabilityTypes: Record<string, number> = {}

    // Track findings by month
    const findingsByMonth: Record<string, number> = {}

    // Track tools used
    const toolsUsed = new Set<string>()

    // Calculate total duration
    let totalDuration = 0

    // Process each report
    filteredReports.forEach((report) => {
      // Count findings by severity
      report.findings.forEach((finding) => {
        totalFindings++

        // Count by severity
        if (finding.severity === "Critical") criticalFindings++
        else if (finding.severity === "High") highFindings++
        else if (finding.severity === "Medium") mediumFindings++
        else if (finding.severity === "Low") lowFindings++

        // Count by target
        findingsByTarget[report.target] = (findingsByTarget[report.target] || 0) + 1

        // Count by vulnerability type (using the finding title as the type)
        const vulnType = finding.title.split(":")[0].trim()
        vulnerabilityTypes[vulnType] = (vulnerabilityTypes[vulnType] || 0) + 1

        // Count by month
        const month = new Date(finding.timestamp).toLocaleString("default", { month: "short", year: "numeric" })
        findingsByMonth[month] = (findingsByMonth[month] || 0) + 1
      })

      // Track tools
      report.selectedTools.forEach((tool) => toolsUsed.add(tool))

      // Add duration
      totalDuration += report.duration
    })

    // Find most vulnerable target
    let mostVulnerableTarget = ""
    let maxFindings = 0
    Object.entries(findingsByTarget).forEach(([target, count]) => {
      if (count > maxFindings) {
        mostVulnerableTarget = target
        maxFindings = count
      }
    })

    // Find most common vulnerability
    let mostCommonVulnerability = ""
    let maxVulnCount = 0
    Object.entries(vulnerabilityTypes).forEach(([type, count]) => {
      if (count > maxVulnCount) {
        mostCommonVulnerability = type
        maxVulnCount = count
      }
    })

    // Calculate security trend
    // For this demo, we'll use a simple algorithm:
    // - If there are more critical/high findings in recent reports, trend is "negative"
    // - If there are fewer critical/high findings in recent reports, trend is "positive"
    // - Otherwise, trend is "neutral"
    let securityTrend = "neutral"
    if (filteredReports.length >= 2) {
      // Sort reports by date
      const sortedReports = [...filteredReports].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )

      // Compare the two most recent reports
      const recentReport = sortedReports[0]
      const previousReport = sortedReports[1]

      const recentSeverity = recentReport.findings.filter(
        (f) => f.severity === "Critical" || f.severity === "High",
      ).length

      const previousSeverity = previousReport.findings.filter(
        (f) => f.severity === "Critical" || f.severity === "High",
      ).length

      if (recentSeverity < previousSeverity) {
        securityTrend = "positive"
      } else if (recentSeverity > previousSeverity) {
        securityTrend = "negative"
      }
    }

    // Get top vulnerabilities
    const topVulnerabilities = Object.entries(vulnerabilityTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // Get recent reports
    const recentReports = [...filteredReports]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)

    return {
      totalReports: filteredReports.length,
      totalFindings,
      criticalFindings,
      highFindings,
      mediumFindings,
      lowFindings,
      avgFindingsPerReport: totalFindings / filteredReports.length,
      mostVulnerableTarget,
      mostCommonVulnerability,
      securityTrend,
      totalTargets: Object.keys(findingsByTarget).length,
      totalTools: toolsUsed.size,
      avgDuration: totalDuration / filteredReports.length,
      findingsByMonth,
      findingsBySeverity: {
        Critical: criticalFindings,
        High: highFindings,
        Medium: mediumFindings,
        Low: lowFindings,
      },
      topVulnerabilities,
      recentReports,
    }
  }, [filteredReports])

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "positive":
        return "text-emerald-500"
      case "negative":
        return "text-red-500"
      default:
        return "text-amber-500"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "positive":
        return "↑"
      case "negative":
        return "↓"
      default:
        return "→"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-900 text-red-200"
      case "high":
        return "bg-orange-900 text-orange-200"
      case "medium":
        return "bg-amber-900 text-amber-200"
      case "low":
        return "bg-blue-900 text-blue-200"
      default:
        return "bg-zinc-800 text-zinc-200"
    }
  }

  const formatDuration = (seconds: number): string => {
    if (isNaN(seconds)) return "N/A"

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    return `${hours}h ${minutes}m`
  }

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (e) {
      return dateString
    }
  }

  // Render bar chart for findings by severity
  const renderSeverityChart = () => {
    const { criticalFindings, highFindings, mediumFindings, lowFindings } = metrics
    const maxValue = Math.max(criticalFindings, highFindings, mediumFindings, lowFindings, 1)

    return (
      <div className="mt-4 space-y-2">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-red-400">Critical</span>
            <span>{criticalFindings}</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full"
              style={{ width: `${(criticalFindings / maxValue) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-orange-400">High</span>
            <span>{highFindings}</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-orange-600 h-2 rounded-full"
              style={{ width: `${(highFindings / maxValue) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-amber-400">Medium</span>
            <span>{mediumFindings}</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-amber-600 h-2 rounded-full"
              style={{ width: `${(mediumFindings / maxValue) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-blue-400">Low</span>
            <span>{lowFindings}</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(lowFindings / maxValue) * 100}%` }}></div>
          </div>
        </div>
      </div>
    )
  }

  // Render top vulnerabilities chart
  const renderTopVulnerabilitiesChart = () => {
    const { topVulnerabilities } = metrics
    const maxValue = topVulnerabilities.length > 0 ? Math.max(...topVulnerabilities.map((v) => v.count)) : 1

    return (
      <div className="mt-4 space-y-2">
        {topVulnerabilities.map((vuln, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="truncate max-w-[200px]" title={vuln.name}>
                {vuln.name}
              </span>
              <span>{vuln.count}</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full"
                style={{ width: `${(vuln.count / maxValue) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}

        {topVulnerabilities.length === 0 && (
          <p className="text-zinc-500 text-sm italic">No vulnerability data available</p>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
            Security Dashboard
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {Object.entries(dateRanges).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTarget} onValueChange={setSelectedTarget}>
              <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Select target" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all">All Targets</SelectItem>
                {targets.map((target) => (
                  <SelectItem key={target} value={target}>
                    {target}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-zinc-400">
            Showing data from {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-emerald-400" />
                    Security Posture
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">
                      <span className={getTrendColor(metrics.securityTrend)}>
                        {getTrendIcon(metrics.securityTrend)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-zinc-400">Trend</div>
                      <div className={`font-medium ${getTrendColor(metrics.securityTrend)}`}>
                        {metrics.securityTrend === "positive"
                          ? "Improving"
                          : metrics.securityTrend === "negative"
                            ? "Declining"
                            : "Stable"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-400" />
                    Total Findings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{metrics.totalFindings}</div>
                    <div className="text-right">
                      <div className="text-sm text-zinc-400">By Severity</div>
                      <div className="text-xs">
                        <span className="text-red-400">{metrics.criticalFindings} Critical</span>,{" "}
                        <span className="text-orange-400">{metrics.highFindings} High</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Target className="h-4 w-4 mr-2 text-blue-400" />
                    Targets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{metrics.totalTargets}</div>
                    <div className="text-right">
                      <div className="text-sm text-zinc-400">Most Vulnerable</div>
                      <div className="text-xs truncate max-w-[120px]" title={metrics.mostVulnerableTarget}>
                        {metrics.mostVulnerableTarget || "N/A"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-purple-400" />
                    Avg. Duration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{formatDuration(metrics.avgDuration)}</div>
                    <div className="text-right">
                      <div className="text-sm text-zinc-400">Tools Used</div>
                      <div className="text-xs">{metrics.totalTools} tools</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle>Findings by Severity</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Distribution of findings across severity levels
                  </CardDescription>
                </CardHeader>
                <CardContent>{renderSeverityChart()}</CardContent>
              </Card>

              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle>Top Vulnerabilities</CardTitle>
                  <CardDescription className="text-zinc-400">Most common vulnerability types found</CardDescription>
                </CardHeader>
                <CardContent>{renderTopVulnerabilitiesChart()}</CardContent>
              </Card>
            </div>

            {/* Recent Reports */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription className="text-zinc-400">Latest security assessments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.recentReports.length > 0 ? (
                    metrics.recentReports.map((report: Report, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-zinc-900">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-zinc-400" />
                          <div>
                            <div className="font-medium">{report.target}</div>
                            <div className="text-xs text-zinc-500 flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {formatDate(report.timestamp)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm">{report.findings.length} findings</div>
                            <div className="flex gap-1 mt-1 justify-end">
                              {report.findings.some((f) => f.severity === "Critical") && (
                                <Badge className={getSeverityColor("Critical")}>Critical</Badge>
                              )}
                              {report.findings.some((f) => f.severity === "High") && (
                                <Badge className={getSeverityColor("High")}>High</Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-zinc-500" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500 text-sm italic">No reports available for the selected filters</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
