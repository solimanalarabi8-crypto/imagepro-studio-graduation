import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search
} from "lucide-react";

export interface CommandItem {
  id: string;
  titleAr: string;
  titleEn: string;
  categoryAr: string;
  categoryEn: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
  lang?: "ar" | "en";
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  commands,
  lang = "ar"
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isAr = lang === "ar";

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands.slice(0, 30);
    const q = query.toLowerCase().trim();
    return commands.filter((cmd) => {
      const matchAr = cmd.titleAr.toLowerCase().includes(q);
      const matchEn = cmd.titleEn.toLowerCase().includes(q);
      const matchCat = cmd.categoryAr.toLowerCase().includes(q) || cmd.categoryEn.toLowerCase().includes(q);
      const matchKeyword = cmd.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchAr || matchEn || matchCat || matchKeyword;
    });
  }, [query, commands]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Ensure active item is visible in scroll container
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(".cmd-item.selected") as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="cmd-palette-backdrop" onClick={onClose}>
      <div
        className="cmd-palette-window"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="cmd-palette-search-row">
          <Search className="cmd-search-icon" size={18} />
          <input
            ref={inputRef}
            type="text"
            className="cmd-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isAr
                ? "اكتب أي أمر أو أداة أو فلتر... (مثال: عزل، حفظ، قص، تباين)"
                : "Type a command, tool, or filter... (e.g. Cutout, Save, Crop, Blur)"
            }
          />
          <span className="cmd-esc-badge">ESC</span>
        </div>

        <div className="cmd-palette-list" ref={listRef}>
          {filtered.length === 0 ? (
            <div className="cmd-empty-state">
              <Search size={28} className="cmd-empty-icon" />
              <p>{isAr ? "لم يتم العثور على أوامر مطابقة" : "No matching commands found"}</p>
              <span>{isAr ? "جرب البحث باسم الأداة أو الاختصار" : "Try searching by tool name or shortcut"}</span>
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`cmd-item ${isSelected ? "selected" : ""}`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                >
                  <div className="cmd-item-left">
                    <span className="cmd-icon-box">{item.icon}</span>
                    <div className="cmd-item-text">
                      <span className="cmd-item-title">{isAr ? item.titleAr : item.titleEn}</span>
                      <span className="cmd-item-category">{isAr ? item.categoryAr : item.categoryEn}</span>
                    </div>
                  </div>
                  {item.shortcut && <span className="cmd-shortcut-badge">{item.shortcut}</span>}
                </div>
              );
            })
          )}
        </div>

        <div className="cmd-palette-footer">
          <div className="cmd-footer-hints">
            <span><kbd>↑</kbd> <kbd>↓</kbd> {isAr ? "للتنقل" : "navigate"}</span>
            <span><kbd>↵</kbd> {isAr ? "للتشغيل" : "execute"}</span>
            <span><kbd>ESC</kbd> {isAr ? "للإغلاق" : "close"}</span>
          </div>
          <span className="cmd-results-count">
            {filtered.length} {isAr ? "أمر متاح" : "commands"}
          </span>
        </div>
      </div>
    </div>
  );
};
