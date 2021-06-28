import React from 'react';
import { TwitterCircleFilled } from '@ant-design/icons';
import { ReactComponent as CoralRefLogo } from '../../../images/coralreef_logo.svg';
import './index.less';


export default (props: any) => {
  return <main>
    <header className="header center">
      <CoralRefLogo />
      <div className="heading">
        Please Follow us on Twitter for updates comming soon <a href="https://twitter.com/CoralReefNFT?s=09" rel="noopener"><TwitterCircleFilled /></a>
      </div>
    </header>
  </main>;
};
