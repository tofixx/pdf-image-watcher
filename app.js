const chokidar = require('chokidar');
const config = require('config');
const fs = require('fs');
const p = require('path');

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

function getFileNameFromPath(path) {
	const filename = p.parse(path).name;
	return filename;
}

function convertAddedFile(path) {
	setTimeout(() => {
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
}

function checkFileCopyComplete(path, prev) {
	fs.stat(path, (err, stat) => {
		if (err) {
			throw err;
		}
		if (stat.mtime.getTime() === prev.mtime.getTime()) {
			log('File copy complete => beginning processing');
			convertAddedFile(path);
		} else {
			setTimeout(checkFileCopyComplete, DELAY, path, stat);
		}
	});
}


function init() {
	const watcher = chokidar.watch(WATCH_FOLDER, WATCH_CONFIG);
	watcher.on('ready', () => { log('start watching folder:', WATCH_FOLDER); });
	watcher.on('unlink', (path) => { log(`File: ${path}, has been REMOVED`); });
	watcher.on('add', (path) => {
		log('File', path, 'has been added');
		if (path.endsWith(ERROR_EXTENSION)) return;
		if (getFileNameFromPath(path).startsWith('.')) return;
		if (path.indexOf(' ') !== -1) {
			cleanupFilename(path);
			return;
		}
		log('will start processing', path, 'after delay', DELAY);
		fs.stat(path, (err, stat) => {
			if (err) {
				warn(`Error watching file for copy completion. ERR: ${err.message}`);
				warn(`Error file not processed. PATH: ${path}`);
			} else {
				log('File copy started...');
				setTimeout(checkFileCopyComplete, DELAY, path, stat);
			}
		});
	});
}

init();
