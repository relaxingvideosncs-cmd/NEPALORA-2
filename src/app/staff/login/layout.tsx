/**
 * Standalone layout for /staff/login — intentionally renders NO shared
 * Header, Footer or BulletinBanner so zero admin routes or UI chrome
 * are exposed to unauthenticated visitors. The root layout globals.css
 * and font variables are already applied via the parent html/body tree.
 */
export default function StaffLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
