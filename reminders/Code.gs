/**
 * CTF workout reminder emails.
 * Every morning, emails each person who RSVP'd to a workout happening TOMORROW.
 * Runs from CTF's Google account; reads the app's database directly.
 *
 * Setup: paste this into script.google.com, add appsscript.json, run checkSetup,
 * then run installDailyTrigger once.
 */
const PROJECT_ID = 'ctf-community-app';
const APP_URL    = 'https://app.camaraderietf.org/';
const FROM_NAME  = 'Camaraderie Through Fitness';
const TZ         = 'America/New_York';
const SEND_HOUR  = 9; // 9 AM Eastern

const BASE = 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/(default)/documents';

/** Main job: called by the daily trigger. */
function sendTomorrowReminders() {
  const tomorrow = Utilities.formatDate(new Date(Date.now() + 24 * 3600 * 1000), TZ, 'yyyy-MM-dd');
  const props = PropertiesService.getScriptProperties();

  const contacts = {};
  listDocs('contacts').forEach(function (d) { contacts[d.id] = d.data; });
  const overrides = {}; // admin edits to workouts (new time, place, or deleted)
  listDocs('events').forEach(function (d) { overrides[d.id] = d.data; });

  let sent = 0, skipped = 0;
  listDocs('rsvps').forEach(function (r) {
    const evs = (r.data && r.data.events) || {};
    const contact = contacts[r.id];
    Object.keys(evs).forEach(function (eventId) {
      const snap = (evs[eventId] && typeof evs[eventId] === 'object') ? evs[eventId] : {};
      const ev = Object.assign({}, snap, overrides[eventId] || {});
      if (ev.deleted || ev.date !== tomorrow) return;
      if (!contact || !contact.email || contact.remind === false) { skipped++; return; }
      const key = 'sent_' + r.id + '_' + eventId;
      if (props.getProperty(key)) return; // already sent this one
      sendReminder(contact, ev);
      props.setProperty(key, tomorrow);
      sent++;
    });
  });
  Logger.log('Reminders for ' + tomorrow + ': sent ' + sent + ', skipped ' + skipped + ' (no email or turned off).');
  cleanupOldKeys(props);
}

function sendReminder(contact, ev) {
  const first = String(contact.name || '').split(' ')[0] || 'there';
  const when = prettyDate(ev.date) + (ev.time ? ' at ' + prettyTime(ev.time) : '');
  const where = ev.location ? ev.location : 'location in the app';
  const subject = 'Reminder: ' + (ev.title || 'CTF workout') + ' tomorrow' + (ev.time ? ' at ' + prettyTime(ev.time) : '');
  const text =
    'Hey ' + first + ',\n\n' +
    "You're on the list for " + (ev.title || 'a CTF workout') + ' tomorrow, ' + when + ', at ' + where + '.\n\n' +
    "Can't make it? Cancel your RSVP in the app so we have an accurate headcount:\n" + APP_URL + '\n\n' +
    'See you there.\nCamaraderie Through Fitness\n\n' +
    'To stop these emails: in the app, tap your name, then Edit profile, and uncheck email reminders.';
  const html =
    '<p>Hey ' + esc(first) + ',</p>' +
    '<p>You\'re on the list for <b>' + esc(ev.title || 'a CTF workout') + '</b> tomorrow, <b>' + esc(when) + '</b>, at ' + esc(where) + '.</p>' +
    '<p>Can\'t make it? <a href="' + APP_URL + '">Cancel your RSVP in the app</a> so we have an accurate headcount.</p>' +
    '<p>See you there.<br>Camaraderie Through Fitness</p>' +
    '<p style="color:#777;font-size:12px">To stop these emails: in the app, tap your name, then Edit profile, and uncheck email reminders.</p>';
  MailApp.sendEmail({ to: contact.email, name: FROM_NAME, subject: subject, body: text, htmlBody: html });
}

/** Run this first: confirms the script can read the database. Sends nothing. */
function checkSetup() {
  const r = listDocs('rsvps').length, c = listDocs('contacts').length, e = listDocs('events').length;
  Logger.log('OK. Found ' + r + ' RSVP records, ' + c + ' email contacts, ' + e + ' workout edits.');
  Logger.log('Emails left today for this account: ' + MailApp.getRemainingDailyQuota());
}

/** Run once to schedule the daily job. Safe to run again; it replaces the old one. */
function installDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendTomorrowReminders') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendTomorrowReminders').timeBased().everyDays(1).atHour(SEND_HOUR).inTimezone(TZ).create();
  Logger.log('Daily reminder scheduled for about ' + SEND_HOUR + ':00 AM Eastern.');
}

/* ---------- helpers ---------- */
function listDocs(collection) {
  const out = [];
  let token = '';
  do {
    const url = BASE + '/' + collection + '?pageSize=300' + (token ? '&pageToken=' + encodeURIComponent(token) : '');
    const res = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('Could not read ' + collection + ' (' + res.getResponseCode() + '): ' + res.getContentText());
    const json = JSON.parse(res.getContentText());
    (json.documents || []).forEach(function (d) {
      out.push({ id: d.name.split('/').pop(), data: decode({ mapValue: { fields: d.fields || {} } }) });
    });
    token = json.nextPageToken || '';
  } while (token);
  return out;
}
function decode(v) {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('mapValue' in v) { const o = {}, f = v.mapValue.fields || {}; Object.keys(f).forEach(function (k) { o[k] = decode(f[k]); }); return o; }
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
  return null;
}
function prettyDate(ymd) {
  const p = String(ymd).split('-').map(Number);
  return Utilities.formatDate(new Date(p[0], p[1] - 1, p[2], 12), TZ, 'EEEE, MMMM d');
}
function prettyTime(hm) {
  const p = String(hm).split(':').map(Number), h = p[0], m = p[1] || 0;
  return ((h % 12) || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h >= 12 ? 'PM' : 'AM');
}
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function cleanupOldKeys(props) {
  const cutoff = Utilities.formatDate(new Date(Date.now() - 14 * 24 * 3600 * 1000), TZ, 'yyyy-MM-dd');
  const all = props.getProperties();
  Object.keys(all).forEach(function (k) { if (k.indexOf('sent_') === 0 && all[k] < cutoff) props.deleteProperty(k); });
}
