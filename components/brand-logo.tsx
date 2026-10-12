import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/assets/logo_header.png"
      alt="Error404"
      width={850}
      height={300}
      priority
      className={cn("h-auto w-40 object-contain", className)}
    />
  );
}
