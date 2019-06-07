const electron = require('electron');
const path = require('path');
const store = require('./config');
const fs = require('fs');
const iconv = require('iconv-lite');
const Sortable = require ('sortablejs');
const ffmpeg = require('./ffmpeg');
const Mousetrap = require('mousetrap');
// const {ipcRenderer} = electron;
const { formatDuration} = require('./util');

let modal;
let header_keywords = ["#FILENAME", "#PLAYLIST_FILE_NAME", "#PLAYLISTID", "#PLAYLISTTC", "#LISTNAME"];
let items_keywords = ["#LISTID", "#DYNAMICMEDIA", "#EVENT NOTE", "#STARTTIME", "#PROGRAM_ID", "#CATEGORY", "#PERFORMER", "#NOTES", "#TC", "#TC_IN", "#TC_OUT", "#TAPEID"];
let current_playlist = {"#FILENAME": "", "#PLAYLIST_FILE_NAME": "", "#PLAYLISTID": "", "#PLAYLISTTC": "00:00:00:00",
    "#LISTNAME": "", "items": []};

document.addEventListener('DOMContentLoaded', () => {
    // console.log(window.location.hash);

    // Modal init
    modal = M.Modal.init(document.getElementById('modal1'), {opacity: 0.5});
    (function () {
        const holder = document.getElementById('app');
        holder.ondragover = () => {return false;};
        holder.ondragleave = () => {return false;};
        holder.ondragend = () => {return false;};
        holder.ondrop = (e) => {
            e.preventDefault();
            for (let f of e.dataTransfer.files) {
                console.log('File(s) you dragged here: ', f.path);
                if (path.extname(f.path) === ".mpg" || path.extname(f.path) === ".mp4") {
                    console.log("send message", f.path);
                    electron.ipcRenderer.send('media-drop', [f.path]);
                }
            }
            return false;
        };
    })();
});

electron.ipcRenderer.on('new-playlist', () => {
    clearPlaylist();
    renderPlaylistHTML();
});

electron.ipcRenderer.on('playlist-opened', (event, filePaths) => {
    clearPlaylist();
    if (!filePaths || filePaths.length !== 1) return;
    // let filename = path.basename(filePaths[0]);
    let fileDir = path.dirname(filePaths[0]);
    store.set('LastPlaylistPath', fileDir);
    // document.title = "GalTV Playlist Editor - " + filename;
    current_playlist = parsePlaylist(readPlaylistFile(filePaths[0]));
    console.log(current_playlist);
    renderPlaylistHTML();
});

electron.ipcRenderer.on('media-add', (event, filePaths) => {
    console.log("'media-add' recieved", filePaths);
    if (!filePaths || filePaths.length !== 1) return;
    let fileDir = path.dirname(filePaths[0]);
    store.set('LastMediaPath', fileDir);
    // const fileDuration = ffmpeg.getDuration(filePaths[0]);
    ffmpeg.getDuration(filePaths[0]).then((fileDuration) => {
        // console.log(`Then val = ${fileDuration}`);
        const list_item = {
            "#LISTID": "",
            "#DYNAMICMEDIA": "FALSE",
            "#TC": "0.00000",
            "file": {
                "path": filePaths[0],
                "in": "0.00000",
                "out": (Math.floor(fileDuration*1000)/1000).toFixed(5), // Math.round(original*100)/100
                "hid": "",
                "title": path.basename(filePaths[0])
            }
        };
        console.log(list_item);
        current_playlist.items.push(list_item);
        console.log(current_playlist);
        renderPlaylistHTML();
    });

});

electron.ipcRenderer.on('note-add', (event, note) => {
    console.log("Note add:" + note);
    const list_item = {
        "#LISTID": "",
        "#DYNAMICMEDIA": "FALSE",
        "#EVENT NOTE": note,
    };
    current_playlist.items.push(list_item);
    console.log(current_playlist);
    renderPlaylistHTML();
});

