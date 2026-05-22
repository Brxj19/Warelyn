export function AppLogo({ compact = false, className = '', imageClassName = '' }) {
  return (
    <span className={`inline-flex items-center ${compact ? 'justify-center' : 'gap-3'} ${className}`}>
      <img alt="Warelyn" className={`object-contain ${compact ? 'h-[42px] w-[42px]' : 'h-12 w-auto max-w-[168px]'} ${imageClassName}`} src="/warelyn-logo.png" />
    </span>
  );
}
