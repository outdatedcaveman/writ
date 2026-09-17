import { Segment, ProjectWiki, ThreadEntity, PlotPointEntity } from "../../types/workspace";

export type MasterCraftSchool = "mcphee" | "gilligan" | "nabokov" | "nolan";

export interface MasterCraftDiagnosis {
  id: string;
  school: MasterCraftSchool;
  schoolLabel: string;
  severity: "critical" | "warning" | "advisory" | "mastered";
  segmentId: string;
  segmentRoman: string;
  segmentTitle: string;
  loadBearingScore: number; // 0 - 100
  developmentScore: number; // 0 - 100
  deficitScore: number;     // 0 - 100 (high = urgent keystone gap)
  headline: string;
  principle: string;
  recommendation: string;
  suggestedPrompt: string;
}

export interface MasterCraftReport {
  overallIntegrityScore: number; // 0 - 100
  totalKeystones: number;
  criticalDeficitsCount: number;
  topPrioritySegmentId: string | null;
  topPriorityNudge: string | null;
  schoolSummaries: Record<
    MasterCraftSchool,
    {
      title: string;
      masterName: string;
      craftFocus: string;
      status: "aligned" | "attention_needed" | "critical_gap";
      score: number;
      keyInsight: string;
    }
  >;
  diagnoses: MasterCraftDiagnosis[];
}

export interface SentinelSettings {
  enabled: boolean;
  intervalMinutes: number; // 15, 30, 45, 60
  soundChime: boolean;
  focusModeOnly: boolean;
}

export const defaultSentinelSettings: SentinelSettings = {
  enabled: true,
  intervalMinutes: 30,
  soundChime: true,
  focusModeOnly: false
};

/**
 * The Master Craft Sentinel Engine
 * Synthesizes the structural non-fiction schemas of John McPhee,
 * the causal consequence integrity of Vince Gilligan,
 * the modular index-card motif mosaic of Vladimir Nabokov,
 * and the multi-timeline pacing cross-cutting of Christopher Nolan.
 */
