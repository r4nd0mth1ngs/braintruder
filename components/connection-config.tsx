"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState } from "react"
import { useConnection, type ConnectionMethod } from "@/contexts/connection-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Loader2, Server, Key, Lock, Database, RotateCw, CheckCircle, AlertCircle } from "lucide-react"

interface ConnectionConfigProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ConnectionConfig({ open, onOpenChange }: ConnectionConfigProps) {
  const { config, updateConfig, status, connect, disconnect, testConnection, resetConfig } = useConnection()
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    setIsLoading(true)
    await connect()
    setIsLoading(false)
  }

  const handleTest = async () => {
    setIsLoading(true)
    await testConnection()
    setIsLoading(false)
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const handleMethodChange = (method: ConnectionMethod) => {
    updateConfig({ method })
  }

  const getStatusColor = () => {
    switch (status) {
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

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return "Connected"
      case "connecting":
        return "Connecting..."
      case "error":
        return "Connection Error"
      default:
        return "Disconnected"
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4" />
      case "connecting":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek-xl rounded-3xl max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
              <Server className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                Kali/Parrot Connection
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400 text-base">
                Configure your connection to the penetration testing system
              </DialogDescription>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Badge variant="outline" className={`${getStatusColor()} font-medium px-4 py-2 rounded-full`}>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                {getStatusText()}
              </div>
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={resetConfig}
              className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-8 max-h-[60vh] overflow-y-auto scrollbar-sleek">
          <div className="space-y-4">
            <Label className="text-base font-semibold text-slate-900 dark:text-white">Connection Method</Label>
            <Select value={config.method} onValueChange={(value) => handleMethodChange(value as ConnectionMethod)}>
              <SelectTrigger className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl h-12">
                <SelectValue placeholder="Select connection method" />
              </SelectTrigger>
              <SelectContent className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek-lg rounded-2xl">
                <SelectItem value="ssh" className="rounded-xl">
                  SSH Connection
                </SelectItem>
                <SelectItem value="api" className="rounded-xl">
                  API Connection
                </SelectItem>
                <SelectItem value="docker" className="rounded-xl">
                  Docker Container
                </SelectItem>
                <SelectItem value="local" className="rounded-xl">
                  Local System
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={config.method} className="w-full">
            <TabsContent value="ssh" className="mt-0 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="ssh-host" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Host
                  </Label>
                  <Input
                    id="ssh-host"
                    placeholder="hostname or IP address"
                    className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl h-12"
                    value={config.host}
                    onChange={(e) => updateConfig({ host: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="ssh-port" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Port
                  </Label>
                  <Input
                    id="ssh-port"
                    type="number"
                    className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl h-12"
                    value={config.port}
                    onChange={(e) => updateConfig({ port: Number.parseInt(e.target.value) || 22 })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="ssh-username" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Username
                </Label>
                <Input
                  id="ssh-username"
                  placeholder="kali"
                  className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl h-12"
                  value={config.username}
                  onChange={(e) => updateConfig({ username: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <Switch
                  id="use-ssh-key"
                  checked={config.useSshKey}
                  onCheckedChange={(checked) => updateConfig({ useSshKey: checked })}
                />
                <Label htmlFor="use-ssh-key" className="font-medium text-slate-700 dark:text-slate-300">
                  Use SSH Key Authentication
                </Label>
              </div>

              {config.useSshKey ? (
                <div className="space-y-3">
                  <Label htmlFor="ssh-key" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    SSH Private Key
                  </Label>
                  <Textarea
                    id="ssh-key"
                    placeholder="Paste your SSH private key here"
                    className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl min-h-[120px] font-mono text-sm"
                    value={config.sshKey}
                    onChange={(e) => updateConfig({ sshKey: e.target.value })}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <Label htmlFor="ssh-password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                  <Input
                    id="ssh-password"
                    type="password"
                    className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl h-12"
                    value={config.password}
                    onChange={(e) => updateConfig({ password: e.target.value })}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="api" className="mt-0 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="api-host" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    API Endpoint
                  </Label>
                  <Input
                    id="api-host"
                    placeholder="https://kali-api.example.com"
                    className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl h-12"
                    value={config.host}
                    onChange={(e) => updateConfig({ host: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="api-port" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Port
                  </Label>
                  <Input
                    id="api-port"
                    type="number"
                    className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl h-12"
                    value={config.port}
                    onChange={(e) => updateConfig({ port: Number.parseInt(e.target.value) || 443 })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="api-key" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  API Key
                </Label>
                <Input
                  id="api-key"
                  type="password"
                  className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl h-12"
                  value={config.apiKey}
                  onChange={(e) => updateConfig({ apiKey: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="docker" className="mt-0 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="docker-image" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Docker Image
                </Label>
                <Input
                  id="docker-image"
                  placeholder="kalilinux/kali-rolling"
                  className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl h-12"
                  value={config.dockerImage}
                  onChange={(e) => updateConfig({ dockerImage: e.target.value })}
                />
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30 rounded-2xl">
                <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                  The Docker container will be created and managed automatically by the backend system.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="local" className="mt-0 space-y-6">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 rounded-2xl">
                <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                  Using the local system option will execute commands directly on the server where the backend is
                  running. This option should only be used if the backend is already running on a Kali or Parrot Linux
                  system.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-6 pt-6 border-t border-slate-200/60 dark:border-slate-700/60">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="timeout" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Connection Timeout
                </Label>
                <span className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  {config.timeout}s
                </span>
              </div>
              <Slider
                id="timeout"
                min={5}
                max={120}
                step={5}
                value={[config.timeout]}
                onValueChange={(value) => updateConfig({ timeout: value[0] })}
                className="w-full"
              />
            </div>

            <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <Switch
                id="remember-credentials"
                checked={config.rememberCredentials}
                onCheckedChange={(checked) => updateConfig({ rememberCredentials: checked })}
              />
              <Label htmlFor="remember-credentials" className="font-medium text-slate-700 dark:text-slate-300">
                Remember connection settings
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-4 pt-6 border-t border-slate-200/60 dark:border-slate-700/60">
          {status === "connected" ? (
            <Button
              variant="outline"
              onClick={handleDisconnect}
              className="flex-1 h-12 rounded-2xl border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold"
            >
              <Lock className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={isLoading}
                className="flex-1 h-12 rounded-2xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-semibold"
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
                Test Connection
              </Button>
              <Button
                onClick={handleConnect}
                disabled={isLoading}
                className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-sleek hover:shadow-sleek-lg"
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                Connect
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
