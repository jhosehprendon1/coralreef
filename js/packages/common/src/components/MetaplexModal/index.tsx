import React from 'react';
import { Modal } from 'antd';

import './index.css';

export const MetaplexModal = (props: any) => {

  const { children, bodyStyle, ...rest } = props

  return (
    <Modal
      bodyStyle={{
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...bodyStyle,
      }}
      footer={null}
      width={400}
      {...rest}
    >
      {children}
    </Modal>
  );
};
