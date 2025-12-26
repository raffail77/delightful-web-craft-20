import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Cookie <span className="text-gold">Policy</span>
            </h1>
            <p className="text-muted-foreground mb-8">Last updated: December 26, 2024</p>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold mb-4">1. What Are Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Cookies are small text files placed on your device when you visit our website. They help us 
                  provide you with a better experience by remembering your preferences and understanding how 
                  you use our platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold mb-4">2. Types of Cookies We Use</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Essential Cookies</h3>
                    <p className="text-muted-foreground">
                      Required for the platform to function. They enable core features like user authentication 
                      and security.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Functional Cookies</h3>
                    <p className="text-muted-foreground">
                      Remember your preferences and settings to provide a personalized experience.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Analytics Cookies</h3>
                    <p className="text-muted-foreground">
                      Help us understand how visitors interact with our platform so we can improve it.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold mb-4">3. Managing Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Most browsers allow you to control cookies through their settings. You can delete existing 
                  cookies and configure your browser to prevent new ones. However, disabling cookies may affect 
                  your experience on our platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold mb-4">4. Third-Party Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may use third-party services that set their own cookies for analytics and functionality 
                  purposes. These third parties have their own privacy policies governing how they use this 
                  information.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold mb-4">5. Updates to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Cookie Policy from time to time. We will notify you of significant changes 
                  by posting a notice on our platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-bold mb-4">6. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have questions about our use of cookies, contact us at{" "}
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

export default CookiePolicy;
