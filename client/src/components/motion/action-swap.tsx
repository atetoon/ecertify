"use client"

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "motion/react"
import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { cn } from "@/lib/utils"

export type ActionSwapItem = {
  id: string
  label: ReactNode
  icon?: ReactNode
  ariaLabel?: string
}

export type ActionSwapButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"

export type ActionSwapButtonSize =
  | "sm"
  | "md"
  | "lg"
  | "icon"

export type ActionSwapAnimation = "blur" | "roll"

type CoreAnimation = "blur" | "roll"

const BLUR_TRANSITION = {
  duration: 0.2,
  ease: "easeInOut",
} as const

const SWAP_BLUR = "blur(8px)"
const ROLL_BLUR = "blur(3px)"

const TEXT_VARIANTS: Record<CoreAnimation, Variants> = {
  blur: {
    initial: {
      opacity: 0,
      scale: 0.94,
      filter: SWAP_BLUR,
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: BLUR_TRANSITION,
    },
    exit: {
      opacity: 0,
      scale: 0.94,
      filter: SWAP_BLUR,
      transition: BLUR_TRANSITION,
    },
  },

  roll: {
    initial: {
      opacity: 0,
      y: "90%",
      filter: ROLL_BLUR,
    },
    animate: {
      opacity: 1,
      y: "0%",
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 460,
        damping: 30,
        mass: 0.55,
      },
    },
    exit: {
      opacity: 0,
      y: "-90%",
      filter: ROLL_BLUR,
      transition: {
        duration: 0.14,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  },
}

const ICON_VARIANTS: Record<CoreAnimation, Variants> = {
  blur: {
    initial: {
      opacity: 0,
      scale: 0.25,
      filter: SWAP_BLUR,
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: BLUR_TRANSITION,
    },
    exit: {
      opacity: 0,
      scale: 0.25,
      filter: SWAP_BLUR,
      transition: BLUR_TRANSITION,
    },
  },

  roll: {
    initial: {
      opacity: 0,
      y: 12,
      filter: ROLL_BLUR,
    },
    animate: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 460,
        damping: 30,
        mass: 0.55,
      },
    },
    exit: {
      opacity: 0,
      y: -12,
      filter: ROLL_BLUR,
      transition: {
        duration: 0.14,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  },
}

const SIZE_CLASS: Record<ActionSwapButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-full px-3 text-xs",
  md: "h-10 gap-2 rounded-full px-4 text-sm",
  lg: "h-12 gap-2.5 rounded-full px-5 text-base",
  icon: "h-10 w-10 rounded-full",
}

export interface ActionSwapTextProps {
  value: string
  children: ReactNode
  animation?: ActionSwapAnimation
  className?: string
}

export interface ActionSwapIconProps {
  value: string
  children: ReactNode
  animation?: ActionSwapAnimation
  className?: string
}

export interface ActionSwapButtonProps
  extends Omit<HTMLMotionProps<"button">, "children" | "onChange"> {
  items: ActionSwapItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (
    value: string,
    item: ActionSwapItem
  ) => void
  variant?: ActionSwapButtonVariant
  size?: ActionSwapButtonSize
  animation?: ActionSwapAnimation
  iconOnly?: boolean
  cycle?: boolean
}

