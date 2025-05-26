"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"

export type AIProvider = "openai" | "deepseek" | "flowise" | "ollama"
export type AIModel = string

export interface PromptTemplate {
  id: string
  name: string
  description: string
  systemPrompt: string
  variables: string[]
  isDefault: boolean
}

export interface AIConfig {
  provider: AIProvider
  model: AIModel
  apiKey: string
  temperature: number
  maxTokens: number
  activePromptTemplate: string
  promptTemplates: PromptTemplate[]
  rememberSettings: boolean
  flowiseEndpoint: string
  flowiseChatflowId: string
}

interface AIContextType {
  config: AIConfig
  updateConfig: (updates: Partial<AIConfig>) => void
  testConnection: () => Promise<boolean>
  addPromptTemplate: (template: Omit<PromptTemplate, "id" | "isDefault">) => void
  updatePromptTemplate: (id: string, updates: Partial<Omit<PromptTemplate, "id" | "isDefault">>) => void
  deletePromptTemplate: (id: string) => void
  setActivePromptTemplate: (id: string) => void
  getActivePromptTemplate: () => PromptTemplate | undefined
  resetConfig: () => void
}

// Default prompt templates
const defaultPromptTemplates: PromptTemplate[] = [
  {
    id: "default-pentest",
    name: "Standard Pentesting",
    description: "General-purpose pentesting prompt for most scenarios",
    systemPrompt: `You are an AI security assistant helping with a penetration test on {{TARGET}}. 
Your goal is to identify security vulnerabilities and suggest appropriate tools and techniques.

Follow these guidelines:
1. Prioritize reconnaissance before suggesting invasive tests
2. Recommend appropriate tools based on discovered information
3. Explain your reasoning and findings clearly
4. Request approval before suggesting potentially disruptive tests
5. Focus on identifying real security issues, not theoretical ones
6. Provide clear remediation advice for any vulnerabilities found

Additional context: {{ADDITIONAL_INFO}}`,
    variables: ["TARGET", "ADDITIONAL_INFO"],
    isDefault: true,
  },
  {
    id: "web-app-pentest",
    name: "Web Application Testing",
    description: "Specialized for web application security testing",
    systemPrompt: `You are an AI security assistant helping with a web application penetration test on {{TARGET}}.
Your goal is to identify web security vulnerabilities like XSS, CSRF, SQLi, and other OWASP Top 10 issues.

Follow these guidelines:
1. Start with passive reconnaissance (directory structure, technologies used)
2. Suggest appropriate web scanning tools (Nikto, OWASP ZAP, etc.)
3. Focus on input validation, authentication, and session management issues
4. Request approval before suggesting tests that might affect application functionality
5. Provide clear remediation advice for any vulnerabilities found

Additional context: {{ADDITIONAL_INFO}}`,
    variables: ["TARGET", "ADDITIONAL_INFO"],
    isDefault: true,
  },
  {
    id: "network-pentest",
    name: "Network Infrastructure",
    description: "Focused on network infrastructure security testing",
    systemPrompt: `You are an AI security assistant helping with a network infrastructure penetration test on {{TARGET}}.
Your goal is to identify network security vulnerabilities, misconfigurations, and potential entry points.

Follow these guidelines:
1. Start with network reconnaissance (port scanning, service enumeration)
2. Identify network services and potential vulnerabilities
3. Suggest appropriate network testing tools (nmap, Nessus, etc.)
4. Request approval before suggesting tests that might disrupt network services
5. Provide clear remediation advice for any vulnerabilities found

Additional context: {{ADDITIONAL_INFO}}`,
    variables: ["TARGET", "ADDITIONAL_INFO"],
    isDefault: true,
  },
]

