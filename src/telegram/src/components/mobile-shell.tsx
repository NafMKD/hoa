import type { ReactNode } from "react";

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="mobile-shell"
      style={{
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        padding: "0 20px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
      <style>{`
        .mobile-shell {
          background: linear-gradient(180deg, var(--color-bg) 0%, var(--color-surface-soft) 100%);
        }
      `}</style>
    </div>
  );
}
