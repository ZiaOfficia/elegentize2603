import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";

import { SEO } from "../components/common/SEO";

export const PrivacyPolicyPage = () => {
  return (
    <div className="bg-white min-h-screen pt-[60px] md:pt-[50px]">
      <SEO
        title="Privacy Policy"
        description="Privacy Policy for Elegantize Weddings."
      />
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 shadow-sm border border-stone-100">
        <h1 className="text-4xl font-serif text-stone-900 mb-8">
          Privacy Policy
        </h1>
        <p className="text-stone-500 mb-8 text-sm uppercase tracking-widest">
          Last Updated: October 2024
        </p>

        <div className="prose prose-stone max-w-none text-stone-600">
          <p className="mb-6">
            At Elegantize, we value your privacy and are committed to protecting
            your personal information. This Privacy Policy outlines how we
            collect, use, and safeguard your data when you visit our website or
            use our wedding decoration services. By using our website, you agree
            to the terms outlined below.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Who We Are
          </h2>
          <p className="mb-6">
            Elegantize provides wedding decoration services across New York and
            New Jersey. Our goal is to create a personalized, memorable event
            experience for your special day. Our website address is:
            [https://elegantize.com].
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            How We Collect and Use Your Personal Information
          </h2>
          <p className="mb-4">
            We collect only the necessary personal information to provide our
            services. This includes:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>Name</li>
            <li>Phone Number</li>
            <li>Email Address</li>
          </ul>
          <p className="mb-4">
            You provide this information when you fill out forms on our website,
            request a consultation, or subscribe to our newsletter. We use your
            data to:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>Respond to inquiries</li>
            <li>Communicate regarding our services</li>
            <li>Personalize your experience with Elegantize</li>
          </ul>
          <p className="mb-6">
            We do not collect payment or sensitive personal data through our
            website.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            How We Protect Your Personal Data
          </h2>
          <p className="mb-6">
            The security of your personal information is a top priority. We take
            appropriate security measures to protect your name, phone number,
            and email address from unauthorized access or disclosure. However,
            no method of transmission over the internet is 100% secure, so we
            cannot guarantee absolute security.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Who We Share Your Data With
          </h2>
          <p className="mb-6">
            We do not sell or rent your personal information. Your data may be
            shared only in the following situations:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>
              <strong>Service Providers:</strong> We may share your information
              with trusted third-party vendors who assist in our service
              delivery, such as communication platforms.
            </li>
            <li>
              <strong>Legal Compliance:</strong> If required by law, we may
              disclose your information to comply with legal obligations.
            </li>
          </ul>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Cookies and Tracking Technologies
          </h2>
          <p className="mb-6">
            Our website uses cookies to enhance your browsing experience.
            Cookies help us remember your preferences and optimize our website’s
            functionality. They assist with:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>
              <strong>Personalization:</strong> Tailoring the website to your
              preferences.
            </li>
            <li>
              <strong>Analytics:</strong> Understanding how visitors use the
              website to improve features.
            </li>
          </ul>
          <p className="mb-6">
            You can manage or disable cookies through your browser settings, but
            please note this may affect some website functions.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            How Long We Retain Your Data
          </h2>
          <p className="mb-6">
            We retain personal information for as long as necessary to provide
            our services or until you request deletion. If you contact us for
            inquiries, we will keep your contact details until your request has
            been fulfilled.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            What Rights You Have Over Your Data
          </h2>
          <p className="mb-6">
            You have the following rights regarding your personal data:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>
              <strong>Access:</strong> Request a copy of the information we
              hold.
            </li>
            <li>
              <strong>Correction:</strong> Ask us to correct inaccurate
              information.
            </li>
            <li>
              <strong>Deletion:</strong> Request the deletion of your data
              (subject to any legal obligations).
            </li>
            <li>
              <strong>Objection:</strong> Opt-out of certain communications,
              such as marketing.
            </li>
          </ul>
          <p className="mb-6">
            To exercise these rights, please contact us at the email or phone
            number below.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Where Your Data Is Sent
          </h2>
          <p className="mb-6">
            Your data may be processed by third-party service providers outside
            of your home country, but we take steps to ensure your privacy is
            protected in accordance with this Privacy Policy.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Changes to This Privacy Policy
          </h2>
          <p className="mb-6">
            We may update this policy from time to time to reflect changes in
            our practices or legal obligations. Any significant updates will be
            communicated through a notice on our website, and we will update the
            effective date at the top. Continued use of our site signifies your
            acceptance of any changes.
          </p>

          <h2 className="text-2xl font-serif text-stone-900 mt-8 mb-4">
            Contact Us
          </h2>
          <p className="mb-4">
            If you have any questions or concerns about this Privacy Policy,
            please contact us at:
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
            We are dedicated to protecting your privacy and ensuring your data
            is handled responsibly.
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
