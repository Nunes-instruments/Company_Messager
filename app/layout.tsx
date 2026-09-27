import "./globals.css";

export const metadata = {
  title: "Nunes Connect",
  description: "Customer messaging and engagement platform for Nunes Instrumentation",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
