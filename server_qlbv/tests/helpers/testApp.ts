import express from 'express';
import cors from 'cors';
import authRoutes from '../../src/routes/auth.routes';
import patientRoutes from '../../src/routes/patient.routes';
import appointmentRoutes from '../../src/routes/appointment.routes';
import billRoutes from '../../src/routes/bill.routes';

const testApp = express();

testApp.use(cors());
testApp.use(express.json());
testApp.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

testApp.use('/api/auth', authRoutes);
testApp.use('/api/patients', patientRoutes);
testApp.use('/api/appointments', appointmentRoutes);
testApp.use('/api/bills', billRoutes);

export default testApp;
