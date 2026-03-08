"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Radius from "./Radius";

const RadiusWrapper = () => {
  const [selectedRadius, setSelectedRadius] = useState<number>(() => {
    const stored = localStorage.getItem('radius');
    return stored ? parseFloat(stored) : 0.5;
  });

  // Set the CSS property immediately
  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--radius', `${selectedRadius}rem`);
  }, [selectedRadius]);

  // Persist to localStorage (can be async)
  useEffect(() => {
    localStorage.setItem('radius', selectedRadius.toString());
  }, [selectedRadius]);

  return <Radius selectedRadius={selectedRadius} onRadiusChange={setSelectedRadius} />;
};

export default RadiusWrapper;
