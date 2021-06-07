import React from 'react';
import { Button, Select } from 'antd';
import { useWallet } from '../../contexts/wallet';
import { ENDPOINTS, useConnectionConfig } from '../../contexts/connection';
import { shortenAddress } from '../../utils';
import { CopyOutlined } from '@ant-design/icons';
import './styles.css';

export const Settings = ({
  additionalSettings,
}: {
  additionalSettings?: JSX.Element;
}) => {
  const { connected, disconnect, select, wallet } = useWallet();
  const { endpoint, setEndpoint } = useConnectionConfig();

  return (<div className="settings">
        Network:{' '}
         <Select
          className="settings__input"
          onSelect={setEndpoint}
          value={endpoint}
          style={{ marginBottom: 20 }}
        >
          {ENDPOINTS.map(({ name, endpoint }) => (
            <Select.Option value={endpoint} key={endpoint}>
              {name}
            </Select.Option>
          ))}
        </Select>
        {connected && (
          <>
            <span>Wallet:</span>
            {wallet?.publicKey && (
              <Button
                className="settings__input"
                style={{ marginBottom: 5 }}
                onClick={() =>
                  navigator.clipboard.writeText(
                    wallet.publicKey?.toBase58() || '',
                  )
                }
              >
                <CopyOutlined />
                {shortenAddress(wallet?.publicKey.toBase58())}
              </Button>
            )}

            <Button
              className="settings__input"
              onClick={select}
              style={{ marginBottom: 5 }}>
              Change
            </Button>
            <Button
              className="settings__btn"
              type="primary"
              onClick={disconnect}
              style={{ marginBottom: 5 }}
            >
              Disconnect
            </Button>
          </>
        )}
        {additionalSettings}
      </div>
  );
};
