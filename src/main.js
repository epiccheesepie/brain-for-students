class BuildCanvas {
	constructor(elem) {
		this.elem = elem;
		this.ctx = elem.getContext('2d');
		this.pixel = 50;
	}
}