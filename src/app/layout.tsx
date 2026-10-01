import type { Metadata } from "next";
import { MainProviders } from "@/Providers/MainProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineText AI - Multi-Model & Vision Chat Studio",
  description: "Enterprise Next.js & TypeScript AI Studio powered by Qwen 2.5, DeepSeek R1, Llama 3.3, and Multi-Image Vision AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body>
        <MainProviders>{children}</MainProviders>
      </body>
    </html>
  );
}
