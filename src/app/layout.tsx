
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIMEO",
  description: "Sistema de Métricas de Extensão e Ocupação",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`antialiased`}>
        
        {children}
      </body>
    </html>
  );
}
