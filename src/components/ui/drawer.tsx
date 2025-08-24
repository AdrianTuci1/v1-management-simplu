import React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { X } from "lucide-react"

const drawerVariants = cva(
  "fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out",
  {
    variants: {
      size: {
        default: "w-full max-w-2xl",
        lg: "w-full max-w-4xl",
        xl: "w-full max-w-6xl",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const drawerHeaderVariants = cva(
  "flex items-center justify-between border-b border-gray-200 p-4 flex-shrink-0",
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
  "flex items-center justify-between border-t border-gray-200 p-4 flex-shrink-0",
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
  ({ className, size, onClose, children, ...props }, ref) => {
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
          className={cn(drawerVariants({ size }), className)}
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
    return (
      <div
        ref={ref}
        className={cn(drawerHeaderVariants({ variant }), className)}
        {...props}
      >
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
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
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          )
        })}
      </div>
    )
  }
)
DrawerNavigation.displayName = "DrawerNavigation"

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
  DrawerContent,
  DrawerFooter,
  drawerVariants,
  drawerHeaderVariants,
  drawerNavigationVariants,
  drawerContentVariants,
  drawerFooterVariants,
  navigationItemVariants,
}