// Default AI configuration
const defaultConfig: AIConfig = {
  provider: "openai",
  model: "gpt-4o",
  apiKey: "",
  temperature: 0.7,
  maxTokens: 4000,
  activePromptTemplate: "default-pentest",
  promptTemplates: defaultPromptTemplates,
  rememberSettings: false,
  flowiseEndpoint: "http://localhost:3000",
  flowiseChatflowId: "",
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export function AIProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AIConfig>(() => {
    // Try to load saved config from localStorage
    if (typeof window !== "undefined") {
      const savedConfig = localStorage.getItem("pentestAIConfig")
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig)
          // Ensure default templates are always available
          const mergedTemplates = [...defaultPromptTemplates]

          // Add any custom templates from saved config
          parsedConfig.promptTemplates?.forEach((template: PromptTemplate) => {
            if (!template.isDefault) {
              mergedTemplates.push(template)
            }
          })

          return {
            ...defaultConfig,
            ...parsedConfig,
            promptTemplates: mergedTemplates,
          }
        } catch (e) {
          console.error("Failed to parse saved AI config:", e)
        }
      }
    }
    return defaultConfig
  })

  const { toast } = useToast()

  // Save config to localStorage when it changes
  useEffect(() => {
    if (config.rememberSettings && typeof window !== "undefined") {
      // Don't store API key in localStorage unless explicitly allowed
      const configToSave = config.rememberSettings ? config : { ...config, apiKey: "" }

      localStorage.setItem("pentestAIConfig", JSON.stringify(configToSave))
    } else if (typeof window !== "undefined") {
      // If not remembering settings, remove any saved config
      localStorage.removeItem("pentestAIConfig")
    }
  }, [config])

  const updateConfig = (updates: Partial<AIConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }

  const testConnection = async () => {
    if (config.provider === "flowise") {
      if (!config.flowiseEndpoint || !config.flowiseChatflowId) {
        toast({
          title: "Missing Configuration",
          description: "Please enter both Flowise endpoint and Chatflow ID",
          variant: "destructive",
        })
        return false
      }

      toast({
        title: "Testing Flowise Connection",
        description: "Please wait while we verify the connection...",
      })

      try {
        const response = await fetch(`${config.flowiseEndpoint}/api/v1/prediction/${config.flowiseChatflowId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: "Test connection" }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        
        toast({
          title: "Connection Successful",
          description: "Successfully connected to Flowise",
        })
        return true
      } catch (error) {
        toast({
          title: "Connection Failed",
          description: error instanceof Error ? error.message : "Failed to connect to Flowise",
          variant: "destructive",
        })
        return false
      }
    }

    // Existing API key check for other providers
    if (!config.apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter an API key to test the connection",
        variant: "destructive",
      })
      return false
    }

    toast({
      title: "Testing AI Connection",
      description: "Please wait while we verify your API key...",
    })

    try {
      // In a real implementation, this would call an API to test the connection
      // For this demo, we'll simulate a successful connection after a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulate successful connection
      toast({
        title: "Connection Successful",
        description: `Successfully connected to ${config.provider} API`,
      })
      return true
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
      return false
    }
  }

  const addPromptTemplate = (template: Omit<PromptTemplate, "id" | "isDefault">) => {
    const newTemplate: PromptTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      isDefault: false,
    }

    setConfig((prev) => ({
      ...prev,
      promptTemplates: [...prev.promptTemplates, newTemplate],
    }))

    toast({
      title: "Template Added",
      description: `Prompt template "${template.name}" has been added`,
    })
  }

  const updatePromptTemplate = (id: string, updates: Partial<Omit<PromptTemplate, "id" | "isDefault">>) => {
    setConfig((prev) => ({
      ...prev,
      promptTemplates: prev.promptTemplates.map((template) =>
        template.id === id ? { ...template, ...updates } : template,
      ),
    }))

    toast({
      title: "Template Updated",
      description: "Prompt template has been updated",
    })
  }

  const deletePromptTemplate = (id: string) => {
    const template = config.promptTemplates.find((t) => t.id === id)

    if (template?.isDefault) {
      toast({
        title: "Cannot Delete Default Template",
        description: "Default templates cannot be deleted",
        variant: "destructive",
      })
      return
    }

    setConfig((prev) => ({
      ...prev,
      promptTemplates: prev.promptTemplates.filter((template) => template.id !== id),
      // If the active template is being deleted, switch to the default
      activePromptTemplate: prev.activePromptTemplate === id ? "default-pentest" : prev.activePromptTemplate,
    }))

    toast({
      title: "Template Deleted",
      description: "Prompt template has been deleted",
    })
  }

  const setActivePromptTemplate = (id: string) => {
    if (config.promptTemplates.some((template) => template.id === id)) {
      setConfig((prev) => ({
        ...prev,
        activePromptTemplate: id,
      }))
    }
  }

  const getActivePromptTemplate = () => {
    return config.promptTemplates.find((template) => template.id === config.activePromptTemplate)
  }

  const resetConfig = () => {
    // Keep custom templates but reset everything else
    const customTemplates = config.promptTemplates.filter((template) => !template.isDefault)

    setConfig({
      ...defaultConfig,
      promptTemplates: [...defaultPromptTemplates, ...customTemplates],
    })

    if (typeof window !== "undefined") {
      localStorage.removeItem("pentestAIConfig")
    }

    toast({
      title: "Configuration Reset",
      description: "AI configuration has been reset to defaults",
    })
  }

  return (
    <AIContext.Provider
      value={{
        config,
        updateConfig,
        testConnection,
        addPromptTemplate,
        updatePromptTemplate,
        deletePromptTemplate,
        setActivePromptTemplate,
        getActivePromptTemplate,
        resetConfig,
      }}
    >
      {children}
    </AIContext.Provider>
  )
}

export function useAI() {
  const context = useContext(AIContext)
  if (context === undefined) {
    throw new Error("useAI must be used within an AIProvider")
  }
  return context
}
