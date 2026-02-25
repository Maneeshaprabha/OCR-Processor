
import "./globals.css";
import { LanguageProvider } from "@/app/Provider/LanguageProvider";
import { ThemeProvider } from "@/app/Provider/ThemeProvider";
import { AuthProvider } from "@/app/components/context/AuthProvider";

export const metadata = {
  title: "OCR Processor",
  description: "OCR App",
  icons: {
    icon: "/logo.ico",
    shortcut: "/logo.ico", 
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-full m-0 p-0" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}