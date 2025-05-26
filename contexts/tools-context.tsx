"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface ToolParameter {
  name: string
  description: string
  type: "string" | "number" | "boolean"
  default: string | number | boolean
  value: string | number | boolean
}

export interface PentestTool {
  id: string
  name: string
  description: string
  category: "reconnaissance" | "scanning" | "vulnerability" | "exploitation" | "post-exploitation" | "web"
  command: string
  parameters: ToolParameter[]
  enabled: boolean
  risky: boolean
}

interface ToolsContextType {
  tools: PentestTool[]
  selectedTools: string[]
  headlessMode: boolean
  toggleHeadlessMode: () => void
  toggleTool: (id: string) => void
  updateToolParameter: (toolId: string, paramName: string, value: string | number | boolean) => void
  getToolsByCategory: (category: string) => PentestTool[]
  resetTools: () => void
}

const ToolsContext = createContext<ToolsContextType | undefined>(undefined)

// Define the default tools available in the platform
const defaultTools: PentestTool[] = [
  // Reconnaissance Tools
  {
    id: "nmap-basic",
    name: "Nmap (Basic)",
    description: "Basic port scanning and service detection",
    category: "reconnaissance",
    command: "nmap -sV [TARGET]",
    parameters: [
      {
        name: "ports",
        description: "Port range to scan",
        type: "string",
        default: "1-1000",
        value: "1-1000",
      },
    ],
    enabled: true,
    risky: false,
  },
  {
    id: "nmap-full",
    name: "Nmap (Full)",
    description: "Comprehensive port scanning and service detection",
    category: "reconnaissance",
    command: "nmap -sV -p- --min-rate 1000 [TARGET]",
    parameters: [
      {
        name: "rate",
        description: "Packet rate",
        type: "number",
        default: 1000,
        value: 1000,
      },
    ],
    enabled: false,
    risky: true,
  },
  {
    id: "whois",
    name: "WHOIS",
    description: "Domain registration information lookup",
    category: "reconnaissance",
    command: "whois [TARGET]",
    parameters: [],
    enabled: true,
    risky: false,
  },
  {
    id: "dig",
    name: "DNS Lookup",
    description: "DNS record lookup",
    category: "reconnaissance",
    command: "dig [TARGET]",
    parameters: [
      {
        name: "record",
        description: "DNS record type",
        type: "string",
        default: "ANY",
        value: "ANY",
      },
    ],
    enabled: true,
    risky: false,
  },

  // Scanning Tools
  {
    id: "nikto",
    name: "Nikto",
    description: "Web server scanner",
    category: "scanning",
    command: "nikto -h [TARGET]",
    parameters: [
      {
        name: "ssl",
        description: "Use SSL",
        type: "boolean",
        default: false,
        value: false,
      },
    ],
    enabled: true,
    risky: false,
  },
  {
    id: "dirb",
    name: "Dirb",
    description: "Web content scanner",
    category: "scanning",
    command: "dirb http://[TARGET]",
    parameters: [
      {
        name: "wordlist",
        description: "Wordlist to use",
        type: "string",
        default: "common.txt",
        value: "common.txt",
      },
    ],
    enabled: false,
    risky: false,
  },
  {
    id: "wpscan",
    name: "WPScan",
    description: "WordPress vulnerability scanner",
    category: "scanning",
    command: "wpscan --url http://[TARGET]",
    parameters: [
      {
        name: "enumerate",
        description: "Enumeration options",
        type: "string",
        default: "vp,u",
        value: "vp,u",
      },
    ],
    enabled: false,
    risky: false,
  },

  // Vulnerability Assessment
  {
    id: "nessus",
    name: "Nessus (Simulated)",
    description: "Vulnerability scanner",
    category: "vulnerability",
    command: "nessus_scan [TARGET]",
    parameters: [
      {
        name: "policy",
        description: "Scan policy",
        type: "string",
        default: "basic",
        value: "basic",
      },
    ],
    enabled: false,
    risky: true,
  },
  {
    id: "openvas",
    name: "OpenVAS",
    description: "Open vulnerability assessment system",
    category: "vulnerability",
    command: "openvas_scan [TARGET]",
    parameters: [],
    enabled: false,
    risky: true,
  },

  // Web Application Testing
  {
    id: "sqlmap",
    name: "SQLMap",
    description: "SQL injection detection and exploitation",
    category: "web",
    command: "sqlmap -u http://[TARGET]",
    parameters: [
      {
        name: "risk",
        description: "Risk level (1-3)",
        type: "number",
        default: 1,
        value: 1,
      },
      {
        name: "level",
        description: "Level of tests (1-5)",
        type: "number",
        default: 1,
        value: 1,
      },
    ],
    enabled: false,
    risky: true,
  },
  {
    id: "xsser",
    name: "XSSer",
    description: "Cross-site scripting detection",
    category: "web",
    command: "xsser --url http://[TARGET]",
    parameters: [],
    enabled: false,
    risky: true,
  },
  {
    id: "owasp-zap",
    name: "OWASP ZAP",
    description: "Web application security scanner",
    category: "web",
    command: "zap-cli quick-scan --self-contained --start-options '-config api.disablekey=true' http://[TARGET]",
    parameters: [],
    enabled: false,
    risky: true,
  },

  // Exploitation
  {
    id: "metasploit",
    name: "Metasploit",
    description: "Exploitation framework",
    category: "exploitation",
    command: "msfconsole -q -x 'use auxiliary/scanner/[MODULE]; set RHOSTS [TARGET]; run; exit'",
    parameters: [
      {
        name: "module",
        description: "Metasploit module",
        type: "string",
        default: "smb/smb_version",
        value: "smb/smb_version",
      },
    ],
    enabled: false,
    risky: true,
  },

  // Post-Exploitation
  {
    id: "linpeas",
    name: "LinPEAS",
    description: "Linux privilege escalation assistant",
    category: "post-exploitation",
    command: "linpeas.sh",
    parameters: [],
    enabled: false,
    risky: true,
  },
  {
    id: "winpeas",
    name: "WinPEAS",
    description: "Windows privilege escalation assistant",
    category: "post-exploitation",
    command: "winpeas.exe",
    parameters: [],
    enabled: false,
    risky: true,
  },
]

