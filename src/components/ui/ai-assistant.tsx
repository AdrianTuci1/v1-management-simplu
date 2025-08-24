import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const aiAssistantVariants = cva(
  "fixed z-50 bg-white border shadow-lg transition-all duration-300 ease-in-out m-2",
  {
    variants: {
      position: {
        "top-right": "top-16 right-4",
        "top-left": "top-16 left-4",
        "bottom-right": "bottom-4 right-4",
        "bottom-left": "bottom-4 left-4",
      },
      size: {
        sm: "w-42 h-96",
        md: "w-96 h-[500px]",
        lg: "w-[500px] h-[600px]",
        xl: "w-[600px] h-[700px]",
      },
      state: {
        open: "opacity-100 visible scale-100 translate-y-0",
        closed: "opacity-0 invisible scale-95 translate-y-2",
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
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
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
    className={cn("flex items-center justify-between p-4 border-b bg-white", className)}
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
    className={cn("flex-1 overflow-y-auto p-4", className)}
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
    className={cn("border-t p-4 bg-white", className)}
    {...props}
  />
))
AIAssistantFooter.displayName = "AIAssistantFooter"

export { AIAssistant, AIAssistantHeader, AIAssistantBody, AIAssistantFooter }
