type Variant = "default" | "secondary" | "outline";

const variantStyles: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-muted text-muted-foreground",
  outline: "border border-border text-foreground",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