electron.ipcRenderer.on('save-playlist', (event, filePaths) => {
    if (!filePaths) return;
    console.log("Save playlist:\n", filePaths);
    current_playlist["#FILENAME"] = current_playlist["#PLAYLIST_FILE_NAME"] = filePaths;
    console.log(current_playlist);
    let fileString = "";
    for (let name of header_keywords) {
        fileString += name + " " + current_playlist[name] + "\r\n";
    }

    for (let item of current_playlist.items) {
        if (item.file) {
            // item is file
            for (let name of items_keywords) {
                if (["#LISTID", "#DYNAMICMEDIA", "#TC"].indexOf(name) > -1) {
                    fileString += name + " " + (item[name] || "")  + "\r\n";
                    // console.log(fileString);
                } else {
                    fileString += item[name] ? name + " " + item[name] + "\r\n" : "";
                }
            }
            fileString += ['"' + item.file.path + '"', item.file.in, item.file.out, item.file.hid , item.file.title].join(';') + "\r\n";
        } else {
            // item is note
            fileString += "#LISTID " + item['#LISTID'] + "\r\n";
            fileString += "#DYNAMICMEDIA " + item['#DYNAMICMEDIA'] + "\r\n";
            fileString += "#EVENT NOTE " + item['#EVENT NOTE'] + "\r\n";
        }

    }
    console.log("fileString: ", fileString);
    writePlaylistFile(filePaths, fileString);
    // #FILENAME \\fileserver\users\RomanSh\ply\full.ply
    // #PLAYLIST_FILE_NAME \\fileserver\users\RomanSh\ply\full.ply
});

electron.ipcRenderer.on('save-playlist-as', (event, filePaths) => {
    console.log("Save playlist as:\n", filePaths);
    console.log(current_playlist);

});

electron.ipcRenderer.on('note-edited', (event, arg) => {
    let item_index = current_playlist.items.findIndex( item => item['#EVENT NOTE'] === arg.data['#EVENT NOTE']);
    current_playlist.items[item_index]['#EVENT NOTE'] = arg.text;
    renderPlaylistHTML();
});

function renderPlaylistHTML() {
    console.log("======Render playlist HTML======");
    const table = document.getElementById('file-list');

    table.innerHTML = "";
    let num = 1;
    for (let item of current_playlist['items']) {
        // console.log(item);
        let row = document.createElement('tr');
        if (item.file) {
            row.innerHTML = `<td class="num">${num}</td><td>${formatDuration(item.file['out'])}</td><td>${item.file['title']}</td><td>${item.file['path']}</td><td>File</td>`;
            // row.style.backgroundColor = "#ff9f60";
            row.classList.add('file');
        } else {
            row.innerHTML = `<td class="num">${num}</td><td></td><td>${item['#EVENT NOTE']}</td><td></td><td>Note</td>`;
            // row.style.backgroundColor = "#00ffff";
            row.classList.add('note');
        }
        // row.classList.add('list-item');
        row.data = item;
        // selectable.add(row);

        // make rows selectable
        row.addEventListener('click', (e) => {
            let parent_row = e.target.parentElement;

            if (e.shiftKey) {
                const rows = table.getElementsByTagName('tr');
                const selected_rows = table.getElementsByClassName('selected');
                let first_selected_index;
                let current_index = [...rows].indexOf(e.target.parentElement);
                if (selected_rows.length > 0) {
                    first_selected_index = [...rows].indexOf(selected_rows[0]);
                    if (current_index > first_selected_index) {
                        for (let i = first_selected_index; i <= current_index; i++) {
                            rows[i].classList.add('selected');
                        }
                    }
                    if (current_index < first_selected_index) {
                        for (let i = current_index; i <= first_selected_index; i++) {
                            rows[i].classList.add('selected');
                        }
                    }
                } else {
                    first_selected_index = [...rows].indexOf(e.target.parentElement);
                    rows[current_index].classList.toggle('selected');
                }
                // console.log("first selected index = ", first_selected_index);
                console.log("Shift key pressed", [...rows].indexOf(e.target.parentElement));
                // console.log(e.target.parentElement.getElementsByTagName('td')[0].innerText);
            } else if (e.ctrlKey) {
                console.log("Ctrl key pressed");
                parent_row.classList.toggle('selected');
            } else {
                console.log("Click", table.getElementsByTagName('tr'));
                // table.getElementsByTagName('tr').forEach((el) => {});
                for (let el of table.getElementsByTagName('tr')) {
                    el.classList.remove('selected');
                }
                parent_row.classList.toggle('selected');
            }

            // if (parent_row.data.file) {
            //     parent_row.classList.toggle('file');
            // } else {
            //     parent_row.classList.toggle('note');
            // }
        });

        table.appendChild(row);
        num++;
    }

    if (typeof sortable !== "undefined") {sortable.destroy()}
    var sortable = Sortable.create(table, {
        animation: 150,
        sort: true,
        onSort: (event) => {
            const nums = table.getElementsByClassName('num');
            for (let i=0; i < nums.length; i++ ) {
                nums[i].innerText = i + 1;
            }
            // refresh current_playlist
            current_playlist.items = readList();
            console.log(current_playlist);
        }
    });

    // if (typeof selectable !== "undefined") {selectable.destroy()}
    // selectable = new Selectable({
    //     filter: table.querySelectorAll('tr'),
    //     classes: {
    //         selected: 'selected'
    //     },
    //     lasso: false
    // });


    document.title = "GalTV Playlist Editor" + (current_playlist["#PLAYLIST_FILE_NAME"] ? (" - " + path.basename(current_playlist["#PLAYLIST_FILE_NAME"])) : "");
    totalLength();
}

