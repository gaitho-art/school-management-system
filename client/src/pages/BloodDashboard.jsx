import { useEffect, useState } from 'react';
import { FiArrowUpRight, FiCheck, FiClock, FiDroplet, FiHeart, FiMapPin, FiNavigation, FiPhone, FiRefreshCw, FiUsers } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const bloodTypes = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

function formatDistance(distance) {
  if (distance < 1) return `${Math.max(100, Math.round(distance * 1000 / 100) * 100)} m away`;
  return `${distance.toFixed(distance < 10 ? 1 : 0)} km away`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function BloodDashboard() {
  const { user, updateUser } = useAuth();
  const [locationLabel, setLocationLabel] = useState(user?.locationLabel || '');
  const [coordinates, setCoordinates] = useState(user?.latitude != null ? { latitude: user.latitude, longitude: user.longitude } : null);
  const [hospitals, setHospitals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [responses, setResponses] = useState({});
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const [nearbyResult, ownResult] = await Promise.all([
        api.get('/blood/nearby'),
        user.accountType === 'donor' ? Promise.resolve({ data: { requests: [] } }) : api.get('/blood/requests/mine'),
      ]);
      setHospitals(nearbyResult.data.hospitals);
      setRequests(nearbyResult.data.requests);
      setMyRequests(ownResult.data.requests);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not load nearby information. Try refreshing.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function saveLocation(nextCoordinates, nextLabel) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { data } = await api.put('/blood/profile', {
        ...nextCoordinates,
        locationLabel: nextLabel.trim() || 'Nearby',
      });
      setCoordinates(nextCoordinates);
      setLocationLabel(data.user.locationLabel);
      updateUser(data.user);
      setNotice('Your location is saved. Nearby hospitals and requests are ready.');
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Location could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  function activateLocation() {
    setError('');
    setNotice('');
    if (!navigator.geolocation) {
      setError('Location is not available in this browser. You can still add a location from a supported device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => saveLocation({ latitude: coords.latitude, longitude: coords.longitude }, locationLabel),
      () => setError('Location permission was not granted. Enable it in your browser settings and try again.'),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  }

  async function toggleAvailability() {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.put('/blood/profile', { isAvailable: !user.isAvailable });
      updateUser(data.user);
      setNotice(data.user.isAvailable ? 'You are visible for compatible requests.' : 'You are paused and will not appear as available.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Availability could not be updated.');
    } finally {
      setBusy(false);
    }
  }

  async function submitRequest(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!coordinates) {
      setError('Set your location before publishing a request.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    const form = new FormData(formElement);
    try {
      await api.post('/blood/requests', {
        requiredType: form.get('requiredType'),
        units: Number(form.get('units')),
        urgency: form.get('urgency'),
        hospitalName: form.get('hospitalName'),
        locationLabel: locationLabel || 'Nearby',
        ...coordinates,
      });
      formElement.reset();
      setShowRequestForm(false);
      setNotice('Your request is live for compatible donors nearby.');
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'The request could not be published.');
    } finally {
      setBusy(false);
    }
  }

  async function respond(requestId) {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post(`/blood/requests/${requestId}/respond`);
      setNotice(data.message);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Your response could not be sent.');
    } finally {
      setBusy(false);
    }
  }

  async function loadResponses(requestId) {
    setError('');
    try {
      const { data } = await api.get(`/blood/requests/${requestId}/responses`);
      setResponses((current) => ({ ...current, [requestId]: data.donors }));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Donor responses could not be loaded.');
    }
  }

  async function markFilled(requestId, status) {
    try {
      await api.patch(`/blood/requests/${requestId}`, { status });
      setNotice(status === 'filled' ? 'Request marked as filled.' : 'Request reopened.');
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Request status could not be updated.');
    }
  }

  const isDonor = user.accountType === 'donor';
  const isHospital = user.accountType === 'hospital';

  return (
    <div className="dashboard">
      <section className="welcome-row">
        <div>
          <div className="eyebrow"><span className="pulse-dot" /> YOUR COMMUNITY, IN REACH</div>
          <h1>{isDonor ? 'Give when you can.' : isHospital ? 'Care, connected.' : 'Find help nearby.'}</h1>
          <p>{isDonor ? 'See nearby hospitals and blood requests that match your group.' : 'Connect a blood need with people and hospitals close to you.'}</p>
        </div>
        <div className="blood-stamp"><FiDroplet /><span>{isHospital ? 'LOCAL' : user.bloodType}</span><small>{isHospital ? 'HOSPITAL' : 'BLOOD GROUP'}</small></div>
      </section>

      {(notice || error) && <div className={error ? 'notice notice-error' : 'notice'} role={error ? 'alert' : 'status'}>{error || notice}</div>}

      <section className="location-band">
        <div className="location-icon"><FiNavigation /></div>
        <div className="location-copy">
          <strong>{coordinates ? `Near ${locationLabel || 'your saved location'}` : 'Start with your location'}</strong>
          <span>{coordinates ? 'Only approximate distance is shown to others.' : 'Share your location to see nearby hospitals and matches.'}</span>
        </div>
        <label className="location-label-input">
          <span>Area name</span>
          <input value={locationLabel} onChange={(event) => setLocationLabel(event.target.value)} maxLength="180" placeholder="City or neighborhood" />
        </label>
        <button className="secondary-button" type="button" onClick={activateLocation} disabled={busy}>
          <FiMapPin /> {coordinates ? 'Update location' : 'Use my location'}
        </button>
      </section>

      {isDonor && <section className="availability-row">
        <div className={`availability-indicator ${user.isAvailable ? 'is-on' : ''}`} />
        <div><strong>{user.isAvailable ? 'Available to donate' : 'Taking a break'}</strong><span>{user.isAvailable ? 'Your group can appear in compatible local requests.' : 'You are hidden from new requests.'}</span></div>
        <button type="button" role="switch" aria-checked={user.isAvailable} className={`switch ${user.isAvailable ? 'switch-on' : ''}`} onClick={toggleAvailability} disabled={busy}><span /></button>
      </section>}

      <div className="content-grid">
        <section className="content-section">
          <div className="section-heading">
            <div><div className="section-kicker">CLOSE TO YOU</div><h2>Nearby hospitals</h2></div>
            <span className="count-label">{hospitals.length} listed</span>
          </div>
          {loading ? <div className="empty-state">Finding nearby places…</div> : hospitals.length ? <div className="hospital-list">
            {hospitals.map((hospital, index) => <article className="hospital-row" key={hospital.id} style={{ '--row-index': index }}>
              <div className="hospital-symbol"><FiMapPin /></div>
              <div className="hospital-info"><h3>{hospital.name}</h3><span>{hospital.locationLabel || 'Location available'}</span></div>
              <span className="distance-label">{formatDistance(hospital.distanceKm)}</span>
              <a className="icon-button map-link" href={hospital.mapUrl} target="_blank" rel="noreferrer" aria-label={`Open ${hospital.name} in maps`} title="Open in maps"><FiArrowUpRight /></a>
              <a className="icon-button phone-link" href={`tel:${hospital.phone}`} aria-label={`Call ${hospital.name}`} title="Call hospital"><FiPhone /></a>
            </article>)}
          </div> : <div className="empty-state"><FiMapPin /><strong>{coordinates ? 'No nearby hospitals yet' : 'Location is needed to search'}</strong><span>{coordinates ? 'Hospitals appear here as they join the network.' : 'Your exact location is never shown to other users.'}</span></div>}
        </section>

        {isDonor ? <section className="content-section request-section">
          <div className="section-heading">
            <div><div className="section-kicker">COMPATIBLE REQUESTS</div><h2>People who need you</h2></div>
            <button className="icon-button refresh-button" onClick={refresh} aria-label="Refresh requests" title="Refresh"><FiRefreshCw /></button>
          </div>
          {loading ? <div className="empty-state">Checking for matches…</div> : requests.length ? <div className="request-list">
            {requests.map((request) => <article className="request-card" key={request.id}>
              <div className="request-topline"><span className={`urgency urgency-${request.urgency}`}>{request.urgency === 'urgent' ? 'Urgent' : request.urgency === 'soon' ? 'Soon' : 'Routine'}</span><span>{formatDistance(request.distanceKm)}</span></div>
              <h3><span className="type-pill">{request.requiredType}</span> needed at {request.hospitalName}</h3>
              <p><FiMapPin /> {request.locationLabel} <span className="request-separator">·</span> {request.units} {request.units === 1 ? 'unit' : 'units'}</p>
              <div className="request-footer"><span><FiClock /> {formatDate(request.createdAt)}</span>
                <button className={request.responded ? 'respond-button responded' : 'respond-button'} disabled={busy || request.responded || !user.isAvailable} onClick={() => respond(request.id)}>
                  {request.responded ? <><FiCheck /> Responded</> : <><FiHeart /> I can help</>}
                </button>
              </div>
              {!user.isAvailable && <small className="paused-hint">Turn availability on to respond.</small>}
            </article>)}
          </div> : <div className="empty-state"><FiUsers /><strong>{coordinates ? 'No matching requests nearby' : 'Set your location to find requests'}</strong><span>New compatible requests will show up here.</span></div>}
          <p className="clinical-note inline-note">Hospitals confirm blood compatibility and donor eligibility.</p>
        </section> : <section className="content-section my-requests-section">
          <div className="section-heading">
            <div><div className="section-kicker">YOUR ACTIVITY</div><h2>Blood requests</h2></div>
            <button type="button" className="text-button" onClick={() => { setShowRequestForm((shown) => !shown); setError(''); }}>{showRequestForm ? 'Close' : '+ New request'}</button>
          </div>
          {showRequestForm && <form className="request-form" onSubmit={submitRequest}>
            <div className="form-grid">
              <label>Blood group needed<select name="requiredType" required defaultValue=""><option value="" disabled>Select group</option>{bloodTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
              <label>Units<input name="units" type="number" min="1" max="20" defaultValue="1" required /></label>
              <label>Urgency<select name="urgency" defaultValue="soon"><option value="routine">Routine</option><option value="soon">Needed soon</option><option value="urgent">Urgent</option></select></label>
              <label>Hospital or clinic<input name="hospitalName" required maxLength="180" defaultValue={isHospital ? user.name : ''} placeholder="Where should donors go?" /></label>
            </div>
            {!coordinates && <p className="form-hint">Share your location above before publishing a request.</p>}
            <button className="primary-button" type="submit" disabled={busy || !coordinates}>Publish request <FiArrowUpRight /></button>
          </form>}
          {loading ? <div className="empty-state">Loading your requests…</div> : myRequests.length ? <div className="my-request-list">
            {myRequests.map((request) => <article className="my-request-row" key={request.id}>
              <div className="type-square">{request.required_type}</div>
              <div className="my-request-info"><strong>{request.hospital_name}</strong><span>{request.location_label} · {request.units} {request.units === 1 ? 'unit' : 'units'} · {formatDate(request.created_at)}</span></div>
              <span className={`status-label status-${request.status}`}>{request.status === 'filled' ? 'Filled' : 'Open'}</span>
              <button className="text-button response-toggle" onClick={() => loadResponses(request.id)}>{request.response_count} {request.response_count === 1 ? 'donor' : 'donors'}</button>
              <button className="small-action" onClick={() => markFilled(request.id, request.status === 'open' ? 'filled' : 'open')}>
                {request.status === 'open' ? 'Mark filled' : 'Reopen'}
              </button>
              {responses[request.id] && <div className="response-list">{responses[request.id].length ? responses[request.id].map((donor) => <div className="donor-response" key={`${request.id}-${donor.phone}`}><span><strong>{donor.name}</strong> · {donor.blood_type}{donor.location_label ? ` · ${donor.location_label}` : ''}</span><a href={`tel:${donor.phone}`}><FiPhone /> {donor.phone}</a></div>) : <span className="response-empty">No donors have responded yet.</span>}</div>}
            </article>)}
          </div> : !showRequestForm && <div className="empty-state"><FiDroplet /><strong>No requests yet</strong><span>Post a request when you need donors nearby.</span></div>}
          <p className="clinical-note inline-note">If this is an emergency, contact local emergency services or a hospital directly.</p>
        </section>}
      </div>
    </div>
  );
}