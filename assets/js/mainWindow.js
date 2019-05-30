const electron = require('electron');
// const {ipcRenderer} = electron;

let modal;

document.addEventListener('DOMContentLoaded', () => {

    // Modal init
    modal = M.Modal.init(document.getElementById('modal1'), {opacity: 0.5});
    // message("test", "Test");
});

electron.ipcRenderer.on('playlist-opened', (event, filePaths) => {
    if (!filePaths || filePaths.length !== 1) return;
    message("Info", filePaths[0]);
    // console.log(list_string);
    parsePlaylist(list_string);
});

function message(head, text) {
    document.getElementById('modal1').children[0].children[0].innerHTML = head;
    document.getElementById('modal1').children[0].children[1].innerHTML = text;
    modal.open();
}

function parsePlaylist(text) {
    // Parse opened playlist
    let playlist = {};
    let keywords = ["#FILENAME", "#PLAYLIST_FILE_NAME", "#PLAYLISTID", "#PLAYLISTTC", "#LISTNAME", "#LISTID", "#DYNAMICMEDIA", "#EVENT NOTE"]
    // TODO: parse head
    let list_head = text.substring(0, text.indexOf("#LISTID")).split('\n');
    for (const row of list_head) {
        console.log(row);
        let name = row.substring(1, row.indexOf(" "));
        let value = row.substring(row.indexOf(" "));
        playlist[name] = value;
    }

    console.log(playlist);
    console.log("============================");

    // TODO: parse items
    let playlist_items = [];
    let list_body = text.substring(text.indexOf("#LISTID")).split('\n');
    console.log(list_body);

}

const list_string = "#FILENAME D:\\playlist test.ply\n" +
    "#PLAYLIST_FILE_NAME D:\\playlist test.ply\n" +
    "#PLAYLISTID 555059037039\n" +
    "#PLAYLISTTC 00:00:00:00\n" +
    "#LISTNAME \n" +
    "#LISTID 553979101726\n" +
    "#DYNAMICMEDIA FALSE\n" +
    "#EVENT NOTE note01\n" +
    "#LISTID 554058529380\n" +
    "#DYNAMICMEDIA FALSE\n" +
    "#TC 0.00000\n" +
    "\"D:\\Filmy\\SHIFT_20 18 05 2019 (12'31'').mp4\";0.00000;751.04000;;SHIFT_20 18 05 2019 (12'31'')\n" +
    "#LISTID 554144674189\n" +
    "#DYNAMICMEDIA FALSE\n" +
    "#TC 0.00000\n" +
    "\"D:\\Zakladni\\Архів\\+03.29_Весна.mpg\";0.00000;210.02400;;+03.29_Весна\n";
