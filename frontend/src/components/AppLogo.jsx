const sources = {
  full: '/warelyn-logo.png',
  collapsed: '/collapsed-sidebar-logo.png',
  mark: '/collapsed-sidebar-logo.png',
};

export function AppLogo({ alt = 'Warelyn', className = '', imageClassName = '', size = 'sidebar', variant = 'full' }) {
  return (
    <span className={`app-logo app-logo--${size} ${className}`} data-variant={variant}>
      <span className="app-logo-frame">
        <img alt={alt} className={`app-logo-image ${imageClassName}`} src={sources[variant] ?? sources.full} />
      </span>
    </span>
  );
}
