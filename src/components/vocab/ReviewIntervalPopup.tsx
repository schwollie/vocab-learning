"use client";

import { useEffect, useRef, useState } from "react";

export default function ReviewIntervalPopup({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const dismissedRef = useRef(false);

  useEffect(() => {
    dismissedRef.current = false;
    setVisible(true);

    const fadeOut = window.setTimeout(() => setVisible(false), 1200);
    const remove = window.setTimeout(() => {
      if (dismissedRef.current) return;
      dismissedRef.current = true;
      onDismiss();
    }, 1600);

    return () => {
      window.clearTimeout(fadeOut);
      window.clearTimeout(remove);
    };
  }, [message, onDismiss]);

  return (
    <div
      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-20 max-w-[7rem]"
      aria-live="polite"
    >
      <div
        className={`inline-block rounded-md px-2 py-1 text-xs font-medium shadow-md border backdrop-blur-sm transition-all duration-300 ease-out bg-slate-800/90 text-white border-slate-600/60 ${
          visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
        }`}
      >
        {message}
      </div>
    </div>
  );
}
