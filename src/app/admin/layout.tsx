import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Panel · Solena",
  robots: { index: false, follow: false },
};

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return <div className="admin">{children}</div>;
}
