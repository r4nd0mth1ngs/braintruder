"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle,
  BarChart3,
  Brain,
  CheckCircle,
  FileText,
  Play,
  Server,
  Sparkles,
  Square,
  Terminal,
  Wrench,
  Zap,
} from "lucide-react"
import PentestConsole from "@/components/pentest-console"
import ApprovalDialog from "@/components/approval-dialog"
import FindingsPanel from "@/components/findings-panel"
import AlertsPanel from "@/components/alerts-panel"
import ToolSelection from "@/components/tool-selection"
import ConnectionConfig from "@/components/connection-config"
import ReportViewer from "@/components/report-viewer"
import Dashboard from "@/components/dashboard"
import AIConfig from "@/components/ai-config"
import { usePentest } from "@/contexts/pentest-context"
import { useTools } from "@/contexts/tools-context"
import { useConnection } from "@/contexts/connection-context"
import { useReport } from "@/contexts/report-context"
import { useAI } from "@/contexts/ai-context"

export default function Home() {
  const {
    target,
    setTarget,
    additionalInfo,
    setAdditionalInfo,
    isRunning,
    startPentest,
    stopPentest,
    connectionStatus,
    showToolSelection,
    setShowToolSelection,
    showConnectionConfig,
    setShowConnectionConfig,
    showAIConfig,
    setShowAIConfig,
  } = usePentest()

  const { selectedTools, headlessMode } = useTools()
  const { status: kaliStatus } = useConnection()
  const { reports } = useReport()
  const { config: aiConfig } = useAI()
  const [showReportViewer, setShowReportViewer] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)

  const getConnectionStatusColor = () => {
    switch (kaliStatus) {
      case "connected":
        return "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/30"
      case "connecting":
        return "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/30"
      case "error":
        return "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/30"
      default:
        return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700/30"
    }
  }

  const getConnectionStatusText = () => {
    switch (kaliStatus) {
      case "connected":
        return "Kali Connected"
      case "connecting":
        return "Connecting..."
      case "error":
        return "Connection Error"
      default:
        return "Disconnected"
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950/20">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl float-animation" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl float-animation"
          style={{ animationDelay: "-3s" }}
        />
      </div>

      <header className="sticky top-0 z-50 glass-ultra dark:glass-ultra-dark border-b border-white/20 dark:border-white/5">
        <div className="container mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-sleek pulse-glow">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text-brand">Braintruder</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  AI Driven Autonomous Penetration Testing Platform
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`${getConnectionStatusColor()} font-medium px-4 py-2 rounded-full shadow-sleek`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      kaliStatus === "connected"
                        ? "bg-emerald-500 animate-pulse"
                        : kaliStatus === "connecting"
                          ? "bg-amber-500 animate-spin"
                          : "bg-red-500"
                    }`}
                  />
                  {getConnectionStatusText()}
                </div>
              </Badge>

              <Badge
                variant="outline"
                className={`${
                  connectionStatus === "connected"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/30"
                    : connectionStatus === "connecting"
                      ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/30"
                      : "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/30"
                } px-4 py-2 font-medium rounded-full shadow-sleek transition-sleek`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === "connected"
                        ? "bg-emerald-500 animate-pulse"
                        : connectionStatus === "connecting"
                          ? "bg-amber-500 animate-spin"
                          : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {connectionStatus === "connected"
                      ? "Server Online"
                      : connectionStatus === "connecting"
                        ? "Connecting..."
                        : "Server Offline"}
                  </span>
                </div>
              </Badge>

              <Badge
                variant="outline"
                className="bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800/30 font-medium px-4 py-2 rounded-full shadow-sleek"
              >
                <Brain className="h-3.5 w-3.5 mr-2" />
                {aiConfig.model}
              </Badge>

              {headlessMode && (
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800/30 font-medium px-4 py-2 rounded-full shadow-sleek"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  Autonomous Mode
                </Badge>
              )}

              <div className="flex gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDashboard(true)}
                  className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 rounded-xl transition-sleek font-medium"
                  disabled={reports.length === 0}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReportViewer(true)}
                  className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 rounded-xl transition-sleek font-medium"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Reports {reports.length > 0 && `(${reports.length})`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto flex flex-1 gap-8 p-8 relative z-10">
        <div className="w-1/3">
          <Card className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek-lg rounded-3xl overflow-hidden">
            <CardHeader className="pb-8">
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Target Configuration</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 text-base">
                Configure your penetration testing target and parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <label htmlFor="target" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Target URL or IP Address
                </label>
                <Input
                  id="target"
                  placeholder="e.g., example.com or 192.168.1.1"
                  className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl h-14 px-5 text-base transition-sleek focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  disabled={isRunning}
                />
              </div>
              <div className="space-y-4">
                <label htmlFor="info" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Additional Information
                </label>
                <Textarea
                  id="info"
                  placeholder="Any known information about the target, technologies used, or specific areas to focus on..."
                  className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl min-h-[140px] p-5 text-base transition-sleek focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 resize-none"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  disabled={isRunning}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-8">
              <Button
                className="w-full bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-2xl h-14 transition-sleek font-semibold shadow-sleek hover:shadow-sleek-lg"
                onClick={() => setShowConnectionConfig(true)}
                disabled={isRunning}
              >
                <Server className="mr-3 h-5 w-5" />
                Configure Kali/Parrot Connection
              </Button>

              <Button
                className="w-full bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-2xl h-14 transition-sleek font-semibold shadow-sleek hover:shadow-sleek-lg"
                onClick={() => setShowAIConfig(true)}
                disabled={isRunning}
              >
                <Brain className="mr-3 h-5 w-5" />
                Configure AI & Prompts
              </Button>

              <Button
                className="w-full bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-2xl h-14 transition-sleek font-semibold shadow-sleek hover:shadow-sleek-lg"
                onClick={() => setShowToolSelection(true)}
                disabled={isRunning}
              >
                <Wrench className="mr-3 h-5 w-5" />
                {headlessMode ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                    AI Tool Selection (Autonomous Mode)
                  </>
                ) : (
                  <>Select Tools ({selectedTools.length})</>
                )}
              </Button>

              {!isRunning ? (
                <Button
                  className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-2xl h-16 transition-sleek font-bold shadow-sleek-lg hover:shadow-sleek-xl text-lg"
                  onClick={startPentest}
                  disabled={!target || connectionStatus !== "connected" || kaliStatus !== "connected"}
                >
                  <Play className="mr-3 h-6 w-6" />
                  Start Penetration Test
                </Button>
              ) : (
                <Button
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl h-16 transition-sleek font-bold shadow-sleek-lg hover:shadow-sleek-xl text-lg"
                  onClick={stopPentest}
                >
                  <Square className="mr-3 h-6 w-6" />
                  Stop Penetration Test
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        <div className="w-2/3">
          <Tabs defaultValue="console" className="h-full flex flex-col">
            <TabsList className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek rounded-3xl p-3 mb-8">
              <TabsTrigger
                value="console"
                className="rounded-2xl px-8 py-4 font-semibold transition-sleek data-[state=active]:bg-white/80 data-[state=active]:shadow-sleek dark:data-[state=active]:bg-slate-800/80 text-base"
              >
                <Terminal className="mr-3 h-5 w-5" />
                Console
              </TabsTrigger>
              <TabsTrigger
                value="findings"
                className="rounded-2xl px-8 py-4 font-semibold transition-sleek data-[state=active]:bg-white/80 data-[state=active]:shadow-sleek dark:data-[state=active]:bg-slate-800/80 text-base"
              >
                <CheckCircle className="mr-3 h-5 w-5" />
                Findings
              </TabsTrigger>
              <TabsTrigger
                value="alerts"
                className="rounded-2xl px-8 py-4 font-semibold transition-sleek data-[state=active]:bg-white/80 data-[state=active]:shadow-sleek dark:data-[state=active]:bg-slate-800/80 text-base"
              >
                <AlertCircle className="mr-3 h-5 w-5" />
                Alerts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="console" className="flex-1 mt-0">
              <Card className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek-lg rounded-3xl h-full overflow-hidden">
                <CardContent className="p-0 h-full">
                  <PentestConsole />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="findings" className="flex-1 mt-0">
              <Card className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek-lg rounded-3xl h-full overflow-hidden">
                <CardContent className="p-0">
                  <FindingsPanel />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="flex-1 mt-0">
              <Card className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek-lg rounded-3xl h-full overflow-hidden">
                <CardContent className="p-0">
                  <AlertsPanel />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ToolSelection open={showToolSelection} onOpenChange={setShowToolSelection} />
      <ConnectionConfig open={showConnectionConfig} onOpenChange={setShowConnectionConfig} />
      <AIConfig open={showAIConfig} onOpenChange={setShowAIConfig} />
      <ReportViewer open={showReportViewer} onOpenChange={setShowReportViewer} />
      <Dashboard open={showDashboard} onOpenChange={setShowDashboard} />
      <ApprovalDialog />
    </main>
  )
}
