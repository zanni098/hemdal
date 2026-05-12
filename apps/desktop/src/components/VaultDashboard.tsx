import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import {
  Search,
  Plus,
  Star,
  StarOff,
  KeyRound,
  FileKey,
  Variable,
  StickyNote,
  Shield,
  Trash2,
  ChevronRight,
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

const typeIcons: Record<string, React.ElementType> = {
  password: KeyRound,
  "api-key": FileKey,
  secret: Shield,
  "environment-variable": Variable,
  note: StickyNote,
};

const typeLabels: Record<string, string> = {
  password: "Password",
  "api-key": "API Key",
  secret: "Secret",
  "environment-variable": "Env Variable",
  note: "Note",
};

export default function VaultDashboard() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const filterType = searchParams.get("type");

  const loadItems = async () => {
    try {
      const result = await invoke<VaultItem[]>("get_items", {
        itemType: filterType,
      });
      setItems(result);
    } catch (e) {
      console.error("Failed to load items:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [filterType]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadItems();
      return;
    }
    try {
      const result = await invoke<VaultItem[]>("search_items", {
        query: searchQuery,
      });
      setItems(result);
    } catch (e) {
      console.error("Search failed:", e);
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      await invoke("toggle_favorite", { id });
      loadItems();
    } catch (e) {
      console.error("Failed to toggle favorite:", e);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await invoke("delete_item", { id });
      loadItems();
    } catch (e) {
      console.error("Failed to delete item:", e);
    }
  };

  const getQuickValue = (item: VaultItem): string => {
    switch (item.item_type) {
      case "password":
        return (item.payload as { username?: string }).username || "No username";
      case "api-key":
        return "API Key";
      case "environment-variable":
        return (item.payload as { key?: string }).key || "";
      case "note":
        return ((item.payload as { content?: string }).content || "").slice(0, 60) + "...";
      default:
        return "";
    }
  };

  const filteredItems = items; // Search is handled server-side

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {filterType ? typeLabels[filterType] || "Items" : "All Items"}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {items.length} item{items.length !== 1 ? "s" : ""} in your vault
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search vault..."
              className="input pl-10 w-72"
            />
          </div>

          <div className="relative group">
            <button className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Item
            </button>
            <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 border border-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="p-1">
                {[
                  { type: "password", label: "Password", icon: KeyRound },
                  { type: "api-key", label: "API Key", icon: FileKey },
                  { type: "environment-variable", label: "Environment Variable", icon: Variable },
                  { type: "note", label: "Secure Note", icon: StickyNote },
                ].map((item) => (
                  <Link
                    key={item.type}
                    to={`/new/${item.type}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hemdal-500" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20">
          <Shield className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No items yet</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery
              ? "No items match your search."
              : "Your vault is empty. Add your first secret."}
          </p>
          {!searchQuery && (
            <Link to="/new/password" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Item
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const Icon = typeIcons[item.item_type] || Shield;
            return (
              <div
                key={item.id}
                className="card hover:border-gray-700 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-hemdal-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white truncate">
                        {item.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                        {typeLabels[item.item_type] || item.item_type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {getQuickValue(item)}
                    </p>
                    {item.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-yellow-400 transition-colors"
                    >
                      {item.favorite ? (
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      ) : (
                        <StarOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => navigate(`/item/${item.id}`)}
                      className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 rounded-lg hover:bg-red-950/50 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
