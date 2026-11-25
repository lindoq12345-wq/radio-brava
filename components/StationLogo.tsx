/* eslint-disable @next/next/no-img-element */
"use client";

import { Radio } from "lucide-react";
import { useState } from "react";

interface Props {
  src: string;
  className?: string;
}

export default function StationLogo({ src, className = "h-12 w-12" }: Props) {
  const [failed, setFailed] = useState(false);
  // Favicons http:// seriam bloqueados (mixed content) numa página https.
  const ok = src.startsWith("https://") && !failed;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 ${className}`}
    >
      {ok ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <Radio className="h-1/2 w-1/2 text-zinc-400" aria-hidden />
      )}
    </div>
  );
}
