import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Heart, Download, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Amplify, { Storage } from "aws-amplify";
import awsExports from "./aws-exports";
Amplify.configure(awsExports);

// --- Utilidades ---
const samplePins = [
  {
    id: "1",
    src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
    title: "Cocina minimalista",
    author: "@nora.design",
    tags: ["hogar", "diseño", "interiores"],
  },
  {
    id: "2",
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
    title: "Montañas al amanecer",
    author: "@ramiro",
    tags: ["naturaleza", "viajes"],
  },
  {
    id: "3",
    src: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1600&auto=format&fit=crop",
    title: "Pastel de frutas",
    author: "@dulcevida",
    tags: ["comida", "recetas"],
  },
  {
    id: "4",
    src: "https://images.unsplash.com/photo-1517816428104-797678c7cf0d?q=80&w=1600&auto=format&fit=crop",
    title: "Estudio de trabajo",
    author: "@makerlab",
    tags: ["setup", "productividad"],
  },
  {
    id: "5",
    src: "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?q=80&w=1600&auto=format&fit=crop",
    title: "Moda urbana",
    author: "@streetfit",
    tags: ["moda", "outfits"],
  },
  {
    id: "6",
    src: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1600&auto=format&fit=crop",
    title: "Plantas en casa",
    author: "@verde",
    tags: ["plantas", "hogar"],
  },
  {
    id: "7",
    src: "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=1600&auto=format&fit=crop",
    title: "Café perfecto",
    author: "@barista",
    tags: ["comida", "bebidas"],
  },
  {
    id: "8",
    src: "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=1600&auto=format&fit=crop",
    title: "Arte abstracto",
    author: "@colors",
    tags: ["arte", "creatividad"],
  },
];

const allTags = [
  "todos",
  "hogar",
  "diseño",
  "interiores",
  "naturaleza",
  "viajes",
  "comida",
  "recetas",
  "setup",
  "productividad",
  "moda",
  "outfits",
  "plantas",
  "bebidas",
  "arte",
  "creatividad",
];

