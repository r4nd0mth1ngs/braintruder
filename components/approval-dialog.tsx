"use client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Shield } from "lucide-react"
import { usePentest } from "@/contexts/pentest-context"

export default function ApprovalDialog() {
  const { pendingApproval, approveAction, denyAction } = usePentest()

  const handleApprove = () => {
    if (pendingApproval) {
      approveAction(pendingApproval.id)
    }
  }

  const handleDeny = () => {
    if (pendingApproval) {
      denyAction(pendingApproval.id)
    }
  }

  return (
    <Dialog open={!!pendingApproval} onOpenChange={(open) => !open && handleDeny()}>
      <DialogContent className="glass-ultra dark:glass-ultra-dark border-0 shadow-sleek-xl rounded-3xl max-w-2xl">
        <DialogHeader className="text-center pb-6">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-6">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            Action Approval Required
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400 text-lg">
            The AI is requesting permission to perform a potentially risky action that requires your approval.
          </DialogDescription>
        </DialogHeader>

        {pendingApproval && (
          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 dark:text-white text-lg">Proposed Action:</h4>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                <p className="text-emerald-600 dark:text-emerald-400 font-mono text-sm leading-relaxed">
                  {pendingApproval.action}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 dark:text-white text-lg">Risk Assessment:</h4>
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 p-4 rounded-2xl">
                <p className="text-amber-700 dark:text-amber-400 leading-relaxed">{pendingApproval.risk}</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30 p-4 rounded-2xl">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-700 dark:text-blue-400 font-semibold">Security Notice</p>
                  <p className="text-blue-600 dark:text-blue-300 text-sm mt-1 leading-relaxed">
                    You have full control over all actions. The AI will only proceed with your explicit approval.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-4 pt-6">
          <Button
            variant="outline"
            onClick={handleDeny}
            className="flex-1 h-12 rounded-2xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-semibold transition-sleek"
          >
            Deny Action
          </Button>
          <Button
            onClick={handleApprove}
            className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-sleek hover:shadow-sleek-lg transition-sleek"
          >
            Approve & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
