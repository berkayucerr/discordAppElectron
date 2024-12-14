const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow (name, x) {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: name,
    x: x,
    y: 0,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('src/index.html')
}

app.whenReady().then(() => {
  createWindow('Kullanıcı 1', 0)
  createWindow('Kullanıcı 2', 1220)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow('Kullanıcı 1', 0)
      createWindow('Kullanıcı 2', 1220)
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})