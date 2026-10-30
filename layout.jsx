import "./globals.css";

export const metadata = {
  title: "SAILU RUN",
  description: "A 3D endless runner game",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}