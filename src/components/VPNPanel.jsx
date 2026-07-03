import React, { useState, useEffect } from 'react';

const styles = {
  panel: {
    flex: '1 1 400px',
    background: 'rgba(26, 26, 46, 0.9)',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(0, 212, 255, 0.15)',
    minWidth: '320px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#00d4ff',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    padding: '12px 16px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
  },
  statusDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  statusDisconnected: {
    background: '#555',
  },
  statusConnecting: {
    background: '#ffb347',
    animation: 'pulse 1s infinite',
  },
  statusConnected: {
    background: '#4caf50',
  },
  statusLabel: {
    fontSize: '14px',
    color: '#8a8a9a',
  },
  statusValue: {
    fontSize: '14px',
    color: '#e0e0e0',
    fontWeight: '500',
  },
  selectWrapper: {
    marginBottom: '20px',
  },
  selectLabel: {
    fontSize: '14px',
    color: '#8a8a9a',
    marginBottom: '8px',
    display: 'block',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(0, 212, 255, 0.3)',
    borderRadius: '8px',
    color: '#e0e0e0',
    fontSize: '16px',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
  },
  ipDisplay: {
    marginBottom: '20px',
    padding: '12px 16px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#8a8a9a',
  },
  ipValue: {
    color: '#4caf50',
    fontWeight: '600',
    fontSize: '16px',
  },
  buttonsRow: {
    display: 'flex',
    gap: '12px',
  },
  connectBtn: {
    flex: 1,
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #00d4ff, #0078d4)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  disconnectBtn: {
    flex: 1,
    padding: '14px 24px',
    background: 'rgba(255, 75, 75, 0.2)',
    border: '1px solid rgba(255, 75, 75, 0.5)',
    borderRadius: '8px',
    color: '#ff4b4b',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

const STATUS_LABELS = {
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
  connected: 'Connected',
};

export default function VPNPanel({
  vpnStatus,
  setVpnStatus,
  selectedCountry,
  setSelectedCountry,
  vpnIp,
  setVpnIp,
}) {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/vpn/countries')
      .then((res) => res.json())
      .then((data) => setCountries(data.countries || []))
      .catch(() => setCountries([]));
  }, []);

  const handleConnect = async () => {
    setVpnStatus('connecting');
    setLoading(true);
    try {
      const res = await fetch('/api/vpn/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: selectedCountry }),
      });
      const data = await res.json();
      if (data.status === 'connected') {
        setVpnIp(data.ip);
        setVpnStatus('connected');
      } else {
        setVpnStatus('disconnected');
      }
    } catch {
      setVpnStatus('disconnected');
    }
    setLoading(false);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await fetch('/api/vpn/disconnect', { method: 'POST' });
      setVpnIp('');
      setVpnStatus('disconnected');
    } catch {
      setVpnIp('');
      setVpnStatus('disconnected');
    }
    setLoading(false);
  };

  const statusDotStyle = {
    ...styles.statusDot,
    ...(vpnStatus === 'disconnected' ? styles.statusDisconnected : {}),
    ...(vpnStatus === 'connecting' ? styles.statusConnecting : {}),
    ...(vpnStatus === 'connected' ? styles.statusConnected : {}),
  };

  return (
    <div style={styles.panel}>
      <div style={styles.title}>🔒 VPN Connection</div>

      <div style={styles.statusRow}>
        <span style={statusDotStyle} />
        <span style={styles.statusLabel}>Status:</span>
        <span style={styles.statusValue}>{STATUS_LABELS[vpnStatus]}</span>
      </div>

      <div style={styles.selectWrapper}>
        <label style={styles.selectLabel}>Select Server Location</label>
        <select
          style={styles.select}
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          disabled={vpnStatus === 'connected' || loading}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
      </div>

      {vpnStatus === 'connected' && vpnIp && (
        <div style={styles.ipDisplay}>
          Your VPN IP: <span style={styles.ipValue}>{vpnIp}</span>
        </div>
      )}

      <div style={styles.buttonsRow}>
        <button
          style={{
            ...styles.connectBtn,
            ...(vpnStatus === 'connected' || loading ? styles.disabledBtn : {}),
          }}
          onClick={handleConnect}
          disabled={vpnStatus === 'connected' || loading}
        >
          Connect
        </button>
        <button
          style={{
            ...styles.disconnectBtn,
            ...(vpnStatus === 'disconnected' || loading ? styles.disabledBtn : {}),
          }}
          onClick={handleDisconnect}
          disabled={vpnStatus === 'disconnected' || loading}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
