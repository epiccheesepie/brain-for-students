const brain = require('brain.js');
const fs = require('file-system');
const PNG = require('pngjs').PNG;
const math = require('mathjs');

class NeuralNetwork {
	constructor(layers=[]) {
		this.layers = layers;
	}

	init(input_cnt, cnt, output_cnt) { //начальная инициализация
		for (let i=0;i<cnt;i++) {
			let lay = new Layer(12);
			lay.init(input_cnt);
			this.layers.push(lay);
			input_cnt = lay.cnt;
		}

		let lay = new OutputLayer(output_cnt);
		lay.init(this.layers[this.layers.length - 1].cnt);
		this.layers.push(lay);
	}

	run(inputs) { //определение результата
		let outputs = [];
		function calcActivate(inputs,lay) {
			let arr = [];
			let { cnt, weights, bias } = lay; //количество нейронов в слое; веса; биас

			for (let i=0;i<cnt;i++) {
				let mult = math.multiply(inputs,weights[i]) + lay.bias; //умножение инпутов и весов + биас
				let x = 1/(1+math.exp(-mult)); //сигмоида
				arr.push(x); //запись в нейроны
			}

			return arr;
		}
		this.layers.forEach( (lay) => {
			console.log(inputs);
			inputs = calcActivate(inputs,lay);
		});

		outputs = inputs;
		console.log(outputs);
		return outputs;
	}

	save(path) { //сохранение слоев
		fs.writeFileSync(path, JSON.stringify(this.layers));
	}

	load(path) { //загрузка слоев
		let layers = JSON.parse(fs.readFileSync(path));
		this.layers = layers;
	}

	train(inputs, outputs) { //тренировка сети

	}

}

class Layer {
	constructor(cnt,bias=1) {
		this.cnt = cnt;
		this.weights = [];
		this.bias = bias;
	}

	init(length) {
		for (let i=0;i<this.cnt;i++) {
			const w = this.weights[i] = [];
			for (let j=0;j<length;j++) {
				w.push(Math.random());
			}
		}
	}
}
class OutputLayer extends Layer {
	constructor(cnt, weights, bias) {
		super(cnt,weights,bias);
	}
}

function png_to_text(path) {
	return new Promise(resolve => {
		let arr = [];
		fs.createReadStream(path)
		.pipe(
			new PNG({
			  filterType: 4,
			})
		)
		.on("parsed", function () {
			for (var y = 0; y < this.height; y++) {
			  for (var x = 0; x < this.width; x++) {
			    var idx = ((this.width * y + x) << 2) + 3;
			    if (this.data[idx] === 255) arr.push(1);
			    else arr.push(0);
			  }
			}
			if (arr.length === 25) resolve(arr);
		});
	});
}

png_to_text('./src/png/17.png')
.then( res => {
	const net = new NeuralNetwork();
	net.init(res.length,2,5);
	
	console.log(net);
	net.run(res);
	net.save('db.json');
});

/*png_to_text('./src/png/20.png').then( (res) => { console.log(res)});
png_to_text('./src/png/27.png').then( (res) => { console.log(res)});
png_to_text('./src/png/30.png').then( (res) => { console.log(res)});*/