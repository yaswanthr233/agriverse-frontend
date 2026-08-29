import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  Bot,
  ScanEye,
  Sparkles,
  Send,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Wheat,
  Mic,
  MicOff,
} from "lucide-react";
import { aiApi } from "@/api/endpoints/ai";
import type {
  AiChatResponse,
  AiCropRecommendResponse,
  AiDiseaseScanResponse,
} from "@/api/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import {
  getSpeechRecognitionLocale,
  getSpeechRecognitionConstructor,
  getSpeechErrorMessage,
} from "@/lib/speechRecognition";

interface Message {
  role: "user" | "assistant";
  content: string;
  source?: string;
  sources?: string[];
  disclaimer?: string;
}

const TABS = [
  { id: "assistant", label: "AI Farming Assistant" },
  { id: "scan", label: "Disease Diagnosis" },
  { id: "recommend", label: "Crop Recommender" },
];

const cropFormSchema = z.object({
  season: z.string().min(1, "Season is required"),
  soil: z.string().min(1, "Soil type is required"),
  irrigation: z.string().min(1, "Irrigation type is required"),
  areaAcres: z.coerce.number().positive("Area must be greater than 0"),
});
type CropFormInput = z.input<typeof cropFormSchema>;
type CropFormOutput = z.output<typeof cropFormSchema>;

