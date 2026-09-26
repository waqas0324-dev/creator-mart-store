import { AdminLayout } from './AdminLayout';
import { AccountSecurity } from '../../components/AccountSecurity';

export function AdminAccount() {
  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Account & Security</h2>
          <p className="text-sm text-gray-500">Change the admin login email or password and review security activity.</p>
        </div>
        <AccountSecurity role="admin" />
      </div>
    </AdminLayout>
  );
}