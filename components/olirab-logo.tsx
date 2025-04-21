import type React from "react"

interface OlirabLogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
  showText?: boolean
}

export const OlirabLogo: React.FC<OlirabLogoProps> = ({ size = "md", className = "", showText = true }) => {
  let imageSize = 32
  let textSize = "text-xl"

  switch (size) {
    case "sm":
      imageSize = 20
      textSize = "text-sm"
      break
    case "md":
      imageSize = 32
      textSize = "text-xl"
      break
    case "lg":
      imageSize = 48
      textSize = "text-2xl"
      break
  }

  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo Image */}
      <img
        src="/ll.png" // Make sure this is placed in the /public directory
        alt="Olirab Logo"
        width={imageSize}
        height={imageSize}
        className="object-contain"
        style={{
          filter: 'brightness(0) saturate(100%) invert(44%) sepia(96%) saturate(721%) hue-rotate(345deg) brightness(97%) contrast(103%)'
        }}
      />

      {/* Text */}
      {showText && (
        <span className={`font-bold ml-2 text-[#FF6B35] ${textSize}`}>
          OLIRAB
          <span className="text-gray-700 font-normal ml-1">Food</span>
        </span>
      )}
    </div>
  )
}
