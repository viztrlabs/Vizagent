import { describe, it, expect } from 'vitest';
import { hasPermission } from './session';

describe('M11 RBAC', () => {
  it('CLIENT can read portals, annotate, comment, request approvals', () => {
    expect(hasPermission('CLIENT', 'client.portals.read')).toBe(true);
    expect(hasPermission('CLIENT', 'collab.annotate')).toBe(true);
    expect(hasPermission('CLIENT', 'collab.comment')).toBe(true);
    expect(hasPermission('CLIENT', 'approvals.request')).toBe(true);
  });

  it('CLIENT cannot manage approvals', () => {
    expect(hasPermission('CLIENT', 'approvals.manage')).toBe(false);
  });

  it('ADMIN can manage approvals', () => {
    expect(hasPermission('ADMIN', 'approvals.manage')).toBe(true);
  });

  it('USER can annotate and comment but not manage approvals', () => {
    expect(hasPermission('USER', 'collab.annotate')).toBe(true);
    expect(hasPermission('USER', 'collab.comment')).toBe(true);
    expect(hasPermission('USER', 'approvals.manage')).toBe(false);
  });
});

describe('M12 Admin RBAC', () => {
  it('SUPER_ADMIN has all admin permissions', () => {
    expect(hasPermission('SUPER_ADMIN', 'admin.users.read')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'admin.users.write')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'admin.rbac.read')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'admin.rbac.write')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'admin.audit.read')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'admin.monitoring.read')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'admin.billing.read')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'admin.billing.write')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'admin.agents.read')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'admin.agents.control')).toBe(true);
  });

  it('ADMIN has read-only admin permissions (no write)', () => {
    expect(hasPermission('ADMIN', 'admin.users.read')).toBe(true);
    expect(hasPermission('ADMIN', 'admin.users.write')).toBe(false);
    expect(hasPermission('ADMIN', 'admin.rbac.read')).toBe(true);
    expect(hasPermission('ADMIN', 'admin.rbac.write')).toBe(false);
    expect(hasPermission('ADMIN', 'admin.audit.read')).toBe(true);
    expect(hasPermission('ADMIN', 'admin.monitoring.read')).toBe(true);
    expect(hasPermission('ADMIN', 'admin.billing.read')).toBe(true);
    expect(hasPermission('ADMIN', 'admin.billing.write')).toBe(false);
    expect(hasPermission('ADMIN', 'admin.agents.read')).toBe(true);
    expect(hasPermission('ADMIN', 'admin.agents.control')).toBe(false);
  });

  it('USER has no admin permissions', () => {
    expect(hasPermission('USER', 'admin.users.read')).toBe(false);
    expect(hasPermission('USER', 'admin.audit.read')).toBe(false);
    expect(hasPermission('USER', 'admin.agents.control')).toBe(false);
  });

  it('CLIENT has no admin permissions', () => {
    expect(hasPermission('CLIENT', 'admin.users.read')).toBe(false);
    expect(hasPermission('CLIENT', 'admin.audit.read')).toBe(false);
    expect(hasPermission('CLIENT', 'admin.agents.control')).toBe(false);
  });
});