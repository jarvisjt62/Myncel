'use client';

import { useState } from 'react';

interface Props {
  /** If set, downloads only that chapter; otherwise downloads the full handbook. */
  slug?: string;
  /** Display style: 'card' for the overview page, 'compact' for inside chapter pages. */
  variant?: 'card' | 'compact';
}

const FORMATS = [
  { id: 'md', label: 'Markdown', ext: '.md', icon: '📝', desc: 'Plain markdown — great for GitHub, Notion, Obsidian' },
  { id: 'docx', label: 'Word', ext: '.docx', icon: '📄', desc: 'Microsoft Word — edit, print, share' },
  { id: 'html', label: 'HTML / PDF', ext: '.html', icon: '🌐', desc: 'Open in browser → print or save as PDF' },
  { id: 'txt', label: 'Plain text', ext: '.txt', icon: '📃', desc: 'Universal plain text' },
  { id: 'json', label: 'JSON', ext: '.json', icon: '⚙️', desc: 'Structured data for developers' },
];

export default function HandbookDownloadButton({ slug, variant = 'card' }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const buildUrl = (fmt: string) => {
    const params = new URLSearchParams({ format: fmt });
    if (slug) params.set('slug', slug);
    return `/api/handbook/download?${params.toString()}`;
  };

  const trigger = async (fmt: string) => {
    setBusy(fmt);
    try {
      const url = buildUrl(fmt);
      // For HTML we open in a new tab so user can print directly.
      // Everything else triggers a download.
      if (fmt === 'html') {
        window.open(url, '_blank', 'noopener');
      } else {
        const a = document.createElement('a');
        a.href = url;
        // Browser will use Content-Disposition's filename
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } finally {
      setTimeout(() => setBusy(null), 1500);
      setTimeout(() => setOpen(false), 500);
    }
  };

  if (variant === 'compact') {
    return (
      <div className="relative inline-block">
        <button
          onClick={() => setOpen(!open)}
          className="px-4 py-2 bg-white border border-[#e6ebf1] hover:border-[#635bff] text-sm font-semibold rounded-lg text-[#0a2540] transition-colors"
        >
          ⬇ Download {open ? '▴' : '▾'}
        </button>
        {open && <DropdownMenu trigger={trigger} busy={busy} onClose={() => setOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e6ebf1] rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-[#0a2540] flex items-center gap-2">
            ⬇ Download the {slug ? 'chapter' : 'handbook'}
          </h3>
          <p className="text-sm text-[#425466] mt-1">
            Take it offline. Save as Word, Markdown, HTML, plain text, or JSON.
          </p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {FORMATS.map((f) => {
          const isBusy = busy === f.id;
          return (
            <button
              key={f.id}
              disabled={isBusy}
              onClick={() => trigger(f.id)}
              className="flex items-start gap-3 p-3 border border-[#e6ebf1] rounded-lg hover:border-[#635bff] hover:bg-[#f6f9fc] text-left transition-all disabled:opacity-50"
            >
              <span className="text-2xl">{f.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-[#0a2540] text-sm">
                  {isBusy ? 'Preparing…' : `${f.label} (${f.ext})`}
                </span>
                <span className="block text-xs text-[#8898aa] leading-snug mt-0.5">{f.desc}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-[#8898aa] mt-3">
        Tip: choose <b>HTML / PDF</b>, then in the new tab hit <kbd className="px-1.5 py-0.5 bg-[#f6f9fc] border border-[#e6ebf1] rounded text-[10px]">Ctrl/⌘+P</kbd> → <b>Save as PDF</b>.
      </p>
    </div>
  );
}

function DropdownMenu({
  trigger,
  busy,
  onClose,
}: {
  trigger: (fmt: string) => void;
  busy: string | null;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-56 bg-white border border-[#e6ebf1] rounded-lg shadow-lg z-50 overflow-hidden">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            disabled={busy === f.id}
            onClick={() => trigger(f.id)}
            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-[#f6f9fc] disabled:opacity-50"
          >
            <span className="text-base">{f.icon}</span>
            <span className="flex-1">
              <span className="block font-semibold text-[#0a2540]">{f.label}</span>
              <span className="block text-[10px] text-[#8898aa]">{f.ext}</span>
            </span>
            {busy === f.id && <span className="text-xs text-[#635bff]">…</span>}
          </button>
        ))}
      </div>
    </>
  );
}