function readList() {
    const table = document.getElementById('file-list');
    const read_list = Array.from(table.getElementsByTagName('tr'))
    return read_list.map(el => {return el.data});
}

function clearPlaylist() {
    current_playlist = {"#FILENAME": "", "#PLAYLIST_FILE_NAME": "", "#PLAYLISTID": "", "#PLAYLISTTC": "00:00:00:00",
        "#LISTNAME": "", "items": []};
    renderPlaylistHTML();
}

function message(head, text) {
    document.getElementById('modal1').children[0].children[0].innerHTML = head;
    document.getElementById('modal1').children[0].children[1].innerHTML = text;
    modal.open();
}

function parsePlaylist(text) {
    // Parse opened playlist
    let playlist = {};

    let head_string = text.substring(0, text.indexOf("#LISTID") != -1 ? text.indexOf("#LISTID"): text.length);

    // TODO: check if header contains all header_keywords
    let valid_head = header_keywords.every((word) => {
        return head_string.indexOf(word) != -1;
    });
    // let valid_head = true;
    if (!valid_head) {
        message("Error", "Invalid playlist file");
        return null;
    }

    let list_head = head_string.split('\r\n');
    let list_body = text.substring(text.indexOf("#LISTID")).split('\r\n');

    for (const row of list_head) {
        let name = containsAny(row, header_keywords);
        if (name) {
            playlist[name] = row.substring(name.length + 1);
        }
    }

    let playlist_items = [];
    let item = {};
    for (const row of list_body) {
        let name = containsAny(row, items_keywords);
        let isFileString = row.match(/^\".+\";[\d\.]*;[\d\.]*;.*;*/);
        // console.log(`isFileString = ${isFileString}`);
        if (name || isFileString) {
            if (name) {
                if (name === "#LISTID") {
                    item = {};
                    item[name] = row.substring(name.length + 1);
                    playlist_items.push(item);
                } else {
                    item[name] = row.substring(name.length + 1);
                }
            } else {
                let file_item = row.split(";");
                item['file'] = {'path': file_item[0].replace(/['"]+/g, ''), 'in': file_item[1], 'out': file_item[2], 'hid': file_item[3], 'title': file_item[4]};
            }
        }
    }
    playlist["items"] = playlist_items;
    // console.log(playlist);
    return playlist;
}

function totalLength() {
    const total_length_el = document.getElementById('total-length');
    let total = 0;
    for (let item of current_playlist.items) {
        // console.log(item);
        if (item.file) {
            total += parseFloat(item.file.out);
        }
    }
    total_length_el.innerHTML = `<h2>Total length: ${formatDuration(total)}</h2>`;
}

function containsAny(str, substrings) {
    for (let i = 0; i < substrings.length; i++) {
        let substring = substrings[i];
        if (str.indexOf(substring + " ") === 0) {
            return substring;
        }
    }
    return null;
}

function readPlaylistFile(filepath) {
    return iconv.decode(fs.readFileSync(filepath), 'win1251');
}

function writePlaylistFile(filepath, content) {
    let content_to_write = iconv.encode(content, 'win1251');
    fs.writeFile(filepath, content_to_write, (err) => {
        if (err) {
            message("An error occurred saving the file", err.message);
            console.log(err);
            return;
        }
        renderPlaylistHTML();
        message("Info", "The file has been successfully saved");
    });
}

Mousetrap.bind('ctrl+return', function(e) {
    console.log("Keyboard event", e);
    const table = document.getElementById('file-list');
    const selected = table.getElementsByClassName('selected');

    if (selected.length !== 1) {
        message("Warning", "Select single note.");
    } else {
        if (selected[0].data.file) {
            // is file item
            message("Warning", "Select single note.");
        } else {
            console.log("Edit note", selected[0]);
            electron.ipcRenderer.send('edit-note', selected[0].data);
        }
    }
    return false;
});

Mousetrap.bind('del', function(e) {
    console.log("Keyboard event", e);
    let elements = document.querySelectorAll('.selected');
    elements.forEach((el) => {
        el.parentNode.removeChild(el);
        current_playlist.items = readList();
        totalLength();
        console.log(current_playlist);
    });
    return false;
});


