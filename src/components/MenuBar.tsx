// src/components/MenuBar.tsx
// La barre de menu en haut avec Fichier, Projet, Outils, Exporter

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import LogoIcon from "../assets/icons/Menubar/logo.svg?react";
import { SvgIcon } from "./SvgIcon";

// ─── Composant Menu déroulant ────────────────
// Props = les "paramètres" qu'on passe à un composant
interface MenuProps {
  label: string;
  children: React.ReactNode;
}

function Menu({ label, children }: MenuProps) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Ferme le menu si on clique en dehors
  useEffect(() => {
    function gererClicExterieur(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    }
    document.addEventListener("mousedown", gererClicExterieur);
    return () => document.removeEventListener("mousedown", gererClicExterieur);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOuvert(!ouvert)}
        className={`px-3 py-1 text-sm rounded transition-colors ${
          ouvert
            ? "bg-white/10 text-white"
            : "text-gray-300 hover:text-white hover:bg-white/8"
        }`}
      >
        {label}
      </button>

      {ouvert && (
        <div
          className="absolute top-full left-0 mt-1 min-w-[180px] rounded-lg shadow-2xl z-50 py-1"
          style={{
            background: "hsl(222, 22%, 13%)",
            border: "1px solid hsl(220, 15%, 24%)",
          }}
          // Ferme le menu après qu'un item a été cliqué
          onClick={() => setOuvert(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Item d'un menu ───────────────────────────
interface MenuItemProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

function MenuItem({ onClick, children, disabled }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
        disabled
          ? "text-gray-600 cursor-not-allowed"
          : "text-gray-300 hover:text-white hover:bg-white/8"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Séparateur dans un menu ──────────────────
function MenuSeparateur() {
  return (
    <div
      className="my-1 border-t"
      style={{ borderColor: "hsl(220, 15%, 22%)" }}
    />
  );
}

// ─────────────────────────────────────────────
// Composant principal : MenuBar
// ─────────────────────────────────────────────
export function MenuBar() {
  const {
    projet,
    modifie,
    nouveauProjet,
    ouvrirProjet,
    enregistrerProjet,
    sauvegarderProjet,
    setVueActive, // ← ajoute
    selectionnerEntree, // ← ajoute
    ongletActif,
  } = useApp();
  // Raccourci clavier Ctrl+S
  useEffect(() => {
    function gererTouche(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (projet) enregistrerProjet();
      }
    }
    document.addEventListener("keydown", gererTouche);
    return () => document.removeEventListener("keydown", gererTouche);
  }, [projet, enregistrerProjet]);

  // ─── Créer un nouveau projet ─────────────
  function handleNouveauProjet() {
    // Si des modifications non sauvegardées, on avertit
    if (modifie && projet) {
      if (
        !window.confirm(
          "Des modifications non sauvegardées seront perdues. Continuer ?",
        )
      ) {
        return;
      }
    }
    const nom = window.prompt("Nom du nouveau projet :", "Nouveau projet");
    if (nom && nom.trim()) {
      nouveauProjet(nom.trim());
    }
  }

  // ── Exporter setlist en .tl ────────────────
  function handleExporterTL() {
    if (!projet) return;
    const setlistData = {
      bandName: projet.bandName,
      setlistSongs: projet.setlistSongs ?? [],
    };
    const blob = new Blob([JSON.stringify(setlistData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `${(projet.bandName || "setlist").replace(/\s+/g, "_")}.tl`;
    lien.click();
    URL.revokeObjectURL(url);
  }

  // ── Imprimer ────────────────────────────
  function handleImprimer() {
    window.print();
  }

  // ── Exporter en PDF/JPG/PNG (utilise html2canvas) ──
  async function handleExporterFormat(format: "pdf" | "jpg" | "png") {
    const a4Container = document.querySelector(".setlist-a4-container") as HTMLElement;
    if (!a4Container) return;

    try {
      const html2canvas = (await import("html2canvas")).default;

      // Créer un clone de la feuille A4 à taille réelle hors écran
      const clone = a4Container.cloneNode(true) as HTMLElement;

      // Dimensions A4 réelles en pixels (210mm × 297mm à ~96 DPI)
      const a4LargeurPx = 794;
      const a4HauteurPx = 1123;

      // Appliquer les dimensions A4 réelles au clone
      clone.style.width = `${a4LargeurPx}px`;
      clone.style.height = `${a4HauteurPx}px`;
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "-9999px";
      clone.style.transform = "none"; // Annuler toute transformation
      clone.style.transformOrigin = "initial";

      // Ajouter le clone au body
      document.body.appendChild(clone);

      // Capturer le clone à taille réelle
      const canvas = await html2canvas(clone, {
        backgroundColor: "white",
        scale: 2, // Haute résolution
        width: a4LargeurPx,
        height: a4HauteurPx,
      });

      // Supprimer le clone
      document.body.removeChild(clone);

      if (format === "pdf") {
        // Pour PDF : ouvre une nouvelle fenêtre avec l'image et lance l'impression
        const imgData = canvas.toDataURL("image/png");
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${projet?.bandName || "Setlist"}</title>
                <style>
                  body { margin: 0; display: flex; justify-content: center; }
                  img { width: 210mm; height: 297mm; object-fit: contain; }
                </style>
              </head>
              <body>
                <img src="${imgData}" alt="Setlist" />
                <script>
                  window.onload = function() {
                    window.print();
                    window.onafterprint = function() { window.close(); };
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      } else {
        // JPG ou PNG : téléchargement direct
        const link = document.createElement("a");
        link.download = `${(projet?.bandName || "setlist").replace(/\s+/g, "_")}.${format}`;
        link.href = canvas.toDataURL(`image/${format}`);
        link.click();
      }
    } catch {
      window.alert("Erreur lors de l'exportation. Vérifiez que html2canvas est installé.");
    }
  }

  // ─── Ouvrir un fichier .tl ───────────────
  function handleOuvrirFichier() {
    if (modifie && projet) {
      if (
        !window.confirm(
          "Des modifications non sauvegardées seront perdues. Continuer ?",
        )
      ) {
        return;
      }
    }

    // Crée un input file invisible et le déclenche
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".tl,.json"; // Accepte .tl et .json (car c'est du JSON)
    input.onchange = (e) => {
      const fichier = (e.target as HTMLInputElement).files?.[0];
      if (!fichier) return;

      const lecteur = new FileReader();
      lecteur.onload = (e) => {
        const contenu = e.target?.result as string;
        const succes = ouvrirProjet(contenu);
        if (!succes) {
          window.alert(
            "Fichier invalide ou corrompu. Vérifiez que c'est bien un fichier ToneLab (.tl)",
          );
        }
      };
      lecteur.readAsText(fichier); // Lit le fichier comme du texte
    };
    input.click();
  }

  return (
    <div
      className="flex items-center gap-1 px-3 h-9 flex-shrink-0"
      style={{
        background: "hsl(222, 25%, 8%)",
        borderBottom: "1px solid hsl(220, 15%, 16%)",
      }}
    >
      {/* Logo / Nom de l'app */}
      <div className="flex items-center gap-2 mr-3">
        <LogoIcon
          width="20"
          height="20"
          style={{
            color: "hsl(var(--tl-accent-princ))",
          }}
        />
        <span className="text-sm font-semibold text-white">ToneLab</span>
      </div>

      {/* Séparateur vertical */}
      <div className="w-px h-4 bg-white/15 mr-1" />

      {/* ── Menu Fichier ── */}
      <Menu label="Fichier">
        <MenuItem onClick={handleNouveauProjet}>Nouveau projet</MenuItem>
        <MenuItem onClick={handleOuvrirFichier}>Ouvrir (.tl)…</MenuItem>
        <MenuSeparateur />
        <MenuItem onClick={enregistrerProjet} disabled={!projet || !modifie}>
          <span>Enregistrer</span>
          <span
            style={{
              color: "hsl(220, 15%, 40%)",
              fontSize: "11px",
              marginLeft: "8px",
            }}
          >
            Ctrl+S
          </span>
        </MenuItem>
        <MenuItem onClick={sauvegarderProjet} disabled={!projet}>
          Exporter le fichier .tl…
        </MenuItem>
      </Menu>

      {/* ── Menu Projet ── */}
      <Menu label="Projet">
        {projet ? (
          <>
            <div className="px-4 py-2 text-xs text-gray-500 select-none">
              Projet actif
            </div>
            <div className="px-4 pb-2 text-sm text-gray-300 font-medium">
              {projet.nom}
            </div>
            <MenuSeparateur />
            <div className="px-4 py-1 text-xs text-gray-500">
              {projet.entries.length} entrée
              {projet.entries.length !== 1 ? "s" : ""}
            </div>
          </>
        ) : (
          <div className="px-4 py-2 text-sm text-gray-500">
            Aucun projet ouvert
          </div>
        )}
      </Menu>

      {/* ── Menu Outils ── */}
      <Menu label="Outils">
        <MenuItem
          onClick={() => {
            setVueActive("home");
            selectionnerEntree(null);
          }}
        >
          Stack — Galerie plugins
        </MenuItem>
      </Menu>

      {/* ── Menu Exporter (visible uniquement sur Setlist) ── */}
      {ongletActif === "setlist" && (
        <Menu label="Exporter">
          <MenuItem onClick={handleExporterTL}>
            Exporter (.tl)
          </MenuItem>
          <MenuSeparateur />
          <MenuItem onClick={() => handleExporterFormat("pdf")}>
            Exporter en PDF
          </MenuItem>
          <MenuItem onClick={() => handleExporterFormat("jpg")}>
            Exporter en JPG
          </MenuItem>
          <MenuItem onClick={() => handleExporterFormat("png")}>
            Exporter en PNG
          </MenuItem>
          <MenuSeparateur />
          <MenuItem onClick={handleImprimer}>
            Imprimer
          </MenuItem>
        </Menu>
      )}

      {/* Espace flexible pour pousser les éléments à droite */}
      <div className="flex-1" />

      {/* Indicateur de modifications non sauvegardées */}
      {/* Après — témoin permanent */}
      <div
        className="flex items-center justify-center w-6 h-6"
        title={
          modifie
            ? "Modifications non enregistrées — Ctrl+S"
            : "Projet enregistré"
        }
      >
        {modifie ? (
          // Point orange — modifications en attente
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "hsl(38, 90%, 55%)" }}
          />
        ) : projet ? (
          // Coche verte — tout est enregistré
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <polyline
              points="2,6.5 5,9.5 10,3"
              stroke="hsl(var(--tl-accent-princ))"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </div>
    </div>
  );
}
