import fs from "node:fs";
import path from "node:path";

export interface Invitado {
  /** URL de la invitación: /roberto-valencia-y-flia */
  slug: string;
  /** Nombre ya formateado para mostrar */
  nombre: string;
  pases: number;
}

/** Palabras que no se capitalizan salvo al inicio del nombre */
const MENORES = new Set(["y", "e", "de", "del", "la", "las", "los"]);

function aTitulo(texto: string): string {
  return texto
    .toLocaleLowerCase("es")
    .split(/\s+/)
    .map((palabra, i) =>
      i > 0 && MENORES.has(palabra)
        ? palabra
        : palabra.charAt(0).toLocaleUpperCase("es") + palabra.slice(1),
    )
    .join(" ");
}

function aSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // quita tildes: "Martínez" -> "Martinez"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Lee "lista de invitados.txt" de la raíz del proyecto.
 * Formato por línea:  NOMBRE — 3
 * Acepta guion largo (—), corto (-) o medio (–).
 */
export function leerInvitados(): Invitado[] {
  const archivo = path.join(process.cwd(), "lista de invitados.txt");
  const crudo = fs.readFileSync(archivo, "utf8");

  const usados = new Map<string, number>();
  const invitados: Invitado[] = [];

  for (const linea of crudo.split(/\r?\n/)) {
    const texto = linea.trim();
    if (!texto) continue;

    // .* es voraz a propósito: parte por el ÚLTIMO guion,
    // así un nombre que lleve guion no rompe el parseo.
    const partes = texto.match(/^(.*)[—–-]\s*(\d+)\s*$/);
    if (!partes) {
      console.warn(`[invitados] línea ignorada, no tiene "nombre — nº": ${texto}`);
      continue;
    }

    const nombreCrudo = partes[1].trim();
    let slug = aSlug(nombreCrudo);

    // Dos invitados homónimos no pueden compartir URL
    const repetido = usados.get(slug) ?? 0;
    usados.set(slug, repetido + 1);
    if (repetido > 0) slug = `${slug}-${repetido + 1}`;

    invitados.push({
      slug,
      nombre: aTitulo(nombreCrudo),
      pases: Number.parseInt(partes[2], 10),
    });
  }

  return invitados;
}
