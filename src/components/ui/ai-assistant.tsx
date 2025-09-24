import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const aiAssistantVariants = cva(
  "bg-white border shadow-lg transition-all duration-300 ease-in-out",
  {
    variants: {
      position: {
        "top-right": "fixed z-50 top-16 right-4 m-2",
        "top-left": "fixed z-50 top-16 left-4 m-2",
        "bottom-right": "fixed z-50 bottom-4 right-4 m-2",
        "bottom-left": "fixed z-50 bottom-4 left-4 m-2",
        "side": "flex-shrink-0 h-full",
      },
      size: {
        sm: "w-64 h-full",
        md: "w-80 h-full",
        lg: "w-96 h-full",
        xl: "w-[500px] h-full",
      },
      state: {
        open: "opacity-100 visible scale-100 translate-y-0",
        closed: "opacity-0 invisible scale-95 translate-y-2 w-0",
      },
    },
    defaultVariants: {
      position: "top-right",
      size: "md",
      state: "closed",
    },
  }
)

export interface AIAssistantProps
  extends React.HTMLAttributes<HTMLDivElement> {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "side"
  size?: "sm" | "md" | "lg" | "xl"
  state?: "open" | "closed"
}

const AIAssistant = React.forwardRef<HTMLDivElement, AIAssistantProps>(
  ({ className, position, size, state, ...props }, ref) => (
    <div
      className={cn(aiAssistantVariants({ position, size, state }), className)}
      ref={ref}
      {...props}
    />
  )
)
AIAssistant.displayName = "AIAssistant"

const AIAssistantHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between px-3 py-2 border-b bg-muted/20", className)}
    {...props}
  />
))
AIAssistantHeader.displayName = "AIAssistantHeader"

const AIAssistantBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-y-auto p-3", className)}
    {...props}
  />
))
AIAssistantBody.displayName = "AIAssistantBody"

const AIAssistantFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("border-t p-3 bg-muted/10", className)}
    {...props}
  />
))
AIAssistantFooter.displayName = "AIAssistantFooter"

export { AIAssistant, AIAssistantHeader, AIAssistantBody, AIAssistantFooter }
