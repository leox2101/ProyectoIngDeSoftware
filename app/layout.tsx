import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/public-sans";
import "./globals.css";
import BarraSuperior from "./components/BarraSuperior";

export const metadata: Metadata = {
  title: "Portal de Empleo",
  description:
    "Sube tu hoja de vida y descubre qué vacantes encajan con tus habilidades.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <BarraSuperior />
        <main className="pagina">
          <div className="contenedor">{children}</div>
        </main>
      </body>
    </html>
  );
}
