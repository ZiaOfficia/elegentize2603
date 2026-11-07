/**
 * Elegantize – Website leads → Google Sheet
 *
 * Paste into: Google Sheet > Extensions > Apps Script > Code.gs
 * 1. Run `setup` once and authorize.
 * 2. Deploy > New deployment > Web app (Execute as: Me, Access: Anyone).
 * 3. Put the /exec URL into VITE_GOOGLE_SHEET_URL in frontend/.env and rebuild.
 */

const SHEET_NAME = 'Leads';

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

    return json_({ success: true });
  } catch (err) {
    return json_({ success: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ status: 'ok' });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Run once manually to create headers and authorize the script.
function setup() {
  getSheet_();
}
