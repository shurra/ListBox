const electron = require('electron'); // eslint-disable-line
const defaultMenu = require('electron-default-menu');

const { Menu } = electron;
const { dialog } = electron;

module.exports = (app, mainWindow, newVersion) => {
    const menu = defaultMenu(app, electron.shell);

    const fileMenu = {
        label: 'File',
        submenu: [
            {
                label: 'Open',
                accelerator: 'CmdOrCtrl+O',
                click() {
                    dialog.showOpenDialog({ properties: ['openFile'] }, (filePaths) => {
                        mainWindow.webContents.send('playlist-opened', filePaths);
                    });
                },
            },
            {
                label: 'Save',
                click() {
                    mainWindow.webContents.send('save-playlist', false);
                },
            },
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