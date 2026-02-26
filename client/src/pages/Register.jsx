import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';

export default function Register() {
  const { register, web3Login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingForm, setLoadingForm] = useState(false);
  const [loadingWeb3, setLoadingWeb3] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoadingForm(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoadingForm(false);
    }
  };

  const handleMetaMask = async () => {
    setError('');
    if (!window.ethereum) {
      setError('MetaMask not installed. Please install MetaMask and try again.');
      return;
    }
    setLoadingWeb3(true);
    try {
      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const { data } = await api.get(`/api/auth/web3/nonce?address=${address}`);
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [data.nonce, address],
      });
      await web3Login(address, signature);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Wallet connection failed.');
    } finally {
      setLoadingWeb3(false);
    }
  };

  const busy = loadingForm || loadingWeb3;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 80% 55% at 50% -5%, rgba(0,229,255,.06), #030711)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px',
      fontFamily: "'DM Sans', sans-serif", color: '#c8d8e8',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        .tf-inp{background:#101929;border:1px solid #1e2d45;border-radius:10px;color:#c8d8e8;padding:10px 14px 10px 38px;font-family:'DM Sans',sans-serif;font-size:14px;width:100%;outline:none;transition:border-color .2s,box-shadow .2s}
        .tf-inp:focus{border-color:#00e5ff;box-shadow:0 0 0 3px rgba(0,229,255,.07)}
        .tf-inp::placeholder{color:#3a5068}
        .tf-btn{background:linear-gradient(135deg,#00b8d4,#00e5ff);color:#030711;font-family:'DM Sans',sans-serif;font-weight:700;border:none;border-radius:9px;cursor:pointer;transition:all .2s;width:100%;padding:13px;font-size:15px}
        .tf-btn:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(0,229,255,.3)}
        .tf-btn:disabled{opacity:.35;cursor:not-allowed;transform:none}
        .tf-web3{background:linear-gradient(135deg,rgba(124,106,247,.12),rgba(124,106,247,.06));border:1px solid rgba(124,106,247,.35);color:#7c6af7;font-family:'DM Sans',sans-serif;font-weight:700;border-radius:9px;cursor:pointer;transition:all .2s;width:100%;padding:12px;font-size:14px;display:flex;align-items:center;justify-content:center;gap:9px}
        .tf-web3:hover{background:rgba(124,106,247,.18)}
        .tf-web3:disabled{opacity:.35;cursor:not-allowed}
        .spin{width:16px;height:16px;border:2px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:sp .65s linear infinite;flex-shrink:0}
        @keyframes sp{to{transform:rotate(360deg)}}
      `}</style>

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg,#00b8d4,#00e5ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 900, color: '#030711',
            }}>T</div>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-.01em' }}>
              Trade<span style={{ color: '#00e5ff' }}>FinX</span>
            </span>
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 28, fontWeight: 400, color: '#c8d8e8', lineHeight: 1.2, margin: '0 0 6px' }}>
            Create your account
          </h1>
          <p style={{ color: '#7090a8', fontSize: 13, margin: 0 }}>
            Institutional-grade AI Finance Platform
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(9,15,30,.9)', border: '1px solid #182236',
          borderRadius: 14, padding: 30, backdropFilter: 'blur(20px)',
        }}>
          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px',
              background: 'rgba(255,61,90,.08)', border: '1px solid rgba(255,61,90,.25)',
              borderRadius: 9, fontSize: 13, color: '#ff3d5a',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3a5068" strokeWidth="1.75" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <input className="tf-inp" type="text" placeholder="Full name" value={name}
                  onChange={e => setName(e.target.value)} required disabled={busy} />
              </div>
              <div style={{ position: 'relative' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3a5068" strokeWidth="1.75" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
                <input className="tf-inp" type="email" placeholder="Email address" value={email}
                  onChange={e => setEmail(e.target.value)} required disabled={busy} />
              </div>
              <div style={{ position: 'relative' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3a5068" strokeWidth="1.75" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input className="tf-inp" type="password" placeholder="Password" value={password}
                  onChange={e => setPassword(e.target.value)} required disabled={busy} />
              </div>
              <button className="tf-btn" type="submit" disabled={busy} style={{ marginTop: 4 }}>
                {loadingForm ? <span className="spin" style={{ margin: '0 auto' }} /> : 'Create Account →'}
              </button>
            </div>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#182236' }} />
            <span style={{ fontSize: 11, color: '#3a5068' }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#182236' }} />
          </div>

          {/* MetaMask */}
          <button className="tf-web3" onClick={handleMetaMask} disabled={busy}>
            <svg width="20" height="20" viewBox="0 0 35 33" fill="none">
              <path d="M32.9 0.75L19.6 10.3l2.4-5.55L32.9.75z" fill="#E17726" />
              <path d="M2.1.75l13.2 9.6-2.3-5.6L2.1.75z" fill="#E27625" />
              <path d="M28.2 23.5l-3.6 5.5 7.7 2.1 2.2-7.4-6.3-.2z" fill="#E27625" />
              <path d="M1.6 23.7l2.2 7.4 7.7-2.1-3.6-5.5-6.3.2z" fill="#E27625" />
              <path d="M11.1 14.7l-2.1 3.2 7.6.3-.3-8.1-5.2 4.6z" fill="#E27625" />
              <path d="M23.9 14.7l-5.3-4.7-.3 8.2 7.6-.3-2-3.2z" fill="#E27625" />
              <path d="M11.5 29l4.6-2.2-3.9-3.1-.7 5.3z" fill="#E27625" />
              <path d="M18.9 26.8l4.6 2.2-.8-5.3-3.8 3.1z" fill="#E27625" />
            </svg>
            {loadingWeb3 ? 'Connecting…' : 'Connect MetaMask Wallet'}
          </button>

          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#7090a8' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#00e5ff', textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
