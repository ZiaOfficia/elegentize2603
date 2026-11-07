/**
 * Elegantize – Website leads → Google Sheet
 *
 * Paste into: Google Sheet > Extensions > Apps Script > Code.gs
 * 1. Run `setup` once and authorize (Sheets + send email). Run `testEmail` to check mail.
 * 2. Deploy > New deployment > Web app (Execute as: Me, Access: Anyone).
 * 3. Put the /exec URL into VITE_GOOGLE_SHEET_URL in frontend/.env and rebuild.
 */

const SHEET_NAME = 'Leads';

// Every new lead is also emailed here (comma-separate to add more addresses).
const NOTIFY_EMAIL = 'info@elegantize.com';

// [Sheet column header, field key sent by the website]
const COLUMNS = [
  ['Timestamp',         '_timestamp'],
  ['Name',              'name'],
  ['Email',             'email'],
  ['Phone',             'phone'],
  ['Event Date',        'eventDate'],
  ['Venue',             'venue'],
  ['Budget',            'budget'],
  ['Service',           'serviceName'],
  ['Message',           'message'],
  ['Lead Source (Form)','source'],
  ['Submitted On Page', 'pageUrl'],
  ['Page Title',        'pageTitle'],
  ['Landing Page',      'landingPage'],
  ['Referrer',          'referrer'],
  ['Traffic Channel',   '_channel'],
  ['UTM Source',        'utm_source'],
  ['UTM Medium',        'utm_medium'],
  ['UTM Campaign',      'utm_campaign'],
  ['UTM Term',          'utm_term'],
  ['UTM Content',       'utm_content'],
  ['Google Ads ID',     'gclid'],
  ['Facebook Click ID', 'fbclid'],
  ['Device',            'device'],
];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  const headers = COLUMNS.map(function (c) { return c[0]; });
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#f3ede4');
  sheet.setFrozenRows(1);
  return sheet;
}

// Readable channel: Google Ads, Facebook Ads, Organic Search, Social, Referral, Direct...
function getChannel_(d) {
  const ref = String(d.referrer || '').toLowerCase();
  const src = String(d.utm_source || '').toLowerCase();
  const med = String(d.utm_medium || '').toLowerCase();

  if (d.gclid) return 'Google Ads';
  if (d.fbclid && /cpc|paid|ads?/.test(med)) return 'Facebook/Instagram Ads';
  if (src) return 'Campaign: ' + d.utm_source + (d.utm_medium ? ' / ' + d.utm_medium : '');
  if (!ref || ref === 'direct') return 'Direct';
  if (/google\.|bing\.|yahoo\.|duckduckgo\.|ecosia\./.test(ref)) return 'Organic Search';
  if (/facebook\.|instagram\.|fb\.|t\.co|twitter\.|x\.com|linkedin\.|pinterest\.|tiktok\.|youtube\./.test(ref)) return 'Social';
  return 'Referral: ' + ref.replace(/^https?:\/\//, '').split('/')[0];
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    data._timestamp = new Date();
    data._channel = getChannel_(data);

    const row = COLUMNS.map(function (c) {
      const key = c[1];
      const val = data[key];
      if (val === undefined || val === null) return '';
      if (key === 'phone' && val) return "'" + val; // keep + and leading 0
      return val;
    });

    getSheet_().appendRow(row);

    // Email is sent after the row is saved, so a mail failure never loses the lead.
    try {
      sendLeadEmail_(data);
    } catch (mailErr) {
      console.error('Lead email failed: ' + mailErr);
    }

    return json_({ success: true });
  } catch (err) {
    return json_({ success: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function escape_(v) {
  return String(v === undefined || v === null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sendLeadEmail_(d) {
  const name = d.name || 'Unknown';
  const subject = 'New Lead: ' + name +
    (d.serviceName ? ' – ' + d.serviceName : '') +
    ' (' + (d.source || 'Website') + ')';

  const sections = [
    ['Lead Details', [
      ['Name', d.name],
      ['Email', d.email],
      ['Phone', d.phone],
      ['Event Date', d.eventDate],
      ['Venue', d.venue],
      ['Budget', d.budget],
      ['Service', d.serviceName],
      ['Message', d.message],
    ]],
    ['Where It Came From', [
      ['Form', d.source],
      ['Submitted On Page', d.pageUrl],
      ['Page Title', d.pageTitle],
      ['Traffic Channel', d._channel],
      ['Landing Page', d.landingPage],
      ['Referrer', d.referrer],
      ['UTM Source', d.utm_source],
      ['UTM Medium', d.utm_medium],
      ['UTM Campaign', d.utm_campaign],
      ['UTM Term', d.utm_term],
      ['UTM Content', d.utm_content],
      ['Google Ads ID', d.gclid],
      ['Facebook Click ID', d.fbclid],
      ['Device', d.device],
    ]],
  ];

  let html = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;max-width:640px">';
  let text = '';

  sections.forEach(function (s) {
    const rows = s[1].filter(function (r) { return r[1]; });
    if (!rows.length) return;
    html += '<h3 style="margin:20px 0 8px;color:#8a6d3b">' + s[0] + '</h3>' +
      '<table style="border-collapse:collapse;width:100%">';
    text += '\n' + s[0].toUpperCase() + '\n';
    rows.forEach(function (r) {
      html += '<tr>' +
        '<td style="padding:6px 10px;border:1px solid #eee;background:#faf7f2;font-weight:bold;width:170px;vertical-align:top">' + escape_(r[0]) + '</td>' +
        '<td style="padding:6px 10px;border:1px solid #eee;white-space:pre-wrap">' + escape_(r[1]) + '</td>' +
        '</tr>';
      text += r[0] + ': ' + r[1] + '\n';
    });
    html += '</table>';
  });

  html += '<p style="margin-top:20px;color:#888;font-size:12px">Received ' +
    escape_(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMM yyyy, hh:mm a')) +
    ' · <a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '">Open Leads Sheet</a></p></div>';

  const options = { htmlBody: html, name: 'Elegantize Website' };
  if (d.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
    options.replyTo = d.email; // hit Reply to answer the client directly
  }

  MailApp.sendEmail(NOTIFY_EMAIL, subject, text, options);
}

function doGet() {
  return json_({ status: 'ok' });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Run once manually to create headers and authorize the script (Sheets + Gmail).
function setup() {
  getSheet_();
}

// Run manually to send yourself a sample lead email (does not add a sheet row).
function testEmail() {
  const sample = {
    name: 'Test Lead',
    email: 'test@example.com',
    phone: '+923001234567',
    eventDate: '2026-12-20',
    venue: 'Test Venue',
    budget: '$3k',
    serviceName: 'Draping Services',
    message: 'This is a test email from Apps Script.',
    source: 'Contact Page Form',
    pageUrl: 'https://elegantize.com/contact',
    referrer: 'https://www.google.com/',
    device: 'Desktop',
  };
  sample._channel = getChannel_(sample);
  sendLeadEmail_(sample);
}
