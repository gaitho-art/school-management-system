import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { testConnection } from './config/db.js';
import { initializeBloodDonationTables } from './database/bloodDonation.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', routes);
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message || 'Server error' }));

const PORT = process.env.PORT || 5000;
testConnection()
	.then(initializeBloodDonationTables)
	.then(() => app.listen(PORT, () => console.log('API on http://localhost:' + PORT)))
	.catch((error) => {
		console.error('Server startup failed:', error.message);
		process.exit(1);
	});
