import React, { Fragment } from 'react';
import { Tag } from '@acme/ds';

export const Tags = ({ items }: { items: string[] }) => (
  <Fragment>
    {items.map((i) => (
      <React.Fragment key={i}>
        <Tag>{i}</Tag>
      </React.Fragment>
    ))}
  </Fragment>
);
