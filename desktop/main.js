// Windows program for the fuel report: the same app as /karburant/, in its own window.
// Data lives in the app's own storage (%APPDATA%\Karburanti), so no browser is involved.
const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const fs = require('fs');
const path = require('path');

if (!app.requestSingleInstanceLock()) app.quit();
let win = null;

function savePdf() {
  const file = dialog.showSaveDialogSync(win, {
    title: 'Ruaj faqen si PDF',
    defaultPath: path.join(app.getPath('desktop'), `Karburanti ${new Date().toLocaleDateString('sq-AL').replace(/\//g, '.')}.pdf`),
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (!file) return;
  win.webContents.printToPDF({ printBackground: true, pageSize: 'A4', landscape: false })
    .then((data) => { fs.writeFileSync(file, data); shell.showItemInFolder(file); })
    .catch((e) => dialog.showErrorBox('Karburanti', 'PDF nuk u ruajt: ' + e.message));
}

function menu() {
  return Menu.buildFromTemplate([
    { label: 'Skedari', submenu: [
      { label: 'Printo…', accelerator: 'CmdOrCtrl+P', click: () => win.webContents.print() },
      { label: 'Ruaj faqen si PDF…', accelerator: 'CmdOrCtrl+Shift+P', click: savePdf },
      { type: 'separator' },
      { label: 'Mbyll', role: 'quit' },
    ] },
    { label: 'Pamja', submenu: [
      { label: 'Zmadho', role: 'zoomIn', accelerator: 'CmdOrCtrl+=' },
      { label: 'Zvogëlo', role: 'zoomOut' },
      { label: 'Madhësia normale', role: 'resetZoom' },
      { type: 'separator' },
      { label: 'Ekran i plotë', role: 'togglefullscreen' },
      { label: 'Rifresko', role: 'reload' },
    ] },
    { label: 'Ndihmë', submenu: [
      { label: 'Ku ruhen të dhënat', click: () => shell.openPath(app.getPath('userData')) },
      { label: `Versioni ${app.getVersion()}`, enabled: false },
    ] },
  ]);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1366, height: 860, minWidth: 900, minHeight: 600,
    title: 'Karburanti', icon: path.join(__dirname, 'icon.png'), backgroundColor: '#f4f5f7', show: false,
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  Menu.setApplicationMenu(menu());
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  win.once('ready-to-show', () => { win.maximize(); win.show(); });

  // The report blocks closing while it has unsaved changes; Electron leaves the question to us.
  win.webContents.on('will-prevent-unload', (e) => {
    const choice = dialog.showMessageBoxSync(win, {
      type: 'question', title: 'Karburanti', buttons: ['Mbyll pa ruajtur', 'Anulo'], defaultId: 1, cancelId: 1,
      message: 'Raporti ka ndryshime të paruajtura.',
      detail: 'Nëse e mbyllni tani, ndryshimet humbasin. Shtypni "Anulo" dhe pastaj "Ruaj raportin".',
    });
    if (choice === 0) e.preventDefault();
  });
  // Website links open in the normal browser; the program only ever shows its own page.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (url.startsWith('file:')) return;
    e.preventDefault();
    if (/^https?:/i.test(url)) shell.openExternal(url);
  });
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
