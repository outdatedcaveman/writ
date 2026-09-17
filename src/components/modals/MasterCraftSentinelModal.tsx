import React, { useState } from "react";
import {
  MasterCraftReport,
  MasterCraftDiagnosis,
  SentinelSettings
} from "../../engine/analysis/masterCraftSentinel";
import {
  ShieldAlert,
  Sparkles,
  Clock,
  Volume2,
  VolumeX,
  Bell,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  Activity,
  X,
  Compass,
  Bookmark,
  GitCommit
} from "lucide-react";

interface MasterCraftSentinelModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MasterCraftReport;
  settings: SentinelSettings;
  onUpdateSettings: (settings: SentinelSettings) => void;
  onFocusSection: (segmentId: string) => void;
  onTriggerTestNudge?: () => void;
}

export const MasterCraftSentinelModal: React.FC<MasterCraftSentinelModalProps> = ({
  isOpen,
  onClose,
  report,
  settings,
  onUpdateSettings,
  onFocusSection,
  onTriggerTestNudge
}) => {
  if (!isOpen) return null;

  const [selectedSchool, setSelectedSchool] = useState<string>("all");

  const filteredDiagnoses =
    selectedSchool === "all"
      ? report.diagnoses
      : report.diagnoses.filter(d => d.school === selectedSchool);

  const getSchoolColor = (school: string) => {
    switch (school) {
      case "mcphee":
        return { border: "#C8A051", bg: "rgba(200, 160, 81, 0.15)", text: "#C8A051" };
      case "gilligan":
        return { border: "#BF614B", bg: "rgba(191, 97, 75, 0.15)", text: "#BF614B" };
      case "nabokov":
        return { border: "#7E9F86", bg: "rgba(126, 159, 134, 0.15)", text: "#7E9F86" };
      case "nolan":
        return { border: "#6B8FA3", bg: "rgba(107, 143, 163, 0.15)", text: "#6B8FA3" };
      default:
        return { border: "#A09A8F", bg: "rgba(160, 154, 143, 0.15)", text: "#A09A8F" };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#0e0e11] border border-[#222228] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#202024] bg-[#121216] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C8A051]/15 border border-[#C8A051]/30 flex items-center justify-center text-[#C8A051]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#ECE7DE]">
                  Master Craft Sentinel & Load-Bearing Nudge Engine
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c1c22] text-[#C8A051] border border-[#2a2a34]">
                  McPhee · Gilligan · Nabokov · Nolan
                </span>
              </div>
              <p className="text-xs text-[#8E8E93]">
                Continuous structural diagnostics, keystone integrity, and proactive interval writing alerts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#ECE7DE] hover:bg-[#1c1c20] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Status Banner: Overall Integrity & Proactive Interval Nudge Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Integrity Score */}
            <div className="p-4 rounded-xl bg-[#141418] border border-[#24242c] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E8E93] block">
                  Structural Integrity
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold font-serif text-[#ECE7DE]">
                    {report.overallIntegrityScore}
                  </span>
                  <span className="text-xs text-[#71717A]">/ 100</span>
                </div>
                <span className="text-[11px] text-[#A09A8F] mt-1 block">
                  {report.criticalDeficitsCount > 0
                    ? `${report.criticalDeficitsCount} keystone section(s) need immediate development`
                    : "All keystone sections structurally balanced"}
                </span>
              </div>

              <div className="w-14 h-14 rounded-full border-4 border-[#24242c] flex items-center justify-center relative">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs"
                  style={{
                    backgroundColor:
                      report.overallIntegrityScore >= 80
                        ? "rgba(126, 159, 134, 0.2)"
                        : "rgba(200, 160, 81, 0.2)",
                    color: report.overallIntegrityScore >= 80 ? "#7E9F86" : "#C8A051"
                  }}
                >
                  {report.overallIntegrityScore}%
                </div>
              </div>
            </div>

            {/* Proactive Interval Nudge Configuration */}
            <div className="md:col-span-2 p-4 rounded-xl bg-[#141418] border border-[#24242c] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#C8A051] flex items-center gap-1.5 font-semibold">
                  <Bell className="w-3.5 h-3.5" />
                  Proactive Author Nudge Interval Alarms
                </span>
                <label className="flex items-center gap-2 text-xs text-[#A09A8F] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={e => onUpdateSettings({ ...settings, enabled: e.target.checked })}
                    className="accent-[#C8A051] rounded"
                  />
                  <span>Alarm Active</span>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 bg-[#0c0c0e] p-1 rounded-lg border border-[#1e1e24] text-xs">
                  {[15, 30, 45, 60].map(mins => (
                    <button
                      key={mins}
                      onClick={() => onUpdateSettings({ ...settings, intervalMinutes: mins })}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        settings.intervalMinutes === mins
                          ? "bg-[#25252c] text-[#ECE7DE] shadow"
                          : "text-[#71717A] hover:text-[#ECE7DE]"
                      }`}
                    >
                      Every {mins}m
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateSettings({ ...settings, soundChime: !settings.soundChime })}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition-colors ${
                      settings.soundChime
                        ? "bg-[#7E9F86]/15 border-[#7E9F86]/40 text-[#7E9F86]"
                        : "bg-[#18181c] border-[#26262e] text-[#71717A]"
                    }`}
                    title="Audio chime alert on nudge"
                  >
                    {settings.soundChime ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>Chime {settings.soundChime ? "On" : "Off"}</span>
                  </button>

                  {onTriggerTestNudge && (
                    <button
                      onClick={onTriggerTestNudge}
                      className="px-2.5 py-1 rounded-lg bg-[#1e1e24] hover:bg-[#282830] border border-[#2c2c36] text-[#A09A8F] hover:text-[#ECE7DE] text-xs cursor-pointer transition-colors"
                      title="Test firing the gentle nudge alarm notification"
                    >
                      Test Alert
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* The Four Masters Cards */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#8E8E93] block px-1">
              The Four Masters Analytical Framework
            </span>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {Object.entries(report.schoolSummaries).map(([schoolKey, s]) => {
                const colors = getSchoolColor(schoolKey);
                const isSelected = selectedSchool === schoolKey;

                return (
                  <div
                    key={schoolKey}
                    onClick={() => setSelectedSchool(selectedSchool === schoolKey ? "all" : schoolKey)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#17171d] border-[#C8A051] shadow-lg ring-1 ring-[#C8A051]/40"
                        : "bg-[#121215] border-[#222226] hover:border-[#35353c] hover:bg-[#15151a]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border"
                          style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.bg }}
                        >
                          {s.masterName}
                        </span>
                        <span className="text-[10px] font-mono text-[#71717A]">{s.score}%</span>
                      </div>
                      <h4 className="font-serif text-xs font-medium text-[#ECE7DE] mt-1.5">
                        {s.title}
                      </h4>
                      <p className="text-[11px] text-[#8E8E93] mt-1 line-clamp-2 leading-relaxed">
                        {s.craftFocus}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#1c1c22] flex items-center justify-between text-[10px]">
                      <span className="text-[#66625B]">Diagnosis</span>
                      <span
                        className={`font-mono font-medium uppercase ${
                          s.status === "critical_gap"
                            ? "text-[#BF614B]"
                            : s.status === "attention_needed"
                            ? "text-[#C8A051]"
                            : "text-[#7E9F86]"
                        }`}
                      >
                        {s.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Urgent Load-Bearing Deficits List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#C8A051] flex items-center gap-1.5 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5" />
                Load-Bearing Chapter Deficits ({filteredDiagnoses.length})
              </span>
              {selectedSchool !== "all" && (
                <button
                  onClick={() => setSelectedSchool("all")}
                  className="text-xs text-[#71717A] hover:text-[#ECE7DE] cursor-pointer"
                >
                  Show All Masters
                </button>
              )}
            </div>

            {filteredDiagnoses.length > 0 ? (
              <div className="space-y-3">
                {filteredDiagnoses.map(diag => {
                  const colors = getSchoolColor(diag.school);

                  return (
                    <div
                      key={diag.id}
                      className="p-4 rounded-xl bg-[#131317] border border-[#24242e] hover:border-[#353540] transition-colors space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[9px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded border"
                            style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.bg }}
                          >
                            {diag.schoolLabel}
                          </span>
                          <span className="font-serif text-xs font-semibold text-[#ECE7DE]">
                            Section {diag.segmentRoman} · {diag.segmentTitle}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-[#8E8E93]">
                            Load-Bearing: <strong className="text-[#C8A051]">{diag.loadBearingScore}%</strong>
                          </span>
                          <span>·</span>
                          <span className="text-[#8E8E93]">
                            Development: <strong className="text-[#A09A8F]">{diag.developmentScore}%</strong>
                          </span>
                          <span>·</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#BF614B]/20 text-[#BF614B] font-bold">
                            Deficit {diag.deficitScore}
                          </span>
                        </div>
                      </div>

                      {/* Headline & Principle */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-[#ECE7DE]">{diag.headline}</h4>
                        <p className="text-[11px] text-[#8E8E93] italic leading-relaxed">
                          {diag.principle}
                        </p>
                      </div>

                      {/* Recommendation & Action */}
                      <div className="p-3 rounded-lg bg-[#0c0c0e] border border-[#1e1e24] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="text-xs text-[#A09A8F] leading-relaxed pr-2">
                          {diag.recommendation}
                        </div>

                        <button
                          onClick={() => {
                            onFocusSection(diag.segmentId);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#ECE7DE] hover:bg-white text-[#0A0A0C] font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow"
                          title="Jump directly into manuscript editor for this section"
                        >
                          <span>Focus & Fill This Section</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-[#131317] border border-[#24242e] text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#7E9F86] mx-auto" />
                <h4 className="text-xs font-medium text-[#ECE7DE]">Structural Arch Aligned</h4>
                <p className="text-[11px] text-[#8E8E93] max-w-md mx-auto leading-relaxed">
                  All key turning points, evidentiary anchors, and thematic threads are currently supported by adequate manuscript development.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#202024] bg-[#121216] flex items-center justify-between text-xs text-[#8E8E93]">
          <span className="font-mono text-[11px]">
            Active Master Craft Sentinel · Evaluating {report.totalKeystones} structural keystone chapters
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1e1e24] hover:bg-[#282830] text-[#ECE7DE] font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
