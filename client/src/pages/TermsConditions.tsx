import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Gift, ArrowLeft, FileText } from 'lucide-react';

export default function TermsConditions() {
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
                <FileText className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Terms & Conditions
            </h1>
            <p className="text-muted-foreground">
              Last Updated: {lastUpdated}
            </p>
          </div>

          {/* Content */}
          <Card className="p-8 space-y-6">
            <p className="text-lg leading-relaxed">
              Welcome to Gift Spark! By using this app, you agree to these terms.
            </p>

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-3">1. Overview</h2>
                <p className="text-muted-foreground">
                  Gift Spark helps you organize gift ideas and discover new suggestions. 
                  You may use the app freely within the limits of your plan.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">2. Accounts & Profiles</h2>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>• Free users can save up to 5 profiles.</li>
                  <li>• Premium users receive additional profiles and monthly token allowances.</li>
                  <li>• You are responsible for keeping your account secure.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">3. Tokens & Subscriptions</h2>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>• Tokens are digital credits used for generating personalized gift suggestions.</li>
                  <li>• Subscription tokens reset monthly and may include bonus tokens.</li>
                  <li>• You can also purchase additional tokens anytime through "Premium Tokens."</li>
                  <li>• All payments are handled securely through the App Store or Google Play.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">4. Refunds</h2>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>• Refunds for in-app purchases follow Apple or Google's refund policies.</li>
                  <li>• Gift Spark does not process refunds directly.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">5. Acceptable Use</h2>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>• Please use Gift Spark responsibly.</li>
                  <li>• Do not upload or share inappropriate or offensive content.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>• All branding, design, and content in Gift Spark are owned by its creators.</li>
                  <li>• You may not copy or redistribute materials from the app without permission.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">7. Disclaimer</h2>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>• Gift suggestions are provided for inspiration and convenience only.</li>
                  <li>• We make no guarantees of satisfaction or suitability of any recommended item.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">8. Support</h2>
                <p className="text-muted-foreground">
                  For questions, technical issues, or data requests, contact: <a href="mailto:support@xzalted.com" className="text-primary hover:underline">support@xzalted.com</a>
                </p>
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
