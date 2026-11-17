require('dotenv').config();
const { createApp } = require('./app');
const { startReminderJob } = require('./jobs/reminders');

const app = createApp();
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Clinic API listening on port ${PORT}`);
});

startReminderJob();
