import Header from "./Header";
import Sidebar from "./Sidebar";

// Consistent app shell: top Header + left Sidebar + scrollable content area with
// an optional page title/subtitle and right-aligned actions. Use this on every
// page so chrome, spacing and background are uniform across the app.
export default function PageLayout({ children, title, subtitle, actions, maxWidth = "max-w-7xl" }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className={`mx-auto w-full ${maxWidth}`}>
            {(title || actions) && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  {title && <h1 className="text-2xl font-bold text-slate-900">{title}</h1>}
                  {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
