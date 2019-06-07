// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron');
const menu = require('./mainMenu');
const prompt = require('electron-prompt');


// console.log(dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] }))
const store = require('./config');

//SET ENV
process.env.NODE_ENV = 'development';
// process.env.NODE_ENV = 'production';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
    // Save settings to file
    for (let k in store.store) {
        store.set(k, store.get(k));
    }

    let width  = store.get('WindowWidth');
    let height = store.get('WindowHeight');
    // Create the browser window.
    mainWindow = new BrowserWindow(
        {
            width: width,
            height: height,
            webPreferences: {
                nodeIntegration: true
            }
        }
    );
    mainWindow.on('resize', () => {
        // The event doesn't pass us the window size, so we call the `getBounds` method which returns an object with
        // the height, width, and x and y coordinates.
        let { width, height } = mainWindow.getBounds();
        // Now that we have them, save them using the `set` method.
        store.set('WindowWidth', width);
        store.set('WindowHeight', height);
    });

    // and load the mainWindow.html of the app.
    mainWindow.loadFile('mainWindow.html');

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    createWindow();
    menu(app, mainWindow);
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow()
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('media-drop', (event, arg) => {
    // event.reply('asynchronous-reply', 'pong')
    mainWindow.webContents.send('media-add', arg);
});

ipcMain.on('edit-note', (event, arg) => {
    prompt({
        width: 370,
        height: 200,
        title: 'Notes dialog',
        label: 'Note:',
        value: arg['#EVENT NOTE'],
        inputAttrs: {
            type: 'text'
        }
    })
        .then((note) => {
            if(note === null) {
            } else {
                mainWindow.webContents.send('note-edited', {text: note, data: arg});
            }
        })
        .catch(console.error);
});
