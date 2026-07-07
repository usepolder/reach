import { Button, Card, Badge } from '@acme/ds';

export function Widget() {
  return (
    <Card>
      <Badge tone="new" />
      <Button>Try it</Button>
      <div className="custom-footer" style={{ padding: '24px' }}>
        <span className="fine-print" style={{ color: '#888888' }}>terms apply</span>
      </div>
    </Card>
  );
}
