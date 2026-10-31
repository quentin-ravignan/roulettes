// Roulettes · envoi des relances de paiement depuis contact@roulettes.club
// À coller dans un projet Google Apps Script (script.google.com) ouvert avec le Gmail qui a l'alias contact@roulettes.club.
// 1. Projet > Paramètres > Propriétés du script : ajoute KEY = une longue phrase secrète (la même que dans l'admin du site).
// 2. Déployer > Nouveau déploiement > Application Web : « Exécuter en tant que : moi », « Accès : tout le monde ».
// 3. Copie l'URL qui finit par /exec dans l'admin du site (Réglages > Relances par e-mail).

var FROM = 'contact@roulettes.club';
var MAX_TO = 5;

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var key = PropertiesService.getScriptProperties().getProperty('KEY');
    if (!key || d.key !== key) return out({ ok: false, error: 'clé invalide' });
    var to = String(d.to || '').split(',').map(function (s) { return s.trim(); }).filter(function (s) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s); });
    if (!to.length || to.length > MAX_TO) return out({ ok: false, error: 'destinataires invalides' });
    var opts = { name: 'Roulettes', replyTo: FROM };
    // send from the alias when Gmail knows it, otherwise from the account itself
    if (GmailApp.getAliases().indexOf(FROM) >= 0) opts.from = FROM;
    GmailApp.sendEmail(to.join(','), String(d.subject || 'Roulettes').slice(0, 200), String(d.text || '').slice(0, 5000), opts);
    return out({ ok: true, from: opts.from || Session.getActiveUser().getEmail() });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
