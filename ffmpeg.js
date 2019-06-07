const execa = require('execa');
const bluebird = require('bluebird');
const which = bluebird.promisify(require('which'));
const path = require('path');
const fileType = require('file-type');
const readChunk = require('read-chunk');

function getWithExt(name) {
    return process.platform === 'win32' ? `${name}.exe` : name;
}

function canExecuteFfmpeg(ffmpegPath) {
    return execa(ffmpegPath, ['-version']);
}

function getFfmpegPath() {
    // const internalFfmpeg = path.join(__dirname, '..', 'app.asar.unpacked', 'ffmpeg', getWithExt('ffmpeg'));
    const internalFfmpeg = path.join(__dirname, 'ffmpeg', getWithExt('ffmpeg'));
    return canExecuteFfmpeg(internalFfmpeg)
        .then(() => internalFfmpeg)
        .catch(() => {
            console.log('Internal ffmpeg unavail ', which('ffmpeg'));
            return which('ffmpeg');
        });
}

async function getFFprobePath() {
    const ffmpegPath = await getFfmpegPath();
    return path.join(path.dirname(ffmpegPath), getWithExt('ffprobe'));
}

function determineOutputFormat(ffprobeFormats, ft) {
    if (ffprobeFormats.includes(ft.ext)) return ft.ext;
    return ffprobeFormats[0] || undefined;
}

async function getFormat(filePath) {
    console.log('getFormat', filePath);

    const ffprobePath = await getFFprobePath();
    const result = await execa(ffprobePath, [
        '-of', 'json', '-show_format', '-i', filePath,
    ]);
    const formatsStr = JSON.parse(result.stdout).format.format_name;
    console.log('formats', formatsStr);
    const formats = (formatsStr || '').split(',');

    // ffprobe sometimes returns a list of formats, try to be a bit smarter about it.
    const bytes = await readChunk(filePath, 0, 4100);
    const ft = fileType(bytes) || {};
    console.log(`fileType detected format ${JSON.stringify(ft)}`);
    return determineOutputFormat(formats, ft);
}

async function getDuration(filePath) {
    // console.log('getDuration', filePath);
    const ffprobePath = await getFFprobePath();
    const result = await execa(ffprobePath, [
        '-of', 'json', '-show_format', '-i', filePath,
    ]);
    const durationStr = JSON.parse(result.stdout).format.duration;
    // console.log('duration ', durationStr);
    return durationStr;
}

module.exports = {
    getFormat,
    getDuration
};
