// api/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --------------- MongoDB Connection ---------------
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// --------------- Mongoose Models ---------------
const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  designation: String,
  workType: { type: String, enum: ['Remote', 'On site'], default: 'On site' },
  phone: String,
  email: String,
  joinDate: String,
  status: { type: String, enum: ['Active', 'Inactive', 'On Leave', 'Resigned', 'Sick'], default: 'Active' },
  homeAddress: String,
  photo: String, // could be a base64 image or URL
}, { timestamps: true });
const Employee = mongoose.model('Employee', EmployeeSchema);

const LoanSchema = new mongoose.Schema({
  name: String,
  date: String,
  type: { type: String, enum: ['Loan Taken', 'Loan Given', 'Receivable'] },
  category: String,
  details: String,
  amount: Number,
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
  remarks: String,
}, { timestamps: true });
const Loan = mongoose.model('Loan', LoanSchema);

const OneTimeLoanSchema = new mongoose.Schema({
  teamMember: String,
  designation: String,
  dateGiven: String,
  amountGiven: Number,
  amountRecovered: { type: Number, default: 0 },
  recoveryDate: String,
  notes: String,
}, { timestamps: true });
const OneTimeLoan = mongoose.model('OneTimeLoan', OneTimeLoanSchema);

const ProjectSchema = new mongoose.Schema({
  projectName: String,
  month: String,
  clientOwner: String,
  workDoneBy: String,
  juniorEditorName: String,
  videosMyWork: Number,
  perVideoRateMyWork: Number,
  videosJunior: Number,
  perVideoRateJunior: Number,
  notes: String,
}, { timestamps: true });
const Project = mongoose.model('Project', ProjectSchema);

const ReceivablePersonSchema = new mongoose.Schema({
  name: String,
  notes: String,
  months: {
    jan: { total: Number, received: Number },
    feb: { total: Number, received: Number },
    mar: { total: Number, received: Number },
    apr: { total: Number, received: Number },
    may: { total: Number, received: Number },
    jun: { total: Number, received: Number },
    jul: { total: Number, received: Number },
    aug: { total: Number, received: Number },
    sep: { total: Number, received: Number },
    oct: { total: Number, received: Number },
    nov: { total: Number, received: Number },
    dec: { total: Number, received: Number },
  }
}, { timestamps: true });
const ReceivablePerson = mongoose.model('ReceivablePerson', ReceivablePersonSchema);

// For Work Log and Session Manager, we use generic key-value storage.
// But for simplicity, we store them as a single document per editor/month.
const WorkLogSchema = new mongoose.Schema({
  editor: String,
  month: String,
  workingDays: Number,
  days: [{ 
    rawCuts: { count: Number, hours: Number },
    caption: { count: Number, hours: Number },
    editing: { count: Number, hours: Number },
    extra: { count: Number, hours: Number },
    extra2: { count: Number, hours: Number }
  }]
}, { timestamps: true });
const WorkLog = mongoose.model('WorkLog', WorkLogSchema);

const SessionRatesSchema = new mongoose.Schema({
  // editor name as key? better to store a single document with rates map
  rates: { type: Map, of: { type: Map, of: Number } }
}, { timestamps: true });
const SessionRates = mongoose.model('SessionRates', SessionRatesSchema);

const SessionMonthlySchema = new mongoose.Schema({
  month: String,
  data: { type: Map, of: { type: Map, of: Number } } // editor -> session -> qty
}, { timestamps: true });
const SessionMonthly = mongoose.model('SessionMonthly', SessionMonthlySchema);

