import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "SPIDEYVERSE – Agent-Net",
  description: "A web of connected agents for modern business execution.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0A0F1C] text-[#E5ECF6] font-inter antialiased min-h-screen">
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#121A2B",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#E5ECF6",
              fontFamily: "Manrope, sans-serif",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
