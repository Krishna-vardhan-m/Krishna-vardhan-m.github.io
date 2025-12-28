/**
 * Google Apps Script Web App for receiving appointment data and writing it to a Google Sheet.
 * It appends the incoming appointment as a new row, then sorts all rows by date+time.
 *
 * Deployment steps are provided in GAS/README.md. After deploying, set the web app URL in
 * `contact.html` as API_ENDPOINT. Optionally set an API_KEY below and configure the same value
 * in the script to add basic protection.
 */

const SHEET_ID = '1_wo79Ufq95YfVrtp-8ol9VX_0k9CYPAv-6tgPHpc9tA'; // e.g. '1AbCdEfG...'
const SHEET_NAME = 'Appointments';
const API_KEY = ''; // OPTIONAL: set a secret token here and send same as `apiKey` in request body

function doPost(e) {
  var result = {status: 'error', message: ''};
  try {
    var payload = {};
    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        // fall back to parameters
        payload = e.parameter || {};
      }
    } else if (e.parameter) {
      payload = e.parameter;
    }

    // Helper: get first non-empty value from possible parameter names
    function getParam(obj, keys) {
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (obj.hasOwnProperty(k) && obj[k] !== undefined && obj[k] !== null) {
          var v = '' + obj[k];
          if (v.trim() !== '') return v.trim();
        }
      }
      return '';
    }

    // Normalize commonly used field names (support hyphens, underscores, camelCase)
    var dateVal = getParam(payload, ['date', 'appointment-date', 'appointment_date']);
    var timeVal = getParam(payload, ['time', 'appointment-time', 'appointment_time']);
    var typeVal = getParam(payload, ['appointmentType', 'appointment-type', 'appointment_type']);
    var nameVal = getParam(payload, ['name', 'full-name', 'full_name', 'fullName']);
    var phoneVal = getParam(payload, ['phone', 'phone-number', 'phone_number']);
    var emailVal = getParam(payload, ['email', 'email-id', 'email_id']);
    var apiKeyVal = getParam(payload, ['apiKey', 'api-key', 'api_key']);

    if (API_KEY && (!apiKeyVal || apiKeyVal !== API_KEY)) {
      result.message = 'Invalid API key';
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }

    // Required fields (email is optional now; appointmentType required)
    var missing = [];
    if (!dateVal) missing.push('date');
    if (!timeVal) missing.push('time');
    if (!typeVal) missing.push('appointmentType');
    if (!nameVal) missing.push('name');
    if (missing.length) {
      result.message = 'Missing required fields: ' + missing.join(', ');
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['Date', 'Time', 'Appointment Type', 'Name', 'Phone', 'Email', 'SubmittedAt']);
    } else if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Date', 'Time', 'Appointment Type', 'Name', 'Phone', 'Email', 'SubmittedAt']);
    }

    // Append new row (email may be empty)
    var submittedAt = new Date();
    sheet.appendRow([dateVal, timeVal, typeVal, nameVal, phoneVal || '', emailVal || '', submittedAt]);

    // Get all rows (excluding header) and sort by combined date+time
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var range = sheet.getRange(2, 1, lastRow - 1, 7); // columns A-G
      var values = range.getValues();
      values.sort(function(a, b) {
        var da = parseDateTime(a[0], a[1]).getTime();
        var db = parseDateTime(b[0], b[1]).getTime();
        return da - db;
      });
      range.setValues(values);
    }

    result.status = 'success';
    result.message = 'Appointment saved';
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    result.message = err.toString();
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Parses date (YYYY-MM-DD) and time (e.g. "09:30 AM" or "14:00") into a JS Date.
 */
function parseDateTime(dateStr, timeStr) {
  var dParts = ('' + dateStr).split('-');
  var year = parseInt(dParts[0], 10) || 1970;
  var month = (parseInt(dParts[1], 10) || 1) - 1;
  var day = parseInt(dParts[2], 10) || 1;

  var hour = 0, minute = 0;
  if (timeStr) {
    var m = ('' + timeStr).trim().match(/(\d{1,2}):?(\d{0,2})\s*(AM|PM)?/i);
    if (m) {
      hour = parseInt(m[1], 10) || 0;
      minute = m[2] ? parseInt(m[2], 10) : 0;
      var ampm = m[3];
      if (ampm) {
        ampm = ampm.toUpperCase();
        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;
      }
    }
  }

  return new Date(year, month, day, hour, minute);
}
