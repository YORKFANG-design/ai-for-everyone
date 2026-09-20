import "./globals.css";

export const metadata = {
  title: "AI for Everyone",
  description: "Tell AI what you need. Get the work done."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
