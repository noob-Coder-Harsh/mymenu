import Image from "next/image";

export function BrandMark({
  size = 36,
  className = "",
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/mark.svg"
      alt="FoodBaba"
      width={size}
      height={size}
      priority={priority}
      className={`rounded-2xl ${className}`.trim()}
    />
  );
}
