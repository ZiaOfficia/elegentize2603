import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";

import { SEO } from "../components/common/SEO";

export const TermsOfServicePage = () => {
  return (
    <div className="bg-white min-h-screen pt-[60px] md:pt-[50px]">
      <SEO
        title="Terms of Service"
        description="Terms of Service for Elegantize Weddings."
      />
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 shadow-sm border border-stone-100">
        <h1 className="text-4xl font-serif text-stone-900 mb-8">
          Terms of Service
        </h1>
        <p className="text-stone-500 mb-8 text-sm uppercase tracking-widest">
          Effective Date: October 2024
        </p>

        <div className="prose prose-stone max-w-none text-stone-600">
          <p className="mb-6">
            Welcome to Elegantize! These Terms of Service (“Terms”) govern your
            access to and use of our wedding decoration services, as well as the
            website elegantize.com. By using our services or visiting our
            website, you agree to these Terms. Please read them carefully. If
            you do not agree with any part of these Terms, please refrain from
            using our services or website.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Acceptance of Terms
          </h2>
          <p className="mb-6">
            By accessing or using elegantize.com or utilizing our wedding
            decoration services, you agree to these Terms, along with our
            Privacy Policy and Cookie Policy. These Terms apply to all users,
            clients, and visitors who access or use our website and services.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Services Overview
          </h2>
          <p className="mb-6">
            Elegantize specializes in wedding decoration services. Our offerings
            include, but are not limited to, consultation, event coordination,
            venue decoration, floral arrangements, lighting, and related
            services. Specific details of the services provided will be outlined
            in your contract or agreement with us.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Service Customization
          </h2>
          <p className="mb-6">
            We aim to tailor our services to meet your preferences. However,
            some service elements may be subject to availability, venue
            restrictions, or other factors, which will be discussed with you
            during the planning process.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Eligibility
          </h2>
          <p className="mb-6">
            Our services are available to individuals who are at least 18 years
            old. By using our services, you confirm that you meet this age
            requirement and have the legal authority to enter into these Terms
            and any related agreements.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Booking and Payment Terms
          </h2>
          <p className="mb-4">
            To secure our wedding decoration services, the following steps are
            necessary:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>
              <strong>Booking Confirmation:</strong> A signed contract outlining
              the scope of services.
            </li>
            <li>
              <strong>Deposit:</strong> A non-refundable deposit may be required
              to confirm your booking. This will be specified in your contract.
            </li>
            <li>
              <strong>Payment Schedule:</strong> Payment terms, including due
              dates, will be detailed in your contract. Full payment is
              typically required before the wedding day.
            </li>
          </ul>
          <p className="mb-6">
            Failure to meet payment terms may result in the cancellation of
            services or additional fees.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Cancellations and Refunds
          </h2>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>
              <strong>Cancellation by the Client:</strong> If you need to cancel
              your booking, refer to the cancellation terms in your contract.
              Deposits are typically non-refundable, and refunds for additional
              payments may be based on a sliding scale, depending on the timing
              of the cancellation.
            </li>
            <li>
              <strong>Cancellation by Elegantize:</strong> In exceptional
              circumstances, such as unforeseen events or failure to meet
              payment terms, we reserve the right to cancel services. In such
              cases, we will provide a full refund of any payments made,
              excluding non-refundable deposits.
            </li>
          </ul>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Changes to Services
          </h2>
          <p className="mb-6">
            Any changes to the scope of services (e.g., decorations, venues, or
            timelines) must be requested in writing and agreed upon by both
            parties. Depending on the nature of the change, additional fees may
            apply.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Client Responsibilities
          </h2>
          <p className="mb-4">You agree to:</p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>
              Provide accurate information about your wedding preferences, guest
              list, venue, and any other relevant details.
            </li>
            <li>
              Ensure that all necessary permits, licenses, and permissions for
              the event venue are secured.
            </li>
            <li>
              Communicate promptly with Elegantize throughout the planning
              process to avoid delays or misunderstandings.
            </li>
          </ul>
          <p className="mb-6">
            Failure to provide accurate or timely information may impact our
            ability to deliver the agreed-upon services.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Third-Party Vendors
          </h2>
          <p className="mb-6">
            During the planning and execution of our services, we may
            collaborate with or recommend third-party vendors (e.g.,
            photographers, caterers, florists). While we work with trusted
            partners, Elegantize is not responsible for the actions or services
            of these third-party vendors. Any agreements made with them are
            separate from your contract with Elegantize.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Intellectual Property
          </h2>
          <p className="mb-6">
            All content and materials provided by Elegantize, including website
            content, designs, logos, and images, are the intellectual property
            of Elegantize or our licensors. You may not reproduce, distribute,
            or create derivative works based on our content without our written
            consent.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Limitation of Liability
          </h2>
          <p className="mb-6">
            To the fullest extent permitted by law, Elegantize will not be
            liable for any indirect, incidental, or consequential damages
            arising from the use of our services or website, including but not
            limited to delays, cancellations, or events beyond our control.
          </p>
          <p className="mb-6">
            We will make every effort to execute your wedding plan as agreed,
            but circumstances such as weather, venue conditions, or unforeseen
            events may affect the final outcome. While we will not be liable for
            such circumstances, we will work diligently to provide alternative
            solutions.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Force Majeure
          </h2>
          <p className="mb-6">
            Elegantize will not be responsible for delays, cancellations, or
            failure to perform services due to events beyond our control, such
            as natural disasters, pandemics, strikes, or other events classified
            as force majeure. In such cases, we will work with you to reschedule
            or adjust services as feasible.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Indemnification
          </h2>
          <p className="mb-6">
            You agree to indemnify and hold Elegantize, its officers, directors,
            employees, and agents harmless from any claims, damages,
            liabilities, or expenses arising from your use of our services,
            breach of these Terms, or violation of any third-party rights.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Dispute Resolution
          </h2>
          <p className="mb-6">
            In the event of a dispute arising from the use of our services or
            website, we encourage you to contact us to seek a resolution. If a
            resolution cannot be reached, the dispute will be governed by the
            laws of [Insert Jurisdiction], and any legal action will be subject
            to the courts of [Insert Jurisdiction].
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Changes to Terms
          </h2>
          <p className="mb-6">
            We reserve the right to update or modify these Terms at any time
            without prior notice. Any changes will be effective immediately upon
            posting to our website. Your continued use of our services after any
            modifications constitutes your acceptance of the updated Terms.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Contact Us
          </h2>
          <p className="mb-4">
            If you have any questions or concerns about these Terms of Service
            or our wedding decoration services, please contact us:
          </p>
          <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
            <h3 className="font-serif text-lg text-stone-900 mb-2">
              Elegantize Support Team
            </h3>
            <p className="mb-1">
              <strong>Email:</strong> info@elegantize.com
            </p>
            <p className="mb-1">
              <strong>Phone:</strong> +1 (347) 686-4562
            </p>
            <p>
              <strong>Address:</strong> 8 Di Tomas Ct, Copiague, NY, 11726
            </p>
          </div>
          <p className="mt-6 italic">
            Thank you for choosing Elegantize! We look forward to making your
            wedding day a truly unforgettable experience.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-100 flex justify-center">
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
