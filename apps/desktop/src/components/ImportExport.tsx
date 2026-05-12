import { useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, Upload, Download, FileJson, FileSpreadsheet, AlertTriangle, Check, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
}

type ImportFormat = "bitwarden" | "csv" | "1password";

export default function ImportExport() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");
  const [format, setFormat] = useState<ImportFormat>("bitwarden");
  const [rawData, setRawData] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [exportData, setExportData] = useState("");
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [copied, setCopied] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setRawData(text);
    } catch (err) {
      alert(`Failed to read file: ${err}`);
    }
  };

  const handleImport = async () => {
    if (!rawData.trim()) {
      alert("Please paste or upload data to import.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await invoke<ImportResult>("import_items", {
        format: format === "1password" ? "1password" : format,
        data: rawData,
      });
      setResult(res);
    } catch (e) {
      alert(`Import failed: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setExportData("");

    try {
      if (exportFormat === "json") {
        const data = await invoke<string>("export_items_json");
        setExportData(data);
      } else {
        const data = await invoke<string>("export_items_csv");
        setExportData(data);
      }
    } catch (e) {
      alert(`Export failed: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const copyExport = async () => {
    if (!exportData) return;
    try {
      await navigator.clipboard.writeText(exportData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  const downloadExport = () => {
    if (!exportData) return;
    const blob = new Blob([exportData], { type: exportFormat === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hemdal-export.${exportFormat === "json" ? "json" : "csv"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatLabels: Record<ImportFormat, { label: string; description: string; example: string }> = {
    bitwarden: {
      label: "Bitwarden JSON",
      description: "Export from Bitwarden vault as JSON (unencrypted)",
      example: "bitwarden_export.json",
    },
    csv: {
      label: "Generic CSV",
      description: "CSV with columns: name, username, password, url, notes, totp",
      example: "passwords.csv",
    },
    "1password": {
      label: "1Password CSV",
      description: "Export from 1Password as CSV",
      example: "1p_export.csv",
    },
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Vault
      </button>

      <h1 className="text-2xl font-bold text-white mb-6">Import & Export</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-lg border border-gray-800">
        <button
          onClick={() => setActiveTab("import")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === "import"
              ? "bg-hemdal-950 text-hemdal-300 border border-hemdal-800"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <Upload className="w-4 h-4" />
          Import
        </button>
        <button
          onClick={() => setActiveTab("export")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === "export"
              ? "bg-hemdal-950 text-hemdal-300 border border-hemdal-800"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {activeTab === "import" ? (
        <div className="space-y-6">
          {/* Format selector */}
          <div>
            <label className="label">Import Format</label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(formatLabels) as ImportFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFormat(f);
                    setResult(null);
                  }}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    format === f
                      ? "bg-hemdal-950 border-hemdal-700"
                      : "bg-gray-900 border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {f === "bitwarden" ? (
                      <FileJson className="w-4 h-4 text-hemdal-400" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 text-green-400" />
                    )}
                    <span className={`text-sm font-medium ${format === f ? "text-hemdal-300" : "text-gray-300"}`}>
                      {formatLabels[f].label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{formatLabels[f].description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* File upload / paste */}
          <div>
            <label className="label">Import Data</label>
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-gray-600 transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports {formatLabels[format].example}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={format === "bitwarden" ? ".json" : ".csv"}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="relative">
                <textarea
                  value={rawData}
                  onChange={(e) => {
                    setRawData(e.target.value);
                    setResult(null);
                  }}
                  className="input min-h-[200px] font-mono text-xs"
                  placeholder={`Paste your ${formatLabels[format].label} export data here...`}
                />
                {rawData && (
                  <button
                    onClick={() => setRawData("")}
                    className="absolute top-2 right-2 text-xs text-gray-500 hover:text-gray-300"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Import button */}
          <button
            onClick={handleImport}
            disabled={loading || !rawData.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Import {formatLabels[format].label}
          </button>

          {/* Results */}
          {result && (
            <div className={`card border-${result.errors.length > 0 ? "yellow" : "green"}-900`}>
              <div className="flex items-center gap-2 mb-3">
                {result.errors.length > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Check className="w-5 h-5 text-green-400" />
                )}
                <span className="font-medium text-white">Import Complete</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-2xl font-bold text-white">{result.total}</div>
                  <div className="text-xs text-gray-400">Total</div>
                </div>
                <div className="bg-green-950/50 border border-green-900 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-400">{result.imported}</div>
                  <div className="text-xs text-green-500">Imported</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-300">{result.skipped}</div>
                  <div className="text-xs text-gray-400">Skipped</div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-yellow-950/30 border border-yellow-900 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <p className="text-xs text-yellow-400 font-medium mb-2">
                    {result.errors.length} error(s)
                  </p>
                  {result.errors.slice(0, 10).map((err, i) => (
                    <p key={i} className="text-xs text-yellow-300/80">
                      {err}
                    </p>
                  ))}
                  {result.errors.length > 10 && (
                    <p className="text-xs text-yellow-300/50">
                      ...and {result.errors.length - 10} more
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Export format */}
          <div>
            <label className="label">Export Format</label>
            <div className="flex gap-3">
              <button
                onClick={() => setExportFormat("json")}
                className={`flex-1 p-4 rounded-xl border text-left transition-colors ${
                  exportFormat === "json"
                    ? "bg-hemdal-950 border-hemdal-700"
                    : "bg-gray-900 border-gray-800 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <FileJson className="w-4 h-4 text-hemdal-400" />
                  <span className={`text-sm font-medium ${exportFormat === "json" ? "text-hemdal-300" : "text-gray-300"}`}>
                    Encrypted JSON
                  </span>
                </div>
                <p className="text-xs text-gray-500">Full vault export in Hemdal format</p>
              </button>
              <button
                onClick={() => setExportFormat("csv")}
                className={`flex-1 p-4 rounded-xl border text-left transition-colors ${
                  exportFormat === "csv"
                    ? "bg-hemdal-950 border-hemdal-700"
                    : "bg-gray-900 border-gray-800 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-green-400" />
                  <span className={`text-sm font-medium ${exportFormat === "csv" ? "text-hemdal-300" : "text-gray-300"}`}>
                    CSV (passwords only)
                  </span>
                </div>
                <p className="text-xs text-gray-500">Plain CSV for migration to other apps</p>
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-950/30 border border-yellow-900">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-300 font-medium">Security Notice</p>
              <p className="text-xs text-yellow-400/80 mt-1">
                Exported data is decrypted and stored in plain text. Keep exports secure and delete them when done.
              </p>
            </div>
          </div>

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export Vault
          </button>

          {/* Export result */}
          {exportData && (
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  value={exportData}
                  readOnly
                  className="input min-h-[300px] font-mono text-xs"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={copyExport}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy to Clipboard"}
                </button>
                <button
                  onClick={downloadExport}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
