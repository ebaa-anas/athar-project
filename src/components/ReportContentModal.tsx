import { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { useUserProfile } from "../hooks/useUserProfile";
import { REPORT_REASONS, buildReportPayload, type ReportTarget } from "../lib/reportContent";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Flag, X, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";

interface ReportContentModalProps {
  open: boolean;
  onClose: () => void;
  /** What is being reported. Null while nothing is selected. */
  target: ReportTarget | null;
}

type Phase = "form" | "submitting" | "done" | "duplicate";

export function ReportContentModal({ open, onClose, target }: ReportContentModalProps) {
  const { user } = useUserProfile();
  const [reason, setReason] = useState<string>("");
  const [detail, setDetail] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);

  // Reset every time the modal is opened for a (possibly different) target.
  useEffect(() => {
    if (open) {
      setReason("");
      setDetail("");
      setPhase("form");
      setError(null);
    }
  }, [open, target?.targetId]);

  if (!open || !target) return null;

  const submit = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setError("Your session has expired. Please sign in again.");
      return;
    }
    if (!reason) {
      setError("Pick a reason so the moderation team knows what to look at.");
      return;
    }

    setError(null);
    setPhase("submitting");
    try {
      // One pending report per person per item — don't let the queue fill with
      // duplicates from the same volunteer.
      const dupe = await getDocs(
        query(
          collection(db, "reports"),
          where("targetId", "==", target.targetId),
          where("reportedById", "==", uid),
          where("status", "==", "pending")
        )
      );
      if (!dupe.empty) {
        setPhase("duplicate");
        return;
      }

      await addDoc(collection(db, "reports"), {
        ...buildReportPayload(target, { uid, name: user?.name || "" }, reason, detail),
        reportDate: serverTimestamp(),
      });
      setPhase("done");
    } catch (e: any) {
      console.error("Failed to submit report:", e);
      setError("Could not send the report. Check your connection and try again.");
      setPhase("form");
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-start gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              <Flag className="h-4 w-4 text-red-400" /> Report content
            </h3>
            <p className="text-slate-300 text-xs font-medium mt-1 truncate">
              {target.targetType === "opportunity" ? "Opportunity" : "Organization"}: {target.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {phase === "done" ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-slate-900">Report sent</h4>
            <p className="text-sm text-slate-500">
              Thanks — the moderation team will review this. You won't be identified to the organization.
            </p>
            <Button onClick={onClose} className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold mt-2">
              Done
            </Button>
          </div>
        ) : phase === "duplicate" ? (
          <div className="p-8 text-center space-y-3">
            <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto" />
            <h4 className="font-bold text-slate-900">Already reported</h4>
            <p className="text-sm text-slate-500">
              You've already reported this and it's still under review. No need to send it again.
            </p>
            <Button onClick={onClose} className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold mt-2">
              Close
            </Button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">What's wrong with it?</p>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors text-sm font-medium ${
                      reason === r
                        ? "border-slate-900 bg-slate-50 text-slate-900"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="accent-slate-900"
                    />
                    {r}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                Anything else? <span className="font-medium normal-case tracking-normal text-slate-400">(optional)</span>
              </p>
              <Textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Add any detail that would help the moderation team."
                className="min-h-[80px] rounded-xl border-slate-200 text-sm"
                maxLength={500}
              />
            </div>

            {error && (
              <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                variant="ghost"
                onClick={onClose}
                className="flex-1 h-11 font-bold text-slate-500 uppercase text-xs tracking-widest"
              >
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={phase === "submitting"}
                className="flex-[2] h-11 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-xs tracking-widest rounded-xl flex items-center justify-center gap-2"
              >
                {phase === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                {phase === "submitting" ? "Sending..." : "Submit report"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
