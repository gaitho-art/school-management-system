import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const BLOOD_TYPES = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
const DONATES_TO = {
  'O-': BLOOD_TYPES,
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};
const ACCOUNT_TYPES = ['donor', 'recipient', 'hospital'];

function sendError(res, status, error) {
  return res.status(status).json({ error });
}

function validCoordinates(latitude, longitude) {
  return Number.isFinite(Number(latitude)) && Number(latitude) >= -90 && Number(latitude) <= 90
    && Number.isFinite(Number(longitude)) && Number(longitude) >= -180 && Number(longitude) <= 180;
}

function distanceKm(fromLat, fromLng, toLat, toLng) {
  const radians = (value) => (value * Math.PI) / 180;
  const latDelta = radians(Number(toLat) - Number(fromLat));
  const lngDelta = radians(Number(toLng) - Number(fromLng));
  const arc = Math.sin(latDelta / 2) ** 2
    + Math.cos(radians(Number(fromLat))) * Math.cos(radians(Number(toLat))) * Math.sin(lngDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

function publicProfile(user) {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    phone: user.phone,
    accountType: user.account_type,
    bloodType: user.blood_type,
    isAvailable: Boolean(user.is_available),
    locationLabel: user.location_label,
    hasLocation: user.latitude != null && user.longitude != null,
  };
}

function getToken(user) {
  return jwt.sign({
    id: user.id,
    role: user.account_type,
    accountType: user.account_type,
    name: user.full_name,
  }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
}

export async function registerBloodUser(req, res) {
  const { name, email, phone, password, accountType, bloodType } = req.body;
  if (!name?.trim() || !email?.trim() || !phone?.trim() || !password || !ACCOUNT_TYPES.includes(accountType)) {
    return sendError(res, 400, 'Name, email, phone, password, and account type are required');
  }
  if (password.length < 8) return sendError(res, 400, 'Password must be at least 8 characters');
  if (accountType !== 'hospital' && !BLOOD_TYPES.includes(bloodType)) {
    return sendError(res, 400, 'Choose a valid blood group');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.execute(
      `INSERT INTO blood_users (full_name, email, phone, password_hash, account_type, blood_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name.trim(), normalizedEmail, phone.trim(), passwordHash, accountType, accountType === 'hospital' ? null : bloodType],
    );
    const user = {
      id: result.insertId,
      full_name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      account_type: accountType,
      blood_type: accountType === 'hospital' ? null : bloodType,
      is_available: accountType === 'donor',
    };
    res.status(201).json({ token: getToken(user), user: publicProfile(user) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return sendError(res, 409, 'An account with this email already exists');
    throw error;
  }
}

export async function loginBloodUser(req, res) {
  const { email, password, accountType } = req.body;
  if (!email || !password || !ACCOUNT_TYPES.includes(accountType)) {
    return sendError(res, 400, 'Email, password, and account type are required');
  }
  const [rows] = await pool.execute(
    `SELECT id, full_name, email, phone, password_hash, account_type, blood_type,
            is_available, location_label, latitude, longitude
     FROM blood_users WHERE email = ?`,
    [email.trim().toLowerCase()],
  );
  const user = rows[0];
  if (!user || user.account_type !== accountType || !(await bcrypt.compare(password, user.password_hash))) {
    return sendError(res, 401, 'Email, password, or account type is incorrect');
  }
  res.json({ token: getToken(user), user: publicProfile(user) });
}

export async function getBloodProfile(req, res) {
  const [rows] = await pool.execute(
    `SELECT id, full_name, email, phone, account_type, blood_type, is_available,
            location_label, latitude, longitude
     FROM blood_users WHERE id = ?`,
    [req.user.id],
  );
  if (!rows[0]) return sendError(res, 404, 'Account not found');
  res.json({ user: publicProfile(rows[0]) });
}

export async function updateBloodProfile(req, res) {
  const [rows] = await pool.execute('SELECT account_type, blood_type FROM blood_users WHERE id = ?', [req.user.id]);
  const account = rows[0];
  if (!account) return sendError(res, 404, 'Account not found');
  const { bloodType, isAvailable, locationLabel, latitude, longitude } = req.body;

  if (bloodType !== undefined) {
    if (account.account_type === 'hospital' || !BLOOD_TYPES.includes(bloodType)) {
      return sendError(res, 400, 'Choose a valid blood group');
    }
    await pool.execute('UPDATE blood_users SET blood_type = ? WHERE id = ?', [bloodType, req.user.id]);
  }
  if (isAvailable !== undefined) {
    if (account.account_type !== 'donor') return sendError(res, 400, 'Only donor accounts can change availability');
    await pool.execute('UPDATE blood_users SET is_available = ? WHERE id = ?', [isAvailable ? 1 : 0, req.user.id]);
  }
  if (locationLabel !== undefined || latitude !== undefined || longitude !== undefined) {
    if (latitude == null && longitude == null && !locationLabel) {
      await pool.execute(
        'UPDATE blood_users SET location_label = NULL, latitude = NULL, longitude = NULL WHERE id = ?',
        [req.user.id],
      );
    } else {
      if (!validCoordinates(latitude, longitude)) return sendError(res, 400, 'Valid latitude and longitude are required');
      await pool.execute(
        'UPDATE blood_users SET location_label = ?, latitude = ?, longitude = ? WHERE id = ?',
        [String(locationLabel || 'Nearby').slice(0, 180), latitude, longitude, req.user.id],
      );
    }
  }
  return getBloodProfile(req, res);
}

export async function getNearby(req, res) {
  const [rows] = await pool.execute('SELECT latitude, longitude, blood_type, account_type FROM blood_users WHERE id = ?', [req.user.id]);
  const account = rows[0];
  if (!account) return sendError(res, 404, 'Account not found');
  const latitude = req.query.latitude ?? account.latitude;
  const longitude = req.query.longitude ?? account.longitude;
  if (!validCoordinates(latitude, longitude)) {
    return res.json({ hospitals: [], requests: [], locationRequired: true });
  }

  const [hospitalRows] = await pool.execute(
    `SELECT id, full_name, phone, location_label, latitude, longitude
     FROM blood_users WHERE account_type = 'hospital' AND latitude IS NOT NULL AND longitude IS NOT NULL`,
  );
  const hospitals = hospitalRows.map((hospital) => ({
    id: hospital.id,
    name: hospital.full_name,
    phone: hospital.phone,
    locationLabel: hospital.location_label,
    distanceKm: distanceKm(latitude, longitude, hospital.latitude, hospital.longitude),
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${hospital.latitude},${hospital.longitude}`,
  })).filter((hospital) => hospital.distanceKm <= 100).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 20);

  let requests = [];
  if (account.account_type === 'donor' && account.blood_type) {
    const recipientTypes = DONATES_TO[account.blood_type];
    const [requestRows] = await pool.execute(
      `SELECT r.id, r.required_type, r.units, r.urgency, r.hospital_name, r.location_label,
              r.latitude, r.longitude, r.created_at, r.requester_id,
              EXISTS (SELECT 1 FROM blood_responses br WHERE br.request_id = r.id AND br.donor_id = ?) AS responded
       FROM blood_requests r
       JOIN blood_users owner ON owner.id = r.requester_id
       WHERE r.status = 'open' AND r.required_type IN (${recipientTypes.map(() => '?').join(',')})
         AND owner.latitude IS NOT NULL AND owner.longitude IS NOT NULL
       ORDER BY FIELD(r.urgency, 'urgent', 'soon', 'routine'), r.created_at DESC
       LIMIT 100`,
      [req.user.id, ...recipientTypes],
    );
    requests = requestRows.map((request) => ({
      id: request.id,
      requiredType: request.required_type,
      units: request.units,
      urgency: request.urgency,
      hospitalName: request.hospital_name,
      locationLabel: request.location_label,
      distanceKm: distanceKm(latitude, longitude, request.latitude, request.longitude),
      createdAt: request.created_at,
      responded: Boolean(request.responded),
    })).filter((request) => request.distanceKm <= 100).sort((a, b) => a.distanceKm - b.distanceKm);
  }

  res.json({ hospitals, requests, locationRequired: false });
}

