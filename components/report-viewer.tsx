"use client"

import { useState } from "react"
import { useReport } from "@/contexts/report-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, FileText, Download, Trash2, FileDown, Clock, Target, AlertTriangle } from "lucide-react"

interface ReportViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ReportViewer({ open, onOpenChange }: ReportViewerProps) {
  const {
    reports,
    currentReport,
    isGeneratingReport,
    generateReport,
    exportReportAsPDF,
    exportReportAsText,
    viewReport,
    deleteReport,
  } = useReport()

  const [activeTab, setActiveTab] = useState<string>("summary")
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)

  const handleGenerateReport = async () => {
    await generateReport()
    setActiveTab("summary")
  }

  const handleViewReport = (reportId: string) => {
    viewReport(reportId)
    setSelectedReportId(reportId)
    setActiveTab("summary")
  }

  const handleDeleteReport = (reportId: string) => {
    deleteReport(reportId)
    if (selectedReportId === reportId) {
      setSelectedReportId(null)
    }
  }

  const handleExportPDF = async () => {
    if (currentReport) {
      await exportReportAsPDF(currentReport.id)
    }
  }

  const handleExportText = async () => {
    if (currentReport) {
      await exportReportAsText(currentReport.id)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString()
    } catch (e) {
      return timestamp
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/30"
      case "high":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/30"
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/30"
      case "low":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/30"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700/30"
    }
  }

  const getEntryColor = (type: string) => {
    switch (type) {
      case "command":
        return "text-cyan-400"
      case "output":
        return "text-slate-200 dark:text-slate-300"
      case "ai":
        return "text-emerald-400"
      case "system":
        return "text-amber-400"
      default:
        return "text-slate-200 dark:text-slate-300"
    }
  }

  const getEntryPrefix = (type: string) => {
    switch (type) {
      case "command":
        return "$ "
      case "output":
        return ""
      case "ai":
        return "[AI] "
      case "system":
        return "[SYSTEM] "
      default:
        return ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek-xl rounded-3xl max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
              <FileText className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">Pentest Reports</DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400 text-base">
                View and manage your penetration testing reports
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* Report List */}
          <div className="w-1/3 border-r border-slate-200/60 dark:border-slate-700/60 pr-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Available Reports</h3>
              <Button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl h-10 px-4 font-semibold shadow-sleek hover:shadow-sleek-lg"
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate New
                  </>
                )}
              </Button>
            </div>
            <ScrollArea className="h-[calc(70vh-100px)] scrollbar-sleek">
              <div className="space-y-3">
                {reports.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-500/20 to-gray-500/20 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">No reports available</p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <Card
                      key={report.id}
                      className={`cursor-pointer transition-sleek ${
                        selectedReportId === report.id
                          ? "glass-ultra dark:glass-ultra-dark border border-emerald-200 dark:border-emerald-800/30 shadow-sleek"
                          : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800/80"
                      } rounded-2xl`}
                      onClick={() => handleViewReport(report.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-slate-900 dark:text-white truncate">{report.target}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteReport(report.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(report.timestamp)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/30 text-xs"
                            >
                              {report.findings.length} finding{report.findings.length !== 1 ? "s" : ""}
                            </Badge>
                            {report.findings.some((f) => f.severity === "Critical" || f.severity === "High") && (
                              <Badge
                                variant="outline"
                                className="bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/30 text-xs"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                High Risk
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Report Content */}
          <div className="w-2/3 overflow-hidden flex flex-col">
            {currentReport ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{currentReport.target}</h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTimestamp(currentReport.timestamp)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {Math.floor(currentReport.duration / 3600)}h {Math.floor((currentReport.duration % 3600) / 60)}m
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportText}
                      className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Export TXT
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPDF}
                      className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek rounded-2xl p-2 mb-6">
                    <TabsTrigger
                      value="summary"
                      className="rounded-xl px-6 py-3 font-semibold transition-sleek data-[state=active]:bg-white/80 data-[state=active]:shadow-sleek dark:data-[state=active]:bg-slate-800/80"
                    >
                      Summary
                    </TabsTrigger>
                    <TabsTrigger
                      value="findings"
                      className="rounded-xl px-6 py-3 font-semibold transition-sleek data-[state=active]:bg-white/80 data-[state=active]:shadow-sleek dark:data-[state=active]:bg-slate-800/80"
                    >
                      Findings ({currentReport.findings.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="recommendations"
                      className="rounded-xl px-6 py-3 font-semibold transition-sleek data-[state=active]:bg-white/80 data-[state=active]:shadow-sleek dark:data-[state=active]:bg-slate-800/80"
                    >
                      Recommendations
                    </TabsTrigger>
                    <TabsTrigger
                      value="console"
                      className="rounded-xl px-6 py-3 font-semibold transition-sleek data-[state=active]:bg-white/80 data-[state=active]:shadow-sleek dark:data-[state=active]:bg-slate-800/80"
                    >
                      Console Log
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="flex-1 overflow-hidden mt-0">
                    <ScrollArea className="h-full scrollbar-sleek">
                      <div className="space-y-6 pr-4">
                        <Card className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek rounded-2xl">
                          <CardHeader>
                            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                              Executive Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                              {currentReport.executiveSummary}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek rounded-2xl">
                          <CardHeader>
                            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                              AI Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed">
                              {currentReport.aiSummary}
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek rounded-2xl">
                          <CardHeader>
                            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                              Assessment Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                  Target
                                </h4>
                                <p className="text-slate-600 dark:text-slate-400">{currentReport.target}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                  Duration
                                </h4>
                                <p className="text-slate-600 dark:text-slate-400">
                                  {Math.floor(currentReport.duration / 3600)}h{" "}
                                  {Math.floor((currentReport.duration % 3600) / 60)}m {currentReport.duration % 60}s
                                </p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Tools Used
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {currentReport.selectedTools.map((toolId) => (
                                  <Badge
                                    key={toolId}
                                    variant="outline"
                                    className="bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800/30"
                                  >
                                    {toolId}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="findings" className="flex-1 overflow-hidden mt-0">
                    <ScrollArea className="h-full scrollbar-sleek">
                      <div className="space-y-4 pr-4">
                        {currentReport.findings.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                              <FileText className="h-8 w-8 text-emerald-500" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400">
                              No findings were identified during this assessment.
                            </p>
                          </div>
                        ) : (
                          currentReport.findings.map((finding, index) => (
                            <Card
                              key={index}
                              className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek rounded-2xl"
                            >
                              <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-4">
                                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {finding.title}
                                  </CardTitle>
                                  <Badge
                                    variant="outline"
                                    className={`${getSeverityColor(finding.severity)} font-medium px-3 py-1 rounded-full flex-shrink-0`}
                                  >
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {finding.severity}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                                  {finding.description}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Discovered: {formatTimestamp(finding.timestamp)}
                                </p>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="recommendations" className="flex-1 overflow-hidden mt-0">
                    <ScrollArea className="h-full scrollbar-sleek">
                      <div className="space-y-4 pr-4">
                        {currentReport.recommendations.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                              <FileText className="h-8 w-8 text-blue-500" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400">No recommendations available.</p>
                          </div>
                        ) : (
                          currentReport.recommendations.map((section, index) => (
                            <Card
                              key={index}
                              className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek rounded-2xl"
                            >
                              <CardHeader>
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                                  {section.title}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {section.content}
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="console" className="flex-1 overflow-hidden mt-0">
                    <div className="h-full bg-slate-900 dark:bg-slate-950 rounded-2xl overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-700/50">
                        <h3 className="text-lg font-semibold text-white">Console Output</h3>
                      </div>
                      <ScrollArea className="h-[calc(100%-60px)] scrollbar-sleek">
                        <div className="p-6 font-mono text-sm space-y-2">
                          {currentReport.consoleEntries.map((entry, index) => (
                            <div key={index} className={getEntryColor(entry.type)}>
                              <span className="text-slate-500 text-xs mr-3">{formatTimestamp(entry.timestamp)}</span>
                              <span className="font-bold">{getEntryPrefix(entry.type)}</span>
                              <span className="break-words">{entry.content}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-slate-500/20 to-gray-500/20 flex items-center justify-center">
                  <FileText className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Report Selected</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Select a report from the list or generate a new one to get started
                </p>
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl h-12 px-6 font-semibold shadow-sleek hover:shadow-sleek-lg"
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate New Report
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
