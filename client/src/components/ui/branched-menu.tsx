'use client'

import React, {
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

import {
  HugeiconsIcon,
  type IconSvgElement,
} from '@hugeicons/react'

import {
  CursorPointer01Icon,
  Download04Icon,
  Layers01Icon,
  Notification03Icon,
  PaintBoardIcon,
  Rocket01Icon,
  Settings02Icon,
  TextFontIcon,
} from '@hugeicons/core-free-icons'

export interface BranchedMenuChild {
  value: string
  label: string
  icon?: ReactNode | IconSvgElement
}

export interface BranchedMenuItem {
  value?: string
  label: string
  icon?: ReactNode | IconSvgElement
  children?: BranchedMenuChild[]
}

export interface BranchedMenuProps {
  items?: BranchedMenuItem[]
  defaultOpen?: number | number[]
  defaultActive?: string

  onSelect?: (
    value: string,
    item: BranchedMenuChild | BranchedMenuItem
  ) => void

  onToggle?: (
    index: number,
    open: boolean
  ) => void

  color?: string
  accentColor?: string
  lineColor?: string

  width?: number
  rowHeight?: number
  indent?: number
  trunk?: number
  radius?: number
  lineWidth?: number
  fontSize?: number
  drawDuration?: number
  foldDuration?: number

  className?: string
}

const DEFAULT_ITEMS: BranchedMenuItem[] = [
  {
    label: 'Getting started',
    children: [
      {
        value: 'install',
        label: 'Installation',
        icon: Download04Icon,
      },
      {
        value: 'quick',
        label: 'Quick start',
        icon: Rocket01Icon,
      },
      {
        value: 'config',
        label: 'Configuration',
        icon: Settings02Icon,
      },
      {
        value: 'theming',
        label: 'Theming',
        icon: PaintBoardIcon,
      },
    ],
  },
  {
    label: 'Components',
    children: [
      {
        value: 'buttons',
        label: 'Buttons',
        icon: CursorPointer01Icon,
      },
      {
        value: 'typography',
        label: 'Typography',
        icon: TextFontIcon,
      },
      {
        value: 'overlays',
        label: 'Overlays',
        icon: Layers01Icon,
      },
      {
        value: 'toasts',
        label: 'Toasts',
        icon: Notification03Icon,
      },
    ],
  },
]

const PAD = 6
const MARK = 16

const renderIcon = (
  icon: ReactNode | IconSvgElement
) =>
  isValidElement(icon)
    ? icon
    : (
        <HugeiconsIcon
          icon={icon as IconSvgElement}
          size={18}
          strokeWidth={1.8}
        />
      )

const toSet = (
  open: number | number[]
) =>
  new Set(
    Array.isArray(open)
      ? open
      : open >= 0
        ? [open]
        : []
  )

const BranchedMenu: React.FC<BranchedMenuProps> = ({
  items = DEFAULT_ITEMS,

  defaultOpen = 0,

  defaultActive = '',

  onSelect,

  onToggle,

  color = '#18181b',

  accentColor = '#18181b',

  lineColor = '#d4d4d8',

  width = 240,

  rowHeight = 44,

  indent = 40,

  trunk = 14,

  radius = 10,

  lineWidth = 1.5,

  fontSize = 16,

  drawDuration = 400,

  foldDuration = 300,

  className = '',
}) => {
  const [open, setOpen] = useState<Set<number>>(
    () => toSet(defaultOpen)
  )

  const [active, setActive] = useState(() => {
    if (defaultActive) return defaultActive

    const first = items.find(
      (it, i) =>
        it.children &&
        toSet(defaultOpen).has(i)
    )

    return first?.children?.[0]?.value ?? ''
  })

  const navRef =
    useRef<HTMLElement>(null)

  const heads =
    useRef<(HTMLButtonElement | null)[]>([])

  const markerRef =
    useRef<HTMLSpanElement>(null)

  const latest = useRef<{
    onSelect?: BranchedMenuProps['onSelect']
    onToggle?: BranchedMenuProps['onToggle']
  }>({})

  latest.current = {
    onSelect,
    onToggle,
  }

  /*
   * Supports BOTH:
   *
   * 1. Direct navigation items
   * 2. Sections containing children
   */
  const activeSection = items.findIndex(
    (item) =>
      item.value === active ||
      item.children?.some(
        (child) => child.value === active
      )
  )

  const activeItem =
    activeSection >= 0
      ? items[activeSection]
      : undefined

  const markerShown =
    activeSection >= 0 &&
    (
      !activeItem?.children ||
      open.has(activeSection)
    )

  useLayoutEffect(() => {
    const place = (glide: boolean) => {
      const marker = markerRef.current

      const element =
        heads.current[activeSection]

      if (!marker) return

      const shouldShow =
        markerShown && element

      if (!glide) {
        marker.style.transition = 'none'
      }

      if (shouldShow) {
        marker.style.top =
          `${
            element.offsetTop +
            (element.offsetHeight - MARK) / 2
          }px`
      }

      marker.toggleAttribute(
        'data-on',
        Boolean(shouldShow)
      )

      if (!glide) {
        void marker.offsetHeight

        marker.style.transition = ''
      }
    }

    place(true)

    let first = true

    const resizeObserver =
      new ResizeObserver(() => {
        if (first) {
          first = false
          return
        }

        place(false)
      })

    if (navRef.current) {
      resizeObserver.observe(
        navRef.current
      )
    }

    return () =>
      resizeObserver.disconnect()
  }, [
    activeSection,
    markerShown,
    items,
    fontSize,
    rowHeight,
  ])

  const select = (
    value: string,
    item:
      | BranchedMenuChild
      | BranchedMenuItem
  ) => {
    setActive(value)

    latest.current.onSelect?.(
      value,
      item
    )
  }

  const toggle = (index: number) => {
    setOpen((previous) => {
      const next =
        new Set(previous)

      const isOpen =
        !next.has(index)

      if (isOpen) {
        next.add(index)
      } else {
        next.delete(index)
      }

      latest.current.onToggle?.(
        index,
        isOpen
      )

      return next
    })
  }

  const r = Math.min(
    radius,
    rowHeight / 2 - 2
  )

  const endX = indent - 8

  const rowY = (index: number) =>
    PAD +
    index * rowHeight +
    rowHeight / 2

  const branch = (index: number) =>
    `M ${trunk} ${
      rowY(index) - r
    }
     A ${r} ${r} 0 0 0 ${
       trunk + r
     } ${rowY(index)}
     H ${endX}`

  const reach = (index: number) =>
    `M ${trunk} 0
     V ${rowY(index) - r}
     A ${r} ${r} 0 0 0 ${
       trunk + r
     } ${rowY(index)}
     H ${endX}`

  const length = (index: number) =>
    rowY(index) -
    r +
    (Math.PI * r) / 2 +
    (endX - trunk - r)

  return (
    <nav
      ref={navRef}
      className={`
        relative
        flex
        w-fit
        max-w-[min(var(--bm-w),100%)]
        flex-col
        pl-3.5
        leading-[1.2]

        [color:var(--bm-ink)]
        [font-family:inherit]
        [font-size:var(--bm-font)]

        before:absolute
        before:top-2
        before:bottom-0
        before:left-0
        before:w-0.5
        before:rounded-[1px]

        before:[background:linear-gradient(
          to_bottom,
          var(--bm-line)_0%,
          var(--bm-line)_55%,
          transparent_100%
        )]

        before:content-['']

        ${className}
      `}
      style={
        {
          '--bm-w': `${width}px`,

          /*
           * These can now be overridden by
           * --bm-theme-* from the dashboard.
           */
          '--bm-ink':
            `var(--bm-theme-ink, ${color})`,

          '--bm-accent':
            `var(--bm-theme-accent, ${accentColor})`,

          '--bm-line':
            `var(--bm-theme-line, ${lineColor})`,

          '--bm-font':
            `${fontSize}px`,

          '--bm-row':
            `${rowHeight}px`,

          '--bm-indent':
            `${indent}px`,

          '--bm-line-w':
            lineWidth,

          '--bm-draw':
            `${drawDuration}ms`,

          '--bm-muted':
            `color-mix(
              in srgb,
              var(--bm-theme-ink, ${color}) 55%,
              transparent
            )`,

          '--bm-fold':
            `${foldDuration}ms`,
        } as CSSProperties
      }
    >
      {/* Active marker */}

      <span
        ref={markerRef}
        className="
          absolute
          -top-px
          left-0
          z-[1]
          h-4
          w-0.5
          rounded-[1px]

          opacity-0

          [background:var(--bm-accent)]

          [transition:
            top_220ms_cubic-bezier(0.23,1,0.32,1),
            opacity_150ms_ease
          ]

          data-[on]:opacity-100

          motion-reduce:[transition:opacity_150ms_ease]
        "
        aria-hidden="true"
      />

      {items.map((item, index) => {
        const children =
          item.children

        const isOpen =
          children
            ? open.has(index)
            : false

        const leafValue =
          item.value ?? item.label

        const leafActive =
          !children &&
          leafValue === active

        const bodyHeight =
          children
            ? PAD * 2 +
              children.length *
                rowHeight
            : 0

        return (
          <div
            key={
              item.value ??
              item.label
            }
            className="
              group/section
              flex
              flex-col
            "
            data-open={
              isOpen
                ? ''
                : undefined
            }
          >
            {/* Top-level item */}

            <button
              ref={(element) => {
                heads.current[index] =
                  element
              }}
              type="button"
              className="
                m-0
                block
                cursor-pointer
                border-0
                bg-transparent

                py-[11px]

                text-left
                font-semibold

                outline-none

                [color:var(--bm-muted)]
                [font-family:inherit]

                [font-size:var(--bm-font)]

                [-webkit-tap-highlight-color:transparent]

                [transition:color_200ms_ease]

                group-data-[open]/section:[color:var(--bm-ink)]

                data-[active]:[color:var(--bm-accent)]

                hover:[color:var(--bm-ink)]
              "
              aria-expanded={
                children
                  ? isOpen
                  : undefined
              }
              aria-current={
                leafActive
                  ? 'true'
                  : undefined
              }
              data-active={
                leafActive
                  ? ''
                  : undefined
              }
              onClick={() =>
                children
                  ? toggle(index)
                  : select(
                      leafValue,
                      item
                    )
              }
            >
              <div className="flex items-center gap-3">
                {item.icon ? (
                  <span
                    className="
                      inline-flex
                      shrink-0
                      opacity-90
                    "
                    aria-hidden="true"
                  >
                    {renderIcon(
                      item.icon
                    )}
                  </span>
                ) : null}

                <span>
                  {item.label}
                </span>
              </div>
            </button>

            {/* Children */}

            {children ? (
              <div
                className="
                  grid
                  [grid-template-rows:0fr]

                  [transition:
                    grid-template-rows_var(--bm-fold)
                    cubic-bezier(0.23,1,0.32,1)
                  ]

                  group-data-[open]/section:
                    [grid-template-rows:1fr]

                  motion-reduce:transition-none
                "
              >
                <div className="min-h-0 overflow-hidden">
                  <div
                    className="
                      relative
                      box-border
                      py-1.5
                    "
                    style={{
                      height:
                        bodyHeight,
                    }}
                  >
                    <svg
                      className="
                        pointer-events-none
                        absolute
                        top-0
                        left-0
                        overflow-visible

                        opacity-0

                        [transition:opacity_200ms_ease]

                        group-data-[open]/section:
                          opacity-100

                        group-data-[open]/section:
                          [transition:
                            opacity_250ms_ease_100ms
                          ]
                      "
                      width={indent}
                      height={bodyHeight}
                      aria-hidden="true"
                    >
                      {/* Main branch */}

                      <path
                        className="
                          fill-none
                          [stroke:var(--bm-line)]
                          [stroke-width:var(--bm-line-w)]
                          [stroke-linecap:round]
                          [stroke-linejoin:round]
                        "
                        d={`
                          M ${trunk} 0
                          V ${
                            rowY(
                              children.length -
                                1
                            ) - r
                          }
                        `}
                      />

                      {/* Branches */}

                      {children.map(
                        (child, childIndex) => (
                          <path
                            key={
                              child.value
                            }
                            className="
                              fill-none
                              [stroke:var(--bm-line)]
                              [stroke-width:var(--bm-line-w)]
                              [stroke-linecap:round]
                              [stroke-linejoin:round]
                            "
                            d={branch(
                              childIndex
                            )}
                          />
                        )
                      )}

                      {/* Active branch */}

                      {children.map(
                        (child, childIndex) => (
                          <path
                            key={
                              child.value
                            }
                            className="
                              fill-none

                              [stroke:var(--bm-accent)]

                              [stroke-width:var(--bm-line-w)]

                              [stroke-linecap:round]
                              [stroke-linejoin:round]

                              [transition:
                                stroke-dashoffset_var(--bm-draw)
                                cubic-bezier(0.23,1,0.32,1)
                              ]

                              motion-reduce:
                                transition-none
                            "
                            d={reach(
                              childIndex
                            )}
                            style={{
                              strokeDasharray:
                                length(
                                  childIndex
                                ),

                              strokeDashoffset:
                                child.value ===
                                active
                                  ? 0
                                  : length(
                                      childIndex
                                    ),
                            }}
                          />
                        )
                      )}
                    </svg>

                    {children.map(
                      (child) => (
                        <button
                          key={
                            child.value
                          }
                          type="button"
                          className="
                            m-0
                            box-border
                            flex
                            w-full
                            cursor-pointer
                            items-center
                            gap-2.5

                            border-0
                            bg-transparent

                            py-0
                            pr-0

                            text-left
                            outline-none

                            [height:var(--bm-row)]
                            [padding-left:var(--bm-indent)]

                            [color:var(--bm-muted)]

                            [font-family:inherit]

                            [-webkit-tap-highlight-color:transparent]

                            [transition:color_200ms_ease]

                            hover:[color:var(--bm-ink)]

                            data-[active]:font-semibold
                            data-[active]:[color:var(--bm-accent)]
                          "
                          aria-current={
                            child.value ===
                            active
                              ? 'true'
                              : undefined
                          }
                          data-active={
                            child.value ===
                            active
                              ? ''
                              : undefined
                          }
                          tabIndex={
                            isOpen
                              ? 0
                              : -1
                          }
                          onClick={() =>
                            select(
                              child.value,
                              child
                            )
                          }
                        >
                          {child.icon ? (
                            <span
                              className="
                                inline-flex
                                flex-none
                                opacity-80
                              "
                              aria-hidden="true"
                            >
                              {renderIcon(
                                child.icon
                              )}
                            </span>
                          ) : null}

                          <span className="whitespace-nowrap">
                            {child.label}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}

export default BranchedMenu