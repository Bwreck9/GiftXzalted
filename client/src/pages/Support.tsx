import { useState } from 'react';
import { useLocation } from 'wouter';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Support() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast({ 
        title: 'Please fill in all fields', 
        variant: 'destructive' 
      });
      return;
    }

    setIsSubmitting(true);

    // Create mailto link with pre-filled information
    const mailtoLink = `mailto:support@xzalted.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    )}`;

    try {
      window.location.href = mailtoLink;
      
      toast({ 
        title: 'Opening your email client',
        description: 'Please send the email to complete your support request.'
      });

      // Reset form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      toast({ 
        title: 'Failed to open email client',
        description: 'Please email us directly at support@xzalted.com',
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <AppHeader />

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <Button
              onClick={() => setLocation('/')}
              variant="ghost"
              size="sm"
              className="hover-elevate mb-4"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Support</h1>
            <p className="text-muted-foreground">
              Have a question or need help? Send us a message and we'll get back to you as soon as possible.
            </p>
          </div>

          {/* Contact Information */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Email Support</h2>
                <a 
                  href="mailto:support@xzalted.com"
                  className="text-sm text-primary hover:underline"
                  data-testid="link-email-direct"
                >
                  support@xzalted.com
                </a>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Fill out the form below and we'll open your email client with a pre-filled message, or email us directly at the address above.
            </p>
          </Card>

          {/* Contact Form */}
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="Brief description of your inquiry"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  data-testid="input-subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Please describe your question or issue in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  data-testid="textarea-message"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full hover-elevate active-elevate-2"
                data-testid="button-submit"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Opening email...' : 'Send Message'}
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
