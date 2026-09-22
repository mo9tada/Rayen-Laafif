import "./globals.css";
import Navbar from "@/components/navbar.js";
import PageTransition from "./transition.js";
import { NavigationProvider } from "./navigation-context.js";

export const metadata = {
  title: "Rayen Laafif — Cinematographer & Director",
  description: "Selected work by Rayen Laafif, cinematographer and director.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* The provider wraps both, so the navbar can react to a pending route
            while the page below it is still fading out. */}
        <NavigationProvider>
          <Navbar />
          <PageTransition>{children}</PageTransition>
        </NavigationProvider>
      </body>
    </html>
  );
}
