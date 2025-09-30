import React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { X } from "lucide-react"
import { useDrawerStackStore } from "../../stores/drawerStackStore"

const drawerVariants = cva(
  "flex flex-col bg-white shadow-xl border border-gray-200 transition-all duration-300 rounded-lg",
  {
    variants: {
      size: {
        default: "w-96", // Match AI Assistant md size
        sm: "w-96",
        md: "w-96", 
        lg: "w-96",
        xl: "w-[500px]",
        full: "w-full max-w-2xl",
      },
      position: {
        overlay: "relative inset-y-0 right-0 z-50",
        side: "flex-shrink-0 h-full",
      },
    },
    defaultVariants: {
      size: "default",
      position: "overlay",
    },
  }
)

const drawerHeaderVariants = cva(
  "flex items-center justify-between border-b border-gray-200 p-4 flex-shrink-0 rounded-t-lg",
  {
    variants: {
      variant: {
        default: "bg-white",
        elevated: "bg-gray-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const drawerNavigationVariants = cva(
  "flex border-b border-border flex-shrink-0",
  {
    variants: {
      variant: {
        default: "bg-white",
        tabs: "bg-gray-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const drawerContentVariants = cva(
  "flex-1 overflow-y-auto bg-white",
  {
    variants: {
      padding: {
        default: "p-4",
        compact: "p-2",
        spacious: "p-6",
      },
    },
    defaultVariants: {
      padding: "default",
    },
  }
)

const drawerFooterVariants = cva(
  "flex items-center justify-between border-t border-gray-200 p-4 flex-shrink-0 rounded-b-lg",
  {
    variants: {
      variant: {
        default: "bg-white",
        elevated: "bg-gray-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const navigationItemVariants = cva(
  "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors",
  {
    variants: {
      active: {
        true: "border-primary text-primary",
        false: "border-transparent text-muted-foreground hover:text-foreground",
      },
      disabled: {
        true: "text-muted-foreground cursor-not-allowed",
        false: "",
      },
    },
    defaultVariants: {
      active: false,
      disabled: false,
    },
  }
)

const externalNavigationVariants = cva(
  "flex gap-2",
  {
    variants: {
      position: {
        top: "justify-center flex-col",
        bottom: "justify-center mt-2 flex-column",
        left: "flex-col justify-center min-h-[200px]",
        right: "flex-col justify-center ml-2 min-h-[200px]",
      },
    },
    defaultVariants: {
      position: "top",
    },
  }
)

const externalNavigationItemVariants = cva(
  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-sm",
  {
    variants: {
      active: {
        true: "bg-primary text-white shadow-md scale-110",
        false: "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:scale-105",
      },
      disabled: {
        true: "bg-gray-50 text-gray-400 cursor-not-allowed opacity-50",
        false: "",
      },
    },
    defaultVariants: {
      active: false,
      disabled: false,
    },
  }
)

export interface DrawerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof drawerVariants> {
  onClose: () => void
  children: React.ReactNode
}

export interface DrawerHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof drawerHeaderVariants> {
  title: string
  subtitle?: string
  onClose: () => void
}

export interface DrawerNavigationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof drawerNavigationVariants> {
  items: Array<{
    id: number | string
    label: string
    icon?: React.ComponentType<{ className?: string }>
    disabled?: boolean
  }>
  activeItem: number | string
  onItemChange: (id: number | string) => void
}

export interface DrawerExternalNavigationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof externalNavigationVariants> {
  items: Array<{
    id: number | string
    label: string
    icon?: React.ComponentType<{ className?: string }>
    disabled?: boolean
  }>
  activeItem: number | string
  onItemChange: (id: number | string) => void
}

export interface DrawerContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof drawerContentVariants> {
  children: React.ReactNode
}

export interface DrawerFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof drawerFooterVariants> {
  children: React.ReactNode
}

export interface NavigationItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'>,
    VariantProps<typeof navigationItemVariants> {
  item: {
    id: number | string
    label: string
    icon?: React.ComponentType<{ className?: string }>
    disabled?: boolean
  }
  isActive: boolean
  onClick: () => void
}

const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(
  ({ className, size, position = "side", onClose, children, ...props }, ref) => {
    // If position is "side", render without backdrop - just the drawer content
    if (position === "side") {
      return (
        <div
          ref={ref}
          className={cn(drawerVariants({ size, position }), className)}
          {...props}
        >
          {children}
        </div>
      )
    }

    // Original overlay behavior with backdrop
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
        
        {/* Drawer */}
        <div
          ref={ref}
          className={cn(drawerVariants({ size, position }), className)}
          {...props}
        >
          {children}
        </div>
      </>
    )
  }
)
Drawer.displayName = "Drawer"

const DrawerHeader = React.forwardRef<HTMLDivElement, DrawerHeaderProps>(
  ({ className, variant, title, subtitle, onClose, ...props }, ref) => {
    const { getStackSize } = useDrawerStackStore()
    const stackSize = getStackSize()
    
    return (
      <div
        ref={ref}
        className={cn(drawerHeaderVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          {stackSize > 0 && (
            <div className="flex items-center gap-1">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">{stackSize}</span>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center h-9 rounded-md px-3 text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerNavigation = React.forwardRef<HTMLDivElement, DrawerNavigationProps>(
  ({ className, variant, items, activeItem, onItemChange, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(drawerNavigationVariants({ variant }), className)}
        {...props}
      >
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && onItemChange(item.id)}
              className={cn(
                navigationItemVariants({
                  active: activeItem === item.id,
                  disabled: item.disabled,
                })
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}

            </button>
          )
        })}
      </div>
    )
  }
)
DrawerNavigation.displayName = "DrawerNavigation"

const DrawerExternalNavigation = React.forwardRef<HTMLDivElement, DrawerExternalNavigationProps>(
  ({ className, position = "left", items, activeItem, onItemChange, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(externalNavigationVariants({ position }), className)}
        {...props}
      >
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && onItemChange(item.id)}
              className={cn(
                externalNavigationItemVariants({
                  active: activeItem === item.id,
                  disabled: item.disabled,
                })
              )}
              title={item.label}
            >
              {Icon && <Icon className="h-5 w-5" />}
            </button>
          )
        })}
      </div>
    )
  }
)
DrawerExternalNavigation.displayName = "DrawerExternalNavigation"

const DrawerContent = React.forwardRef<HTMLDivElement, DrawerContentProps>(
  ({ className, padding, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(drawerContentVariants({ padding }), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DrawerContent.displayName = "DrawerContent"

const DrawerFooter = React.forwardRef<HTMLDivElement, DrawerFooterProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(drawerFooterVariants({ variant }), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DrawerFooter.displayName = "DrawerFooter"

export {
  Drawer,
  DrawerHeader,
  DrawerNavigation,
  DrawerExternalNavigation,
  DrawerContent,
  DrawerFooter,
  drawerVariants,
  drawerHeaderVariants,
  drawerNavigationVariants,
  externalNavigationVariants,
  externalNavigationItemVariants,
  drawerContentVariants,
  drawerFooterVariants,
  navigationItemVariants,
}
