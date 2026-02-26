import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const S = {
    page: { padding: '28px 30px', maxWidth: 960, fontFamily: "'DM Sans',sans-serif", color: '#c8d8e8' },
    card: { background: 'rgba(9,15,30,.95)', border: '1px solid #182236', borderRadius: 16, padding: '24px 28px', marginBottom: 18 },
    label: { fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#3a5068', display: 'block', marginBottom: 6 },
    input: { width: '100%', background: '#0c1424', border: '1px solid #1e2d45', borderRadius: 9, padding: '10px 14px', color: '#c8d8e8', fontSize: 13, fontFamily: "'DM Sans',sans-serif", boxSizing: 'border-box', outline: 'none', transition: 'border-color .18s' },
    btn: { padding: '10px 22px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13, transition: 'all .18s' },
    sec: { fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#3a5068', marginBottom: 14 },
    tab: (active) => ({ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 12, transition: 'all .18s', background: active ? 'rgba(0,229,255,.1)' : 'transparent', color: active ? '#00e5ff' : '#3a5068', borderBottom: active ? '2px solid #00e5ff' : '2px solid transparent' }),
};

const TABS = ['Profile', 'Account', 'Socials', 'History'];
const GENDERS = ['', 'male', 'female', 'non-binary', 'prefer-not-to-say'];
const THEMES = ['dark', 'midnight', 'ocean', 'forest', 'red'];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toast(msg, ok = true) {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `position:fixed;bottom:28px;right:28px;padding:12px 22px;border-radius:10px;font-size:13px;font-weight:600;z-index:9999;font-family:DM Sans,sans-serif;background:${ok ? 'rgba(0,214,143,.15)' : 'rgba(255,61,90,.15)'};color:${ok ? '#00d68f' : '#ff3d5a'};border:1px solid ${ok ? 'rgba(0,214,143,.3)' : 'rgba(255,61,90,.3)'};`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

export default function Profile() {
    const { user: authUser } = useAuth();
    const [tab, setTab] = useState('Profile');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef();

    // Form state
    const [form, setForm] = useState({
        name: '', bio: '', age: '', phone: '', gender: '', handle: '', theme: 'dark', avatar: '',
        instagram: '', facebook: '', linkedin: '', github: '',
        email: '', currentPassword: '', newPassword: '', confirmPassword: '',
    });

    const fetchProfile = useCallback(async () => {
        try {
            const { data } = await api.get('/api/user/profile');
            setProfile(data);
            setForm(f => ({
                ...f,
                name: data.name || '',
                bio: data.bio || '',
                age: data.age || '',
                phone: data.phone || '',
                gender: data.gender || '',
                handle: data.handle || '',
                theme: data.theme || 'dark',
                avatar: data.avatar || '',
                instagram: data.socials?.instagram || '',
                facebook: data.socials?.facebook || '',
                linkedin: data.socials?.linkedin || '',
                github: data.socials?.github || '',
                email: data.email || '',
            }));
        } catch { toast('Failed to load profile', false); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setForm(f => ({ ...f, avatar: ev.target.result }));
        reader.readAsDataURL(file);
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            const payload = {
                name: form.name,
                bio: form.bio,
                age: form.age ? Number(form.age) : null,
                phone: form.phone,
                gender: form.gender,
                handle: form.handle,
                theme: form.theme,
                avatar: form.avatar,
                socials: { instagram: form.instagram, facebook: form.facebook, linkedin: form.linkedin, github: form.github },
            };
            if (form.email && form.email !== profile?.email) payload.email = form.email;
            if (form.newPassword) {
                if (form.newPassword !== form.confirmPassword) { toast('Passwords do not match', false); setSaving(false); return; }
                if (form.newPassword.length < 6) { toast('Password must be 6+ characters', false); setSaving(false); return; }
                payload.currentPassword = form.currentPassword;
                payload.newPassword = form.newPassword;
            }
            await api.patch('/api/user/profile', payload);
            toast('Profile saved successfully');
            setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
            fetchProfile();
        } catch (e) {
            toast(e.response?.data?.message || 'Save failed', false);
        } finally { setSaving(false); }
    };

    const clearSearch = async () => {
        await api.delete('/api/user/search-history'); toast('Search history cleared');
        fetchProfile();
    };
    const clearLogin = async () => {
        await api.delete('/api/user/login-history'); toast('Login history cleared');
        fetchProfile();
    };

    const initials = (form.name || authUser?.name || 'U').charAt(0).toUpperCase();
    const themePalette = { dark: '#00e5ff', midnight: '#7c6af7', ocean: '#06b6d4', forest: '#10b981', red: '#f43f5e' };

    if (loading) return (
        <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ color: '#3a5068', fontSize: 14 }}>Loading profile…</div>
        </div>
    );

    return (
        <div style={S.page}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        input:focus,select:focus,textarea:focus{border-color:#00e5ff!important;box-shadow:0 0 0 2px rgba(0,229,255,.08)}
        input::placeholder,textarea::placeholder{color:#3a5068}
        .soc-inp:hover{border-color:#336!important}
      `}</style>

            {/* Header */}
            <div style={{ marginBottom: 22 }}>
                <div style={S.sec}>My Account</div>
                <h2 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 22, fontWeight: 700, margin: 0 }}>
                    Profile <span style={{ color: '#00e5ff' }}>Settings</span>
                </h2>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 22, borderBottom: '1px solid #182236' }}>
                {TABS.map(t => (
                    <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
                ))}
            </div>

            {/* ─── PROFILE TAB ─── */}
            {tab === 'Profile' && (
                <div>
                    {/* Avatar + basic info */}
                    <div style={{ ...S.card, display: 'flex', gap: 28, alignItems: 'flex-start' }}>
                        {/* Avatar */}
                        <div style={{ flexShrink: 0, textAlign: 'center' }}>
                            <div
                                style={{ width: 96, height: 96, borderRadius: '50%', background: form.avatar ? 'transparent' : `${themePalette[form.theme]}22`, border: `3px solid ${themePalette[form.theme]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: themePalette[form.theme], cursor: 'pointer', overflow: 'hidden', marginBottom: 10 }}
                                onClick={() => fileRef.current.click()}>
                                {form.avatar ? <img src={form.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                            </div>
                            <input type="file" ref={fileRef} accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                            <button style={{ ...S.btn, background: 'rgba(0,229,255,.08)', color: '#00e5ff', border: '1px solid rgba(0,229,255,.2)', fontSize: 11, padding: '6px 14px' }} onClick={() => fileRef.current.click()}>
                                Upload Photo
                            </button>
                            {form.avatar && (
                                <button style={{ ...S.btn, background: 'transparent', color: '#ff3d5a', fontSize: 11, padding: '4px 10px', display: 'block', margin: '6px auto 0' }} onClick={() => setForm(f => ({ ...f, avatar: '' }))}>
                                    Remove
                                </button>
                            )}
                        </div>

                        {/* Fields */}
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={S.label}>Full Name</label>
                                <input style={S.input} value={form.name} onChange={set('name')} placeholder="Your name" />
                            </div>
                            <div>
                                <label style={S.label}>Handle <span style={{ color: '#3a5068', fontWeight: 400 }}>(@username)</span></label>
                                <input style={S.input} value={form.handle} onChange={set('handle')} placeholder="@yourhandle" />
                            </div>
                            <div>
                                <label style={S.label}>Age</label>
                                <input style={S.input} type="number" value={form.age} onChange={set('age')} placeholder="25" min="13" max="120" />
                            </div>
                            <div>
                                <label style={S.label}>Phone</label>
                                <input style={S.input} value={form.phone} onChange={set('phone')} placeholder="+91 99999 00000" />
                            </div>
                            <div>
                                <label style={S.label}>Gender</label>
                                <select style={{ ...S.input, appearance: 'none' }} value={form.gender} onChange={set('gender')}>
                                    {GENDERS.map(g => <option key={g} value={g}>{g || 'Prefer not to say'}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={S.label}>Theme</label>
                                <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                                    {THEMES.map(t => (
                                        <button key={t} onClick={() => setForm(f => ({ ...f, theme: t }))}
                                            style={{ width: 26, height: 26, borderRadius: '50%', background: themePalette[t], border: `3px solid ${form.theme === t ? '#fff' : 'transparent'}`, cursor: 'pointer', flexShrink: 0 }} title={t} />
                                    ))}
                                </div>
                            </div>
                            <div style={{ gridColumn: '1/-1' }}>
                                <label style={S.label}>Bio <span style={{ color: '#3a5068' }}>({form.bio.length}/300)</span></label>
                                <textarea style={{ ...S.input, height: 80, resize: 'vertical' }} value={form.bio} onChange={set('bio')} maxLength={300} placeholder="Tell the world about yourself…" />
                            </div>
                        </div>
                    </div>

                    <button onClick={saveProfile} disabled={saving}
                        style={{ ...S.btn, background: 'linear-gradient(135deg,#00b8d4,#00e5ff)', color: '#030711', padding: '12px 32px', fontSize: 14, opacity: saving ? .6 : 1 }}>
                        {saving ? 'Saving…' : 'Save Profile'}
                    </button>
                </div>
            )}

            {/* ─── ACCOUNT TAB ─── */}
            {tab === 'Account' && (
                <div>
                    <div style={S.card}>
                        <div style={S.sec}>Email Address</div>
                        <label style={S.label}>New Email</label>
                        <input style={{ ...S.input, maxWidth: 420, marginBottom: 18 }} type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" />

                        <div style={S.sec}>Change Password</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={S.label}>Current Password</label>
                                <input style={S.input} type="password" value={form.currentPassword} onChange={set('currentPassword')} placeholder="Current password" />
                            </div>
                            <div>
                                <label style={S.label}>New Password</label>
                                <input style={S.input} type="password" value={form.newPassword} onChange={set('newPassword')} placeholder="Min 6 characters" />
                            </div>
                            <div>
                                <label style={S.label}>Confirm Password</label>
                                <input style={S.input} type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat new password" />
                            </div>
                        </div>
                    </div>

                    <div style={S.card}>
                        <div style={S.sec}>Wallet</div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#3a5068', padding: '10px 14px', background: '#0c1424', borderRadius: 8, border: '1px solid #1e2d45' }}>
                            {profile?.walletAddress || 'No wallet connected'}
                        </div>
                    </div>

                    <button onClick={saveProfile} disabled={saving}
                        style={{ ...S.btn, background: 'linear-gradient(135deg,#00b8d4,#00e5ff)', color: '#030711', padding: '12px 32px', fontSize: 14, opacity: saving ? .6 : 1 }}>
                        {saving ? 'Saving…' : 'Save Account'}
                    </button>
                </div>
            )}

            {/* ─── SOCIALS TAB ─── */}
            {tab === 'Socials' && (
                <div>
                    <div style={S.card}>
                        <div style={S.sec}>Social Media Handles</div>
                        {[
                            { key: 'instagram', icon: 'IG', label: 'Instagram', placeholder: 'instagram.com/yourhandle', color: '#e1306c' },
                            { key: 'facebook', icon: 'FB', label: 'Facebook', placeholder: 'facebook.com/yourprofile', color: '#1877f2' },
                            { key: 'linkedin', icon: 'IN', label: 'LinkedIn', placeholder: 'linkedin.com/in/yourprofile', color: '#0a66c2' },
                            { key: 'github', icon: 'GH', label: 'GitHub', placeholder: 'github.com/yourusername', color: '#c9d1d9' },
                        ].map(({ key, icon, label, placeholder, color }) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color, flexShrink: 0 }}>{icon}</div>
                                <div style={{ flex: 1 }}>
                                    <label style={S.label}>{label}</label>
                                    <input className="soc-inp" style={{ ...S.input, border: `1px solid ${color}22` }} value={form[key]} onChange={set(key)} placeholder={placeholder} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={saveProfile} disabled={saving}
                        style={{ ...S.btn, background: 'linear-gradient(135deg,#00b8d4,#00e5ff)', color: '#030711', padding: '12px 32px', fontSize: 14, opacity: saving ? .6 : 1 }}>
                        {saving ? 'Saving…' : 'Save Socials'}
                    </button>
                </div>
            )}

            {/* ─── HISTORY TAB ─── */}
            {tab === 'History' && (
                <div>
                    {/* Login History */}
                    <div style={S.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div style={S.sec}>Login History</div>
                            {profile?.loginHistory?.length > 0 && (
                                <button onClick={clearLogin} style={{ ...S.btn, background: 'rgba(255,61,90,.08)', color: '#ff3d5a', border: '1px solid rgba(255,61,90,.2)', fontSize: 11, padding: '5px 14px' }}>
                                    Clear
                                </button>
                            )}
                        </div>
                        {(profile?.loginHistory || []).length === 0 ? (
                            <div style={{ color: '#3a5068', fontSize: 13 }}>No login history recorded.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                                {[...(profile?.loginHistory || [])].reverse().map((h, i) => {
                                    const d = new Date(h.at);
                                    return (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: '#0c1424', borderRadius: 9, border: '1px solid #182236' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#00d68f' : '#3a5068', flexShrink: 0 }} />
                                            <div>
                                                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: i === 0 ? '#00e5ff' : '#7090a8' }}>
                                                    {DAYS[d.getDay()]}, {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                </div>
                                                <div style={{ fontSize: 11, color: '#3a5068', marginTop: 2 }}>{h.ip || 'Unknown IP'} · {(h.userAgent || '').slice(0, 60)}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Search History */}
                    <div style={S.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div style={S.sec}>Search History</div>
                            {profile?.searchHistory?.length > 0 && (
                                <button onClick={clearSearch} style={{ ...S.btn, background: 'rgba(255,61,90,.08)', color: '#ff3d5a', border: '1px solid rgba(255,61,90,.2)', fontSize: 11, padding: '5px 14px' }}>
                                    Clear All
                                </button>
                            )}
                        </div>
                        {(profile?.searchHistory || []).length === 0 ? (
                            <div style={{ color: '#3a5068', fontSize: 13 }}>No search history recorded.</div>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {[...(profile?.searchHistory || [])].reverse().map((h, i) => (
                                    <div key={i} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: '#0c1424', border: '1px solid #1e2d45', color: '#7090a8' }}>
                                        {h.query}
                                        <span style={{ marginLeft: 8, color: '#3a5068', fontSize: 10 }}>
                                            {new Date(h.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
