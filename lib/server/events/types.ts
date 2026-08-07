export interface DomainEvent {
  id: string;
  type: 'BookingCreated' | 'SessionStarting' | 'PaymentSucceeded' | 'AssetUploaded';
  aggregateId: string;
  tenantId: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  metadata: { correlationId?: string; userId?: string };
}
