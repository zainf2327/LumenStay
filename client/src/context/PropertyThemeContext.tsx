import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface PropertyThemeTokens {
  slug: string;
  name: string;
  heritageColor: string;
  heritageBg: string;
  heritageBorder: string;
  location: string;
}

export const PROPERTY_HERITAGE_MAP: Record<string, PropertyThemeTokens> = {
  'prop-birchwood': {
    slug: 'the-birchwood',
    name: 'The Birchwood',
    heritageColor: '#2D4A3E',
    heritageBg: '#EBF4EF',
    heritageBorder: '#C8E3D4',
    location: 'Aspen, CO',
  },
  'prop-copperline': {
    slug: 'copperline-inn',
    name: 'Copperline Inn',
    heritageColor: '#B85D19',
    heritageBg: '#FAF0E8',
    heritageBorder: '#F2D7C2',
    location: 'Breckenridge, CO',
  },
  'prop-wren': {
    slug: 'the-wren-house',
    name: 'The Wren House',
    heritageColor: '#9C7A3C',
    heritageBg: '#FAF6EE',
    heritageBorder: '#ECE2CE',
    location: 'Telluride, CO',
  },
  'prop-sundowner': {
    slug: 'sundowner-lodge',
    name: 'Sundowner Lodge',
    heritageColor: '#C85A32',
    heritageBg: '#FAF2EE',
    heritageBorder: '#F3D6CA',
    location: 'Park City, UT',
  },
  'prop-cedar-salt': {
    slug: 'cedar-and-salt',
    name: 'Cedar & Salt',
    heritageColor: '#A44A3F',
    heritageBg: '#FAF0EF',
    heritageBorder: '#F2D3D0',
    location: 'Moab, UT',
  },
  'prop-ledger': {
    slug: 'the-ledger',
    name: 'The Ledger',
    heritageColor: '#2B3A4A',
    heritageBg: '#EEF2F6',
    heritageBorder: '#D1DCE7',
    location: 'Salt Lake City, UT',
  },
};

interface PropertyThemeContextType {
  activePropertyTheme: PropertyThemeTokens;
  heritageMap: Record<string, PropertyThemeTokens>;
}

const DEFAULT_THEME: PropertyThemeTokens = {
  slug: 'lumenstay',
  name: 'LumenStay Portfolio',
  heritageColor: '#B08D57',
  heritageBg: '#FAF6EE',
  heritageBorder: '#ECE2CE',
  location: 'Colorado & Utah',
};

const PropertyThemeContext = createContext<PropertyThemeContextType>({
  activePropertyTheme: DEFAULT_THEME,
  heritageMap: PROPERTY_HERITAGE_MAP,
});

export const PropertyThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentProperty } = useAuth();

  const activeTheme = (currentProperty && PROPERTY_HERITAGE_MAP[currentProperty.id]) 
    ? PROPERTY_HERITAGE_MAP[currentProperty.id] 
    : DEFAULT_THEME;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--property-heritage-color', activeTheme.heritageColor);
    root.style.setProperty('--property-heritage-bg', activeTheme.heritageBg);
    root.style.setProperty('--property-heritage-border', activeTheme.heritageBorder);
  }, [activeTheme]);

  return (
    <PropertyThemeContext.Provider value={{ activePropertyTheme: activeTheme, heritageMap: PROPERTY_HERITAGE_MAP }}>
      {children}
    </PropertyThemeContext.Provider>
  );
};

export const usePropertyTheme = () => useContext(PropertyThemeContext);