export function AiHub() {
  const [activeTab, setActiveTab] = useState("assistant");

  /* ── Tab 1: AI Assistant ────────────────────────────── */
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your AgriVerse AI agronomy assistant. Ask me anything about crop diseases, organic fertilization, weather effects, or livestock care.",
      source: "n8n AI & Supabase Vector Store",
      disclaimer:
        "Agricultural AI suggestions should be verified with local agronomy experts.",
    },
  ]);

  const chatMutation = useMutation({
    mutationFn: (msg: string) => aiApi.chat(msg),
    onSuccess: (res: AiChatResponse) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.answer || res.reply || res.message || "",
          source: res.source,
          sources: res.sources,
          disclaimer: res.disclaimer,
        },
      ]);
    },
    onError: () => toast.error("AgriVerse AI is temporarily unavailable. Please try again."),
  });

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  function handleToggleVoice() {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser. Please type your question.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;

      // Dynamically resolve speech language
      const savedLang = localStorage.getItem("agriverse_ai_lang") || localStorage.getItem("agriverse_lang") || "en";
      const targetLocale = getSpeechRecognitionLocale(savedLang);
      recognition.lang = targetLocale;

      console.log("Selected language:", savedLang);
      console.log("Speech recognition language:", recognition.lang);

      recognition.onstart = () => {
        setIsListening(true);
        toast("Listening... Speak your question", { icon: "🎤" });
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInputMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("[SpeechRecognition in AiHub]", event.error);
        const errMsg = getSpeechErrorMessage(event.error, savedLang);
        if (event.error !== "aborted" && errMsg) {
          toast.error(errMsg);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.error("[SpeechRecognition exception]", err);
      setIsListening(false);
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMessage.trim() || chatMutation.isPending) return;
    const userMsg = inputMessage.trim();
    setInputMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    chatMutation.mutate(userMsg);
  }

  /* ── Tab 2: Disease Scan ────────────────────────────── */
  const [scanType, setScanType] = useState("crop");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] =
    useState<AiDiseaseScanResponse | null>(null);

  const scanMutation = useMutation({
    mutationFn: ({ type, file }: { type: string; file: File }) =>
      aiApi.scan(type, file),
    onSuccess: (res: AiDiseaseScanResponse) => {
      setScanResult(res);
      toast.success("Analysis complete");
    },
    onError: () => toast.error("Failed to analyze image."),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
    }
  }

  function handleScanSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || scanMutation.isPending) return;
    scanMutation.mutate({ type: scanType, file: selectedFile });
  }

  /* ── Tab 3: Crop Recommender ────────────────────────── */
  const [recommendResult, setRecommendResult] =
    useState<AiCropRecommendResponse | null>(null);

  const {
    register: registerCrop,
    handleSubmit: handleCropSubmit,
    formState: { errors: cropErrors },
  } = useForm<CropFormInput, unknown, CropFormOutput>({
    resolver: zodResolver(cropFormSchema),
    defaultValues: {
      season: "Kharif (Monsoon)",
      soil: "Alluvial / Loamy",
      irrigation: "Canal / Tube well",
      areaAcres: 5,
    },
  });

  const recommendMutation = useMutation({
    mutationFn: aiApi.recommendCrops,
    onSuccess: (res: AiCropRecommendResponse) => {
      setRecommendResult(res);
      toast.success("Recommendations generated");
    },
    onError: () => toast.error("Couldn't generate crop recommendations."),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          AgriVerse AI Hub
        </h1>
        <p className="mt-1 text-ink-500">
          Smart farming assistants, computer-vision disease diagnosis, and
          data-driven crop recommendations.
        </p>
      </div>

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* ── TAB 1: Assistant ─────────────────────────────── */}
      {activeTab === "assistant" && (
        <Card className="flex h-[600px] flex-col p-4">
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                    <Bot className="size-4" aria-hidden="true" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-sm ${
                    m.role === "user"
                      ? "rounded-br-none bg-primary-600 text-white"
                      : "rounded-bl-none bg-surface-sunk text-ink-900"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.content}</p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 rounded-md bg-surface p-2 text-xs text-ink-600 border border-border">
                      <span className="font-semibold text-ink-800 block mb-1">📚 Retrieved Sources:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                        {m.sources.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {m.disclaimer && (
                    <p className="mt-3 border-t border-border/40 pt-2 text-[11px] opacity-75">
                      {m.disclaimer} · Source: {m.source}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex items-center gap-2 text-xs text-ink-400">
                <Bot
                  className="size-4 animate-spin text-primary-600"
                  aria-hidden="true"
                />
                Thinking...
              </div>
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="mt-4 flex items-center gap-2 border-t border-border pt-4"
          >
            <input
              type="text"
              placeholder={isListening ? "Listening... Speak your question" : "Ask a question about your crops, soil or livestock..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="h-10 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-600 focus:outline-none"
            />
            <Button
              type="button"
              variant="outline"
              aria-label="Voice input"
              onClick={handleToggleVoice}
              className={isListening ? "border-danger-400 bg-danger-50 text-danger-700 animate-pulse" : ""}
            >
              {isListening ? <MicOff className="size-4 animate-bounce" /> : <Mic className="size-4" />}
            </Button>
            <Button type="submit" loading={chatMutation.isPending} disabled={!inputMessage.trim()}>
              <Send className="size-4" aria-hidden="true" /> Send
            </Button>
          </form>
        </Card>
      )}

      {/* ── TAB 2: Disease Scan ──────────────────────────── */}
      {activeTab === "scan" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ink-900">
              Upload plant / animal image
            </h2>
            <p className="mt-1 text-xs text-ink-500">
              Upload a clear photo of the infected leaf, stem, or animal lesion
              for automated diagnosis.
            </p>

            <form onSubmit={handleScanSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink-700">
                  Diagnosis type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-ink-700">
                    <input
                      type="radio"
                      name="scanType"
                      value="crop"
                      checked={scanType === "crop"}
                      onChange={() => setScanType("crop")}
                    />
                    Crop / Plant
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink-700">
                    <input
                      type="radio"
                      name="scanType"
                      value="animal"
                      checked={scanType === "animal"}
                      onChange={() => setScanType("animal")}
                    />
                    Livestock / Animal
                  </label>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center">
                {previewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={previewUrl}
                      alt="Upload preview"
                      className="mx-auto max-h-48 rounded-md object-cover"
                    />
                    <label className="cursor-pointer text-xs font-medium text-primary-700 hover:underline">
                      Change photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center">
                    <Upload
                      className="size-10 text-ink-400"
                      aria-hidden="true"
                    />
                    <span className="mt-2 text-sm font-medium text-ink-700">
                      Click to select image
                    </span>
                    <span className="mt-1 text-xs text-ink-400">
                      PNG, JPG up to 10MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!selectedFile}
                loading={scanMutation.isPending}
              >
                <ScanEye className="size-4" aria-hidden="true" /> Analyze
                Disease
              </Button>
            </form>
          </Card>

          {/* Scan Results Card */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ink-900">
              Diagnosis Report
            </h2>

            {scanMutation.isPending && (
              <div className="mt-12 flex flex-col items-center justify-center text-center">
                <ScanEye
                  className="size-10 animate-pulse text-primary-600"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-medium text-ink-900">
                  Analyzing symptoms & visual patterns...
                </p>
                <p className="mt-1 text-xs text-ink-500">
                  Checking against 100+ pathogen profiles
                </p>
              </div>
            )}

            {!scanMutation.isPending && !scanResult && (
              <div className="mt-12 text-center text-sm text-ink-500">
                Upload an image and run diagnosis to view findings, severity
                and recommended organic/chemical treatments.
              </div>
            )}

            {scanResult && (
              <div className="mt-4 space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <h3 className="text-xl font-bold text-ink-900">
                      {scanResult.disease}
                    </h3>
                    <p className="text-xs text-ink-500">
                      Affected area: {scanResult.affected}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge
                      tone={
                        scanResult.confidence > 0.8 ? "success" : "warning"
                      }
                    >
                      {(scanResult.confidence * 100).toFixed(0)}% Confidence
                    </Badge>
                    <span className="numeric mt-1 text-[11px] text-ink-400">
                      Severity: {scanResult.severity}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                    <CheckCircle2
                      className="size-3.5 text-primary-600"
                      aria-hidden="true"
                    />
                    Recommended Treatment
                  </h4>
                  <ul className="mt-2 space-y-1 text-sm text-ink-700">
                    {scanResult.treatment.map((t, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary-600">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {scanResult.prevention && (
                  <div>
                    <h4 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                      <AlertTriangle
                        className="size-3.5 text-warning-600"
                        aria-hidden="true"
                      />
                      Preventative Guidelines
                    </h4>
                    <p className="mt-1 text-sm text-ink-700">
                      {scanResult.prevention}
                    </p>
                  </div>
                )}

                <p className="mt-4 rounded-md bg-surface-sunk px-3 py-2 text-xs text-ink-500">
                  {scanResult.disclaimer} · Source: {scanResult.source}
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── TAB 3: Crop Recommender ─────────────────────── */}
      {activeTab === "recommend" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ink-900">
              Field Parameters
            </h2>
            <p className="mt-1 text-xs text-ink-500">
              Input soil type, sowing season and water access to get
              top-yielding, profitable crop choices.
            </p>

            <form
              onSubmit={handleCropSubmit((v) =>
                recommendMutation.mutate({
                  season: v.season,
                  soil: v.soil,
                  irrigation: v.irrigation,
                  areaAcres: Number(v.areaAcres),
                }),
              )}
              className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <Select
                label="Season"
                options={[
                  { value: "Kharif (Monsoon)", label: "Kharif (Monsoon)" },
                  { value: "Rabi (Winter)", label: "Rabi (Winter)" },
                  { value: "Zaid (Summer)", label: "Zaid (Summer)" },
                ]}
                error={cropErrors.season?.message}
                {...registerCrop("season")}
              />

              <Select
                label="Soil type"
                options={[
                  { value: "Alluvial / Loamy", label: "Alluvial / Loamy" },
                  { value: "Black Cotton Soil", label: "Black Cotton Soil" },
                  { value: "Red & Laterite", label: "Red & Laterite" },
                  { value: "Sandy Loam", label: "Sandy Loam" },
                  { value: "Clay", label: "Clay" },
                ]}
                error={cropErrors.soil?.message}
                {...registerCrop("soil")}
              />

              <Select
                label="Irrigation method"
                options={[
                  { value: "Canal / Tube well", label: "Canal / Tube well" },
                  { value: "Drip Irrigation", label: "Drip Irrigation" },
                  { value: "Sprinkler", label: "Sprinkler" },
                  { value: "Rainfed Only", label: "Rainfed Only" },
                ]}
                error={cropErrors.irrigation?.message}
                {...registerCrop("irrigation")}
              />

              <Input
                label="Farm area (acres)"
                type="number"
                step="0.5"
                error={cropErrors.areaAcres?.message}
                {...registerCrop("areaAcres")}
              />

              <div className="flex justify-end sm:col-span-2 lg:col-span-4">
                <Button
                  type="submit"
                  size="lg"
                  loading={recommendMutation.isPending}
                >
                  <Sparkles className="size-4" aria-hidden="true" /> Generate
                  Recommendations
                </Button>
              </div>
            </form>
          </Card>

          {recommendResult && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-ink-900">
                Ranked Crop Recommendations
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommendResult.recommendations.map((rec, i) => (
                  <Card key={i} className="flex flex-col justify-between p-5">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-md bg-primary-100 text-primary-700">
                            <Wheat className="size-4" aria-hidden="true" />
                          </div>
                          <h4 className="text-lg font-semibold text-ink-900">
                            {rec.crop}
                          </h4>
                        </div>
                        <Badge tone="success">
                          {(rec.score * 100).toFixed(0)}% Match
                        </Badge>
                      </div>

                      <p className="mt-3 text-sm text-ink-700">{rec.reason}</p>

                      <dl className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs">
                        <div className="flex justify-between">
                          <dt className="text-ink-400">Est. Revenue</dt>
                          <dd className="font-semibold text-primary-700">
                            {rec.revenue}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-ink-400">Water Requirement</dt>
                          <dd className="text-ink-900">{rec.water}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-ink-400">Optimal Season</dt>
                          <dd className="text-ink-900">{rec.season}</dd>
                        </div>
                      </dl>
                    </div>
                  </Card>
                ))}
              </div>

              <p className="rounded-md bg-surface-sunk px-3 py-2 text-xs text-ink-500">
                {recommendResult.disclaimer} · Source: {recommendResult.source}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