export function ToolsProvider({ children }: { children: ReactNode }) {
  const [tools, setTools] = useState<PentestTool[]>(defaultTools)
  const [headlessMode, setHeadlessMode] = useState(false)

  const selectedTools = tools.filter((tool) => tool.enabled).map((tool) => tool.id)

  const toggleHeadlessMode = () => {
    setHeadlessMode((prev) => !prev)
  }

  const toggleTool = (id: string) => {
    setTools((prevTools) => prevTools.map((tool) => (tool.id === id ? { ...tool, enabled: !tool.enabled } : tool)))
  }

  const updateToolParameter = (toolId: string, paramName: string, value: string | number | boolean) => {
    setTools((prevTools) =>
      prevTools.map((tool) =>
        tool.id === toolId
          ? {
              ...tool,
              parameters: tool.parameters.map((param) => (param.name === paramName ? { ...param, value } : param)),
            }
          : tool,
      ),
    )
  }

  const getToolsByCategory = (category: string) => {
    return tools.filter((tool) => tool.category === category)
  }

  const resetTools = () => {
    setTools(defaultTools)
    setHeadlessMode(false)
  }

  return (
    <ToolsContext.Provider
      value={{
        tools,
        selectedTools,
        headlessMode,
        toggleHeadlessMode,
        toggleTool,
        updateToolParameter,
        getToolsByCategory,
        resetTools,
      }}
    >
      {children}
    </ToolsContext.Provider>
  )
}

export function useTools() {
  const context = useContext(ToolsContext)
  if (context === undefined) {
    throw new Error("useTools must be used within a ToolsProvider")
  }
  return context
}
