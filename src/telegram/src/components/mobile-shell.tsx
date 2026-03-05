import type { ReactNode } from "react";

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        padding: "0 16px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
}
