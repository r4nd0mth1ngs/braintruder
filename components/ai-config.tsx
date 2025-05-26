"use client"

import { useState } from "react"
import { useAI, type AIProvider, type AIModel, type PromptTemplate } from "@/contexts/ai-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Brain,
  Copy,
  Edit,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Plus,
  RotateCw,
  Save,
  Sparkles,
  Trash2,
  Variable,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface AIConfigProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AIConfig({ open, onOpenChange }: AIConfigProps) {
  const {
    config,
    updateConfig,
    testConnection,
    addPromptTemplate,
    updatePromptTemplate,
    deletePromptTemplate,
    setActivePromptTemplate,
    getActivePromptTemplate,
    resetConfig,
  } = useAI()

  const [activeTab, setActiveTab] = useState<string>("connection")
  const [isLoading, setIsLoading] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null)
  const [newTemplate, setNewTemplate] = useState<Omit<PromptTemplate, "id" | "isDefault">>({
    name: "",
    description: "",
    systemPrompt: "",
    variables: ["TARGET", "ADDITIONAL_INFO"],
  })
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)

  const handleTestConnection = async () => {
    setIsLoading(true)
    await testConnection()
    setIsLoading(false)
  }

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      updatePromptTemplate(editingTemplate.id, {
        name: editingTemplate.name,
        description: editingTemplate.description,
        systemPrompt: editingTemplate.systemPrompt,
        variables: editingTemplate.variables,
      })
      setEditingTemplate(null)
    }
  }

  const handleCreateTemplate = () => {
    if (newTemplate.name && newTemplate.systemPrompt) {
      addPromptTemplate(newTemplate)
      setNewTemplate({
        name: "",
        description: "",
        systemPrompt: "",
        variables: ["TARGET", "ADDITIONAL_INFO"],
      })
      setIsCreatingTemplate(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingTemplate(null)
  }

  const handleCancelCreate = () => {
    setIsCreatingTemplate(false)
    setNewTemplate({
      name: "",
      description: "",
      systemPrompt: "",
      variables: ["TARGET", "ADDITIONAL_INFO"],
    })
  }

  const extractVariables = (prompt: string): string[] => {
    const regex = /\{\{([A-Z_]+)\}\}/g
    const matches = prompt.match(regex) || []
    return matches.map((match) => match.replace(/\{\{|\}\}/g, ""))
  }

  const handlePromptChange = (prompt: string, isNew = false) => {
    const variables = extractVariables(prompt)

    if (isNew) {
      setNewTemplate((prev) => ({
        ...prev,
        systemPrompt: prompt,
        variables,
      }))
    } else if (editingTemplate) {
      setEditingTemplate((prev) => (prev ? { ...prev, systemPrompt: prompt, variables } : null))
    }
  }

  const activeTemplate = getActivePromptTemplate()

  const renderProviderOptions = () => {
    const providers: { value: AIProvider; label: string }[] = [
      { value: "openai", label: "OpenAI" },
      { value: "deepseek", label: "Deepseek" },
      { value: "flowise", label: "Flowise" },
      { value: "ollama", label: "Ollama" },
    ]

    return providers.map((provider) => (
      <SelectItem key={provider.value} value={provider.value} className="rounded-xl">
        {provider.label}
      </SelectItem>
    ))
  }

  const renderModelOptions = () => {
    if (config.provider === "openai") {
      return null
    }

    const models: Record<Exclude<AIProvider, "openai">, { value: AIModel; label: string }[]> = {
      deepseek: [
        { value: "deepseek-coder", label: "Deepseek Coder" },
        { value: "deepseek-chat", label: "Deepseek Chat" },
      ],
      flowise: [{ value: "flowise-chatflow", label: "Flowise Chatflow" }],
      ollama: [
        { value: "llama3.1", label: "Llama 3.1" },
        { value: "codellama", label: "Code Llama" },
        { value: "mistral", label: "Mistral" },
        { value: "phi3", label: "Phi-3" },
      ],
    }

    const currentProviderModels = models[config.provider as Exclude<AIProvider, "openai">]

    if (!currentProviderModels) {
      return null
    }

    return currentProviderModels.map((model) => (
      <SelectItem key={model.value} value={model.value} className="rounded-xl">
        {model.label}
      </SelectItem>
    ))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek-xl rounded-3xl max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Brain className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">AI Configuration</DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400 text-base">
                Configure the AI model and customize prompts for penetration testing
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <TabsList className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek rounded-2xl p-2">
                <TabsTrigger
                  value="connection"
                  className="rounded-xl px-6 py-3 font-semibold transition-sleek data-[state=active]:bg-white/80 data-[state=active]:shadow-sleek dark:data-[state=active]:bg-slate-800/80"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Connection
                </TabsTrigger>
                <TabsTrigger
                  value="prompts"
                  className="rounded-xl px-6 py-3 font-semibold transition-sleek data-[state=active]:bg-white/80 data-[state=active]:shadow-sleek dark:data-[state=active]:bg-slate-800/80"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Prompt Templates
                </TabsTrigger>
              </TabsList>

              <Button
                variant="outline"
                size="sm"
                onClick={resetConfig}
                className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            <TabsContent value="connection" className="h-full mt-0 flex-1">
              <ScrollArea className="h-[60vh] scrollbar-sleek">
                <div className="space-y-8 pr-4">
                  <Card className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">AI Provider</CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400">
                        Select the AI provider and model to use for penetration testing
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Label
                          htmlFor="ai-provider"
                          className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                        >
                          Provider
                        </Label>
                        <Select
                          value={config.provider}
                          onValueChange={(value) => updateConfig({ provider: value as AIProvider })}
                        >
                          <SelectTrigger
                            id="ai-provider"
                            className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl h-12"
                          >
                            <SelectValue placeholder="Select AI provider" />
                          </SelectTrigger>
                          <SelectContent className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek-lg rounded-2xl">
                            {renderProviderOptions()}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="ai-model" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Model
                        </Label>
                        {config.provider === "openai" ? (
                          <div className="space-y-2">
                            <Input
                              id="ai-model"
                              placeholder="Enter OpenAI model name (e.g., gpt-4o, gpt-4-turbo)"
                              className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl h-12"
                              value={config.model}
                              onChange={(e) => updateConfig({ model: e.target.value as AIModel })}
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Enter the exact model name you want to use (e.g., gpt-4o, gpt-4-turbo, gpt-3.5-turbo)
                            </p>
                          </div>
                        ) : (
                          <Select
                            value={config.model}
                            onValueChange={(value) => updateConfig({ model: value as AIModel })}
                          >
                            <SelectTrigger
                              id="ai-model"
                              className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl h-12"
                            >
                              <SelectValue placeholder="Select AI model" />
                            </SelectTrigger>
                            <SelectContent className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek-lg rounded-2xl">
                              {renderModelOptions()}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="api-key" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            API Key
                          </Label>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <Input
                          id="api-key"
                          type={showApiKey ? "text" : "password"}
                          placeholder={`Enter your ${config.provider} API key`}
                          className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl h-12"
                          value={config.apiKey}
                          onChange={(e) => updateConfig({ apiKey: e.target.value })}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Your API key is used to connect to the AI service. It will not be shared or stored unless you
                          enable "Remember Settings".
                        </p>
                      </div>

                      <div className="pt-4">
                        <Button
                          onClick={handleTestConnection}
                          disabled={isLoading || !config.apiKey}
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl h-12 px-8 font-semibold shadow-sleek hover:shadow-sleek-lg"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Testing Connection...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Test Connection
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                        Model Parameters
                      </CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400">
                        Adjust parameters to control the AI's behavior
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label
                            htmlFor="temperature"
                            className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                          >
                            Temperature
                          </Label>
                          <span className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                            {config.temperature}
                          </span>
                        </div>
                        <Slider
                          id="temperature"
                          min={0}
                          max={1}
                          step={0.1}
                          value={[config.temperature]}
                          onValueChange={(value) => updateConfig({ temperature: value[0] })}
                          className="w-full"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Controls randomness: Lower values are more deterministic, higher values are more creative.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label
                            htmlFor="max-tokens"
                            className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                          >
                            Max Tokens
                          </Label>
                          <span className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                            {config.maxTokens}
                          </span>
                        </div>
                        <Slider
                          id="max-tokens"
                          min={1000}
                          max={8000}
                          step={100}
                          value={[config.maxTokens]}
                          onValueChange={(value) => updateConfig({ maxTokens: value[0] })}
                          className="w-full"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Maximum number of tokens to generate in the response.
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                        <Switch
                          id="remember-settings"
                          checked={config.rememberSettings}
                          onCheckedChange={(checked) => updateConfig({ rememberSettings: checked })}
                        />
                        <Label htmlFor="remember-settings" className="font-medium text-slate-700 dark:text-slate-300">
                          Remember settings (including API key)
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="prompts" className="h-full mt-0 flex-1">
              <ScrollArea className="h-[60vh] scrollbar-sleek">
                <div className="space-y-8 pr-4">
                  {/* Active Template */}
                  <Card className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek rounded-2xl">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                            Active Prompt Template
                          </CardTitle>
                          <CardDescription className="text-slate-600 dark:text-slate-400">
                            The currently selected prompt template for AI guidance
                          </CardDescription>
                        </div>
                        {activeTemplate && (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/30 font-medium px-3 py-1 rounded-full"
                          >
                            {activeTemplate.name}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {activeTemplate ? (
                        <>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                              Description
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400">{activeTemplate.description}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                              System Prompt
                            </h4>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-sm font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto scrollbar-sleek">
                              {activeTemplate.systemPrompt}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Variables</h4>
                            <div className="flex flex-wrap gap-2">
                              {activeTemplate.variables.map((variable) => (
                                <Badge
                                  key={variable}
                                  variant="outline"
                                  className="bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800/30 font-medium px-3 py-1 rounded-full"
                                >
                                  <Variable className="h-3 w-3 mr-1" />
                                  {variable}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                          <p className="text-slate-500 dark:text-slate-400">No active template selected</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Template Editor or List */}
                  {editingTemplate ? (
                    <Card className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                          Edit Template
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="edit-template-name"
                            className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                          >
                            Template Name
                          </Label>
                          <Input
                            id="edit-template-name"
                            className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl h-12"
                            value={editingTemplate.name}
                            onChange={(e) =>
                              setEditingTemplate((prev) => (prev ? { ...prev, name: e.target.value } : null))
                            }
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="edit-template-description"
                            className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                          >
                            Description
                          </Label>
                          <Input
                            id="edit-template-description"
                            className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl h-12"
                            value={editingTemplate.description}
                            onChange={(e) =>
                              setEditingTemplate((prev) => (prev ? { ...prev, description: e.target.value } : null))
                            }
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="edit-template-prompt"
                            className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                          >
                            System Prompt
                          </Label>
                          <div className="relative">
                            <Textarea
                              id="edit-template-prompt"
                              className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl min-h-[200px] font-mono text-sm"
                              value={editingTemplate.systemPrompt}
                              onChange={(e) => handlePromptChange(e.target.value)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-3 right-3 h-8 w-8 rounded-xl bg-white/80 dark:bg-slate-800/80"
                              onClick={() => navigator.clipboard.writeText(editingTemplate.systemPrompt)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Use variables like {"{{TARGET}}"} and {"{{ADDITIONAL_INFO}}"} that will be replaced with
                            actual values.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Detected Variables
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {editingTemplate.variables.map((variable) => (
                              <Badge
                                key={variable}
                                variant="outline"
                                className="bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800/30 font-medium px-3 py-1 rounded-full"
                              >
                                <Variable className="h-3 w-3 mr-1" />
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-4">
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="flex-1 h-12 rounded-2xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-semibold"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveTemplate}
                          className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-sleek hover:shadow-sleek-lg"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                      </CardFooter>
                    </Card>
                  ) : isCreatingTemplate ? (
                    <Card className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                          Create New Template
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="new-template-name"
                            className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                          >
                            Template Name
                          </Label>
                          <Input
                            id="new-template-name"
                            className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl h-12"
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate((prev) => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="new-template-description"
                            className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                          >
                            Description
                          </Label>
                          <Input
                            id="new-template-description"
                            className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl h-12"
                            value={newTemplate.description}
                            onChange={(e) => setNewTemplate((prev) => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="new-template-prompt"
                            className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                          >
                            System Prompt
                          </Label>
                          <Textarea
                            id="new-template-prompt"
                            className="bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 rounded-2xl min-h-[200px] font-mono text-sm"
                            value={newTemplate.systemPrompt}
                            onChange={(e) => handlePromptChange(e.target.value, true)}
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Use variables like {"{{TARGET}}"} and {"{{ADDITIONAL_INFO}}"} that will be replaced with
                            actual values.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Detected Variables
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {newTemplate.variables.map((variable) => (
                              <Badge
                                key={variable}
                                variant="outline"
                                className="bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800/30 font-medium px-3 py-1 rounded-full"
                              >
                                <Variable className="h-3 w-3 mr-1" />
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-4">
                        <Button
                          variant="outline"
                          onClick={handleCancelCreate}
                          className="flex-1 h-12 rounded-2xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-semibold"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateTemplate}
                          disabled={!newTemplate.name || !newTemplate.systemPrompt}
                          className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-sleek hover:shadow-sleek-lg"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Create Template
                        </Button>
                      </CardFooter>
                    </Card>
                  ) : (
                    <Card className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek rounded-2xl">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                              Available Templates
                            </CardTitle>
                            <CardDescription className="text-slate-600 dark:text-slate-400">
                              Select a template to use or customize
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsCreatingTemplate(true)}
                            className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            New Template
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {config.promptTemplates.map((template) => (
                            <div
                              key={template.id}
                              className={`p-4 rounded-2xl transition-sleek ${
                                config.activePromptTemplate === template.id
                                  ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30"
                                  : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                                    {template.name}
                                    {template.isDefault && (
                                      <Badge
                                        variant="outline"
                                        className="ml-2 bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/30 text-xs"
                                      >
                                        Default
                                      </Badge>
                                    )}
                                  </h3>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    {template.description}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-xl"
                                    onClick={() => setEditingTemplate(template)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {!template.isDefault && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-xl text-red-500 hover:text-red-600"
                                      onClick={() => deletePromptTemplate(template.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {template.variables.map((variable) => (
                                  <Badge
                                    key={variable}
                                    variant="outline"
                                    className="bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800/30 text-xs"
                                  >
                                    <Variable className="h-3 w-3 mr-1" />
                                    {variable}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex justify-end">
                                {config.activePromptTemplate !== template.id ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setActivePromptTemplate(template.id)}
                                    className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl"
                                  >
                                    Use Template
                                  </Button>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/30"
                                  >
                                    Active
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="pt-6 border-t border-slate-200/60 dark:border-slate-700/60">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl h-12 px-8 font-semibold shadow-sleek hover:shadow-sleek-lg"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
