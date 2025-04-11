"use client";

import { useEffect, useRef } from "react";

export default function HeroAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasDimensions();
    window.addEventListener("resize", setCanvasDimensions);

    // Audio wave animation
    const waves: any[] = [];
    const waveCount = 5;
    const waveColors = [
      "rgba(255, 255, 255, 0.1)",
      "rgba(255, 255, 255, 0.07)",
      "rgba(255, 255, 255, 0.05)",
    ];

    for (let i = 0; i < waveCount; i++) {
      waves.push({
        frequency: 0.005 + 0.002 * i,
        amplitude: 80 + i * 15,
        phase: Math.random() * Math.PI * 2,
        y: canvas.height / 2 + (i - waveCount / 2) * 50,
        speed: 0.05 + 0.01 * i,
        color: waveColors[i % waveColors.length],
      });
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.moveTo(0, wave.y);

        for (let x = 0; x < canvas.width; x++) {
          const y =
            wave.y + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fillStyle = wave.color;
        ctx.fill();

        // Update phase for animation
        wave.phase += wave.speed;
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", setCanvasDimensions);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
