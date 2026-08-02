const fs = require('fs');

const content = `import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logActivity.js';

export async function getProfile(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM school_profile WHERE id = 1');
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const fields = [
      'school_name', 'motto', 'vision', 'mission', 'address', 'county', 'sub_county',
      'email', 'phone_primary', 'phone_secondary', 'principal_name', 'deputy_principal',
      'opening_date', 'academic_year', 'logo_path', 'stamp_path',
      'term1_start', 'term1_end', 'term2_start', 'term2_end', 'term3_start', 'term3_end',
    ];
    
    const values = {};
    fields.forEach((f) => { 
      if (req.body[f] !== undefined && req.body[f] !== '') {
        values[f] = req.body[f];
      }
    });

    if (req.files?.logo?.[0]) values.logo_path = '/uploads/logos/' + req.files.logo[0].filename;
    if (req.files?.stamp?.[0]) values.stamp_path = '/uploads/logos/' + req.files.stamp[0].filename;

    const [rows] = await pool.query('SELECT id FROM school_profile WHERE id = 1');
    const exists = rows.length > 0;

    if (exists) {
      if (Object.keys(values).length === 0) {
        return res.json({ message: 'Nothing to update' });
      }
      const cols = Object.keys(values).map((k) => \`\${k} = :\${k}\`).join(', ');
      await pool.execute(\`UPDATE school_profile SET \${cols} WHERE id = 1\`, values);
    } else {
      values.id = 1;
      const cols = Object.keys(values).join(', ');
      const ph = Object.keys(values).map((k) => \`:\${k}\`).join(', ');
      await pool.execute(\`INSERT INTO school_profile (\${cols}) VALUES (\${ph})\`, values);
    }

    await logActivity(req.user, 'UPDATE_SCHOOL_PROFILE', 'school', 'Updated school profile');
    res.json({ message: 'School profile saved' });
  } catch (err) {
    console.error('School Profile Update Error:', err);
    res.status(500).json({ error: err.message });
  }
}
`;

fs.writeFileSync('controllers/schoolController.js', content);
console.log('School controller updated successfully!');