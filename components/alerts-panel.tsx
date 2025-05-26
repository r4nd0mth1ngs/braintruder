"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { usePentest } from "@/contexts/pentest-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, AlertTriangle, Info, Bell } from "lucide-react"

export default function AlertsPanel() {
  const { alerts, isRunning } = usePentest()

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/30"
      case "warning":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/30"
      case "info":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/30"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700/30"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">System Alerts</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">Important notifications and system messages</p>
      </div>

      <ScrollArea className="flex-1 scrollbar-sleek">
        <div className="p-6 space-y-4">
          {alerts.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                  <Bell className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-base">
                  {isRunning ? "Monitoring for alerts..." : "No alerts. System notifications will appear here."}
                </p>
              </div>
            </div>
          ) : (
            alerts.map((alert, index) => (
              <Card
                key={index}
                className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek rounded-2xl overflow-hidden"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(alert.severity)}
                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                        {alert.title}
                      </CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${getSeverityColor(alert.severity)} font-medium px-3 py-1 rounded-full flex-shrink-0`}
                    >
                      {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{alert.message}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(alert.timestamp).toLocaleString()}
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
