import { Button, Table } from '@acme/ds';
import * as DS from '@acme/ds';
import { LegacyCard } from './LegacyCard';
import Hero from './Hero';

export function App() {
  return (
    <main className="app">
      <Hero title="hi" />
      <DS.Banner tone="info" />
      <Table>
        <Table.Row>
          <Button>Save</Button>
        </Table.Row>
      </Table>
      <LegacyCard />
      <div style={{ padding: 12 }}>
        <section>
          <Button>Cancel</Button>
        </section>
      </div>
    </main>
  );
}
