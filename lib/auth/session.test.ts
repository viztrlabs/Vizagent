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