// --- Tarjeta de Pin ---
function PinCard({ pin, liked, onLike, onOpen }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="mb-4 break-inside-avoid"
   >
      <div className="group relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5">
        <img
          src={pin.src}
          alt={pin.title}
          className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
          onClick={() => onOpen(pin)}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
          <div className="space-y-1">
            <div className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-800 backdrop-blur">
              {pin.author}
            </div>
            <div className="flex flex-wrap gap-1">
              {pin.tags.slice(0, 3).map((t) => (
                <span key={t} className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] text-gray-700 backdrop-blur">
                  #{t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="pointer-events-auto rounded-full bg-white/90 shadow backdrop-blur hover:bg-white"
              onClick={() => onLike(pin.id)}
            >
              <Heart className={`mr-1 h-4 w-4 ${liked ? "fill-red-500 stroke-red-500" : ""}`} />
              {liked ? "Guardado" : "Guardar"}
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="pointer-events-auto rounded-full bg-white/90 shadow backdrop-blur hover:bg-white"
              onClick={() => onOpen(pin)}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="px-1 pt-2 text-sm font-medium text-gray-800">{pin.title}</div>
    </motion.div>
  );
}

// --- Visor Modal ---
function Viewer({ open, pin, onClose }) {
  return (
    <AnimatePresence>
      {open && pin && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            layout
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow hover:bg-white"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="grid gap-0 md:grid-cols-5">
              <div className="md:col-span-3">
                <img src={pin.src} alt={pin.title} className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-col gap-4 p-5 md:col-span-2">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{pin.title}</h3>
                  <p className="text-sm text-gray-500">por {pin.author}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pin.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                      #{t}
                    </Badge>
                  ))}
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Button className="rounded-full">Guardar</Button>
                  <Button variant="secondary" className="rounded-full" asChild>
                    <a href={pin.src} download>
                      <Download className="mr-2 h-4 w-4" /> Descargar
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Componente principal ---
export default function PinterestClone() {
  const [pins, setPins] = useState(samplePins);
  const [liked, setLiked] = useState(() => new Set());
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("todos");
  const [viewerPin, setViewerPin] = useState(null);
  const [openViewer, setOpenViewer] = useState(false);
  const [sortBy, setSortBy] = useState("recientes");
  const fileRef = useRef(null);

  const filtered = useMemo(() => {
    let list = pins.filter((p) =>
      [p.title, p.author, ...(p.tags || [])]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())
    );
    if (tag !== "todos") list = list.filter((p) => p.tags.includes(tag));

    if (sortBy === "nombre") list.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === "guardados")
      list.sort((a, b) => (liked.has(b.id) ? 1 : 0) - (liked.has(a.id) ? 1 : 0));

    return list;
  }, [pins, query, tag, sortBy, liked]);

  const onLike = (id) => {
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const onOpen = (pin) => {
    setViewerPin(pin);
    setOpenViewer(true);
  };

  const onClose = () => setOpenViewer(false);

  const onUpload = async (file) => {
    if (!file) return;
    try {
      // Subir a S3
      const s3Key = `pins/${Date.now()}_${file.name}`;
      await Storage.put(s3Key, file, {
        contentType: file.type,
        level: "public"
      });
      const imageUrl = await Storage.get(s3Key, { level: "public" });
      const id = String(Date.now());
      const newPin = {
        id,
        src: imageUrl,
        title: file.name.replace(/\.[^.]+$/, ""),
        author: "@tú",
        tags: ["subido"],
      };
      setPins((p) => [newPin, ...p]);
    } catch (err) {
      alert("Error al subir la imagen a AWS S3: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gray-900 text-white shadow">
              P
            </div>
            <span className="text-lg font-semibold">Arcadia</span>
          </div>

          <div className="relative ml-2 hidden flex-1 items-center sm:flex">
            <Search className="absolute left-3 h-5 w-5 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca ideas, recetas, lugares…"
              className="w-full rounded-full pl-10"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="rounded-full">
                  <Filter className="mr-2 h-4 w-4" /> Filtrar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Etiquetas</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allTags.map((t) => (
                  <DropdownMenuItem key={t} onClick={() => setTag(t)}>
                    {tag === t ? "✓ " : ""}
                    {t}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                {[
                  { k: "recientes", label: "Recientes" },
                  { k: "nombre", label: "Nombre" },
                  { k: "guardados", label: "Más guardados" },
                ].map((opt) => (
                  <DropdownMenuItem key={opt.k} onClick={() => setSortBy(opt.k)}>
                    {sortBy === opt.k ? "✓ " : ""}
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={() => fileRef.current?.click()}
              className="rounded-full"
            >
              <Plus className="mr-2 h-4 w-4" /> Crear Pin
            </Button>
            <input
              type="file"
              accept="image/*"
              ref={fileRef}
              className="hidden"
              onChange={(e) => onUpload(e.target.files?.[0])}
            />
          </div>
        </div>

        {/* Barra de búsqueda en móvil */}
        <div className="px-4 pb-3 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca ideas, recetas, lugares…"
              className="w-full rounded-full pl-10"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Etiqueta:</span>
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 6).map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    tag === t ? "border-gray-900 bg-gray-900 text-white" : "bg-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {filtered.length} resultados
            </Badge>
            {tag !== "todos" && (
              <Badge className="rounded-full px-3 py-1">#{tag}</Badge>
            )}
          </div>
          <div className="text-sm text-gray-500">Orden: {sortBy}</div>
        </div>

        {/* Masonry con CSS columns */}
        <motion.div
          layout
          className="columns-1 gap-4 [column-fill:_balance] sm:columns-2 md:columns-3 lg:columns-4"
        >
          <AnimatePresence>
            {filtered.map((pin) => (
              <PinCard
                key={pin.id}
                pin={pin}
                liked={liked.has(pin.id)}
                onLike={onLike}
                onOpen={onOpen}
              />)
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <Viewer open={openViewer} pin={viewerPin} onClose={onClose} />

    </div>
  );
}
