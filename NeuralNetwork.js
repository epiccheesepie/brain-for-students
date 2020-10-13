const math = require('mathjs');
const fs = require('file-system');

class NeuralNetwork {
	constructor(layers=[]) {
		this.layers = layers;
	}

	init({ input_cnt, output_cnt, hidden_cnt, hidden_neurons_cnt }) { //начальная инициализация
		const layers = this.layers;
		for (let i=0;i<hidden_cnt;i++) {
			let lay = new Layer(hidden_neurons_cnt);
			lay.init(input_cnt);
			layers.push(lay);
			input_cnt = lay.cnt;
		}

		let lay = new OutputLayer(output_cnt);
		lay.init(layers[layers.length - 1].cnt);
		layers.push(lay);
	}

	run(inputs) { //определение результата
		function calcActivate(inputs,lay) { //рассчет активации нейронов в слое
			let arr = [];
			let { cnt, weights, bias } = lay; //количество нейронов в слое; веса; биас

			for (let i=0;i<cnt;i++) {
				let mult = math.multiply(inputs,weights[i]) + bias; //умножение инпутов и весов + биас
				let x = 1/(1+math.exp(-mult)); //функция активации (сигмоида)
				arr.push(x); //запись в нейроны
			}

			return arr;
		}

		let outputs = [];
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

module.exports = NeuralNetwork;