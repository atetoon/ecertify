import { motion } from "motion/react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface VerifiedBadgeProps {
  size?: number
  variant?: "default" | "shimmer"
  className?: string
}

export function VerifiedBadge({
  size = 22,
  variant = "default",
  className,
}: VerifiedBadgeProps) {
  return (
    <motion.span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full bg-blue-500 text-white",
        className
      )}
      style={{
        width: size,
        height: size,
      }}
      animate={
        variant === "shimmer"
          ? {
              boxShadow: [
                "0 0 0 rgba(59,130,246,0)",
                "0 0 14px rgba(59,130,246,0.45)",
                "0 0 0 rgba(59,130,246,0)",
              ],
            }
          : undefined
      }
      transition={
        variant === "shimmer"
          ? {
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : undefined
      }
    >
      <Check
        strokeWidth={3}
        style={{
          width: size * 0.55,
          height: size * 0.55,
        }}
      />
    </motion.span>
  )
}