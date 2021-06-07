import React, { useEffect, useState } from 'react'
import { Statistic } from 'antd'
import { useSolPrice } from '../../contexts'
import { formatUSD } from '@oyster/common'

interface IAmountLabel {
  amount: number | string,
  displayUSD?: boolean,
  title?: string,
  style?: object,
  containerStyle?: object,
  newClasses?: string
}

export const AmountLabel = (props: IAmountLabel) => {
  const { amount: _amount, displayUSD = true, title = "", style = {}, containerStyle = {} } = props
  const amount = typeof _amount === "string" ? parseFloat(_amount) : _amount

  const solPrice = useSolPrice()

  const [priceUSD, setPriceUSD] = useState<number | undefined>(undefined)

  useEffect(() => {
    setPriceUSD(solPrice * amount)
  }, [amount, solPrice])

  return <div style={{ ...containerStyle }}>
    <Statistic
      style={style}
      className={props.newClasses ? props.newClasses : 'create-statistic'}
      title={title || ""}
      value={amount}
      prefix="◎"
    />
    {displayUSD &&
      <div
        style={{
          margin: 'auto 0',
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '1.5rem',
        }}
      >
        {formatUSD.format(priceUSD || 0)}
      </div>
    }
  </div>
}
