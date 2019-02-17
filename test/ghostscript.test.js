const chai = require('chai');

const { expect } = chai;
const gs = require('ghostscript4js');

describe('Grostscript', () => {
	it('should return ghostscript version', () => {
		const version = gs.version();
		expect(version.revision, 'revision number exists without getting error')
			.to.be.greaterThan(900);
	});
});
