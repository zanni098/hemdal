import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, Plus, X } from "lucide-react";

const typeConfig: Record<
  string,
  {
    label: string;
    fields: { name: string; label: string; type: string; required?: boolean; placeholder?: string }[];
  }
> = {
  password: {
    label: "Password",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "e.g., Google Account" },
      { name: "username", label: "Username / Email", type: "text", placeholder: "user@example.com" },
      { name: "password", label: "Password", type: "password", required: true },
      { name: "urls", label: "Website URLs (comma separated)", type: "text", placeholder: "https://google.com" },
      { name: "totp", label: "TOTP Secret (optional)", type: "text", placeholder: "Base32 secret..." },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Additional notes..." },
    ],
  },
  "api-key": {
    label: "API Key",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "e.g., OpenAI API Key" },
      { name: "key", label: "API Key", type: "text", required: true },
      { name: "endpoint", label: "Endpoint URL (optional)", type: "text", placeholder: "https://api.example.com" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  secret: {
    label: "Secret",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "value", label: "Secret Value", type: "text", required: true },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  "environment-variable": {
    label: "Environment Variable",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "e.g., Production Database URL" },
      { name: "key", label: "Variable Key", type: "text", required: true, placeholder: "DATABASE_URL" },
      { name: "value", label: "Variable Value", type: "text", required: true },
      { name: "project", label: "Project (optional)", type: "text", placeholder: "my-app" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  note: {
    label: "Secure Note",
    fields: [
      { name: "name", label: "Title", type: "text", required: true },
      { name: "content", label: "Content", type: "textarea", required: true },
    ],
  },
};

export default function ItemForm() {
  const { type } = useParams<{ type: string }>();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const config = type ? typeConfig[type] : null;

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      loadItem(id);
    }
  }, [id]);

  const loadItem = async (itemId: string) => {
    try {
      const item = await invoke<{
        name: string;
        tags: string[];
        payload: Record<string, unknown>;
      }>("get_item", { id: itemId });
      setFormData(flattenPayload(item.payload));
      setTags(item.tags);
    } catch (e) {
      console.error("Failed to load item:", e);
    }
  };

  const flattenPayload = (payload: Record<string, unknown>): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (Array.isArray(value)) {
        result[key] = value.join(", ");
      } else if (value !== null && value !== undefined) {
        result[key] = String(value);
      }
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let payload: Record<string, unknown> = {};

      switch (type) {
        case "password":
          payload = {
            username: formData.username || "",
            password: formData.password || "",
            urls: formData.urls ? formData.urls.split(",").map((u) => u.trim()) : [],
            notes: formData.notes || null,
            totp: formData.totp || null,
          };
          break;
        case "api-key":
          payload = {
            key: formData.key || "",
            endpoint: formData.endpoint || null,
            headers: null,
            notes: formData.notes || null,
          };
          break;
        case "secret":
          payload = {
            value: formData.value || "",
            notes: formData.notes || null,
          };
          break;
        case "environment-variable":
          payload = {
            key: formData.key || "",
            value: formData.value || "",
            project: formData.project || null,
            notes: formData.notes || null,
          };
          break;
        case "note":
          payload = {
            content: formData.content || "",
          };
          break;
      }

      if (isEditing && id) {
        await invoke("update_item", {
          id,
          name: formData.name,
          tags,
          payload,
        });
      } else {
        await invoke("create_item", {
          request: {
            item_type: type,
            name: formData.name,
            tags,
            payload,
          },
        });
      }

      navigate("/");
    } catch (e) {
      console.error("Failed to save item:", e);
      alert(`Failed to save: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  if (!config) {
    return (
      <div className="p-8">
        <h1 className="text-white text-xl">Unknown item type: {type}</h1>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Vault
      </button>

      <h1 className="text-2xl font-bold text-white mb-6">
        {isEditing ? "Edit" : "New"} {config.label}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {config.fields.map((field) => (
          <div key={field.name}>
            <label className="label">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {field.type === "textarea" ? (
              <textarea
                value={formData[field.name] || ""}
                onChange={(e) =>
                  setFormData({ ...formData, [field.name]: e.target.value })
                }
                className="input min-h-[100px] resize-y"
                placeholder={field.placeholder}
                required={field.required}
              />
            ) : (
              <input
                type={field.type}
                value={formData[field.name] || ""}
                onChange={(e) =>
                  setFormData({ ...formData, [field.name]: e.target.value })
                }
                className="input"
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
          </div>
        ))}

        {/* Tags */}
        <div>
          <label className="label">Tags</label>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-hemdal-950 text-hemdal-300 border border-hemdal-800 text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              className="input flex-1"
              placeholder="Add a tag..."
            />
            <button
              type="button"
              onClick={addTag}
              className="btn-secondary px-3"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              isEditing ? "Save Changes" : "Create Item"
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
