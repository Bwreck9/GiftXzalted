import { useToast } from '@/hooks/use-toast';

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

export function useCopyToClipboard() {
  const { toast } = useToast();

  const copy = async (text: string, successMessage = 'Copied to clipboard!') => {
    const success = await copyToClipboard(text);
    
    if (success) {
      toast({
        title: successMessage,
        duration: 2000,
      });
    } else {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
        duration: 3000,
      });
    }
    
    return success;
  };

  return { copy };
}
