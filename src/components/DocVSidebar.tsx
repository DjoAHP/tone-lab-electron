import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useApp } from "../context/AppContext";
import type { DocvFileItem } from "../types";
import DossierIcon from "../assets/icons/DocV/dossier-sidebar.svg?react";
import DossierVideIcon from "../assets/icons/DocV/dossier-vide-sidebar.svg?react";
import DocIcon from "../assets/icons/DocV/doc-sidebar.svg?react";

const LARGEUR_MIN = 300;
const LARGEUR_MAX = 500;

// Lit toutes les entrées d'un DirectoryReader de manière récursive
function readAllEntries(dirReader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise<FileSystemEntry[]>((resolve) => {
    const entries: FileSystemEntry[] = [];
    const lire = () => {
      dirReader.readEntries((results) => {
        if (results.length === 0) {
          resolve(entries);
          return;
        }
        entries.push(...results);
        lire();
      });
    };
    lire();
  });
}

// Récupère tous les IDs de dossiers dans l'arbre
function getAllFolderIds(items: DocvFileItem[] | null): string[] {
  if (!items) return [];
  const ids: string[] = [];
  for (const item of items) {
    if (item.type === "folder") {
      ids.push(item.id);
      if (item.children) {
        ids.push(...getAllFolderIds(item.children));
      }
    }
  }
  return ids;
}

