import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | VizTR',
  description: 'VizTR terms of service - rules and guidelines for using our platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>
        <p className="text-gray-400 mb-6">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using VizTR, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>VizTR is a SaaS platform for creating, managing, and deploying architectural visualization experiences including virtual tours, WebAR, WebXR, and 3D configurators.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Account Responsibilities</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>You must provide accurate and complete registration information</li>
              <li>You are responsible for safeguarding your account credentials</li>
              <li>You must be at least 18 years old to use the Service</li>
              <li>You may not share your account with others</li>
              <li>You must notify us immediately of any unauthorized access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Upload malicious code or content</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use the Service to develop a competing product</li>
              <li>Exceed rate limits or abuse API endpoints</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Intellectual Property</h2>
            <p>The Service and its original content, features, and functionality are owned by VizTR and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
            <h3 className="text-lg font-medium text-white mt-4 mb-2">Your Content</h3>
            <p>You retain ownership of all content you upload to the Service. You grant VizTR a limited license to host, store, and process your content solely to provide the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Subscriptions and Payment</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Paid plans are billed in advance on a monthly or annual basis</li>
              <li>All fees are non-refundable except as required by law</li>
              <li>We may change pricing with 30 days&apos; notice</li>
              <li>Free trial converts to paid subscription unless canceled before trial ends</li>
              <li>Overdue payments may result in service suspension</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Data and Privacy</h2>
            <p>Your use of the Service is also governed by our <a href="/legal/privacy-policy" className="text-cyan-400 hover:underline">Privacy Policy</a>. You are responsible for maintaining backups of your content.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Service Availability</h2>
            <p>We strive for 99.9% uptime but do not guarantee uninterrupted service. We may perform maintenance with reasonable advance notice. We are not liable for downtime or data loss.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, VizTR shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenue, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Termination</h2>
            <p>We may terminate or suspend your account at any time for violation of these Terms. Upon termination, your right to use the Service ceases immediately. We may retain data as required by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. Material changes will be communicated 30 days in advance. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Governing Law</h2>
            <p>These Terms are governed by the laws of India, without regard to conflict of law principles.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Contact</h2>
            <p>Questions about these Terms? Contact us at <a href="mailto:legal@viztr.io" className="text-cyan-400 hover:underline">legal@viztr.io</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
