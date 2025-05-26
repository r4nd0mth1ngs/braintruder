"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { usePentest, type Finding, type ConsoleEntry, type Alert } from "@/contexts/pentest-context"
import { useTools } from "@/contexts/tools-context"
import { useConnection } from "@/contexts/connection-context"
import { useToast } from "@/hooks/use-toast"

export interface ReportSection {
  title: string
  content: string
}

export interface Report {
  id: string
  target: string
  timestamp: string
  duration: number // in seconds
  executiveSummary: string
  findings: Finding[]
  consoleEntries: ConsoleEntry[]
  alerts: Alert[]
  selectedTools: string[]
  aiSummary: string
  vulnerabilitySummary: ReportSection[]
  recommendations: ReportSection[]
  isGenerating: boolean
}

interface ReportContextType {
  reports: Report[]
  currentReport: Report | null
  isGeneratingReport: boolean
  generateReport: () => Promise<void>
  exportReportAsPDF: (reportId: string) => Promise<void>
  exportReportAsText: (reportId: string) => Promise<void>
  viewReport: (reportId: string) => void
  deleteReport: (reportId: string) => void
}

const ReportContext = createContext<ReportContextType | undefined>(undefined)

export function ReportProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>([])
  const [currentReport, setCurrentReport] = useState<Report | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const { target, consoleEntries, findings, alerts, isRunning } = usePentest()
  const { tools } = useTools()
  const { config: connectionConfig } = useConnection()
  const { toast } = useToast()

  // Generate a new report with AI summary
  const generateReport = async () => {
    if (isRunning) {
      toast({
        title: "Pentest in progress",
        description: "Please wait for the pentest to complete before generating a report",
        variant: "destructive",
      })
      return
    }

    if (findings.length === 0 && consoleEntries.length === 0) {
      toast({
        title: "No data to report",
        description: "Run a pentest first to generate findings",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingReport(true)

    try {
      // Create a new report ID
      const reportId = `report-${Date.now()}`

      // Get selected tools
      const selectedToolIds = tools.filter((tool) => tool.enabled).map((tool) => tool.id)

      // Calculate duration from console entries
      const startTime = consoleEntries.length > 0 ? new Date(consoleEntries[0].timestamp).getTime() : Date.now()
      const endTime =
        consoleEntries.length > 0 ? new Date(consoleEntries[consoleEntries.length - 1].timestamp).getTime() : Date.now()
      const duration = Math.floor((endTime - startTime) / 1000)

      // Prepare data for AI summary
      const aiSummaryData = {
        target,
        findings,
        connectionMethod: connectionConfig.method,
        selectedTools: selectedToolIds,
        consoleEntries: consoleEntries.map((entry) => ({
          type: entry.type,
          content: entry.content,
        })),
      }

      // Generate AI summary
      const aiSummary = await generateAISummary(aiSummaryData)

      // Generate vulnerability sections
      const vulnerabilitySummary = generateVulnerabilitySections(findings)

      // Generate recommendations
      const recommendations = generateRecommendations(findings)

      // Create the report
      const newReport: Report = {
        id: reportId,
        target,
        timestamp: new Date().toISOString(),
        duration,
        executiveSummary: aiSummary.executiveSummary,
        findings,
        consoleEntries,
        alerts,
        selectedTools: selectedToolIds,
        aiSummary: aiSummary.fullSummary,
        vulnerabilitySummary,
        recommendations,
        isGenerating: false,
      }

      // Add the report to the list
      setReports((prev) => [...prev, newReport])
      setCurrentReport(newReport)

      toast({
        title: "Report generated",
        description: "Your pentest report has been successfully generated",
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Report generation failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // Generate AI summary of findings
  const generateAISummary = async (data: any) => {
    // In a real implementation, this would call an AI API like OpenAI
    // For this demo, we'll simulate an AI response

    await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API call

    // Count findings by severity
    const severityCounts = data.findings.reduce((acc: Record<string, number>, finding: Finding) => {
      acc[finding.severity] = (acc[finding.severity] || 0) + 1
      return acc
    }, {})

    // Generate executive summary
    const executiveSummary = `
      Security assessment of ${data.target} revealed ${data.findings.length} security findings. 
      ${severityCounts.Critical ? `${severityCounts.Critical} critical, ` : ""}
      ${severityCounts.High ? `${severityCounts.High} high, ` : ""}
      ${severityCounts.Medium ? `${severityCounts.Medium} medium, ` : ""}
      ${severityCounts.Low ? `${severityCounts.Low} low ` : ""}
      severity issues were identified. Immediate remediation is recommended for all critical and high severity findings.
    `
      .trim()
      .replace(/\s+/g, " ")

    // Generate full summary
    const fullSummary = `
      # Security Assessment Summary

      ## Overview
      A comprehensive security assessment was conducted on ${data.target} using automated tools and AI-guided analysis.
      The assessment utilized ${data.selectedTools.length} specialized security tools via ${data.connectionMethod} connection.
      
      ## Key Findings
      The assessment identified a total of ${data.findings.length} security findings:
      ${severityCounts.Critical ? `- Critical: ${severityCounts.Critical}\n` : ""}
      ${severityCounts.High ? `- High: ${severityCounts.High}\n` : ""}
      ${severityCounts.Medium ? `- Medium: ${severityCounts.Medium}\n` : ""}
      ${severityCounts.Low ? `- Low: ${severityCounts.Low}\n` : ""}
      
      ## Risk Assessment
      ${
        severityCounts.Critical || severityCounts.High
          ? "The target system has significant security vulnerabilities that require immediate attention."
          : severityCounts.Medium
            ? "The target system has moderate security issues that should be addressed in a timely manner."
            : "The target system has minor security concerns that should be addressed as part of routine maintenance."
      }
      
      ## Recommendation Summary
      ${severityCounts.Critical ? "- Critical vulnerabilities should be patched immediately\n" : ""}
      ${severityCounts.High ? "- High severity issues should be remediated within 30 days\n" : ""}
      ${severityCounts.Medium ? "- Medium severity issues should be addressed within 90 days\n" : ""}
      ${
        severityCounts.Low
          ? "- Low severity issues should be reviewed and addressed according to organizational policies\n"
          : ""
      }
      
      A detailed breakdown of each finding and specific remediation steps are provided in the following sections.
    `.trim()

    return {
      executiveSummary,
      fullSummary,
    }
  }

  // Generate vulnerability sections based on findings
  const generateVulnerabilitySections = (findings: Finding[]): ReportSection[] => {
    // Group findings by severity
    const findingsBySeverity: Record<string, Finding[]> = {}

    findings.forEach((finding) => {
      if (!findingsBySeverity[finding.severity]) {
        findingsBySeverity[finding.severity] = []
      }
      findingsBySeverity[finding.severity].push(finding)
    })

    // Create sections for each severity level
    const sections: ReportSection[] = []

    // Order: Critical, High, Medium, Low
    const severityOrder = ["Critical", "High", "Medium", "Low"]

    severityOrder.forEach((severity) => {
      if (findingsBySeverity[severity] && findingsBySeverity[severity].length > 0) {
        const content = findingsBySeverity[severity]
          .map(
            (finding) => `
            ### ${finding.title}
            
            **Description:** ${finding.description}
            
            **Timestamp:** ${new Date(finding.timestamp).toLocaleString()}
          `,
          )
          .join("\n\n")

        sections.push({
          title: `${severity} Severity Findings`,
          content,
        })
      }
    })

    return sections
  }

  // Generate recommendations based on findings
  const generateRecommendations = (findings: Finding[]): ReportSection[] => {
    // In a real implementation, this would be more sophisticated and possibly AI-generated
    // For this demo, we'll create generic recommendations based on finding types

    const recommendations: Record<string, string> = {
      "SQL Injection":
        "Implement prepared statements or parameterized queries. Use an ORM or database abstraction layer. Apply input validation and sanitization.",
      XSS: "Implement Content Security Policy (CSP). Use context-specific output encoding. Sanitize user input. Use modern frameworks that automatically escape output.",
      CSRF: "Implement anti-CSRF tokens. Use SameSite cookie attribute. Verify Origin and Referer headers.",
      "Insecure Cookie":
        "Set the HttpOnly, Secure, and SameSite attributes on cookies. Use proper cookie scoping with Domain and Path attributes.",
      Authentication:
        "Implement multi-factor authentication. Use secure password storage with strong hashing algorithms. Implement account lockout policies.",
      Authorization:
        "Implement proper access control checks. Use principle of least privilege. Implement role-based access control (RBAC).",
    }

    // Extract recommendation categories from findings
    const recommendationCategories = new Set<string>()

    findings.forEach((finding) => {
      Object.keys(recommendations).forEach((category) => {
        if (finding.title.toLowerCase().includes(category.toLowerCase())) {
          recommendationCategories.add(category)
        }
      })
    })

    // Create recommendation sections
    const sections: ReportSection[] = []

    recommendationCategories.forEach((category) => {
      sections.push({
        title: `${category} Remediation`,
        content: recommendations[category],
      })
    })

    // Add general recommendations if we have findings
    if (findings.length > 0) {
      sections.push({
        title: "General Security Recommendations",
        content: `
          - Keep all systems and software up to date with security patches
          - Implement a security awareness training program
          - Conduct regular security assessments and penetration tests
          - Develop and maintain a security incident response plan
          - Implement defense-in-depth security controls
        `,
      })
    }

    return sections
  }

  // Export report as PDF
  const exportReportAsPDF = async (reportId: string) => {
    const report = reports.find((r) => r.id === reportId)
    if (!report) {
      toast({
        title: "Report not found",
        description: "The requested report could not be found",
        variant: "destructive",
      })
      return
    }

    try {
      toast({
        title: "Generating PDF",
        description: "Your report is being prepared for download",
      })

      // In a real implementation, this would use a library like jsPDF or call a backend API
      // For this demo, we'll simulate PDF generation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate download by creating a text file
      const content = generateReportContent(report)
      const blob = new Blob([content], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `pentest-report-${report.target}-${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "PDF exported",
        description: "Your report has been downloaded as a PDF",
      })
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast({
        title: "PDF export failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    }
  }

  // Export report as text
  const exportReportAsText = async (reportId: string) => {
    const report = reports.find((r) => r.id === reportId)
    if (!report) {
      toast({
        title: "Report not found",
        description: "The requested report could not be found",
        variant: "destructive",
      })
      return
    }

    try {
      // Generate report content
      const content = generateReportContent(report)

      // Create and download text file
      const blob = new Blob([content], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `pentest-report-${report.target}-${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Text report exported",
        description: "Your report has been downloaded as a text file",
      })
    } catch (error) {
      console.error("Error exporting text report:", error)
      toast({
        title: "Text export failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    }
  }

  // Generate report content
  const generateReportContent = (report: Report): string => {
    const toolNames = report.selectedTools
      .map((toolId) => {
        const tool = tools.find((t) => t.id === toolId)
        return tool ? tool.name : toolId
      })
      .join(", ")

    const content = `
=======================================================================
                    AI PENTEST PLATFORM SECURITY REPORT
=======================================================================

REPORT GENERATED: ${new Date(report.timestamp).toLocaleString()}
TARGET: ${report.target}
DURATION: ${formatDuration(report.duration)}
TOOLS USED: ${toolNames}

-----------------------------------------------------------------------
                        EXECUTIVE SUMMARY
-----------------------------------------------------------------------

${report.executiveSummary}

-----------------------------------------------------------------------
                        AI ANALYSIS
-----------------------------------------------------------------------

${report.aiSummary}

-----------------------------------------------------------------------
                        FINDINGS SUMMARY
-----------------------------------------------------------------------

${report.findings.length === 0 ? "No security findings were identified." : ""}

${report.vulnerabilitySummary
  .map(
    (section) => `
-----------------------------------------------------------------------
                        ${section.title.toUpperCase()}
-----------------------------------------------------------------------

${section.content}
`,
  )
  .join("\n")}

-----------------------------------------------------------------------
                        RECOMMENDATIONS
-----------------------------------------------------------------------

${report.recommendations
  .map(
    (section) => `
${section.title}:
${section.content}
`,
  )
  .join("\n\n")}

-----------------------------------------------------------------------
                        CONSOLE LOG
-----------------------------------------------------------------------

${report.consoleEntries
  .map((entry) => `[${new Date(entry.timestamp).toLocaleString()}] [${entry.type.toUpperCase()}] ${entry.content}`)
  .join("\n")}

-----------------------------------------------------------------------
                        END OF REPORT
-----------------------------------------------------------------------
`

    return content
  }

  // Format duration in seconds to human-readable format
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    const parts = []
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`)
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`)
    if (remainingSeconds > 0 || parts.length === 0)
      parts.push(`${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`)

    return parts.join(", ")
  }

  // View a specific report
  const viewReport = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId)
    if (report) {
      setCurrentReport(report)
    } else {
      toast({
        title: "Report not found",
        description: "The requested report could not be found",
        variant: "destructive",
      })
    }
  }

  // Delete a report
  const deleteReport = (reportId: string) => {
    setReports((prev) => prev.filter((r) => r.id !== reportId))
    if (currentReport?.id === reportId) {
      setCurrentReport(null)
    }
    toast({
      title: "Report deleted",
      description: "The report has been deleted",
    })
  }

  return (
    <ReportContext.Provider
      value={{
        reports,
        currentReport,
        isGeneratingReport,
        generateReport,
        exportReportAsPDF,
        exportReportAsText,
        viewReport,
        deleteReport,
      }}
    >
      {children}
    </ReportContext.Provider>
  )
}

export function useReport() {
  const context = useContext(ReportContext)
  if (context === undefined) {
    throw new Error("useReport must be used within a ReportProvider")
  }
  return context
}
