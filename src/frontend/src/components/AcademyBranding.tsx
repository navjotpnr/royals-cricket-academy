interface AcademyBrandingProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

export function AcademyBranding({
  size = "md",
  showTagline = true,
  className = "",
}: AcademyBrandingProps) {
  const imgSizes = { sm: 40, md: 64, lg: 96 };
  const titleSizes = {
    sm: "text-base font-bold",
    md: "text-xl font-bold",
    lg: "text-2xl font-bold",
  };
  const tagSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };
  const s = imgSizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-shrink-0">
        <img
          src="/assets/images/logo.jpg"
          alt="Royals Cricket Academy Logo"
          width={s}
          height={s}
          className="rounded-full border-2 border-primary/30 object-cover shadow-sm"
          style={{ width: s, height: s }}
        />
      </div>
      <div>
        <div
          className={`${titleSizes[size]} text-primary leading-tight font-display`}
        >
          Royals Cricket Academy
        </div>
        {showTagline && (
          <div className={`${tagSizes[size]} text-muted-foreground font-body`}>
            Jalandhar &nbsp;|&nbsp; 76963-72777
          </div>
        )}
      </div>
    </div>
  );
}
