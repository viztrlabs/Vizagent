export type EventName =
  | 'signup_started'
  | 'signup_completed'
  | 'signup_failed'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'asset_uploaded'
  | 'deployment_published'
  | 'checkout_started'
  | 'checkout_completed'
  | 'subscription_changed'
  | 'login_failed'
  | 'payment_failed';

export type EventPropertiesMap = {
  signup_started: { method: 'email' | 'oauth'; referrer: string };
  signup_completed: { method: string };
  signup_failed: { error_code: string; method: string };
  onboarding_step_completed: { step: number; step_name: 'welcome' | 'project_setup' | 'first_asset' | 'publish' | 'team_invite' };
  onboarding_completed: { duration_ms: number; steps_completed: number };
  asset_uploaded: { asset_id: string; asset_type: 'model' | 'texture' | 'scene' | 'environment' | 'other'; file_size_mb: number };
  deployment_published: { deployment_id: string; project_id: string; xr_mode: 'tour' | 'webxr' | 'web_ar' | 'vr' | 'pixel_streaming' };
  checkout_started: { plan_id: string; amount: number; currency: string };
  checkout_completed: { plan_id: string; amount: number; currency: string; subscription_id: string };
  subscription_changed: { plan_id: string; previous_plan_id: string | null; subscription_id: string; change_type: 'upgrade' | 'downgrade' | 'cancel' | 'resume' };
  login_failed: { reason: 'invalid_credentials' | 'mfa_required' | 'account_locked' | 'unknown' };
  payment_failed: { error_code: string; invoice_id: string };
};