import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import {
  ArrowLeft,
  Copy,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";

interface VaultItem {
  id: string;
  item_type: string;
  name: string;
  created_at: number;
  updated_at: number;
  tags: string[];
  favorite: boolean;
  payload: Record<string, unknown>;
}

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<VaultItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) loadItem(id);
  }, [id]);

  const loadItem = async (itemId: string) => {
    try {
      const result = await invoke<VaultItem>("get_item", { id: itemId });
      setItem(result);
    } catch (e) {
      console.error("Failed to load item:", e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  const deleteItem = async () => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await invoke("delete_item", { id });
      navigate("/");
    } catch (e) {
      console.error("Failed to delete item:", e);
    }
  };

  const toggleSecret = (field: string) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const renderField = (label: string, value: string, fieldId: string, isSecret = false) => {
    if (!value) return null;
    const hidden = isSecret && !showSecrets[fieldId];

    return (
      <div key={fieldId} className="card border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </span>
          <div className="flex items-center gap-1">
            {isSecret && (
              <button
                onClick={() => toggleSecret(fieldId)}
                className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
              >
                {showSecrets[fieldId] ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              onClick={() => copyToClipboard(value, fieldId)}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
            >
              {copiedField === fieldId ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <div className="font-mono text-sm text-gray-200 break-all">
          {hidden ? "•".repeat(Math.min(value.length, 32)) : value}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hemdal-500" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Item not found.</p>
      </div>
    );
  }

  const renderPayload = () => {
    switch (item.item_type) {
      case "password": {
        const p = item.payload as {
          username?: string;
          password?: string;
          urls?: string[];
          totp?: string | null;
          notes?: string | null;
        };
        return (
          <div className="space-y-3">
            {renderField("Username", p.username || "", "username")}
            {renderField("Password", p.password || "", "password", true)}
            {p.totp && renderField("TOTP Secret", p.totp, "totp", true)}
            {p.urls && p.urls.length > 0 && (
              <div className="card border-gray-800">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
                  Websites
                </span>
                <div className="space-y-2">
                  {p.urls.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-hemdal-400 hover:text-hemdal-300 text-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {url}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {p.notes && renderField("Notes", p.notes, "notes")}
          </div>
        );
      }
      case "api-key": {
        const p = item.payload as {
          key?: string;
          endpoint?: string | null;
          notes?: string | null;
        };
        return (
          <div className="space-y-3">
            {renderField("API Key", p.key || "", "key", true)}
            {p.endpoint && (
              <div className="card border-gray-800">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
                  Endpoint
                </span>
                <a
                  href={p.endpoint}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-hemdal-400 hover:text-hemdal-300 text-sm"
                >
                  {p.endpoint}
                </a>
              </div>
            )}
            {p.notes && renderField("Notes", p.notes, "notes")}
          </div>
        );
      }
      case "environment-variable": {
        const p = item.payload as {
          key?: string;
          value?: string;
          project?: string | null;
          notes?: string | null;
        };
        return (
          <div className="space-y-3">
            {renderField("Key", p.key || "", "key")}
            {renderField("Value", p.value || "", "value", true)}
            {p.project && renderField("Project", p.project, "project")}
            {p.notes && renderField("Notes", p.notes, "notes")}
          </div>
        );
      }
      case "secret": {
        const p = item.payload as { value?: string; notes?: string | null };
        return (
          <div className="space-y-3">
            {renderField("Value", p.value || "", "value", true)}
            {p.notes && renderField("Notes", p.notes, "notes")}
          </div>
        );
      }
      case "note": {
        const p = item.payload as { content?: string };
        return (
          <div className="card border-gray-800">
            <div className="whitespace-pre-wrap text-gray-200 text-sm">
              {p.content || ""}
            </div>
          </div>
        );
      }
      default:
        return (
          <pre className="text-xs text-gray-400 overflow-auto">
            {JSON.stringify(item.payload, null, 2)}
          </pre>
        );
    }
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

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{item.name}</h1>
          <p className="text-gray-400 text-sm mt-1">
            Last updated {new Date(item.updated_at * 1000).toLocaleString()}
          </p>
          {item.tags.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/edit/${item.id}`)}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={deleteItem}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-950/50 text-red-400 hover:bg-red-900/50 transition-colors font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {renderPayload()}
    </div>
  );
}