// --------------- Routes ---------------
// Employees
app.get('/api/employees', async (req, res) => { try { const list = await Employee.find(); res.json(list); } catch(e) { res.status(500).json({ error: e.message }); } });
app.post('/api/employees', async (req, res) => { try { const emp = new Employee(req.body); await emp.save(); res.status(201).json(emp); } catch(e) { res.status(400).json({ error: e.message }); } });
app.put('/api/employees/:id', async (req, res) => { try { const emp = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(emp); } catch(e) { res.status(400).json({ error: e.message }); } });
app.delete('/api/employees/:id', async (req, res) => { try { await Employee.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch(e) { res.status(500).json({ error: e.message }); } });

// Loans
app.get('/api/loans', async (req, res) => { try { res.json(await Loan.find()); } catch(e) { res.status(500).json({ error: e.message }); } });
app.post('/api/loans', async (req, res) => { try { const doc = new Loan(req.body); await doc.save(); res.status(201).json(doc); } catch(e) { res.status(400).json({ error: e.message }); } });
app.put('/api/loans/:id', async (req, res) => { try { const doc = await Loan.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(doc); } catch(e) { res.status(400).json({ error: e.message }); } });
app.delete('/api/loans/:id', async (req, res) => { try { await Loan.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch(e) { res.status(500).json({ error: e.message }); } });

// OneTimeLoans
app.get('/api/otl', async (req, res) => { try { res.json(await OneTimeLoan.find()); } catch(e) { res.status(500).json({ error: e.message }); } });
app.post('/api/otl', async (req, res) => { try { const doc = new OneTimeLoan(req.body); await doc.save(); res.status(201).json(doc); } catch(e) { res.status(400).json({ error: e.message }); } });
app.put('/api/otl/:id', async (req, res) => { try { const doc = await OneTimeLoan.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(doc); } catch(e) { res.status(400).json({ error: e.message }); } });
app.delete('/api/otl/:id', async (req, res) => { try { await OneTimeLoan.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch(e) { res.status(500).json({ error: e.message }); } });

// Projects
app.get('/api/projects', async (req, res) => { try { res.json(await Project.find()); } catch(e) { res.status(500).json({ error: e.message }); } });
app.post('/api/projects', async (req, res) => { try { const doc = new Project(req.body); await doc.save(); res.status(201).json(doc); } catch(e) { res.status(400).json({ error: e.message }); } });
app.put('/api/projects/:id', async (req, res) => { try { const doc = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(doc); } catch(e) { res.status(400).json({ error: e.message }); } });
app.delete('/api/projects/:id', async (req, res) => { try { await Project.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch(e) { res.status(500).json({ error: e.message }); } });

// ReceivablePersons
app.get('/api/receivables', async (req, res) => { try { res.json(await ReceivablePerson.find()); } catch(e) { res.status(500).json({ error: e.message }); } });
app.post('/api/receivables', async (req, res) => { try { const doc = new ReceivablePerson(req.body); await doc.save(); res.status(201).json(doc); } catch(e) { res.status(400).json({ error: e.message }); } });
app.put('/api/receivables/:id', async (req, res) => { try { const doc = await ReceivablePerson.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(doc); } catch(e) { res.status(400).json({ error: e.message }); } });
app.delete('/api/receivables/:id', async (req, res) => { try { await ReceivablePerson.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch(e) { res.status(500).json({ error: e.message }); } });

// Work Logs
app.get('/api/worklog', async (req, res) => { try { res.json(await WorkLog.find()); } catch(e) { res.status(500).json({ error: e.message }); } });
app.post('/api/worklog', async (req, res) => { try { const doc = new WorkLog(req.body); await doc.save(); res.status(201).json(doc); } catch(e) { res.status(400).json({ error: e.message }); } });
app.put('/api/worklog/:id', async (req, res) => { try { const doc = await WorkLog.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(doc); } catch(e) { res.status(400).json({ error: e.message }); } });
app.delete('/api/worklog/:id', async (req, res) => { try { await WorkLog.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch(e) { res.status(500).json({ error: e.message }); } });

// Session Rates (single document approach)
app.get('/api/sessionrates', async (req, res) => { try { const doc = await SessionRates.findOne(); res.json(doc ? doc.rates : {}); } catch(e) { res.status(500).json({ error: e.message }); } });
app.post('/api/sessionrates', async (req, res) => { try { const { rates } = req.body; let doc = await SessionRates.findOne(); if (doc) { doc.rates = rates; await doc.save(); } else { doc = new SessionRates({ rates }); await doc.save(); } res.json(doc.rates); } catch(e) { res.status(400).json({ error: e.message }); } });

// Session Monthly data
app.get('/api/sessionmonthly', async (req, res) => { try { res.json(await SessionMonthly.find()); } catch(e) { res.status(500).json({ error: e.message }); } });
app.post('/api/sessionmonthly', async (req, res) => { try { const doc = new SessionMonthly(req.body); await doc.save(); res.status(201).json(doc); } catch(e) { res.status(400).json({ error: e.message }); } });
app.put('/api/sessionmonthly/:id', async (req, res) => { try { const doc = await SessionMonthly.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(doc); } catch(e) { res.status(400).json({ error: e.message }); } });
app.delete('/api/sessionmonthly/:id', async (req, res) => { try { await SessionMonthly.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch(e) { res.status(500).json({ error: e.message }); } });

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;