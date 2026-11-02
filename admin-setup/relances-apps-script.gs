// Roulettes · e-mails sent from contact@roulettes.club: payment reminders (admin) and the registration summary (parents)
// À coller dans un projet Google Apps Script (script.google.com) ouvert avec le Gmail qui a l'alias contact@roulettes.club.
// 1. Projet > Paramètres > Propriétés du script : ajoute KEY = une longue phrase secrète (la même que dans l'admin du site).
// 2. Déployer > Nouveau déploiement > Application Web : « Exécuter en tant que : moi », « Accès : tout le monde ».
// 3. Copie l'URL qui finit par /exec dans l'admin du site (Réglages > Relances par e-mail).

var FROM = 'contact@roulettes.club';
var BCC = 'quentin.ravignan@gmail.com';
var MAX_TO = 5;
var FB = { project: 'roulettes-club', apiKey: 'AIzaSyBMwk6GpRr9v-oYa2DoVDgxRoDFynD0Mck' };

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.type === 'inscription') return out(recap(d));
    var key = PropertiesService.getScriptProperties().getProperty('KEY');
    if (!key || d.key !== key) return out({ ok: false, error: 'clé invalide' });
    var to = String(d.to || '').split(',').map(function (s) { return s.trim(); }).filter(valid);
    if (!to.length || to.length > MAX_TO) return out({ ok: false, error: 'destinataires invalides' });
    var opts = mailOpts();
    GmailApp.sendEmail(to.join(','), String(d.subject || 'Roulettes').slice(0, 200), String(d.text || '').slice(0, 5000), opts);
    return out({ ok: true, from: opts.from || Session.getActiveUser().getEmail() });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

// Registration summary. The parent sends their Firebase sign-in, never the text: the script checks the sign-in with Google,
// reads the rider and the family with the parent's own rights, and sends one summary per rider (copy to the club in Bcc).
function recap(d) {
  var r = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FB.apiKey, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify({ idToken: String(d.idToken || '') }), muteHttpExceptions: true });
  var u = (JSON.parse(r.getContentText()).users || [])[0];
  if (!u || !u.email || !u.emailVerified) return { ok: false, error: 'connexion invalide' };
  var me = u.email.toLowerCase(), id = String(d.riderId || '').replace(/[^A-Za-z0-9_-]/g, '');
  var props = PropertiesService.getScriptProperties();
  if (!id) return { ok: false, error: 'rider manquant' };
  if (props.getProperty('recap-' + id)) return { ok: true, already: true };
  var rider = doc('riders/' + id, d.idToken);
  if (!rider || (rider.emails || []).indexOf(me) < 0) return { ok: false, error: 'rider introuvable' };
  var fam = doc('families/' + rider.familyId, d.idToken) || {}, S = doc('settings/app', d.idToken) || {};
  var plan = +rider.plan || 0, adh = +rider.adhesion || 0;
  var lines = [
    'Bonjour ' + (rider.responsable || fam.responsable || '') + ',', '',
    'Merci pour l’inscription de ' + rider.firstName + ' à Roulettes ! Voici le récapitulatif :', '',
    '- Rider : ' + rider.firstName + ' ' + (rider.lastName || ''),
    '- Date de naissance : ' + (rider.birthDate || '–'),
    '- Stance : ' + (!rider.stance || rider.stance === '?' ? 'à découvrir' : rider.stance),
    '- Formule : ' + (rider.formula || ''),
    '- Montant : ' + (plan ? plan + ' € de cours' : '') + (plan && adh ? ' + ' : '') + (adh ? adh + ' € d’adhésion' : '') + ' = ' + (plan + adh) + ' €',
    '- Droit à l’image : ' + (rider.imageRights ? 'oui' : 'non'),
    '- Responsable légal·e : ' + (rider.emergency || ''),
    '- Adresse : ' + (fam.address || '–'),
    '- Email : ' + (rider.contactEmail || me),
    rider.medical ? '- Informations complémentaires : ' + rider.medical : '', '',
    'L’inscription sera validée par le club à réception du paiement.',
    S.payInfo ? '\n' + S.payInfo + '\n' : '',
    'Tu peux suivre le dossier et personnaliser le rider de ' + rider.firstName + ' dans ton espace : https://roulettes.club/espace.html', '',
    'À très vite sur les spots !', 'L’équipe Roulettes'];
  var to = [me]; if (valid(rider.contactEmail || '') && rider.contactEmail.toLowerCase() !== me) to.push(rider.contactEmail.toLowerCase());
  var opts = mailOpts(); opts.bcc = BCC;
  GmailApp.sendEmail(to.join(','), 'Roulettes · inscription de ' + rider.firstName, lines.filter(function (l) { return l !== null; }).join('\n').replace(/\n{3,}/g, '\n\n'), opts);
  props.setProperty('recap-' + id, new Date().toISOString());
  return { ok: true };
}

function doc(path, token) {
  var r = UrlFetchApp.fetch('https://firestore.googleapis.com/v1/projects/' + FB.project + '/databases/(default)/documents/' + path,
    { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return null;
  var f = JSON.parse(r.getContentText()).fields || {}, o = {};
  for (var k in f) o[k] = val(f[k]);
  return o;
}
function val(v) {
  if ('stringValue' in v) return v.stringValue; if ('integerValue' in v) return +v.integerValue; if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue; if ('arrayValue' in v) return (v.arrayValue.values || []).map(val);
  if ('mapValue' in v) { var o = {}, f = v.mapValue.fields || {}; for (var k in f) o[k] = val(f[k]); return o; } return null;
}
function valid(s) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s); }
// send from the alias when Gmail knows it, otherwise from the account itself
function mailOpts() { var o = { name: 'Roulettes', replyTo: FROM }; if (GmailApp.getAliases().indexOf(FROM) >= 0) o.from = FROM; return o; }
function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
