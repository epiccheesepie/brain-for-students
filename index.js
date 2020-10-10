const fs = require('file-system');
const PNG = require('pngjs').PNG;
const math = require('mathjs');

class NeuralNetwork {
	constructor(layers=[]) {
		this.layers = layers;
	}

	init({ input_cnt, output_cnt, layers_cnt, layers_neurons_cnt }) { //начальная инициализация
		for (let i=0;i<layers_cnt;i++) {
			let lay = new Layer(layers_neurons_cnt);
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
				let mult = math.multiply(inputs,weights[i]) + bias; //умножение инпутов и весов + биас
				let x = 1/(1+math.exp(-mult)); //сигмоида
				arr.push(x); //запись в нейроны
			}

			return arr;
		}
		this.layers.forEach( (lay) => {
			inputs = calcActivate(inputs,lay);
			lay.activates = inputs;
		});
		outputs = inputs;

		return outputs;
	}

	save(path) { //сохранение слоев
		fs.writeFileSync(path, JSON.stringify(this.layers));
	}

	load(path) { //загрузка слоев
		let layers = JSON.parse(fs.readFileSync(path));
		this.layers = layers;
	}

	train({ data, repeat_cnt, speed }) { //тренировка сети
		for(let i=0;i<repeat_cnt;i++) {
			data.forEach(val => {
				this._backProp(val.input,val.output,speed);
			});
		}
	}

	_backProp(inputs, outputs, speed) { //back propagation
		const train_outputs = this.run(inputs);	

		const layers = this.layers; //слои сети
		const errors = [];
		errors.unshift(math.add(outputs,math.multiply(train_outputs,-1)));
		layers.reverse().every((lay,index,arr) => {
			if (index === arr.length-1) return false;
			let d = [];
			let weights_to_d = [];
			let cnt = lay.weights[0].length;
			let ix = 0;
			for(let i=0;i<cnt;i++) {
				for(let j=0;j<lay.cnt;j++) {
					weights_to_d.push(lay.weights[j][ix]);
				}
				ix++;
				let dx = math.multiply(errors[0],weights_to_d);
				d.push(dx);
				weights_to_d = [];
			}
			errors.unshift(d);
			return true;
		});

		layers.reverse().forEach((lay,index) => {
			let weights = [];
			for(let i=0;i<lay.cnt;i++) {
				let weights_x = [];
				for(let j=0;j<lay.weights[i].length;j++) {
					let w = lay.weights[i][j];
					let f = lay.activates[i]*(1-lay.activates[i]);
					weights_x.push(w+errors[index][i]*f*inputs[j]*speed);
				}
				weights.push(weights_x);
			}
			lay.weights = weights;
			inputs = lay.activates;
		});
	}

}

class Layer {
	constructor(cnt,bias=0) {
		this.cnt = cnt;
		this.weights = [];
		this.activates = [];
		this.bias = bias;
	}

	init(length) {
		for (let i=0;i<this.cnt;i++) {
			const w = this.weights[i] = [];
			for (let j=0;j<length;j++) {
				w.push(Math.random() - 0.5);
			}
		}
	}
}
class OutputLayer extends Layer {
	constructor(cnt, weights, activates, bias) {
		super(cnt,weights,activates,bias);
		this.bias = 0;
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

function tests(net, dir) {
	const png = fs.readdirSync(dir);
	Promise.all(png.map( (path) => {
		return png_to_text(dir + '/' + path);
	}))
	.then(values => {
		const outp = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
		values.forEach(val => {
			let res = net.run(val);
			//console.log(res);
			if (res[0] > 0.8) outp[1]++;
			else if (res[1] > 0.8) outp[2]++;
			else if (res[2] > 0.8) outp[3]++;
			else if (res[3] > 0.8) outp[4]++;
			else if (res[4] > 0.8) outp[5]++;
		});

		console.log(outp);
	});

}

/*
let png = fs.readdirSync('./src/png/1');
let main_png;
Promise.all(png.map( (path) => {
	return png_to_text('./src/png/1/' + path);
}))
.then(values => {
	main_png = values;

	let db = main_png.map((val,index) => {
		if (index === 0) return {input: val, output: [1,0,0,0,0]};
		if (index === 1) return {input: val, output: [0,1,0,0,0]};
		if (index === 2) return {input: val, output: [0,0,1,0,0]};
		if (index === 3) return {input: val, output: [0,0,0,1,0]};
		if (index >= 4) return {input: val, output: [0,0,0,0,1]};
	});
	
	const net = new NeuralNetwork();
	net.init({
		input_cnt: 25,
		output_cnt: 5,
		layers_cnt: 4,
		layers_neurons_cnt: 18
	});
	net.train({
		data: db,
		repeat_cnt: 500,
		speed: 0.1
	});

	console.log(net.run(db[0].input));
	console.log(net.run(db[1].input));
	console.log(net.run(db[2].input));
	console.log(net.run(db[3].input));

	//net.save('net.json');


});*/


const net = new NeuralNetwork();
net.load('net.json');

const dir = './src/png/2'
tests(net,dir);
