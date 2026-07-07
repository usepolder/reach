import { Button, Card, Table } from '@acme/ds';

export function App() {
  return (
    <>
      <Card>
        <Table>
          <Table.Row>
            <Button>Go</Button>
          </Table.Row>
        </Table>
      </Card>
      <div>
        <span>layout glue, unstyled</span>
      </div>
    </>
  );
}
