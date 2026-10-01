import { useNavigate } from 'react-router';
import { Compass } from 'lucide-react';
import { useDocumentTitle } from '../lib/hooks';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/misc';

export default function NotFound() {
  useDocumentTitle('Not found');
  const navigate = useNavigate();
  return (
    <EmptyState
      icon={<Compass />}
      title="Page not found"
      description="That page doesn't exist — it may have moved."
      action={<Button onClick={() => navigate('/')}>Go home</Button>}
    />
  );
}
