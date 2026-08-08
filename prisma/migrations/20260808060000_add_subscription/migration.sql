CREATE TABLE "subscriptions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "stripe_customer_id" TEXT NOT NULL,
  "stripe_subscription_id" TEXT NOT NULL,
  "stripe_price_id" TEXT NOT NULL,
  "tier" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "current_period_start" TIMESTAMP(3),
  "current_period_end" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscriptions_stripe_customer_id_key" ON "subscriptions"("stripe_customer_id");
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");
CREATE INDEX "subscriptions_tenant_id_idx" ON "subscriptions"("tenant_id");
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON "subscriptions"
  USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);
