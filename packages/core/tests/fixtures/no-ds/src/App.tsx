import { Button } from '@mui/material';
import styled from 'styled-components';

const Wrap = styled.div`
  padding: 4px;
`;

export function App() {
  return (
    <Wrap>
      <Button className="primary">Hi</Button>
      <button className="secondary">Bye</button>
    </Wrap>
  );
}
