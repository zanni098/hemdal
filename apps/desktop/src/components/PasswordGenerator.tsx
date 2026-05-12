import { useState } from "react";
import { Dice5, Copy, Check } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const CHARS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

export default function PasswordGenerator({ value, onChange }: Props) {
  const [length, setLength] = useState(20);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeDigits, setIncludeDigits] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    let pool = CHARS.lowercase;
    if (includeUppercase) pool += CHARS.uppercase;
    if (includeDigits) pool += CHARS.digits;
    if (includeSymbols) pool += CHARS.symbols;

    // Ensure at least one of each selected type
    let password = "";
    if (includeUppercase) password += randomChar(CHARS.uppercase);
    if (includeDigits) password += randomChar(CHARS.digits);
    if (includeSymbols) password += randomChar(CHARS.symbols);

    while (password.length < length) {
      password += randomChar(pool);
    }

    // Shuffle
    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    onChange(password);
  };

  const randomChar = (pool: string) => {
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const copyToClipboard = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  const strength = getStrength(value);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="input font-mono text-sm"
            placeholder="Enter or generate a password..."
          />
        </div>
        <button
          type="button"
          onClick={generate}
          className="btn-secondary flex items-center gap-1.5 px-3"
          title="Generate password"
        >
          <Dice5 className="w-4 h-4" />
          Generate
        </button>
        <button
          type="button"
          onClick={copyToClipboard}
          disabled={!value}
          className="btn-secondary px-3"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Strength bar */}
      {value && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
              style={{ width: `${(strength.score / 5) * 100}%` }}
            />
          </div>
          <span className={`text-xs font-medium ${strength.textColor}`}>
            {strength.label}
          </span>
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-xs">Length</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="8"
              max="64"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="flex-1 accent-hemdal-500"
            />
            <span className="text-sm text-gray-300 w-8 text-right">{length}</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeUppercase}
              onChange={(e) => setIncludeUppercase(e.target.checked)}
              className="accent-hemdal-500"
            />
            <span className="text-sm text-gray-300">Uppercase (A-Z)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDigits}
              onChange={(e) => setIncludeDigits(e.target.checked)}
              className="accent-hemdal-500"
            />
            <span className="text-sm text-gray-300">Digits (0-9)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={(e) => setIncludeSymbols(e.target.checked)}
              className="accent-hemdal-500"
            />
            <span className="text-sm text-gray-300">Symbols (!@#$)</span>
          </label>
        </div>
      </div>
    </div>
  );
}

function getStrength(password: string): {
  score: number;
  label: string;
  color: string;
  textColor: string;
} {
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const colors = [
    "bg-red-600",
    "bg-red-500",
    "bg-yellow-500",
    "bg-hemdal-500",
    "bg-green-500",
    "bg-green-400",
  ];
  const textColors = [
    "text-red-500",
    "text-red-400",
    "text-yellow-400",
    "text-hemdal-400",
    "text-green-400",
    "text-green-300",
  ];

  return {
    score: Math.min(score, 5),
    label: labels[Math.min(score, 5)],
    color: colors[Math.min(score, 5)],
    textColor: textColors[Math.min(score, 5)],
  };
}
