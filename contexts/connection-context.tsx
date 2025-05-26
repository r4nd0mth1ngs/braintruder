"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"

export type ConnectionMethod = "ssh" | "api" | "docker" | "local"
export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error"

export interface ConnectionConfig {
  method: ConnectionMethod
  host: string
  port: number
  username: string
  password: string
  sshKey: string
  useSshKey: boolean
  dockerImage: string
  apiKey: string
  timeout: number
  rememberCredentials: boolean
}

interface ConnectionContextType {
  config: ConnectionConfig
  updateConfig: (updates: Partial<ConnectionConfig>) => void
  status: ConnectionStatus
  connect: () => Promise<boolean>
  disconnect: () => void
  testConnection: () => Promise<boolean>
  isConfigValid: () => boolean
  resetConfig: () => void
}

const defaultConfig: ConnectionConfig = {
  method: "ssh",
  host: "localhost",
  port: 22,
  username: "kali",
  password: "",
  sshKey: "",
  useSshKey: false,
  dockerImage: "kalilinux/kali-rolling",
  apiKey: "",
  timeout: 30,
  rememberCredentials: false,
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined)

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConnectionConfig>(() => {
    // Try to load saved config from localStorage
    if (typeof window !== "undefined") {
      const savedConfig = localStorage.getItem("pentestConnectionConfig")
      if (savedConfig) {
        try {
          return JSON.parse(savedConfig)
        } catch (e) {
          console.error("Failed to parse saved connection config:", e)
        }
      }
    }
    return defaultConfig
  })

  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const { toast } = useToast()

  // Save config to localStorage when it changes
  useEffect(() => {
    if (config.rememberCredentials && typeof window !== "undefined") {
      localStorage.setItem("pentestConnectionConfig", JSON.stringify(config))
    } else if (typeof window !== "undefined") {
      // If not remembering credentials, remove any saved config
      localStorage.removeItem("pentestConnectionConfig")
    }
  }, [config])

  const updateConfig = (updates: Partial<ConnectionConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }

  const isConfigValid = () => {
    // Basic validation based on connection method
    switch (config.method) {
      case "ssh":
        if (!config.host || !config.username) return false
        if (!config.useSshKey && !config.password) return false
        if (config.useSshKey && !config.sshKey) return false
        break
      case "api":
        if (!config.host || !config.apiKey) return false
        break
      case "docker":
        if (!config.dockerImage) return false
        break
      case "local":
        // Local doesn't need validation
        break
    }
    return true
  }

  const connect = async () => {
    if (!isConfigValid()) {
      toast({
        title: "Invalid configuration",
        description: "Please check your connection settings",
        variant: "destructive",
      })
      return false
    }

    setStatus("connecting")

    try {
      // In a real implementation, this would send a connection request to the backend
      // For this demo, we'll simulate a connection
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulate successful connection
      setStatus("connected")
      toast({
        title: "Connection established",
        description: `Connected to ${config.method === "local" ? "local system" : config.host}`,
      })
      return true
    } catch (error) {
      setStatus("error")
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
      return false
    }
  }

  const disconnect = () => {
    // In a real implementation, this would send a disconnect request to the backend
    setStatus("disconnected")
    toast({
      title: "Disconnected",
      description: "Connection to pentesting system closed",
    })
  }

  const testConnection = async () => {
    if (!isConfigValid()) {
      toast({
        title: "Invalid configuration",
        description: "Please check your connection settings",
        variant: "destructive",
      })
      return false
    }

    toast({
      title: "Testing connection...",
      description: "Please wait while we test the connection",
    })

    try {
      // In a real implementation, this would send a test request to the backend
      // For this demo, we'll simulate a test
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate successful test
      toast({
        title: "Connection test successful",
        description: `Successfully connected to ${config.method === "local" ? "local system" : config.host}`,
      })
      return true
    } catch (error) {
      toast({
        title: "Connection test failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
      return false
    }
  }

  const resetConfig = () => {
    setConfig(defaultConfig)
    if (typeof window !== "undefined") {
      localStorage.removeItem("pentestConnectionConfig")
    }
  }

  return (
    <ConnectionContext.Provider
      value={{
        config,
        updateConfig,
        status,
        connect,
        disconnect,
        testConnection,
        isConfigValid,
        resetConfig,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  )
}

export function useConnection() {
  const context = useContext(ConnectionContext)
  if (context === undefined) {
    throw new Error("useConnection must be used within a ConnectionProvider")
  }
  return context
}
