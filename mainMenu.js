const electron = require('electron'); // eslint-disable-line
const defaultMenu = require('electron-default-menu');
const prompt = require('electron-prompt');

const store = require('./config');

const { Menu } = electron;
const { dialog } = electron;

module.exports = (app, mainWindow, newVersion) => {
    const menu = defaultMenu(app, electron.shell);

    const fileMenu = {
        label: 'File',
        submenu: [
            {
                label: 'New Playlist',
                accelerator: 'CmdOrCtrl+N',
                click() {
                        mainWindow.webContents.send('new-playlist', null);
                },
            },
            {
                label: 'Open',
                accelerator: 'CmdOrCtrl+O',
                click() {
                    dialog.showOpenDialog({
                        filters: [{extensions: ['ply'], name: "Playlist"}],
                        properties: ['openFile'],
                        title: "Open playlist",
                        defaultPath: store.get('LastPlaylistPath')
                    }, (filePaths) => {
                        mainWindow.webContents.send('playlist-opened', filePaths);
                    });
                },
            },
            {
                label: 'Add media',
                accelerator: 'Alt+Insert',
                click() {
                    dialog.showOpenDialog({
                        filters: [{extensions: ['mpg', "mp4"], name: "Media files"}],
                        properties: ['openFile'],
                        title: "Add media",
                        defaultPath: store.get('LastMediaPath')
                    }, (filePaths) => {
                        mainWindow.webContents.send('media-add', filePaths);
                    });
                },
            },
            {
                label: 'Add note',
                accelerator: 'CmdOrCtrl+Shift +n',
                click() {
                    prompt({
                        width: 370,
                        height: 200,
                        title: 'Notes dialog',
                        label: 'Note:',
                        value: '',
                        inputAttrs: {
                            type: 'text'
                        }
                    })
                        .then((note) => {
                            mainWindow.webContents.send('note-add', note);
                        })
                        .catch(console.error);
                },
            },
            {
                label: 'Save Playlist',
                accelerator: 'CmdOrCtrl+s',
                click() {
                    dialog.showSaveDialog({
                            filters: [{extensions: ['ply'], name: "Playlist"}],
                            defaultPath: store.get('LastPlaylistPath')
                        },
                        (filePaths) => {
                            mainWindow.webContents.send('save-playlist', filePaths);
                        });

                },
            },
            // {
            //     label: 'Save as...',
            //     accelerator: 'Alt+s',
            //     click() {
            //         dialog.showSaveDialog({
            //                 filters: [{extensions: ['ply'], name: "Playlist"}],
            //                 defaultPath: store.get('LastPlaylistPath')
            //             },
            //             (filePaths) => {
            //                 mainWindow.webContents.send('save-playlist-as', filePaths);
            //             });
            //
            //     },
            // },
            {
                label: 'Exit',
                click() {
                    app.quit();
                },
            },
        ],
    };

    menu.splice((process.platform === 'darwin' ? 1 : 0), 0, fileMenu);
    //
    // const helpIndex = menu.findIndex(item => item.role === 'help');
    // if (helpIndex >= 0) {
    //     menu.splice(helpIndex, 1, {
    //             label: 'Tools',
    //             submenu: [
    //                 {
    //                     label: 'Merge files',
    //                     click() {
    //                         mainWindow.webContents.send('show-merge-dialog', true);
    //                     },
    //                 },
    //             ],
    //         },
    //         {
    //             role: 'help',
    //             submenu: [
    //                 {
    //                     label: 'Learn More',
    //                     click() { electron.shell.openExternal(homepage); },
    //                 },
    //             ],
    //         });
    // }
    //
    // if (newVersion) {
    //     menu.push({
    //         label: 'New version!',
    //         submenu: [
    //             {
    //                 label: `Download ${newVersion}`,
    //                 click() { electron.shell.openExternal(releasesPage); },
    //             },
    //         ],
    //     });
    // }

    Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
};
