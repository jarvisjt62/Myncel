'use client';

import Link from 'next/link';
import { useState } from 'react';
import { HANDBOOK_CHAPTERS } from '@/lib/handbook/content';

interface Props {
  activeSlug: string;
}

export default function HandbookSidebar({ activeSlug }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="md:w-64 shrink-0">
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden w-full flex items-center justify-between bg-white border border-[#e6ebf1] rounded-lg px-4 py-3 mb-4 text-sm font-semibold text-[#0a2540]"
      >
        📖 Chapters {open ? '▴' : '▾'}
      </button>

      <div
        className={`${open ? 'block' : 'hidden'} md:block bg-white border border-[#e6ebf1] rounded-xl p-3 md:sticky md:top-20`}
      >
        <Link
          href="/handbook"
          className={`block px-3 py-2 text-sm rounded-lg ${
            activeSlug === '' ? 'bg-[#635bff] text-white font-semibold' : 'text-[#425466] hover:bg-[#f6f9fc]'
          }`}
          onClick={() => setOpen(false)}
        >
          📖 Handbook home
        </Link>

        <div className="mt-2 border-t border-[#e6ebf1] pt-2 space-y-0.5">
          {HANDBOOK_CHAPTERS.map((c, i) => {
            const active = c.slug === activeSlug;
            return (
              <Link
                key={c.slug}
                href={`/handbook/${c.slug}`}
                onClick={() => setOpen(false)}
                className={`flex items-start gap-2 px-3 py-2 text-sm rounded-lg ${
                  active
                    ? 'bg-[#635bff] text-white font-semibold'
                    : 'text-[#425466] hover:bg-[#f6f9fc]'
                }`}
              >
                <span className="w-5 text-center shrink-0">{c.emoji}</span>
                <span className="flex-1 leading-tight">
                  <span className={`text-xs ${active ? 'text-purple-200' : 'text-[#8898aa]'}`}>
                    Ch {i + 1}
                  </span>
                  <br />
                  {c.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
