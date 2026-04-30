import React, { useEffect, useState } from 'react';

interface SvgIconProps {
  src: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * Composant pour afficher un SVG importé avec ?raw
 * - Injecte le contenu SVG via dangerouslySetInnerHTML
 * - Le SVG hérite de la couleur du parent (currentColor fonctionne naturellement)
 * - Aucune modification du contenu SVG n'est nécessaire
 */
export function SvgIcon({ src, width, height, className, style, onClick }: SvgIconProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    if (typeof src !== 'string' || !src.trim()) {
      setSvgContent(null);
      return;
    }

    // Supprime la déclaration XML si présente (<?xml version="1.0"?>)
    let content = src;
    content = content.replace(/<\?xml[^?]*\?>/g, '');

    setSvgContent(content.trim());
  }, [src]);

  if (svgContent) {
    return (
      <div
        className={className}
        style={{
          width,
          height,
          ...style,
          flexShrink: 0,
        }}
        onClick={onClick}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  }

  // Fallback : <img> standard (ne supporte pas currentColor)
  return (
    <img
      src={src}
      width={width}
      height={height}
      className={className}
      style={{
        ...style,
        flexShrink: 0,
      }}
      onClick={onClick}
      alt=""
    />
  );
}
