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
            aria-label="Gift Xzalted Home"
            data-testid="button-home-logo"
          >
            <div className="bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-2 rounded-lg">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Gift Xzalted
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
              Welcome to Gift Xzalted! By using this app, you agree to these terms.
            </p>

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-3">1. Overview</h2>
                <p className="text-muted-foreground">
                  Gift Xzalted helps you organize gift ideas and discover new suggestions. 
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
                <p className="text-muted-foreground mb-3">
                  Tokens are digital credits used for generating AI-powered gift recommendations. 
                  Each AI generation costs 500 tokens.
                </p>
                <div className="space-y-3 text-muted-foreground ml-4">
                  <div>
                    <p className="font-medium text-foreground">Subscription Tokens:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Included with Basic, Premium, and Enterprise plans</li>
                      <li>• Reset to your plan's monthly allowance on the 1st of each month</li>
                      <li>• Unused subscription tokens do not carry over to the next month</li>
                      <li>• Used second, after purchased tokens are depleted</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Purchased Tokens:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Available as one-time purchases ($5 for 5,000 tokens)</li>
                      <li>• Never expire and never reset</li>
                      <li>• Used first when generating AI recommendations</li>
                      <li>• Remain in your account until you use them</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Payment & Security:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• All payments are processed securely through Stripe</li>
                      <li>• Subscriptions renew automatically unless cancelled</li>
                      <li>• You can manage your subscription at any time</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">4. Third-Party Services</h2>
                <p className="text-muted-foreground">
                  Gift Xzalted integrates with third-party services including Google (for authentication), 
                  payment processors (for transactions), and OpenAI (for AI-powered recommendations). 
                  Your use of these services is subject to their respective terms and policies.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">5. Token Restoration & Refund Policy</h2>
                
                <div className="space-y-3 text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground">Automatic Token Restoration:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• If an AI generation fails due to a technical error (server outage, API failure, database error), 
                          your tokens will be automatically restored to your account</li>
                      <li>• This restoration happens immediately and protects you from losing tokens to system failures</li>
                      <li>• Token restoration is automatic and does not require you to contact support</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-medium text-foreground">AI Generations Are Final:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Once an AI recommendation is successfully generated and delivered to you, the transaction is complete and final</li>
                      <li>• We cannot refund tokens for completed AI generations, even if you are not satisfied with the results</li>
                      <li>• AI-powered recommendations incur real costs from our service providers (OpenAI) and are one-time transactions</li>
                      <li>• By using tokens to generate recommendations, you acknowledge these are final purchases</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-medium text-foreground">Monetary Refunds:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Refund requests for token purchases or subscriptions are evaluated on a case-by-case basis</li>
                      <li>• All monetary refunds are processed through Stripe according to our refund policy</li>
                      <li>• To request a refund, contact us at <a href="mailto:support@xzalted.com" className="text-primary hover:underline">support@xzalted.com</a></li>
                      <li>• Refund requests must be made within 30 days of purchase</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-medium text-foreground">Subscription Cancellations:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• You may cancel your subscription at any time through your account settings</li>
                      <li>• Upon cancellation, you will retain access to your subscription benefits until the end of your current billing period</li>
                      <li>• Unused subscription tokens will be forfeited when your subscription period ends</li>
                      <li>• Purchased tokens remain in your account permanently, even after subscription cancellation</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">6. Acceptable Use</h2>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>• Please use Gift Xzalted responsibly.</li>
                  <li>• Do not upload or share inappropriate or offensive content.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>• All branding, design, and content in Gift Xzalted are owned by its creators.</li>
                  <li>• You may not copy or redistribute materials from the app without permission.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">8. Disclaimer</h2>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>• Gift suggestions are provided for inspiration and convenience only.</li>
                  <li>• We make no guarantees of satisfaction or suitability of any recommended item.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">9. Support</h2>
                <p className="text-muted-foreground">
                  For questions, technical issues, or data requests, contact: <a href="mailto:support@xzalted.com" className="text-primary hover:underline">support@xzalted.com</a>
                </p>
              </div>
            </div>
          </Card>

          {/* Footer Copyright */}
          <div className="text-center text-sm text-muted-foreground py-4">
            © {currentYear} Gift Xzalted. Created & managed by Xzalted. All rights reserved.
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
