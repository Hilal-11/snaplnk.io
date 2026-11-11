import Image from "next/image";

/** Theme-aware logo mark: black tile on light, light tile on dark. Pure CSS swap, no flash. */
export default function Logo({
  size = 30,
  className = "",
  inverse = false,
  alt = "snaplnk.io",
}: {
  size?: number;
  className?: string;
  /** Use on dark/primary surfaces (e.g. inside a black button). */
  inverse?: boolean;
  alt?: string;
}) {
  const [lightSrc, darkSrc] = inverse
    ? ["/snaplinklogodark.svg", "/snaplinklogolight.svg"]
    : ["/snaplinklogolight.svg", "/snaplinklogodark.svg"];
  return (
    <>
      <Image src={lightSrc} width={size} height={size} alt={alt} className={`dark:hidden ${className}`} />
      <Image src={darkSrc} width={size} height={size} alt={alt} className={`hidden dark:block ${className}`} />
    </>
  );
}
