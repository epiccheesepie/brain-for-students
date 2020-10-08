const fs = require('file-system');
const PNG = require('pngjs').PNG;
const math = require('mathjs');

class NeuralNetwork {
	constructor(layers=[]) {
		this.layers = layers;
	}

	init(input_cnt, output_cnt, cnt_hidden, cnt_hidden_neurons) { //начальная инициализация
		for (let i=0;i<cnt_hidden;i++) {
			let lay = new Layer(cnt_hidden_neurons);
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

	train(arr, q) { //тренировка сети
		for(let i=0;i<q;i++) {
			arr.forEach(val => {
				this._backProp(val.input,val.output);
			});
		}
	}

	_backProp(inputs, outputs) { //back propagation
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
					weights_x.push(w+errors[index][i]*f*inputs[j]*0.9);
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


//лаба1
const net = new NeuralNetwork();
net.init(25,5,2,12);

const png = {};
png_to_text('./src/png/17.png')
.then( res => {
	png['17'] = res;
	png_to_text('./src/png/20.png')
	.then( res => {
		png['20'] = res;
		png_to_text('./src/png/27.png')
		.then( res => {
			png['27'] = res;	
			png_to_text('./src/png/30.png')
			.then( res => {
				png['30'] = res;
				
				net.train([
					{input: png['17'], output: [1,0,0,0,0]},
					{input: png['20'], output: [0,1,0,0,0]},
					{input: png['27'], output: [0,0,1,0,0]},
					{input: png['30'], output: [0,0,0,1,0]},
				], 1000);													

				console.log(net.run(png['17']));
				console.log(net.run(png['20']));
				console.log(net.run(png['27']));
				console.log(net.run(png['30']));

				//net.save('db.json');
			});
		});
	});
});