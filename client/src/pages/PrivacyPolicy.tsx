import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Gift, ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();
  const currentYear = new Date().getFullYear();
  const lastUpdated = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 group"
            aria-label="Gift Spark Home"
            data-testid="button-home-logo"
          >
            <div className="bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-2 rounded-lg">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Gift Spark
            </span>
          </button>
          
          <Button
            onClick={() => setLocation('/')}
            className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:opacity-90 text-white border-0 shadow-md hover-elevate active-elevate-2"
            data-testid="button-back-home"
            aria-label="Back to Home"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-primary/20 to-purple-500/10 p-4 rounded-full">
                <Shield className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Last Updated: {lastUpdated}
            </p>
          </div>

          {/* Content */}
          <Card className="p-8 space-y-6">
            <p className="text-lg leading-relaxed">
              Gift Spark values your privacy. This policy explains what information we collect, 
              why we collect it, and how we use it.
            </p>

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>• Basic profile info: names, gift ideas, and notes you enter.</li>
                  <li>• Usage data: how you interact with the app to help improve features.</li>
                  <li>• Optional contact info: only if you choose to create an account or subscribe.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>• To save your wishlists and personalize gift suggestions.</li>
                  <li>• To manage subscriptions, tokens, and profile limits.</li>
                  <li>• To improve app performance and user experience.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">3. Data Storage & Security</h2>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>• Your data is stored securely and never sold or shared with third parties.</li>
                  <li>• Access is limited to Gift Spark systems and authorized service providers.</li>
                  <li>• We retain your data for as long as your account is active or as needed to provide services.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">4. Third-Party Services</h2>
                <p className="text-muted-foreground mb-2">
                  Gift Spark uses the following third-party services to provide our features:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>• <strong>Google Sign-In</strong>: For secure authentication</li>
                  <li>• <strong>Payment Processors</strong>: To handle subscriptions and token purchases securely</li>
                  <li>• <strong>OpenAI</strong>: To generate personalized gift recommendations</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  These services have their own privacy policies governing how they handle your data.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">5. Your Choices</h2>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>• You can delete profiles, wishlists, or your entire account at any time.</li>
                  <li>• To request full data deletion, contact us at: <a href="mailto:support@xzalted.com" className="text-primary hover:underline">support@xzalted.com</a></li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">6. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Gift Spark is intended for general audiences and not designed for children under 13.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">7. Updates</h2>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>• We may update this policy from time to time as features evolve.</li>
                  <li>• Any significant updates will be announced in the app or on our website.</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Footer Copyright */}
          <div className="text-center text-sm text-muted-foreground py-4">
            © {currentYear} Gift Spark. Created & managed by Xzalted. All rights reserved.
          </div>

          {/* Bottom Back Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              size="lg"
              className="hover-elevate active-elevate-2"
              aria-label="Back to Home"
              data-testid="button-back-bottom"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
