'use client';

import { useState, useEffect, useCallback } from 'react';

interface Deal {
  id: string;
  title: string;
  stage: string;
  value: number | null;
  currency: string;
  closeDate: string | null;
  lead: { name: string; email: string };
  updatedAt: string;
}

interface PipelineStage {
  stage: string;
  label: string;
  color: string;
}

const STAGES: PipelineStage[] = [
  { stage: 'PROSPECT', label: 'Prospect', color: '#6366f1' },
  { stage: 'QUOTE', label: 'Quote', color: '#3b82f6' },
  { stage: 'NEGOTIATION', label: 'Negotiation', color: '#f59e0b' },
  { stage: 'CLOSED_WON', label: 'Closed Won', color: '#10b981' },
  { stage: 'CLOSED_LOST', label: 'Closed Lost', color: '#ef4444' },
];

export default function KanbanBoard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);
  const [draggingOverStage, setDraggingOverStage] = useState<string | null>(null);

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm/deals');
      if (!res.ok) throw new Error('Failed to fetch deals');
      const data = await res.json();
      setDeals(data.deals || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching deals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
    // Set up polling for real-time updates (optional)
    const interval = setInterval(fetchDeals, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [fetchDeals]);

  const handleDragStart = (dealId: string) => {
    setDraggingDealId(dealId);
  };

  const handleDragEnd = () => {
    setDraggingDealId(null);
    setDraggingOverStage(null);
  };

  const handleDragOver = (stage: string) => {
    setDraggingOverStage(stage);
  };

  const handleDragLeave = () => {
    setDraggingOverStage(null);
  };

  const handleDrop = async (dealId: string, newStage: string) => {
    try {
      const res = await fetch(`/api/crm/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      
      if (!res.ok) throw new Error('Failed to update deal stage');
      
      // Optimistic update - update local state
      setDeals(prevDeals =>
        prevDeals.map(deal =>
          deal.id === dealId ? { ...deal, stage: newStage } : deal
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move deal');
      console.error('Error updating deal stage:', err);
      // Revert optimistic update on error
      setDeals(prevDeals =>
        prevDeals.map(deal =>
          deal.id === dealId ? { ...deal, stage: deal.stage } : deal
        )
      );
    } finally {
      setDraggingDealId(null);
      setDraggingOverStage(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        Loading CRM Kanban board...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        background: '#fee2e2', 
        border: '1px solid #fecaca', 
        borderRadius: '0.5rem',
        margin: '2rem'
      }}>
        <p style={{ color: '#dc2626', margin: '0 0 0.5rem 0' }}>{error}</p>
        <button 
          onClick={fetchDeals}
          style={{ 
            padding: '0.5rem 1rem', 
            background: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0.375rem', 
            cursor: 'pointer' 
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Group deals by stage
  const dealsByStage: Record<string, Deal[]> = {};
  deals.forEach(deal => {
    if (!dealsByStage[deal.stage]) {
      dealsByStage[deal.stage] = [];
    }
    dealsByStage[deal.stage].push(deal);
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Deal Kanban Board</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => window.location.href = '/(dashboard)/crm/deals'}
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#6b7280', 
              color: 'white', 
              border: 'none', 
              borderRadius: '0.375rem', 
              cursor: 'pointer' 
            }}
          >
            Back to List
          </button>
          <button 
            onClick={fetchDeals}
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#10b981', 
              color: 'white', 
              border: 'none', 
              borderRadius: '0.375rem', 
              cursor: 'pointer' 
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '1.5rem', 
        overflowX: 'auto', 
        paddingBottom: '1rem' 
      }}>
        {STAGES.map(stage => {
          const stageDeals = dealsByStage[stage.stage] || [];
          const isDraggingOver = draggingOverStage === stage.stage;
          
          return (
            <div
              key={stage.stage}
              style={{ 
                flex: '0 0 280px', 
                minWidth: '280px',
                background: isDraggingOver ? '#f0f9ff' : 'white',
                border: isDraggingOver ? '2px dashed #3b82f6' : '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1rem',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '1rem' 
              }}>
                <h2 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: 600, 
                  color: stage.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    background: stage.color, 
                    borderRadius: '50%' 
                  }}></div>
                  {stage.label}
                </h2>
                <span style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 500, 
                  color: '#6b7280' 
                }}>
                  {stageDeals.length} deals
                </span>
              </div>

              {stageDeals.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#9ca3af', 
                  fontStyle: 'italic',
                  padding: '2rem'
                }}>
                  No deals in this stage
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.75rem',
                  minHeight: '200px'
                }}>
                  {stageDeals.map(deal => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => handleDragStart(deal.id)}
                      onDragEnd={handleDragEnd}
                      style={{ 
                        cursor: 'move',
                        userSelect: 'none',
                        background: 'white', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '0.375rem', 
                        padding: '1rem',
                        marginBottom: '0.5rem',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        position: 'relative',
                        opacity: draggingDealId === deal.id ? 0.5 : 1,
                        transform: draggingDealId === deal.id ? 'translateX(10px)' : 'translateX(0)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'start',
                        marginBottom: '0.5rem' 
                      }}>
                        <h3 style={{ 
                          fontSize: '0.95rem', 
                          fontWeight: 600, 
                          margin: '0',
                          lineHeight: '1.4'
                        }}>
                          {deal.title}
                        </h3>
                        {deal.value != null && (
                          <span style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: 600, 
                            color: '#10b981' 
                          }}>
                            ${deal.value.toLocaleString()}
                          </span>
                        )}
                      </div>
                      
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#6b7280', 
                        marginBottom: '0.5rem' 
                      }}>
                        {deal.lead?.name || 'Unknown Lead'}
                      </div>
                      
                      {deal.closeDate && (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#9ca3af', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem' 
                        }}>
                          <span style={{ 
                            width: '12px', 
                            height: '12px', 
                            background: '#fbbf24', 
                            borderRadius: '50%', 
                            display: 'inline-block' 
                          }}></span>
                          <span>{new Date(deal.closeDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#9ca3af', 
                        marginTop: '0.5rem' 
                      }}>
                        Updated: {new Date(deal.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Drag overlay placeholder */}
      {draggingDealId && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none',
          zIndex: 1000
        }}>
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '2px dashed #3b82f6',
            borderRadius: '0.5rem',
            padding: '2rem',
            textAlign: 'center',
            width: '300px'
          }}>
            <p style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1.125rem', 
              fontWeight: 600,
              color: '#3b82f6' 
            }}>
              Dragging deal...
            </p>
            <p style={{ 
              margin: '0', 
              fontSize: '0.875rem', 
              color: '#6b7280' 
            }}>
              Drop over a stage to move the deal
            </p>
          </div>
        </div>
      )}
    </div>
  );
}