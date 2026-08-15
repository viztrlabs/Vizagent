'use client';

import React, { useState } from 'react';

interface Approval {
  id: string;
  projectId: string;
  requesterId: string;
  approverId: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApprovalWorkflowProps {
  approvals: Approval[];
  onRequest: (projectId: string, notes?: string) => Promise<void>;
  onDecide: (id: string, status: 'approved' | 'rejected', notes?: string) => Promise<void>;
  currentUserId: string;
  role: 'CLIENT' | 'USER' | 'ADMIN' | 'SUPER_ADMIN';
}

export default function ApprovalWorkflow({ approvals, onRequest, onDecide, currentUserId, role }: ApprovalWorkflowProps) {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestNotes, setRequestNotes] = useState('');
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canManage = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const canRequest = role === 'CLIENT' || role === 'USER' || role === 'ADMIN' || role === 'SUPER_ADMIN';

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const decidedApprovals = approvals.filter(a => a.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Approval Workflows</h2>
        {canRequest && (
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors"
          >
            Request Approval
          </button>
        )}
      </div>

      {pendingApprovals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals ({pendingApprovals.length})</h3>
          <div className="space-y-3">
            {pendingApprovals.map((approval) => (
              <div key={approval.id} className="bg-white border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                        Pending
                      </span>
                      <span className="text-xs text-gray-500">
                        Requested: {new Date(approval.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-900 mb-2">Project: {approval.projectId}</p>
                    <p className="text-gray-600 text-sm mb-2">Requested by: {approval.requesterId}</p>
                    {approval.notes && (
                      <p className="text-gray-600 text-sm mb-2 italic">"{approval.notes}"</p>
                    )}
                    {canManage && approval.approverId === 'current_user' && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => { /* approve */ }}
                          className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => { /* reject */ }}
                          className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {decidedApprovals.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">History ({decidedApprovals.length})</h3>
              <div className="space-y-3">
                {decidedApprovals.map((approval) => (
                  <div key={approval.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            approval.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Decided: {new Date(approval.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-900 mb-1">Project: {approval.projectId}</p>
                        <p className="text-gray-600 text-sm mb-1">Approved by: {approval.approverId}</p>
                        {approval.notes && (
                          <p className="text-gray-600 text-sm italic">Notes: {approval.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
}

export default ApprovalWorkflow;