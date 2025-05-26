"use client"

import { useState } from "react"
import { useTools, type PentestTool } from "@/contexts/tools-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertTriangle,
  Bug,
  FileSearch,
  Fingerprint,
  Lock,
  RotateCw,
  Search,
  Shield,
  Sparkles,
  Wrench,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ToolSelectionProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ToolSelection({ open, onOpenChange }: ToolSelectionProps) {
  const { tools, selectedTools, headlessMode, toggleHeadlessMode, toggleTool, updateToolParameter, resetTools } =
    useTools()

  const [activeTab, setActiveTab] = useState("reconnaissance")
  const [showHeadlessWarning, setShowHeadlessWarning] = useState(false)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "reconnaissance":
        return <Search className="h-4 w-4" />
      case "scanning":
        return <FileSearch className="h-4 w-4" />
      case "vulnerability":
        return <Bug className="h-4 w-4" />
      case "exploitation":
        return <Shield className="h-4 w-4" />
      case "post-exploitation":
        return <Lock className="h-4 w-4" />
      case "web":
        return <Wrench className="h-4 w-4" />
      default:
        return <Fingerprint className="h-4 w-4" />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "reconnaissance":
        return "Reconnaissance"
      case "scanning":
        return "Scanning"
      case "vulnerability":
        return "Vulnerability"
      case "exploitation":
        return "Exploitation"
      case "post-exploitation":
        return "Post-Exploitation"
      case "web":
        return "Web Testing"
      default:
        return category.charAt(0).toUpperCase() + category.slice(1)
    }
  }

  const handleParameterChange = (tool: PentestTool, paramName: string, value: string | number | boolean) => {
    updateToolParameter(tool.id, paramName, value)
  }

  const handleHeadlessModeToggle = () => {
    if (!headlessMode) {
      setShowHeadlessWarning(true)
    } else {
      toggleHeadlessMode()
    }
  }

  const confirmHeadlessMode = () => {
    toggleHeadlessMode()
    setShowHeadlessWarning(false)
  }

  const renderParameterInput = (tool: PentestTool, param: PentestTool["parameters"][0]) => {
    switch (param.type) {
      case "string":
        return (
          <Input
            id={`${tool.id}-${param.name}`}
            value={param.value as string}
            onChange={(e) => handleParameterChange(tool, param.name, e.target.value)}
            className="h-10 bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-xl"
            disabled={headlessMode}
          />
        )
      case "number":
        return (
          <div className="flex items-center gap-4">
            <Slider
              id={`${tool.id}-${param.name}`}
              value={[param.value as number]}
              min={1}
              max={param.name === "risk" ? 3 : param.name === "level" ? 5 : 10000}
              step={1}
              onValueChange={(value) => handleParameterChange(tool, param.name, value[0])}
              className="w-full"
              disabled={headlessMode}
            />
            <span className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full min-w-[50px] text-center">
              {param.value}
            </span>
          </div>
        )
      case "boolean":
        return (
          <Checkbox
            id={`${tool.id}-${param.name}`}
            checked={param.value as boolean}
            onCheckedChange={(checked) => handleParameterChange(tool, param.name, !!checked)}
            disabled={headlessMode}
          />
        )
      default:
        return null
    }
  }

  const toolsByCategory = {
    reconnaissance: tools.filter((tool) => tool.category === "reconnaissance"),
    scanning: tools.filter((tool) => tool.category === "scanning"),
    vulnerability: tools.filter((tool) => tool.category === "vulnerability"),
    exploitation: tools.filter((tool) => tool.category === "exploitation"),
    "post-exploitation": tools.filter((tool) => tool.category === "post-exploitation"),
    web: tools.filter((tool) => tool.category === "web"),
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek-xl rounded-3xl max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
                <Wrench className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                  Pentest Tool Selection
                </DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400 text-base">
                  Select the tools you want the AI to use during the penetration test
                </DialogDescription>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {headlessMode
                  ? "AI will automatically select appropriate tools"
                  : `${selectedTools.length} tool${selectedTools.length !== 1 ? "s" : ""} selected`}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/30 rounded-2xl">
                  <Switch id="headless-mode" checked={headlessMode} onCheckedChange={handleHeadlessModeToggle} />
                  <Label htmlFor="headless-mode" className="flex items-center cursor-pointer font-medium">
                    <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                    Autonomous AI Mode
                  </Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetTools}
                  className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl"
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {headlessMode ? (
              <Card className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                    <Sparkles className="h-6 w-6 mr-3 text-purple-500" />
                    Autonomous AI Mode Enabled
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                    In this mode, the AI will automatically select and configure the most appropriate tools based on:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 mb-6">
                    <li>The target type (web application, network, server, etc.)</li>
                    <li>Information discovered during reconnaissance</li>
                    <li>The specific vulnerabilities it identifies</li>
                    <li>The context of the penetration test</li>
                  </ul>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-amber-700 dark:text-amber-300 font-semibold">Important Security Notice</p>
                        <p className="text-amber-600 dark:text-amber-200 text-sm mt-1 leading-relaxed">
                          The AI will request approval before running any high-risk tools or commands. You will always
                          have the final say on which actions are executed.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
                <TabsList className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek rounded-2xl p-2 mb-6 flex flex-wrap justify-center gap-1">
                  {Object.keys(toolsByCategory).map((category) => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className="rounded-xl px-4 py-3 font-semibold transition-sleek data-[state=active]:bg-white/80 data-[state=active]:shadow-sleek dark:data-[state=active]:bg-slate-800/80 flex items-center gap-2"
                    >
                      {getCategoryIcon(category)}
                      <span className="hidden md:inline">{getCategoryLabel(category)}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
                  <TabsContent key={category} value={category} className="flex-1 mt-0">
                    <ScrollArea className="h-[50vh] scrollbar-sleek">
                      <div className="space-y-4 pr-4">
                        {categoryTools.map((tool) => (
                          <Card
                            key={tool.id}
                            className={`transition-sleek ${
                              tool.enabled
                                ? "glass-ultra dark:glass-ultra-dark border border-emerald-200 dark:border-emerald-800/30 shadow-sleek"
                                : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50"
                            } rounded-2xl`}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <Switch
                                    id={tool.id}
                                    checked={tool.enabled}
                                    onCheckedChange={() => toggleTool(tool.id)}
                                  />
                                  <label
                                    htmlFor={tool.id}
                                    className="font-semibold text-slate-900 dark:text-white cursor-pointer"
                                  >
                                    {tool.name}
                                  </label>
                                  {tool.risky && (
                                    <Badge
                                      variant="outline"
                                      className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/30 font-medium px-2 py-1 rounded-full"
                                    >
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Risky
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <p className="text-slate-600 dark:text-slate-400 mb-4 ml-10 leading-relaxed">
                                {tool.description}
                              </p>

                              <div className="ml-10 space-y-4">
                                <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl text-emerald-600 dark:text-emerald-400">
                                  {tool.command}
                                </div>

                                {tool.parameters.length > 0 && (
                                  <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                      Parameters
                                    </h4>
                                    {tool.parameters.map((param) => (
                                      <div
                                        key={`${tool.id}-${param.name}`}
                                        className="grid grid-cols-3 gap-4 items-center"
                                      >
                                        <label
                                          htmlFor={`${tool.id}-${param.name}`}
                                          className="text-sm font-medium text-slate-600 dark:text-slate-400"
                                        >
                                          {param.name}
                                          <p className="text-xs text-slate-500 dark:text-slate-500">
                                            {param.description}
                                          </p>
                                        </label>
                                        <div className="col-span-2">{renderParameterInput(tool, param)}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>

          <DialogFooter className="pt-6 border-t border-slate-200/60 dark:border-slate-700/60">
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-2xl h-12 px-8 font-semibold shadow-sleek hover:shadow-sleek-lg"
            >
              Confirm Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showHeadlessWarning} onOpenChange={setShowHeadlessWarning}>
        <AlertDialogContent className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek-xl rounded-3xl">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-6">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              Enable Autonomous AI Mode
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400 text-lg">
              In Autonomous Mode, the AI will have full control over tool selection and configuration. It will
              automatically choose the most appropriate tools based on the target and findings during the pentest.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <p className="text-slate-700 dark:text-slate-300 font-semibold mb-3">Important Security Considerations:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
              <li>The AI will request approval before running any high-risk tools</li>
              <li>You will always have the final say on which actions are executed</li>
              <li>You can stop the pentest at any time</li>
              <li>The AI will prioritize non-invasive tools first</li>
            </ul>
          </div>
          <AlertDialogFooter className="flex gap-4">
            <AlertDialogCancel className="flex-1 h-12 rounded-2xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmHeadlessMode}
              className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-sleek hover:shadow-sleek-lg"
            >
              Enable Autonomous Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
