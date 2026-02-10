import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default async function AreaRestritaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/area-restrita');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
