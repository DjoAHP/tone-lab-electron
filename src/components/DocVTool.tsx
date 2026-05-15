import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useApp } from "../context/AppContext";
import type { DocvFileItem } from "../types";
import DocIcon from "../assets/icons/DocV/doc-sidebar.svg?react";
import DocVideIcon from "../assets/icons/DocV/doc-vide.svg?react";
import FullscreenIcon from "../assets/icons/DocV/fullscreen.svg?react";

export function DocVTool() {
  const {
    docvSelectedFile,
    docvFiles,
    setDocvSelectedFile,
  } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Calcul des dimensions A4 responsives
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const padding = 48; // 24px chaque côté
    const availableWidth = rect.width - padding;
    const availableHeight = rect.height - padding;

    const a4Ratio = 210 / 297; // ≈ 0.707

    let w = availableWidth;
    let h = availableWidth * a4Ratio;

    if (h > availableHeight) {
      h = availableHeight;
      w = availableHeight / a4Ratio;
    }

    setDimensions({ width: Math.floor(w), height: Math.floor(h) });
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [updateDimensions]);

  // Trouver l'élément sélectionné dans l'arbre
  const findItem = useCallback(
    (items: DocvFileItem[] | null, id: string): DocvFileItem | null => {
      if (!items) return null;
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findItem(item.children, id);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  // Sélection automatique du premier fichier quand un dossier est sélectionné
  const selectedItem = useMemo(() => {
    if (!docvFiles || !docvSelectedFile) return null;
    return findItem(docvFiles, docvSelectedFile);
  }, [docvFiles, docvSelectedFile, findItem]);

  // Générer l'URL objet quand le fichier change
  useEffect(() => {
    // Nettoyer l'ancienne URL objet
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
    setError(null);

    if (!selectedItem || selectedItem.type === "folder") return;
    if (!selectedItem._file) return;

    const url = URL.createObjectURL(selectedItem._file);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedItem]);

  // Nettoyage global au démontage
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  // Calculer le type MIME
  const mimeType = useMemo(() => {
    if (!selectedItem || !selectedItem.extension) return undefined;
    const ext = selectedItem.extension.toLowerCase();
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    if (ext === "png") return "image/png";
    if (ext === "pdf") return "application/pdf";
    return undefined;
  }, [selectedItem]);

  const isImage = mimeType?.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  // Taille du fichier lisible
  const readableSize = useMemo(() => {
    if (!selectedItem?.size) return "";
    const bytes = selectedItem.size;
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1048576).toFixed(1)} Mo`;
  }, [selectedItem]);

  // Navigation entre fichiers
  const allFiles = useMemo(() => {
    if (!docvFiles) return [];
    const result: DocvFileItem[] = [];
    const flatten = (items: DocvFileItem[]) => {
      for (const item of items) {
        if (item.type === "file") result.push(item);
        if (item.children) flatten(item.children);
      }
    };
    flatten(docvFiles);
    return result;
  }, [docvFiles]);

  const currentIndex = useMemo(() => {
    return allFiles.findIndex((f) => f.id === docvSelectedFile);
  }, [allFiles, docvSelectedFile]);

  const navigateFile = useCallback(
    (direction: "prev" | "next") => {
      if (allFiles.length === 0) return;
      let idx = currentIndex;
      if (direction === "next") {
        idx = (currentIndex + 1) % allFiles.length;
      } else {
        idx = (currentIndex - 1 + allFiles.length) % allFiles.length;
      }
      setDocvSelectedFile(allFiles[idx].id);
    },
    [allFiles, currentIndex, setDocvSelectedFile]
  );

  // Plein écran
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen?.() ?? document.documentElement.requestFullscreen();
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        navigateFile("prev");
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        navigateFile("next");
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigateFile, toggleFullscreen]);

  if (!selectedItem) {
    return (
      <div
        ref={containerRef}
        className="flex-1 flex flex-col items-center justify-center relative"
        style={{ background: "hsl(222, 25%, 8%)", overflow: "hidden" }}
      >
        <div style={{ textAlign: "center", color: "hsl(220, 15%, 50%)" }}>
          <div style={{ marginBottom: "16px", opacity: 0.3, display: "flex", justifyContent: "center" }}>
            <DocVideIcon width={48} height={48} />
          </div>
          <div style={{ fontSize: "14px" }}>
            Sélectionnez un fichier dans la barre latérale
          </div>
          <div style={{ fontSize: "12px", marginTop: 4, opacity: 0.6 }}>
            ou déposez un dossier contenant des images/PDF
          </div>
        </div>
      </div>
    );
  }

  if (selectedItem.type === "folder") {
    return (
      <div
        ref={containerRef}
        className="flex-1 flex flex-col items-center justify-center relative"
        style={{ background: "hsl(222, 25%, 8%)", overflow: "hidden" }}
      >
        <div style={{ textAlign: "center", color: "hsl(220, 15%, 50%)" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>
            📁
          </div>
          <div style={{ fontSize: "14px" }}>
            "{selectedItem.name}" est un dossier
          </div>
          <div style={{ fontSize: "12px", marginTop: 4, opacity: 0.6 }}>
            Sélectionnez un fichier à l'intérieur
          </div>
        </div>
      </div>
    );
  }

  // ── Mode plein écran total ──────────────────────────────────
  if (isFullscreen) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 9999,
          overflow: "hidden",
        }}
      >
        {/* Barre flottante en haut */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 48,
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            zIndex: 10,
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
            {selectedItem.name}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => navigateFile("prev")}
              disabled={allFiles.length <= 1}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.2)",
                color: allFiles.length > 1 ? "white" : "rgba(255,255,255,0.2)",
                cursor: allFiles.length > 1 ? "pointer" : "default",
                fontSize: "18px",
                padding: "4px 12px",
                borderRadius: "6px",
              }}
            >
              ◀
            </button>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
              {currentIndex + 1} / {allFiles.length}
            </span>
            <button
              onClick={() => navigateFile("next")}
              disabled={allFiles.length <= 1}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.2)",
                color: allFiles.length > 1 ? "white" : "rgba(255,255,255,0.2)",
                cursor: allFiles.length > 1 ? "pointer" : "default",
                fontSize: "18px",
                padding: "4px 12px",
                borderRadius: "6px",
              }}
            >
              ▶
            </button>
            <button
              onClick={toggleFullscreen}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "white",
                cursor: "pointer",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "13px",
                marginLeft: 8,
              }}
            >
              ✕ Quitter
            </button>
          </div>
        </div>

        {/* Document en plein écran */}
        {error ? (
          <div style={{ textAlign: "center", color: "hsl(0, 60%, 50%)" }}>
            <div style={{ fontSize: "14px", marginBottom: 8 }}>⚠ Erreur de chargement</div>
            <div style={{ fontSize: "12px", opacity: 0.7 }}>{error}</div>
          </div>
        ) : isImage && objectUrl ? (
          <img
            src={objectUrl}
            alt={selectedItem.name}
            style={{
              maxWidth: "100vw",
              maxHeight: "100vh",
              objectFit: "contain",
            }}
            onError={() => setError("Impossible de charger l'image")}
          />
        ) : isPdf && objectUrl ? (
          <iframe
            src={objectUrl}
            title={selectedItem.name}
            style={{
              width: "100vw",
              height: "100vh",
              border: "none",
              background: "white",
            }}
            onError={() => setError("Impossible de charger le PDF")}
          />
        ) : (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px", opacity: 0.3 }}>
              📄
            </div>
            <div style={{ fontSize: "13px" }}>Chargement...</div>
          </div>
        )}

        {/* Nom du fichier en bas */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: "50%",
            transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.35)",
            fontSize: "12px",
            textAlign: "center",
            maxWidth: "80vw",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {selectedItem.name}
        </div>
      </div>
    );
  }

  // ── Mode normal (pas plein écran) ───────────────────────────
  return (
    <div className="flex-1 flex flex-col relative" style={{ background: "hsl(222, 25%, 8%)", overflow: "hidden" }}>
      {/* Barre d'info en haut */}
      <div
        style={{
          padding: "8px 20px",
          background: "hsl(222, 20%, 11%)",
          borderBottom: "1px solid hsl(220, 15%, 16%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          height: 42,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <DocIcon style={{ width: 16, height: 16, color: "hsl(220, 15%, 50%)" }} />
          <span
            style={{
              fontSize: "13px",
              color: "hsl(220, 15%, 80%)",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 300,
            }}
          >
            {selectedItem.name}
          </span>
          <span style={{ fontSize: "11px", color: "hsl(220, 15%, 45%)" }}>
            {selectedItem.extension?.toUpperCase()} · {readableSize}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => navigateFile("prev")}
            disabled={allFiles.length <= 1}
            style={{
              background: "none",
              border: "none",
              color: allFiles.length > 1 ? "hsl(220, 15%, 60%)" : "hsl(220, 15%, 30%)",
              cursor: allFiles.length > 1 ? "pointer" : "default",
              fontSize: "16px",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            ◀
          </button>
          <span style={{ fontSize: "11px", color: "hsl(220, 15%, 45%)" }}>
            {currentIndex + 1}/{allFiles.length}
          </span>
          <button
            onClick={() => navigateFile("next")}
            disabled={allFiles.length <= 1}
            style={{
              background: "none",
              border: "none",
              color: allFiles.length > 1 ? "hsl(220, 15%, 60%)" : "hsl(220, 15%, 30%)",
              cursor: allFiles.length > 1 ? "pointer" : "default",
              fontSize: "16px",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            ▶
          </button>
          {/* Bouton plein écran */}
          <button
            onClick={toggleFullscreen}
            title="Plein écran (F)"
            style={{
              background: "none",
              border: "none",
              color: "hsl(220, 15%, 45%)",
              cursor: "pointer",
              padding: "4px 6px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.7,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.7"; }}
          >
            <FullscreenIcon style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {/* Zone A4 */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-5"
        style={{ overflow: "auto", background: "hsl(222, 25%, 8%)" }}
      >
        {error ? (
          <div style={{ textAlign: "center", color: "hsl(0, 60%, 50%)" }}>
            <div style={{ fontSize: "14px", marginBottom: 8 }}>⚠ Erreur de chargement</div>
            <div style={{ fontSize: "12px", opacity: 0.7 }}>{error}</div>
          </div>
        ) : isImage && objectUrl ? (
          <img
            src={objectUrl}
            alt={selectedItem.name}
            style={{
              width: dimensions.width,
              height: dimensions.height,
              objectFit: "contain",
              background: "white",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              borderRadius: "2px",
            }}
            onError={() => setError("Impossible de charger l'image")}
          />
        ) : isPdf && objectUrl ? (
          <iframe
            src={objectUrl}
            title={selectedItem.name}
            style={{
              width: dimensions.width,
              height: dimensions.height,
              border: "none",
              background: "white",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              borderRadius: "2px",
            }}
            onError={() => setError("Impossible de charger le PDF")}
          />
        ) : (
          <div style={{ textAlign: "center", color: "hsl(220, 15%, 50%)" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px", opacity: 0.3 }}>
              📄
            </div>
            <div style={{ fontSize: "13px" }}>Chargement...</div>
          </div>
        )}
      </div>
    </div>
  );
}