import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Code Learner",
  description:
    "Study tool for understanding coding concepts — plan, QA, and communicate with developers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
