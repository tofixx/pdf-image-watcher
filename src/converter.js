const gs = require('ghostscript4js');
const config = require('config');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const { log } = require('./logger');

const GS_OPTIONS = config.get('ghostscript-options');
const IMG_OPTIONS = config.get('image-options');


function Converter(file, target) {
	this.basePath = path.dirname(require.main.filename);
	this.file = path.join(this.basePath, file);
	this.filename = path.parse(file).name;
	this.outputDir = path.join(this.basePath, target);
	this.convert = this.getConverter();
}

Converter.prototype = {

	pdfConverter() {
		const outputDir = path.join(this.outputDir, this.filename);
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir);
			fs.chmodSync(outputDir, '775');
		}
		const outputName = path.join(outputDir, `${this.filename}-%03d.png`);
		const cmd = `-sDEVICE=${GS_OPTIONS.device} -o ${outputName} -sDEVICE=${GS_OPTIONS.device} -r${GS_OPTIONS.resolution} ${this.file}`;
		log('execute ghostscript with', cmd);
		return gs.execute(cmd)
			.then(() => Promise.resolve())
			.catch(err => Promise.reject(err));
	},

	imageConverter() {
		return sharp(this.file)
			.jpeg(IMG_OPTIONS)
			.toFile(path.join(this.outputDir, `${this.filename}.jpg`));
	},

	getConverter() {
		const [extension] = this.file.split('.').slice(-1);
		switch (extension.toLowerCase()) {
			case ('pdf'):
				log('detected type pdf for', this.file);
				return this.pdfConverter;
			case ('jpg'):
			case ('jpeg'):
				log('detected type image for', this.file);
				return this.imageConverter;
			default:
				throw new Error(`did not found converter for ${this.file}`);
		}
	},
};

module.exports = Converter;
