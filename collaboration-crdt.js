(function () {
  'use strict';
  var paper = document.getElementById('paper');
  var title = document.getElementById('documentTitle');
  var state = document.getElementById('collaborationState');
  var endpoint = document.querySelector('meta[name="collaboration-endpoint"]').content.trim();
  if (!window.Y || !endpoint || !window.WebSocket) return;

  var documentPath = 'documents/untitled-document.html';
  var socket;
  var doc;
  var text;
  var ready = false;
  var applyingRemote = false;
  var reconnectTimer;

  function safeName() {
    return (title.value || 'untitled-document').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'untitled-document';
  }

  function encode(update) {
    var bytes = new Uint8Array(update);
    var binary = '';
    for (var index = 0; index < bytes.length; index++) binary += String.fromCharCode(bytes[index]);
    return btoa(binary);
  }

  function decode(value) {
    var binary = atob(value);
    var bytes = new Uint8Array(binary.length);
    for (var index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }

  function sendSnapshot(update) {
    if (!ready || !socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'crdt-update', path: documentPath, update: encode(update), title: title.value, html: text.toString() }));
  }

  function renderRemote() {
    applyingRemote = true;
    paper.innerHTML = text.toString() || '<p><br></p>';
    applyingRemote = false;
  }

  function connect() {
    clearTimeout(reconnectTimer);
    doc = new Y.Doc();
    text = doc.getText('document');
    socket = new WebSocket(endpoint + '/collab');
    socket.addEventListener('open', function () {
      state.textContent = 'Live';
      socket.send(JSON.stringify({ type: 'join-crdt', path: documentPath }));
    });
    socket.addEventListener('message', function (event) {
      var message = JSON.parse(event.data);
      if (message.type === 'crdt-sync') {
        if (message.update) Y.applyUpdate(doc, decode(message.update), 'remote');
        if (!message.update && paper.innerHTML) text.insert(0, paper.innerHTML);
        if (message.title) title.value = message.title;
        renderRemote();
        ready = true;
        if (!message.update) sendSnapshot(Y.encodeStateAsUpdate(doc));
        return;
      }
      if (message.type === 'crdt-update') {
        Y.applyUpdate(doc, decode(message.update), 'remote');
        if (message.title) title.value = message.title;
        renderRemote();
      }
    });
    socket.addEventListener('close', function () {
      ready = false;
      state.textContent = 'Reconnecting...';
      reconnectTimer = setTimeout(connect, 3000);
    });
    socket.addEventListener('error', function () { state.textContent = 'Reconnecting...'; });
    doc.on('update', function (update, origin) {
      if (origin !== 'remote') sendSnapshot(update);
    });
  }

  paper.addEventListener('input', function () {
    if (applyingRemote || !ready) return;
    doc.transact(function () {
      if (text.length) text.delete(0, text.length);
      text.insert(0, paper.innerHTML);
    }, 'local');
  });
  title.addEventListener('input', function () {
    if (documentPath === 'documents/untitled-document.html') documentPath = 'documents/' + safeName() + '.html';
    if (ready) sendSnapshot(Y.encodeStateAsUpdate(doc));
  });
  connect();
}());
