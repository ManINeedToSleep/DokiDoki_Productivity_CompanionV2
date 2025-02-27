"use client";

import React, { useEffect, useState } from "react";

const PolkaDotBackground = ({
  dotColor = "#F5C0DF",
  backgroundColor = "#ffffff",
  dotSize = 60,
  spacing = 120,
}) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const calculateDots = () => {
    const cols = Math.ceil(dimensions.width / spacing) + 2;
    const rows = Math.ceil(dimensions.height / spacing) * 3; // Triple the rows
    const dots = [];

    // Start from negative height to have dots above viewport
    for (let y = -Math.ceil(dimensions.height / spacing); y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const offsetX = y % 2 === 0 ? 0 : spacing / 2;
        dots.push({
          left: `${(x * spacing) + offsetX - spacing}px`,
          top: `${(y * spacing)}px`,
        });
      }
    }
    return dots;
  };

  return (
    <div
      className="fixed inset-0"
      style={{
        backgroundColor,
        overflow: 'hidden',
        zIndex: -1,
      }}
    >
      <div className="absolute inset-0" style={{ height: '300%', top: '-100%' }}>
        <div className="absolute inset-0 animate-polkadot-fall">
          {calculateDots().map((position, i) => (
            <div
              key={`dot1-${i}`}
              className="absolute"
              style={{
                backgroundColor: dotColor,
                width: `${dotSize}px`,
                height: `${dotSize}px`,
                borderRadius: '50%',
                left: position.left,
                top: position.top,
                opacity: 0.8,
                boxShadow: '0 0 10px rgba(255, 182, 193, 0.3)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PolkaDotBackground;
