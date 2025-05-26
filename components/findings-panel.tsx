"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { usePentest } from "@/contexts/pentest-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle } from "lucide-react"

export default function FindingsPanel() {
  const { findings, isRunning } = usePentest()

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

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Security Findings</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">Discovered vulnerabilities and security issues</p>
      </div>

      <ScrollArea className="flex-1 scrollbar-sleek">
        <div className="p-6 space-y-4">
          {findings.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-base">
                  {isRunning
                    ? "Scanning for vulnerabilities..."
                    : "No findings yet. Start a pentest to discover security issues."}
                </p>
              </div>
            </div>
          ) : (
            findings.map((finding, index) => (
              <Card
                key={index}
                className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek rounded-2xl overflow-hidden"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
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
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{finding.description}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Discovered: {new Date(finding.timestamp).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
