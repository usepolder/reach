import { Card, CardContent } from '@mui/material';

export function LegacyCard() {
  return (
    <Card>
      <CardContent>
        <div className="legacy" style={{ color: '#ff0000', padding: '16px' }}>
          old
        </div>
      </CardContent>
    </Card>
  );
}
