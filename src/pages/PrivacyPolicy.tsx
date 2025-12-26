import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Privacy <span className="text-gold">Policy</span>
            </h1>
            <p className="text-muted-foreground mb-8">Last updated: December 26, 2024</p>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold mb-4">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  TimeBank ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains 
                  how we collect, use, disclose, and safeguard your information when you use our platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold mb-4">2. Information We Collect</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We collect information you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Name, email address, and contact information</li>
                  <li>Profile information and skills you choose to share</li>
                  <li>Messages and communications with other users</li>
                  <li>Transaction and service exchange history</li>
                  <li>Feedback and correspondence</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold mb-4">3. How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and manage time credits</li>
                  <li>Connect you with other users for skill exchanges</li>
                  <li>Send notifications and updates about your account</li>
                  <li>Respond to your comments and questions</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold mb-4">4. Information Sharing</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We do not sell your personal information. We may share your information with third parties only 
                  in the following circumstances: with your consent, to comply with legal obligations, to protect 
                  our rights, or with service providers who assist in our operations.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold mb-4">5. Data Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement appropriate technical and organizational measures to protect your personal information 
                  against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold mb-4">6. Your Rights</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You have the right to access, correct, or delete your personal information. You can manage your 
                  account settings or contact us for assistance with these requests.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-bold mb-4">7. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have questions about this Privacy Policy, please contact us at{" "}
                  <a href="mailto:privacy@timebank.com" className="text-gold hover:underline">
                    privacy@timebank.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