export class MasterCraftSentinel {
  public static analyzeProject(params: {
    segments: Segment[];
    wiki?: ProjectWiki;
    threads: Record<string, ThreadEntity> | ThreadEntity[];
    plotPoints?: PlotPointEntity[];
  }): MasterCraftReport {
    const rawSegments = params.segments.filter(s => !s.isArchived).sort((a, b) => a.order - b.order);
    const threadsList: ThreadEntity[] = Array.isArray(params.threads)
      ? params.threads.filter(t => !t.isArchived)
      : Object.values(params.threads || {}).filter(t => !t.isArchived);
    const plotPointsList = (params.plotPoints || params.wiki?.plotPoints || []).filter(p => !p.isArchived);
    const argumentsList = (params.wiki?.arguments || []).filter(a => !a.isArchived);
    const charactersList = (params.wiki?.characters || []).filter(c => !c.isArchived);

    if (rawSegments.length === 0) {
      return this.emptyReport();
    }

    const diagnoses: MasterCraftDiagnosis[] = [];

    // Analyze each segment through the lens of all 4 masters
    rawSegments.forEach((seg, idx) => {
      const wordCount = (seg.textContent.match(/\b\w+\b/g) || []).length;
      const targetWordCount = 1800;
      const wordCompletionRatio = Math.min(1, wordCount / targetWordCount);
      const goalsCheckedRatio = seg.goals.length > 0 ? (seg.status === "done" ? 1 : 0.4) : 0.3;
      const developmentScore = Math.round((wordCompletionRatio * 0.7 + goalsCheckedRatio * 0.3) * 100);

      // 1. MCPHEE: Structural Non-Fiction & Keystone Cross-Section Weight
      // Segments carrying central thesis arguments or the critical "lead"
      const linkedArguments = argumentsList.filter(a => a.targetSegmentIds?.includes(seg.id));
      const isLeadSegment = idx === 0;
      const isSynthesisSegment = idx === rawSegments.length - 1;
      let mcpheeWeight = 30;
      if (isLeadSegment) mcpheeWeight += 40;
      if (isSynthesisSegment) mcpheeWeight += 35;
      mcpheeWeight += linkedArguments.length * 20;
      mcpheeWeight = Math.min(100, mcpheeWeight);

      if (mcpheeWeight >= 70 && developmentScore < 45) {
        diagnoses.push({
          id: `mcphee-${seg.id}`,
          school: "mcphee",
          schoolLabel: "John McPhee · Keystone Architecture",
          severity: "critical",
          segmentId: seg.id,
          segmentRoman: seg.romanNumeral,
          segmentTitle: seg.title,
          loadBearingScore: mcpheeWeight,
          developmentScore,
          deficitScore: Math.round(mcpheeWeight * (1 - developmentScore / 100)),
          headline: `Section ${seg.romanNumeral} is a Load-Bearing Keystone with Thin Evidence`,
          principle: "McPhee's Law: The structural arch cannot stand if the keystone chapter rests on assertion rather than deeply observed factual cross-sections.",
          recommendation: `This section anchors ${linkedArguments.length > 0 ? `${linkedArguments.length} core dialectical thesis argument(s)` : "the opening lead inquiry"}. Expand with primary citations, empirical evidence, and concrete narrative cross-sections.`,
          suggestedPrompt: `Draft 3 concrete observed scenes or empirical proofs anchoring the central thesis of Section ${seg.romanNumeral}: "${seg.title}".`
        });
      }

      // 2. GILLIGAN: Causal Consequence Integrity (Cause-and-Effect Ledger)
      // Plot beats where a decision forces an irreversible consequence
      const segPlotPoints = plotPointsList.filter(p => p.targetSegmentId === seg.id);
      const isTurningPoint = segPlotPoints.some(
        p => p.beatType === "catalyst" || p.beatType === "midpoint" || p.beatType === "climax" || p.beatType === "all_is_lost"
      );
      let gilliganWeight = 25;
      if (isTurningPoint) gilliganWeight += 50;
      if (segPlotPoints.length > 0) gilliganWeight += 20;
      gilliganWeight = Math.min(100, gilliganWeight);

      if (gilliganWeight >= 75 && developmentScore < 50) {
        const beatNames = segPlotPoints.map(p => p.title).join(", ") || "Critical turning beat";
        diagnoses.push({
          id: `gilligan-${seg.id}`,
          school: "gilligan",
          schoolLabel: "Vince Gilligan · Causal Consequence Ledger",
          severity: "critical",
          segmentId: seg.id,
          segmentRoman: seg.romanNumeral,
          segmentTitle: seg.title,
          loadBearingScore: gilliganWeight,
          developmentScore,
          deficitScore: Math.round(gilliganWeight * (1 - developmentScore / 100)),
          headline: `Section ${seg.romanNumeral} Hosts Turning Point (${beatNames}) Without Consequence Build-up`,
          principle: "Gilligan's Law: Every dramatic consequence must be earned through strict causality ('Because X happened, character Y is forced to Z'). No unearned revelations.",
          recommendation: `Develop the precise psychological pressure that forces the character to cross this threshold. The beat cannot happen accidentally; show the claustrophobic squeeze of prior choices.`,
          suggestedPrompt: `Map the 3 prior actions that make the turning point in Section ${seg.romanNumeral} completely inevitable and unavoidable.`
        });
      }

      // 3. NABOKOV: Thematic Motif & Index-Card Mosaic Continuity
      // Recurring threads, character presence, and color/symbolic resonance
      const treatedThreads = threadsList.filter(t => seg.treatedThreadIds?.includes(t.id));
      const appearingChars = charactersList.filter(
        c => seg.characterIds?.includes(c.id) || (seg.textContent && seg.textContent.toLowerCase().includes(c.name.toLowerCase()))
      );
      let nabokovWeight = Math.min(95, treatedThreads.length * 18 + appearingChars.length * 15);

      if (treatedThreads.length === 0 && rawSegments.length > 3 && idx > 0 && idx < rawSegments.length - 1) {
        diagnoses.push({
          id: `nabokov-gap-${seg.id}`,
          school: "nabokov",
          schoolLabel: "Vladimir Nabokov · Index-Card Motif Mosaic",
          severity: "warning",
          segmentId: seg.id,
          segmentRoman: seg.romanNumeral,
          segmentTitle: seg.title,
          loadBearingScore: 55,
          developmentScore,
          deficitScore: 40,
          headline: `Section ${seg.romanNumeral} is an Isolated Island in the Thematic Mosaic`,
          principle: "Nabokov's Law: A novel is a tapestry of patterned cards. A passage lacking recurring motifs or thread resonances is inert filler.",
          recommendation: `Weave at least one continuing narrative thread or recurring symbolic motif through this chapter to connect it with the broader tapestry.`,
          suggestedPrompt: `Identify a recurring sensory motif or thread from earlier chapters to plant into Section ${seg.romanNumeral}.`
        });
      }

      // 4. NOLAN: Multi-Timeline Temporal Pacing & Climax Cross-Cutting Rhythm
      // Ticking clock rhythm, act boundary alignment, dramatic acceleration
      const actIndex = Math.floor((idx / rawSegments.length) * 3);
      const isLateSecondAct = actIndex === 1 && idx >= Math.floor(rawSegments.length * 0.55);
      const isClimacticResolution = actIndex === 2 && idx === rawSegments.length - 2;
      let nolanWeight = 30;
      if (isLateSecondAct) nolanWeight += 40;
      if (isClimacticResolution) nolanWeight += 50;
      nolanWeight = Math.min(100, nolanWeight);

      if ((isLateSecondAct || isClimacticResolution) && wordCount < 600) {
        diagnoses.push({
          id: `nolan-pacing-${seg.id}`,
          school: "nolan",
          schoolLabel: "Christopher Nolan · Cross-Cut Pacing Rhythm",
          severity: "warning",
          segmentId: seg.id,
          segmentRoman: seg.romanNumeral,
          segmentTitle: seg.title,
          loadBearingScore: nolanWeight,
          developmentScore,
          deficitScore: Math.round(nolanWeight * (1 - developmentScore / 100)),
          headline: `Section ${seg.romanNumeral} Needs Temporal Pressure & Pacing Acceleration`,
          principle: "Nolan's Law: As storylines converge toward the climactic threshold, the cross-cutting tempo must accelerate and raise the stakes.",
          recommendation: `This chapter sits in a critical narrative pinch point. Tighten sentence length, shorten scene intervals, and introduce a ticking-clock constraint to quicken the reader's pulse.`,
          suggestedPrompt: `Rewrite the central tension in Section ${seg.romanNumeral} with immediate ticking-clock stakes.`
        });
      }
    });

    // Sort diagnoses by deficit urgency (highest deficit score first)
    diagnoses.sort((a, b) => b.deficitScore - a.deficitScore);

    const criticalCount = diagnoses.filter(d => d.severity === "critical").length;
    const topPriority = diagnoses[0] || null;

    // Overall integrity calculation
    const avgDeficit = diagnoses.length > 0
      ? diagnoses.reduce((acc, d) => acc + d.deficitScore, 0) / diagnoses.length
      : 0;
    const overallIntegrityScore = Math.max(25, Math.min(98, Math.round(100 - avgDeficit * 0.85)));

    // School Summaries
    const mcpheeDiags = diagnoses.filter(d => d.school === "mcphee");
    const gilliganDiags = diagnoses.filter(d => d.school === "gilligan");
    const nabokovDiags = diagnoses.filter(d => d.school === "nabokov");
    const nolanDiags = diagnoses.filter(d => d.school === "nolan");

    return {
      overallIntegrityScore,
      totalKeystones: diagnoses.filter(d => d.loadBearingScore >= 70).length,
      criticalDeficitsCount: criticalCount,
      topPrioritySegmentId: topPriority ? topPriority.segmentId : null,
      topPriorityNudge: topPriority ? topPriority.headline : null,
      schoolSummaries: {
        mcphee: {
          title: "Structural Keystone Integrity",
          masterName: "John McPhee",
          craftFocus: "Factual cross-sections, structural diagrams, and evidentiary anchors",
          status: mcpheeDiags.some(d => d.severity === "critical") ? "critical_gap" : mcpheeDiags.length > 0 ? "attention_needed" : "aligned",
          score: Math.max(30, 100 - mcpheeDiags.length * 20),
          keyInsight: mcpheeDiags[0]?.recommendation || "All lead inquiries and central thesis arguments rest on well-evidenced chapters."
        },
        gilligan: {
          title: "Causal Consequence Ledger",
          masterName: "Vince Gilligan",
          craftFocus: "Strict cause-and-effect integrity, character motivation, and earned consequences",
          status: gilliganDiags.some(d => d.severity === "critical") ? "critical_gap" : gilliganDiags.length > 0 ? "attention_needed" : "aligned",
          score: Math.max(30, 100 - gilliganDiags.length * 22),
          keyInsight: gilliganDiags[0]?.recommendation || "Turning points and character transformations are earned through strict causal consequences."
        },
        nabokov: {
          title: "Modular Index-Card Mosaic",
          masterName: "Vladimir Nabokov",
          craftFocus: "Recurring symbolic motifs, character presence, and non-linear card harmony",
          status: nabokovDiags.some(d => d.severity === "critical") ? "critical_gap" : nabokovDiags.length > 0 ? "attention_needed" : "aligned",
          score: Math.max(40, 100 - nabokovDiags.length * 15),
          keyInsight: nabokovDiags[0]?.recommendation || "Thematic threads and motifs are interwoven harmoniously across chapters."
        },
        nolan: {
          title: "Temporal Cross-Cut Rhythm",
          masterName: "Christopher Nolan",
          craftFocus: "Ticking-clock pacing, converge-accelerate cadence, and multi-thread rhythm",
          status: nolanDiags.some(d => d.severity === "critical") ? "critical_gap" : nolanDiags.length > 0 ? "attention_needed" : "aligned",
          score: Math.max(40, 100 - nolanDiags.length * 18),
          keyInsight: nolanDiags[0]?.recommendation || "Dramatic tension accelerates proportionally toward act boundaries and the climax."
        }
      },
      diagnoses
    };
  }

