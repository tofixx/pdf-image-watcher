const chokidar = require('chokidar');
const config = require('config');
const fs = require('fs');

const Converter = require('./src/converter');
const { log, warn } = require('./src/logger');

const WATCH_FOLDER = config.get('watch-folder');
const EXPORT_FOLDER = config.get('export-folder');
const WATCH_CONFIG = config.get('watch-config');
const DELAY = config.get('delay');

const ERROR_EXTENSION = '.error.txt';

log('config loaded:', WATCH_CONFIG);

function createErrorLogFile(path, err) {
	try {
		fs.writeFileSync(`${path}${ERROR_EXTENSION}`, (err.message || err));
	} catch (error) {
		warn(error);
	}
}

function cleanupFilename(path) {
	const newPath = path.replace(' ', '_');
	fs.renameSync(path, newPath);
}

function init() {
	const watcher = chokidar.watch(WATCH_FOLDER, WATCH_CONFIG);
	watcher.on('ready', () => { log('start watching folder:', WATCH_FOLDER); });
	watcher.on('add', (path) => {
		if (path.endsWith(ERROR_EXTENSION)) return;
		if (path.split(' ').length !== 1) {
			cleanupFilename(path);
			return;
		}
		log('File', path, 'has been added');
		setTimeout(() => {
			log('start processing', path, 'to', EXPORT_FOLDER);
			let converter = null;
			try {
				converter = new Converter(path, EXPORT_FOLDER);
				converter.convert().then(() => {
					log('successfully converted', path, 'remove source file...');
					fs.unlink(path, (err) => {
						if (err) throw err;
						log(path, 'removed successfully');
					});
				});
			} catch (error) {
				log('error converting', path, 'to', EXPORT_FOLDER);
				warn(error);
				createErrorLogFile(path, error);
			}
		}, DELAY);
	});
}

init();
