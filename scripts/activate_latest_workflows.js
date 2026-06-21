const path = require('path');
const sqlite3 = require('sqlite3');

const configPath = process.argv[2] || path.resolve(__dirname, '..', 'config.local.json');
const config = require(configPath);
const companyName = config.companyName || 'KOL招募';
const dbPath = path.join(process.env.N8N_USER_FOLDER || path.resolve(__dirname, '..', 'runtime', 'n8n-data'), '.n8n', 'database.sqlite');

const workflowNames = [
  `${companyName} KOL - Form Intake Automation`,
  `${companyName} KOL - Daily Follow-up Reminder`,
  `${companyName} KOL - Weekly Dashboard Report`,
];

const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function callback(error) {
      if (error) reject(error);
      else resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => (error ? reject(error) : resolve(rows)));
  });
}

(async () => {
  for (const name of workflowNames) {
    await run('update workflow_entity set active = 0 where name = ?', [name]);
    const rows = await all(
      'select id, name, createdAt from workflow_entity where name = ? order by createdAt desc limit 1',
      [name],
    );
    if (!rows.length) throw new Error(`Workflow not found: ${name}`);
    await run('update workflow_entity set active = 1, updatedAt = CURRENT_TIMESTAMP where id = ?', [rows[0].id]);
    console.log(`Activated ${rows[0].name} (${rows[0].id})`);
  }
})()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.close());
