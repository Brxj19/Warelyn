const variants = {
  primary: 'bg-warelyn-primary text-white hover:bg-blue-900 focus:ring-warelyn-primary/30',
  secondary: 'bg-white text-warelyn-text border border-warelyn-border hover:bg-slate-50 focus:ring-slate-300',
  accent: 'bg-warelyn-accent text-white hover:bg-emerald-600 focus:ring-emerald-300',
  danger: 'bg-warelyn-danger text-white hover:bg-red-600 focus:ring-red-300',
};

export function Button({ children, className = '', variant = 'primary', type = 'button', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