export async function createBloodRequest(req, res) {
  if (!['recipient', 'hospital'].includes(req.user.accountType)) {
    return sendError(res, 403, 'Only recipient or hospital accounts can create a blood request');
  }
  const { requiredType, units, urgency, hospitalName, locationLabel, latitude, longitude } = req.body;
  if (!BLOOD_TYPES.includes(requiredType)) return sendError(res, 400, 'Choose a valid required blood group');
  if (!Number.isInteger(Number(units)) || Number(units) < 1 || Number(units) > 20) {
    return sendError(res, 400, 'Units must be between 1 and 20');
  }
  if (!['routine', 'soon', 'urgent'].includes(urgency)) return sendError(res, 400, 'Choose an urgency');
  if (!hospitalName?.trim() || !locationLabel?.trim() || !validCoordinates(latitude, longitude)) {
    return sendError(res, 400, 'Hospital, location, and a valid map location are required');
  }
  const [result] = await pool.execute(
    `INSERT INTO blood_requests
       (requester_id, required_type, units, urgency, hospital_name, location_label, latitude, longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, requiredType, Number(units), urgency, hospitalName.trim().slice(0, 180), locationLabel.trim().slice(0, 180), latitude, longitude],
  );
  res.status(201).json({ id: result.insertId, message: 'Blood request published' });
}

export async function getMyRequests(req, res) {
  const [requests] = await pool.execute(
    `SELECT r.id, r.required_type, r.units, r.urgency, r.hospital_name, r.location_label,
            r.status, r.created_at, COUNT(br.id) AS response_count
     FROM blood_requests r
     LEFT JOIN blood_responses br ON br.request_id = r.id
     WHERE r.requester_id = ?
     GROUP BY r.id ORDER BY r.created_at DESC`,
    [req.user.id],
  );
  res.json({ requests });
}

export async function respondToRequest(req, res) {
  if (req.user.accountType !== 'donor') return sendError(res, 403, 'Only donor accounts can respond');
  const [requests] = await pool.execute(
    `SELECT r.id, r.required_type, r.status, r.requester_id, donor.blood_type
     FROM blood_requests r JOIN blood_users donor ON donor.id = ? WHERE r.id = ?`,
    [req.user.id, req.params.id],
  );
  const request = requests[0];
  if (!request) return sendError(res, 404, 'Blood request not found');
  if (request.status !== 'open') return sendError(res, 409, 'This request is no longer open');
  if (Number(request.requester_id) === Number(req.user.id)) return sendError(res, 400, 'You cannot respond to your own request');
  if (!DONATES_TO[request.blood_type]?.includes(request.required_type)) {
    return sendError(res, 403, 'This request is not compatible with your registered blood group');
  }
  await pool.execute('INSERT IGNORE INTO blood_responses (request_id, donor_id) VALUES (?, ?)', [request.id, req.user.id]);
  res.status(201).json({ message: 'Your contact details are now shared with the request owner' });
}

export async function getRequestResponses(req, res) {
  const [requests] = await pool.execute('SELECT requester_id FROM blood_requests WHERE id = ?', [req.params.id]);
  if (!requests[0]) return sendError(res, 404, 'Blood request not found');
  if (Number(requests[0].requester_id) !== Number(req.user.id)) return sendError(res, 403, 'Only the request owner can view donor contacts');
  const [donors] = await pool.execute(
    `SELECT donor.full_name AS name, donor.phone, donor.blood_type, donor.location_label,
            response.created_at AS responded_at
     FROM blood_responses response
     JOIN blood_users donor ON donor.id = response.donor_id
     WHERE response.request_id = ? ORDER BY response.created_at`,
    [req.params.id],
  );
  res.json({ donors });
}

export async function updateRequestStatus(req, res) {
  const { status } = req.body;
  if (!['open', 'filled'].includes(status)) return sendError(res, 400, 'Choose a valid request status');
  const [result] = await pool.execute(
    'UPDATE blood_requests SET status = ? WHERE id = ? AND requester_id = ?',
    [status, req.params.id, req.user.id],
  );
  if (!result.affectedRows) return sendError(res, 404, 'Blood request not found');
  res.json({ message: status === 'filled' ? 'Request marked as filled' : 'Request reopened' });
}