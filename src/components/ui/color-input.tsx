"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { CheckIcon } from "@radix-ui/react-icons"

interface ColorInputProps {
  onChange?: (color: string) => void // Callback for final color
  defaultValue?: string // Default color
  swatches?: string[] // Swatches for quick selection
  showOpacity?: boolean // Whether to show the opacity slider
  label?: string // Label for the input
}

const defaultSwatches = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
]

// Helper to calculate final color with opacity
const generateFinalColor = (color: string, opacity: number): string => {
  if (opacity === 100) return color // No need to calculate if opacity is 100%
  const alpha = Math.round(opacity * 2.55) // Convert opacity (0-100) to 0-255
    .toString(16) // Convert to hexadecimal
    .padStart(2, "0") // Ensure 2 digits (e.g., "0F")
  return `${color}${alpha}`
}

function ColorInput({
  onChange,
  defaultValue = "#3b82f6",
  swatches = defaultSwatches,
  showOpacity = true,
  label = "Color",
}: ColorInputProps) {
  const [color, setColor] = useState(defaultValue) // Base color without opacity
  const [opacity, setOpacity] = useState(100) // Opacity (0-100)

  // Update color when defaultValue changes
  useEffect(() => {
    setColor(defaultValue)
  }, [defaultValue])

  const finalColor = generateFinalColor(color, opacity) // Calculate the final color

  // Trigger the onChange callback whenever color or opacity changes
  const updateFinalColor = (newColor: string, newOpacity = opacity) => {
    const updatedColor = generateFinalColor(newColor, newOpacity)
    setColor(newColor)
    onChange?.(updatedColor) // Pass final color to parent
  }

  const updateOpacity = (newOpacity: number) => {
    setOpacity(newOpacity)
    onChange?.(generateFinalColor(color, newOpacity)) // Pass final color to parent
  }

  return (
    <div className="w-full max-w-xs space-y-2 relative z-10">
      {label && (
        <label
          htmlFor="color-input"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
      )}

      {/* Color Picker */}
      <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg">
        {/* Color Preview & Code */}
        <div className="space-y-3 mb-4">
          <div className="flex gap-3 items-center justify-center">
            <div
              className="w-16 h-16 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 shadow-sm"
              style={{ backgroundColor: finalColor }} // Display final color
            />
          </div>
          <div className="flex items-center justify-center">
            <input
              type="text"
              value={finalColor.toUpperCase()}
              readOnly
              className={cn(
                "w-32 px-3 py-2 text-center rounded-md border border-zinc-200 dark:border-zinc-800",
                "bg-zinc-50 dark:bg-zinc-900 text-sm font-mono cursor-default",
                "focus:outline-none",
              )}
            />
          </div>
        </div>

        {/* Opacity Slider */}
        {showOpacity && (
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span>Opacity</span>
              <span>{opacity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => updateOpacity(Number(e.target.value))}
              className={cn(
                "w-full h-2 rounded-full appearance-none",
                "bg-gradient-to-r from-transparent to-current cursor-pointer",
                "dark:bg-gradient-to-r dark:from-zinc-800 dark:to-current",
                // Thumb styles for webkit
                "[&::-webkit-slider-thumb]:appearance-none",
                "[&::-webkit-slider-thumb]:w-4",
                "[&::-webkit-slider-thumb]:h-4",
                "[&::-webkit-slider-thumb]:rounded-full",
                "[&::-webkit-slider-thumb]:border-2",
                "[&::-webkit-slider-thumb]:border-white",
                "[&::-webkit-slider-thumb]:dark:border-zinc-900",
                "[&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(255,255,255,0.9),0_2px_5px_rgba(0,0,0,0.1)]",
                "[&::-webkit-slider-thumb]:dark:shadow-[0_0_0_4px_rgba(0,0,0,0.9),0_2px_5px_rgba(0,0,0,0.5)]",
                "[&::-webkit-slider-thumb]:hover:scale-110",
                "[&::-webkit-slider-thumb]:transition-all",
                // Thumb styles for firefox
                "[&::-moz-range-thumb]:appearance-none",
                "[&::-moz-range-thumb]:w-4",
                "[&::-moz-range-thumb]:h-4",
                "[&::-moz-range-thumb]:rounded-full",
                "[&::-moz-range-thumb]:border-2",
                "[&::-moz-range-thumb]:border-white",
                "[&::-moz-range-thumb]:dark:border-zinc-900",
                "[&::-moz-range-thumb]:shadow-[0_0_0_4px_rgba(255,255,255,0.9),0_2px_5px_rgba(0,0,0,0.1)]",
                "[&::-moz-range-thumb]:dark:shadow-[0_0_0_4px_rgba(0,0,0,0.9),0_2px_5px_rgba(0,0,0,0.5)]",
                "[&::-moz-range-thumb]:hover:scale-110",
                "[&::-moz-range-thumb]:transition-all",
              )}
              style={{
                color,
                ["--thumb-color" as string]: color,
                ["--webkit-slider-thumb-background" as string]: color,
                ["--moz-range-thumb-background" as string]: color,
                background: `linear-gradient(to right, ${
                  document.documentElement.classList.contains("dark")
                    ? "#27272a"
                    : "transparent"
                }, ${color})`,
              }}
            />
            <style>{`
              input[type="range"]::-webkit-slider-thumb {
                background-color: var(--thumb-color);
              }
              input[type="range"]::-moz-range-thumb {
                background-color: var(--thumb-color);
              }
              @media (prefers-color-scheme: dark) {
                input[type="range"] {
                  background: linear-gradient(
                    to right,
                    #27272a,
                    var(--thumb-color)
                  );
                }
              }
            `}</style>
          </div>
        )}

        {/* Color Swatches */}
        <div className="grid grid-cols-6 gap-2">
          {swatches.map((swatch) => (
            <button
              type="button"
              key={swatch}
              onClick={() => updateFinalColor(swatch)}
              className={cn(
                "w-10 h-10 rounded-md border-2 border-zinc-200 dark:border-zinc-700",
                "transition-all hover:scale-110 hover:border-zinc-400 dark:hover:border-zinc-500 relative",
              )}
              style={{ backgroundColor: swatch }}
            >
              {color === swatch && (
                <CheckIcon
                  className={cn(
                    "w-5 h-5 absolute inset-0 m-auto text-white",
                    "drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]",
                  )}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export { ColorInput }