export function ActionSwapText({
  value,
  children,
  animation = "blur",
  className,
}: ActionSwapTextProps) {
  const reduce = useReducedMotion()
  const measureRef = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState<number>()

  useLayoutEffect(() => {
    const nextWidth = measureRef.current?.offsetWidth

    if (!nextWidth) return

    setWidth((currentWidth) =>
      currentWidth === nextWidth ? currentWidth : nextWidth
    )
  })

  const coreAnimation: CoreAnimation =
    animation === "blur" ? "blur" : "roll"

  return (
    <span
      className={cn(
        "relative inline-block overflow-hidden whitespace-nowrap align-bottom",
        className
      )}
      style={{
        width,
        transition: reduce
          ? undefined
          : "width 220ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <span
        ref={measureRef}
        aria-hidden
        className="invisible inline-block whitespace-nowrap"
      >
        {children}
      </span>

      <AnimatePresence initial={false}>
        <motion.span
          key={`${animation}-${value}`}
          variants={TEXT_VARIANTS[coreAnimation]}
          initial={reduce ? false : "initial"}
          animate={
            reduce
              ? {
                  opacity: 1,
                  filter: "blur(0px)",
                  scale: 1,
                  y: 0,
                }
              : "animate"
          }
          exit={reduce ? undefined : "exit"}
          className="absolute left-0 top-0 inline-block"
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function ActionSwapIcon({
  value,
  children,
  animation = "blur",
  className,
}: ActionSwapIconProps) {
  const reduce = useReducedMotion()

  const coreAnimation: CoreAnimation =
    animation === "blur" ? "blur" : "roll"

  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden",
        className
      )}
    >
      <AnimatePresence
        mode="popLayout"
        initial={false}
      >
        <motion.span
          key={`${animation}-${value}`}
          aria-hidden
          variants={ICON_VARIANTS[coreAnimation]}
          initial={reduce ? false : "initial"}
          animate={
            reduce
              ? {
                  opacity: 1,
                  filter: "blur(0px)",
                  scale: 1,
                  y: 0,
                }
              : "animate"
          }
          exit={reduce ? undefined : "exit"}
          className="col-start-1 row-start-1 inline-flex items-center justify-center"
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function ActionSwapButton({
  items,
  value,
  defaultValue,
  onValueChange,
  variant = "secondary",
  size = "md",
  animation = "blur",
  iconOnly = size === "icon",
  cycle = true,
  className,
  disabled,
  onClick,
  ...rest
}: ActionSwapButtonProps) {
  const reduce = useReducedMotion()

  const [internalValue, setInternalValue] = useState(
    defaultValue ?? items[0]?.id
  )

  const currentValue = value ?? internalValue

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === currentValue)
  )

  const activeItem = items[activeIndex] ?? items[0]

  const nextItem =
    cycle && items.length > 0
      ? items[(activeIndex + 1) % items.length]
      : undefined

  if (!activeItem) return null

  return (
    <motion.button
      type="button"
      disabled={disabled}
      whileTap={
        reduce || disabled
          ? undefined
          : { scale: 0.97 }
      }
      className={cn(
        "inline-flex items-center justify-center overflow-hidden",
        "font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        SIZE_CLASS[size],

        // eCERTIFY black style
        variant === "primary" &&
          "bg-zinc-950 text-white hover:bg-zinc-800",

        variant === "secondary" &&
          "border border-zinc-200 bg-white text-zinc-950",

        variant === "outline" &&
          "border border-zinc-200 bg-transparent text-zinc-950",

        variant === "ghost" &&
          "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",

        className
      )}
      aria-label={
        activeItem.ariaLabel ??
        (iconOnly &&
        typeof activeItem.label === "string"
          ? activeItem.label
          : undefined)
      }
      onClick={(event) => {
        onClick?.(event)

        if (
          event.defaultPrevented ||
          disabled ||
          !cycle ||
          !nextItem
        ) {
          return
        }

        if (value === undefined) {
          setInternalValue(nextItem.id)
        }

        onValueChange?.(
          nextItem.id,
          nextItem
        )
      }}
      {...rest}
    >
      {activeItem.icon ? (
        <ActionSwapIcon
          value={activeItem.id}
          animation={animation}
          className="h-4 w-4"
        >
          {activeItem.icon}
        </ActionSwapIcon>
      ) : null}

      {!iconOnly ? (
        <ActionSwapText
          value={activeItem.id}
          animation={animation}
        >
          {activeItem.label}
        </ActionSwapText>
      ) : null}
    </motion.button>
  )
}
