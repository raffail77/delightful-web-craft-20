import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Terms of <span className="text-gold">Service</span>
            </h1>
            <p className="text-muted-foreground mb-8">Last updated: December 26, 2024</p>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold mb-4">1. Agreement to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using TimeBank, you agree to be bound by these Terms of Service. If you do not 
                  agree to these terms, please do not use our platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold mb-4">2. Use of Service</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  TimeBank is a platform for exchanging skills and services using time credits. You agree to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account</li>
                  <li>Use the platform for lawful purposes only</li>
                  <li>Respect other users and their property</li>
                  <li>Not engage in fraudulent or deceptive practices</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold mb-4">3. Time Credits</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Time credits are a virtual unit of exchange on our platform. They have no cash value and cannot 
                  be redeemed for currency. TimeBank reserves the right to adjust time credit balances in cases 
                  of fraud, abuse, or technical errors.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold mb-4">4. Service Exchanges</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Users are responsible for the quality and delivery of services they offer. TimeBank is a 
                  facilitator and is not liable for disputes between users. We encourage users to communicate 
                  clearly and set expectations before beginning an exchange.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold mb-4">5. User Content</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You retain ownership of content you post. By posting, you grant TimeBank a license to use, 
                  display, and distribute that content on our platform. You are responsible for ensuring you 
                  have the right to share any content you post.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold mb-4">6. Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may suspend or terminate your account for violations of these terms or for any other reason 
                  at our discretion. You may also close your account at any time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold mb-4">7. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  TimeBank is provided "as is" without warranties of any kind. We are not liable for any indirect, 
                  incidental, or consequential damages arising from your use of the platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-bold mb-4">8. Contact</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For questions about these Terms, contact us at{" "}
                  <a href="mailto:legal@timebank.com" className="text-gold hover:underline">
                    legal@timebank.com
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

export default TermsOfService;
