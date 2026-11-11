import { useState } from 'react';
import { FiArrowUpRight, FiDroplet, FiHeart, FiMapPin, FiShield } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const accountTypes = [
  { value: 'donor', label: 'I can donate' },
  { value: 'recipient', label: 'I need blood' },
  { value: 'hospital', label: 'Hospital' },
];
const bloodTypes = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [accountType, setAccountType] = useState('donor');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const details = Object.fromEntries(form.entries());
    try {
      if (mode === 'register') await register({ ...details, accountType });
      else await login(details.email, details.password, accountType);
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'We could not complete that request. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-story">
        <a className="wordmark wordmark-light" href="/" aria-label="Redline home"><span className="brand-mark"><FiDroplet /></span>redline</a>
        <div className="story-copy">
          <div className="eyebrow eyebrow-light"><span className="pulse-dot" /> A little closer. A lot of hope.</div>
          <h1>Blood, when<br />it matters.</h1>
          <p>Find nearby hospitals. Meet people ready to donate. Make the next step easier for someone.</p>
          <div className="story-points">
            <span><FiMapPin /> Nearby, by choice</span>
            <span><FiShield /> Your location stays private</span>
          </div>
        </div>
        <div className="story-foot"><FiHeart /> Every connection starts with care.</div>
        <div className="story-orbit orbit-one" /><div className="story-orbit orbit-two" />
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="form-kicker">COMMUNITY BLOOD NETWORK</div>
          <h2>{mode === 'login' ? 'Welcome back' : 'Join the network'}</h2>
          <p className="form-intro">{mode === 'login' ? 'Sign in to find your next step.' : 'Create an account to connect with your local community.'}</p>

          <div className="account-switch" role="group" aria-label="Account type">
            {accountTypes.map((type) => (
              <button key={type.value} type="button" className={accountType === type.value ? 'selected' : ''} onClick={() => setAccountType(type.value)}>
                {type.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && <>
              <label>{accountType === 'hospital' ? 'Hospital name' : 'Full name'}
                <input name="name" autoComplete="name" required maxLength="150" placeholder={accountType === 'hospital' ? 'e.g. Northside Community Hospital' : 'Your name'} />
              </label>
              <label>Phone number
                <input name="phone" type="tel" autoComplete="tel" required maxLength="30" placeholder="A number people can reach you on" />
              </label>
              {accountType !== 'hospital' && <fieldset className="blood-picker">
                <legend>Your blood group</legend>
                <div className="blood-options">
                  {bloodTypes.map((type) => <label key={type} className="blood-option">
                    <input type="radio" name="bloodType" value={type} required />
                    <span>{type}</span>
                  </label>)}
                </div>
              </fieldset>}
            </>}
            <label>Email address
              <input name="email" type="email" autoComplete="email" required maxLength="190" placeholder="you@example.com" />
            </label>
            <label>Password
              <input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="8" required placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} />
            </label>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button type="submit" className="primary-button auth-submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <FiArrowUpRight />
            </button>
          </form>

          <p className="mode-switch">{mode === 'login' ? 'New to Redline?' : 'Already have an account?'}{' '}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Create account' : 'Sign in'}
            </button>
          </p>
          <p className="clinical-note">Donations and blood compatibility are confirmed by qualified medical staff.</p>
        </div>
      </section>
    </div>
  );
}