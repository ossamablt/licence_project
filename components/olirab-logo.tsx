import type React from "react"

interface OlirabLogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
  showText?: boolean
}

export const OlirabLogo: React.FC<OlirabLogoProps> = ({ size = "md", className = "", showText = true }) => {
  let logoSize = "24"
  let textSize = "text-lg"

  switch (size) {
    case "sm":
      logoSize = "20"
      textSize = "text-sm"
      break
    case "md":
      logoSize = "32"
      textSize = "text-xl"
      break
    case "lg":
      logoSize = "48"
      textSize = "text-2xl"
      break
  }

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative">
        {/* Burger Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={logoSize} height={logoSize}>
          {/* Bun top */}
          <path
            d="M8,20 C8,12 16,8 32,8 C48,8 56,12 56,20 L56,22 C56,22 48,26 32,26 C16,26 8,22 8,22 L8,20 Z"
            fill="#FF6B35"
          />
          {/* Lettuce */}
          <path
            d="M6,27 C6,27 12,33 32,33 C52,33 58,27 58,27 L58,30 C58,30 50,34 32,34 C14,34 6,30 6,30 L6,27 Z"
            fill="#4CAF50"
          />
          {/* Cheese */}
          <path
            d="M7,37 C7,37 13,41 32,41 C51,41 57,37 57,37 L57,39 C57,39 49,42 32,42 C15,42 7,39 7,39 L7,37 Z"
            fill="#FFC107"
          />
          {/* Patty */}
          <path
            d="M8,34 C8,34 16,38 32,38 C48,38 56,34 56,34 L56,37 C56,37 48,40 32,40 C16,40 8,37 8,37 L8,34 Z"
            fill="#795548"
          />
          {/* Bun bottom */}
          <path
            d="M8,42 C8,42 16,46 32,46 C48,46 56,42 56,42 L56,48 C56,52 48,56 32,56 C16,56 8,52 8,48 L8,42 Z"
            fill="#FF6B35"
          />
        </svg>
      </div>

      {showText && (
        <span className={`font-bold ml-2 text-[#FF6B35] ${textSize}`}>
          OLIRAB
          <span className="text-gray-700 font-normal ml-1">Fast Food</span>
        </span>
      )}
    </div>
  )
}

