import { cn } from "@/lib/cn";

interface AvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

export function Avatar({ name, src, className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("size-9 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex size-9 items-center justify-center rounded-full",
        "bg-primary-100 text-sm font-medium text-primary-700",
        className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
