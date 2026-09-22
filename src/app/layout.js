import "./globals.css";
import Navbar from "@/components/navbar.js";
import PageTransition from "./transition.js";

export const metadata = {
  title: "Rayen Laafif — Cinematographer & Director",
  description: "Selected work by Rayen Laafif, cinematographer and director.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* The navbar sits outside the fade so it stays put between pages. */}
        <Navbar />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
