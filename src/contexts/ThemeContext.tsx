import React, { createContext, useContext, useEffect, useState } from 'react';
import { useBrandingSettings } from '@/api/brandingApi';

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Generate color shades from a base color
function generateColorPalette(baseHex: string) {
  const base = hexToRgb(baseHex);
  if (!base) return null;

  // Generate lighter and darker shades
  const shades = {
    50: lighten(base, 0.95),
    100: lighten(base, 0.9),
    200: lighten(base, 0.8),
    300: lighten(base, 0.6),
    400: lighten(base, 0.4),
    500: base,
    600: darken(base, 0.1),
    700: darken(base, 0.25),
    800: darken(base, 0.4),
    900: darken(base, 0.55),
    950: darken(base, 0.7),
  };

  return shades;
}

function lighten(rgb: { r: number; g: number; b: number }, amount: number) {
  return {
    r: Math.round(rgb.r + (255 - rgb.r) * amount),
    g: Math.round(rgb.g + (255 - rgb.g) * amount),
    b: Math.round(rgb.b + (255 - rgb.b) * amount),
  };
}

function darken(rgb: { r: number; g: number; b: number }, amount: number) {
  return {
    r: Math.round(rgb.r * (1 - amount)),
    g: Math.round(rgb.g * (1 - amount)),
    b: Math.round(rgb.b * (1 - amount)),
  };
}

interface ThemeContextType {
  primaryColor: string;
  secondaryColor: string;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  primaryColor: '#2563EB',
  secondaryColor: '#1E40AF',
  isLoading: true,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { data: branding, isLoading } = useBrandingSettings();
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [secondaryColor, setSecondaryColor] = useState('#1E40AF');

  useEffect(() => {
    const primary = branding?.primaryColor || '#2563EB';
    const secondary = branding?.secondaryColor || '#1E40AF';

    setPrimaryColor(primary);
    setSecondaryColor(secondary);

    // Generate and apply primary color palette
    const primaryPalette = generateColorPalette(primary);
    if (primaryPalette) {
      Object.entries(primaryPalette).forEach(([shade, rgb]) => {
        document.documentElement.style.setProperty(
          `--color-primary-${shade}`,
          `${rgb.r} ${rgb.g} ${rgb.b}`
        );
      });
    }

    // Generate and apply secondary color palette
    const secondaryPalette = generateColorPalette(secondary);
    if (secondaryPalette) {
      Object.entries(secondaryPalette).forEach(([shade, rgb]) => {
        document.documentElement.style.setProperty(
          `--color-secondary-${shade}`,
          `${rgb.r} ${rgb.g} ${rgb.b}`
        );
      });
    }

    // Set base color variables
    document.documentElement.style.setProperty('--primary-color', primary);
    document.documentElement.style.setProperty('--secondary-color', secondary);
  }, [branding?.primaryColor, branding?.secondaryColor]);

  return (
    <ThemeContext.Provider value={{ primaryColor, secondaryColor, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
