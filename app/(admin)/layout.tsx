import { redirect } from 'next/navigation';
import { getCurrentAuth } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/session';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata = {
  title: { default: 'Admin', template: 'Admin | %s' },
  description: 'VizTR administration portal',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await getCurrentAuth();

  // P1.1: Admin portal route guard — require ADMIN or SUPER_ADMIN
  const isAdmin = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  if (!isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-bg">
      <AdminSidebar role={role} />
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
