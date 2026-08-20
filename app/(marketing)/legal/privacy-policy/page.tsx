import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | VizTR',
  description: 'VizTR privacy policy - how we collect, use, and protect your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="text-gray-400 mb-6">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>VizTR (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our architectural visualization platform and related services (collectively, the &quot;Service&quot;).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-white mt-4 mb-2">Account Information</h3>
            <p>When you create an account, we collect your name, email address, and authentication credentials (managed through Supabase Auth).</p>
            <h3 className="text-lg font-medium text-white mt-4 mb-2">Project Data</h3>
            <p>We store 3D models, images, configurations, and deployment data you upload or create through the Service. This data is stored in Supabase Storage and Cloudflare R2.</p>
            <h3 className="text-lg font-medium text-white mt-4 mb-2">Usage Data</h3>
            <p>We automatically collect analytics data including page views, feature usage, device information, and browser type to improve our Service.</p>
            <h3 className="text-lg font-medium text-white mt-4 mb-2">Payment Information</h3>
            <p>Payment processing is handled by Stripe. We do not store credit card numbers or payment details on our servers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To provide and maintain the Service</li>
              <li>To process transactions and manage subscriptions</li>
              <li>To send service-related communications</li>
              <li>To improve and personalize the Service</li>
              <li>To detect and prevent fraud or abuse</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Sharing</h2>
            <p>We do not sell your personal information. We share data only with:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Service providers necessary to operate the Service (Supabase, Cloudflare, Stripe, Vercel)</li>
              <li>When required by law or to protect our rights</li>
              <li>With your explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <p>We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data</li>
              <li>Export your data in a portable format</li>
              <li>Object to processing of your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Security</h2>
            <p>We implement industry-standard security measures including encryption in transit (TLS), encryption at rest, row-level security on all database tables, and regular security audits.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Cookies</h2>
            <p>We use essential cookies for authentication and session management. Analytics cookies (PostHog) are only loaded with your consent. See our cookie preferences for details.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. International Transfers</h2>
            <p>Your data may be processed in countries outside your jurisdiction. We ensure appropriate safeguards are in place for international data transfers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p>We may update this policy from time to time. Material changes will be communicated via email or in-app notification.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, contact us at <a href="mailto:privacy@viztr.io" className="text-cyan-400 hover:underline">privacy@viztr.io</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