  public static emptyReport(): MasterCraftReport {
    return {
      overallIntegrityScore: 100,
      totalKeystones: 0,
      criticalDeficitsCount: 0,
      topPrioritySegmentId: null,
      topPriorityNudge: null,
      schoolSummaries: {
        mcphee: {
          title: "Structural Keystone Integrity",
          masterName: "John McPhee",
          craftFocus: "Factual cross-sections and thesis anchors",
          status: "aligned",
          score: 100,
          keyInsight: "Add manuscript chapters to activate McPhee keystone analysis."
        },
        gilligan: {
          title: "Causal Consequence Ledger",
          masterName: "Vince Gilligan",
          craftFocus: "Strict cause-and-effect integrity",
          status: "aligned",
          score: 100,
          keyInsight: "Add plot beats to track causal consequences."
        },
        nabokov: {
          title: "Modular Index-Card Mosaic",
          masterName: "Vladimir Nabokov",
          craftFocus: "Thematic motifs and card continuity",
          status: "aligned",
          score: 100,
          keyInsight: "Add narrative threads to evaluate mosaic density."
        },
        nolan: {
          title: "Temporal Cross-Cut Rhythm",
          masterName: "Christopher Nolan",
          craftFocus: "Multi-thread cadence and ticking clock",
          status: "aligned",
          score: 100,
          keyInsight: "Pacing rhythm aligned."
        }
      },
      diagnoses: []
    };
  }
}
