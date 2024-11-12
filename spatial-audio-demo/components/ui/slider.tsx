import * as React from "react"

const Slider = React.forwardRef<
  HTMLDivElement,
  {
    value: number[]
    onValueChange: (value: number[]) => void
    min?: number
    max?: number
    step?: number
    className?: string
  }
>(({ value, onValueChange, min = 0, max = 100, step = 1, className = "" }, ref) => {
  const percentage = ((value[0] - min) / (max - min)) * 100

  return (
    <div
      ref={ref}
      className={`relative flex w-full touch-none select-none items-center ${className}`}
    >
      <div className="relative w-full h-2 bg-gray-200 rounded-full">
        <div
          className="absolute h-full bg-blue-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          value={value[0]}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onValueChange([Number(e.target.value)])}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  )
})
Slider.displayName = "Slider"

export { Slider } 