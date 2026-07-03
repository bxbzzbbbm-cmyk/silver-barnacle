import React, { useState } from 'react';
import VPNPanel from './components/VPNPanel';
import StripeCheckout from './components/StripeCheckout';

const styles = {
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)',
    color: '#e0e0e0',
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  logo: {
    fontSize: '48px',
    fontWeight: '700',
    letterSpacing: '2px',
    color: '#00d4ff',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#8a8a9a',
    fontWeight: '400',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    maxWidth: '900px',
    width: '100%',
  },
  panelsRow: {
    display: 'flex',
    gap: '32px',
    width: '100%',
    flexWrap: 'wrap',
  },
};

export default function App() {
  const [vpnStatus, setVpnStatus] = useState('disconnected');
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [vpnIp, setVpnIp] = useState('');

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div style={styles.logo}>🛡️ SecureVPN</div>
        <div style={styles.subtitle}>Browse privately. Stay protected.</div>
      </div>
      <div style={styles.mainContent}>
        <div style={styles.panelsRow}>
          <VPNPanel
            vpnStatus={vpnStatus}
            setVpnStatus={setVpnStatus}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            vpnIp={vpnIp}
            setVpnIp={setVpnIp}
          />
          <StripeCheckout vpnStatus={vpnStatus} />
        </div>
      </div>
    </div>
  );
}
