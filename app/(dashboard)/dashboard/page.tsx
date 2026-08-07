import { Metadata } from 'next';
import { DashboardClient } from './DashboardClient';

export const metadata: Metadata = {
  title: 'Dashboard | VizTR',
  description: 'Analytics dashboard for architectural visualization projects',
};

export default async function DashboardPage() {
  return <DashboardClient />;
}