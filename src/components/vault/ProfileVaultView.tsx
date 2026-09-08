import React, { useState } from "react";
import { VaultSample, StylisticProfile } from "../../types/profileVault";
import {
  Sparkles,
  Plus,
  Trash2,
  Cpu,
  Feather,
  BookOpen,
  CheckCircle2,
  Sliders,
  RefreshCw
} from "lucide-react";

interface ProfileVaultViewProps {
  samples: VaultSample[];
  profile: StylisticProfile;
  onAddSample: (sample: Omit<VaultSample, "id" | "addedAt" | "wordCount">) => void;
  onDeleteSample: (sampleId: string) => void;
  onRetrainProfile: () => void;
}

export const ProfileVaultView: React.FC<ProfileVaultViewProps> = ({
  samples,
  profile,
  onAddSample,
  onDeleteSample,
  onRetrainProfile
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [authorType, setAuthorType] = useState<"self" | "admired_model">("self");
  const [authorName, setAuthorName] = useState("Bruno");
  const [excerpt, setExcerpt] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isTraining, setIsTraining] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!excerpt.trim() || !title.trim()) return;

    onAddSample({
      title: title.trim(),
      author: authorType,
      authorName: authorName.trim(),
      excerpt: excerpt.trim(),
      tags: tagsInput.split(",").map(t => t.trim()).filter(Boolean)
    });

    setTitle("");
    setExcerpt("");
    setTagsInput("");
    setIsAdding(false);
  };

  const handleRetrain = () => {
    setIsTraining(true);
    setTimeout(() => {
      onRetrainProfile();
      setIsTraining(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-[#ECE7DE] rounded-xl border border-[#202020] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#202020] bg-[#121212]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#C8A051]/10 flex items-center justify-center text-[#C8A051]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium tracking-wide">The Profile Vault & Stylistic Daemon</h2>
            <p className="text-xs text-[#66625B]">
              Corpus of personal prose, cognitive habits, and admired style models conditioning the internal AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRetrain}
            disabled={isTraining}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181818] border border-[#282828] text-xs font-medium text-[#ECE7DE] hover:bg-[#222] transition-colors cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C8A051] ${isTraining ? "animate-spin" : ""}`} />
            <span>{isTraining ? "Synthesizing..." : "Re-train ML Daemon"}</span>
          </button>

          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ECE7DE] text-[#080808] text-xs font-medium hover:bg-white transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Drop Style Sample</span>
          </button>
        </div>
      </div>

      {/* Main Vault Content */}
      <div className="flex-1 overflow-y-auto p-6 flex gap-6">
        {/* Left: Style Samples Corpus */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A09A8F]">
              Ingested Prose & Philosophical Samples ({samples.length})
            </h3>
            <span className="text-xs text-[#66625B]">
              Total words: {samples.reduce((a, b) => a + b.wordCount, 0)}
            </span>
          </div>

          {/* Add Sample Form */}
          {isAdding && (
            <form onSubmit={handleSubmit} className="p-5 rounded-xl border border-[#C8A051] bg-[#141414] space-y-3">
              <h4 className="text-xs font-medium uppercase tracking-wider text-[#C8A051]">
                Drop Text Sample into Vault
              </h4>

              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Sample Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="bg-[#080808] border border-[#202020] text-xs text-[#ECE7DE] px-3 py-2 rounded-lg focus:outline-none"
                  required
                />
                <select
                  value={authorType}
                  onChange={e => {
                    const val = e.target.value as any;
                    setAuthorType(val);
                    if (val === "self") setAuthorName("Bruno");
                  }}
                  className="bg-[#080808] border border-[#202020] text-xs text-[#A09A8F] px-3 py-2 rounded-lg focus:outline-none"
                >
                  <option value="self">Authored by Myself (Bruno)</option>
                  <option value="admired_model">Admired Style Model</option>
                </select>
                <input
                  type="text"
                  placeholder="Author Name / Source"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  className="bg-[#080808] border border-[#202020] text-xs text-[#ECE7DE] px-3 py-2 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <textarea
                placeholder="Paste paragraph, essay excerpt, or philosophical reflection here..."
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                className="w-full h-32 bg-[#080808] border border-[#202020] rounded-lg p-3 text-xs font-serif leading-relaxed text-[#ECE7DE] focus:outline-none resize-none"
                required
              />

              <input
                type="text"
                placeholder="Tags (comma separated, e.g. philosophy, cadence, clarity)"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                className="w-full bg-[#080808] border border-[#202020] text-xs text-[#ECE7DE] px-3 py-2 rounded-lg focus:outline-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs text-[#66625B] hover:text-[#A09A8F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-[#C8A051] text-[#080808] text-xs font-medium hover:bg-[#d6b063]"
                >
                  Ingest into Vault
                </button>
              </div>
            </form>
          )}

          {/* Sample Cards */}
          <div className="space-y-3">
            {samples.map(sample => (
              <div
                key={sample.id}
                className="p-5 rounded-xl border border-[#202020] bg-[#101010] flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                        sample.author === "self" ? "bg-[#7E9F86]/10 text-[#7E9F86] border border-[#7E9F86]/30" : "bg-[#6B8FA3]/10 text-[#6B8FA3] border border-[#6B8FA3]/30"
                      }`}>
                        {sample.author === "self" ? "Personal Voice" : "Style Model"}
                      </span>
                      <span className="text-xs font-medium text-[#ECE7DE]">{sample.authorName}</span>
                    </div>

                    <button
                      onClick={() => onDeleteSample(sample.id)}
                      className="text-[#66625B] hover:text-[#BF614B] p-1 rounded transition-colors"
                      title="Remove sample"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="font-serif text-base font-medium text-[#ECE7DE]">{sample.title}</h4>
                  <p className="font-serif text-xs leading-relaxed text-[#A09A8F] mt-2 italic bg-[#090909] p-3 rounded-lg border border-[#1c1c1c]">
                    "{sample.excerpt}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#1c1c1c] text-[11px] text-[#66625B]">
                  <div className="flex items-center gap-1.5">
                    {sample.tags.map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 rounded bg-[#181818] text-[#A09A8F]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span>{sample.wordCount} words</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Learned Stylistic & Cognitive Profile */}
        <div className="w-96 border-l border-[#202020] pl-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-[#C8A051]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#C8A051]">
                Extracted Cognitive DNA
              </span>
            </div>
            <h3 className="font-serif text-base font-medium text-[#ECE7DE]">
              Persona & Tone Signature
            </h3>
            <p className="text-xs text-[#A09A8F] mt-2 leading-relaxed bg-[#141414] p-3 rounded-lg border border-[#202020]">
              {profile.personaSummary}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#66625B] block mb-2">
              Core Descriptors
            </span>
            <div className="flex flex-wrap gap-1.5">
              {profile.toneDescriptors.map(t => (
                <span key={t} className="px-2 py-1 rounded bg-[#181818] border border-[#282828] text-xs text-[#ECE7DE]">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#66625B] block mb-2">
              Favorite Rhetorical Formulations
            </span>
            <div className="space-y-1">
              {profile.lexicalHabits.favoriteFormulations.map((form, i) => (
                <div key={i} className="text-xs text-[#7E9F86] font-serif bg-[#0a0a0a] px-2.5 py-1.5 rounded border border-[#1a1a1a]">
                  "{form}"
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#66625B] block mb-2">
              Cadence & Dialectic Rhythm
            </span>
            <div className="space-y-2 text-xs text-[#A09A8F] bg-[#141414] p-3 rounded-lg border border-[#202020]">
              <p><strong className="text-[#ECE7DE]">Pacing:</strong> {profile.rhetoricalCadence.sentencePacing}</p>
              <p><strong className="text-[#ECE7DE]">Density:</strong> {profile.rhetoricalCadence.paragraphDensity}</p>
              <p><strong className="text-[#ECE7DE]">Dialectic:</strong> {profile.rhetoricalCadence.dialecticPattern}</p>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#66625B] block mb-2">
              Synthetic Prompt Directive
            </span>
            <p className="text-[11px] font-mono text-[#66625B] bg-[#0c0c0c] p-3 rounded-lg border border-[#1c1c1c] leading-relaxed">
              {profile.syntheticPromptDirectives}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
