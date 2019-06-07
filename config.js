const Store = require('electron-store');

const schema = {
	WindowWidth: {
		type: 'integer',
		minimum: 200,
		maximum: 1920,
		default: 800
	},
	WindowHeight: {
		type: 'integer',
		minimum: 200,
		maximum: 1080,
		default: 600
	},
	LastPlaylistPath: {
		type: 'string'
	},
	LastMediaPath: {
		type: 'string'
	},
};


module.exports = new Store({schema});
