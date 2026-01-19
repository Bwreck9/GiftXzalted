import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface AmazonProductCardProps {
  url: string;
  title?: string;
}

export function AmazonProductCard({ url, title }: AmazonProductCardProps) {
  // Parse product ID from Amazon URL
  const getProductId = (url: string) => {
    const match = url.match(/\/dp\/([A-Z0-9]+)/i) || url.match(/\/gp\/product\/([A-Z0-9]+)/i);
    return match ? match[1] : null;
  };

  const productId = getProductId(url);
  const displayTitle = title || 'Amazon Product';

  return (
    <Card className="p-4 hover-elevate" data-testid={`card-amazon-product-${productId}`}>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h4 className="font-medium text-foreground mb-1">{displayTitle}</h4>
          {productId && (
            <p className="text-sm text-muted-foreground">Product ID: {productId}</p>
          )}
        </div>
        <Button
          asChild
          variant="default"
          size="sm"
          data-testid={`button-view-product-${productId}`}
          className="hover-elevate active-elevate-2"
        >
          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            View
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </Card>
  );
}
