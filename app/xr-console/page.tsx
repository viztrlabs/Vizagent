import { XRConsoleLayout } from '@/components/xr-console/XRConsoleLayout';
import { XRConsoleDashboard } from '@/components/xr-console/XRConsoleDashboard';

export default function XRConsolePage() {
  return (
    <XRConsoleLayout>
      <XRConsoleDashboard />
    </XRConsoleLayout>
  );
}