// Parcours récursif de l'arborescence — retourne une structure arborescente propre
async function traverseFileTree(item: FileSystemEntry, path: string): Promise<DocvFileItem | null> {
  if (item.isFile) {
    return new Promise<DocvFileItem | null>((resolve) => {
      (item as FileSystemFileEntry).file((file: File) => {
        const extension = file.name.split(".").pop()?.toLowerCase();
        const allowedExtensions = ["jpg", "jpeg", "png", "pdf"];
        if (extension && allowedExtensions.includes(extension)) {
          resolve({
            id: `${path}/${file.name}`,
            name: file.name,
            type: "file",
            path,
            extension,
            size: file.size,
            _file: file,
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  if (item.isDirectory) {
    const folderId = `${path}/${item.name}`;
    const dirReader = (item as FileSystemDirectoryEntry).createReader();
    const entries = await readAllEntries(dirReader);

    const childPromises = entries.map((entry) => traverseFileTree(entry, folderId));
    const childResults = await Promise.all(childPromises);
    const children = childResults.filter((c): c is DocvFileItem => c !== null);

    // Ne pas ajouter les dossiers vides
    if (children.length === 0) return null;

    return {
      id: folderId,
      name: item.name,
      type: "folder",
      path,
      children,
    };
  }

  return null;
}

export function DocVSidebar() {
  const {
    docvFiles,
    docvSelectedFile,
    setDocvSelectedFile,
    docvSidebarWidth,
    setDocvSidebarWidth,
    toggleDocvSidebar,
    setDocvFiles,
  } = useApp();

  const [dragOver, setDragOver] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const enTrainDeRedimensionner = useRef(false);
  const xDepart = useRef(0);
  const largeurDepart = useRef(0);

  // Ouvrir automatiquement les nouveaux dossiers
  useEffect(() => {
    if (!docvFiles || docvFiles.length === 0) {
      setExpandedFolders(new Set());
      return;
    }
  }, [docvFiles]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      const items = e.dataTransfer.items;
      if (!items || items.length === 0) return;

      const entries: FileSystemEntry[] = [];
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry();
        if (entry) entries.push(entry);
      }

      if (entries.length === 0) return;

      const results = await Promise.all(
        entries.map((entry) => traverseFileTree(entry, ""))
      );
      const fileItems = results.filter((r): r is DocvFileItem => r !== null);

      // Ajouter les nouveaux fichiers/dossiers sans remplacer les existants
      const existingIds = new Set(docvFiles?.map((f: DocvFileItem) => f.id) ?? []);
      const filtered = fileItems.filter((f: DocvFileItem) => !existingIds.has(f.id));
      setDocvFiles([...(docvFiles ?? []), ...filtered]);
    },
    [setDocvFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  // Toggle dossier ou sélectionner fichier
  const handleFolderClick = useCallback(
    (item: DocvFileItem) => {
      if (item.type === "file") {
        setDocvSelectedFile(item.id);
      } else {
        // Toggle expanded/collapsed
        setExpandedFolders(prev => {
          const current = prev || new Set();
          const next = new Set(current);
          if (next.has(item.id)) {
            next.delete(item.id);
          } else {
            next.add(item.id);
          }
          return next;
        });
      }
    },
    [setDocvSelectedFile]
  );

  // Rendu récursif de l'arbre (pas de useCallback pour éviter les closures obsolètes)
  const renderTree = (items: DocvFileItem[], level: number = 0) => {
    return items.map((item) => {
      const isFolder = item.type === "folder";
      const isSelected = docvSelectedFile === item.id;
      const indent = level * 20;

      if (isFolder) {
        const isExpanded = expandedFolders.has(item.id);
        return (
          <div key={item.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleFolderClick(item)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "4px 8px",
                paddingLeft: `${indent + 8}px`,
                margin: "2px 4px",
                background: isSelected
                  ? "hsl(220, 15%, 18%)"
                  : "transparent",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
                color: isSelected
                  ? "hsl(var(--tl-accent-princ))"
                  : "hsl(220, 15%, 70%)",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isSelected)
                  e.currentTarget.style.background = "hsl(220, 15%, 14%)";
              }}
              onMouseLeave={(e) => {
                if (!isSelected)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              {isExpanded ? (
                <DossierIcon
                  width={16}
                  height={16}
                  style={{ marginRight: 8, flexShrink: 0 }}
                />
              ) : (
                <DossierVideIcon
                  width={16}
                  height={16}
                  style={{ marginRight: 8, flexShrink: 0 }}
                />
              )}
              <span
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.name}
              </span>
            </div>
            {isExpanded && item.children && item.children.length > 0 && (
              <div>{renderTree(item.children, level + 1)}</div>
            )}
          </div>
        );
      }

      // Fichier
      return (
        <div
          key={item.id}
          role="button"
          tabIndex={0}
          onClick={() => setDocvSelectedFile(item.id)}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "4px 8px",
            paddingLeft: `${indent + 8}px`,
            margin: "2px 4px",
            background: isSelected
              ? "hsl(220, 15%, 18%)"
              : "transparent",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "13px",
            color: isSelected
              ? "hsl(var(--tl-accent-princ))"
              : "hsl(220, 15%, 70%)",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!isSelected)
              e.currentTarget.style.background = "hsl(220, 15%, 14%)";
          }}
          onMouseLeave={(e) => {
            if (!isSelected)
              e.currentTarget.style.background = "transparent";
          }}
        >
          <DocIcon
            width={16}
            height={16}
            style={{ marginRight: 8, flexShrink: 0 }}
          />
          <span
            style={{
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.name}
          </span>
          {item.size != null && (
            <span
              style={{
                fontSize: "11px",
                color: "hsl(220, 15%, 50%)",
                marginLeft: 8,
                flexShrink: 0,
              }}
            >
              {item.size < 1024
                ? `${item.size} o`
                : item.size < 1048576
                ? `${(item.size / 1024).toFixed(1)} Ko`
                : `${(item.size / 1048576).toFixed(1)} Mo`}
            </span>
          )}
        </div>
      );
    });
  };

  // Redimensionnement
  const demarrerRedimensionnement = useCallback(
    (e: React.MouseEvent) => {
      enTrainDeRedimensionner.current = true;
      xDepart.current = e.clientX;
      largeurDepart.current = docvSidebarWidth;
      e.preventDefault();
      e.stopPropagation();
    },
    [docvSidebarWidth]
  );

  useEffect(() => {
    function surMouvement(e: MouseEvent) {
      if (!enTrainDeRedimensionner.current) return;
      const delta = e.clientX - xDepart.current;
      const nouvelleLargeur = Math.min(
        Math.max(largeurDepart.current + delta, LARGEUR_MIN),
        LARGEUR_MAX
      );
      setDocvSidebarWidth(nouvelleLargeur);
    }
    function surRelachement() {
      enTrainDeRedimensionner.current = false;
    }
    document.addEventListener("mousemove", surMouvement);
    document.addEventListener("mouseup", surRelachement);
    return () => {
      document.removeEventListener("mousemove", surMouvement);
      document.removeEventListener("mouseup", surRelachement);
    };
  }, [setDocvSidebarWidth]);

  return (
    <div
      className="flex flex-col h-full flex-shrink-0 relative"
      style={{
        width: `${docvSidebarWidth}px`,
        flexShrink: 0,
        height: "100%",
        background: "hsl(222, 20%, 11%)",
        borderRight: "1px solid hsl(220, 15%, 18%)",
        display: "flex",
        flexDirection: "column",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* En-tête */}
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid hsl(220, 15%, 16%)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "hsl(220, 15%, 45%)",
          }}
        >
          DocV
        </span>
        <button
          onClick={toggleDocvSidebar}
          style={{
            background: "none",
            border: "none",
            color: "hsl(220, 15%, 50%)",
            cursor: "pointer",
            fontSize: "16px",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "hsl(220, 15%, 14%)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "none";
          }}
        >
          ✕
        </button>
      </div>

      {/* Zone de dépôt */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: dragOver
            ? "hsl(220, 15%, 18%)"
            : "hsl(222, 20%, 11%)",
          transition: "background 0.2s",
          padding: "20px",
        }}
      >
        {!docvFiles ? (
          <div style={{ textAlign: "center", color: "hsl(220, 15%, 50%)" }}>
            <div
              style={{
                marginBottom: "12px",
                opacity: 0.5,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <DossierVideIcon width={32} height={32} />
            </div>
            <div style={{ fontSize: "13px", lineHeight: 1.6 }}>
              Glissez-déposez un dossier ici
              <br />
              contenant des images JPG, PNG
              <br />
              ou des fichiers PDF
            </div>
          </div>
        ) : (
          <div style={{ padding: "4px 0" }}>{renderTree(docvFiles)}</div>
        )}
      </div>

      {/* Poignée redimensionnement */}
      <div
        onMouseDown={demarrerRedimensionnement}
        className="absolute top-0 right-0 h-full"
        style={{
          width: "4px",
          cursor: "col-resize",
          background: "transparent",
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background =
            "hsl(var(--tl-accent-princ) / 0.3)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = "transparent";
        }}
      />
    </div>
  );
}