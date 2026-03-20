"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Radius from "./Radius";

const RadiusWrapper = () => {
  const [selectedRadius, setSelectedRadius] = useState<number>(() => {
    if (typeof window === "undefined") return 0.5;
    const stored = localStorage.getItem("radius");
    return stored ? parseFloat(stored) : 0.5;
  });

  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--radius", `${selectedRadius}rem`);
  }, [selectedRadius]);

  useEffect(() => {
    localStorage.setItem("radius", selectedRadius.toString());
  }, [selectedRadius]);

  return <Radius selectedRadius={selectedRadius} onRadiusChange={setSelectedRadius} />;
};

export default RadiusWrapper;