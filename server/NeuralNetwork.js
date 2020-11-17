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

	save(path) { //сохранение слоев
		fs.writeFileSync(path, JSON.stringify(this.layers));
	}

	load(path) { //загрузка слоев
		let layers = JSON.parse(fs.readFileSync(path));
		this.layers = layers;
	}

	clear() {
		this.layers = [];
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
				w.push(Math.random()); //для backProp -0.5
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

class NeuralNetwork_BackProp extends NeuralNetwork {

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

	train({ data, err=0.01, speed }) { //тренировка сети
		let d_er;
		let cnt = 0;
		do {
			const arr_er = [];
			data.forEach(val => {
				arr_er.push(this._backProp(val.input,val.output,speed));
			});

			d_er = arr_er.reduce((sum, a) => sum+a, 0) / arr_er.length;
			cnt += 1;
			if (cnt > 3000) break;
		}
		while (err < d_er);

		return cnt;
	}

	_backProp(inputs, outputs, speed) { //back propagation
		const train_outputs = this.run(inputs);	

		const layers = this.layers; //слои сети
		const errors = [];
		errors.unshift(math.add(outputs,math.multiply(train_outputs,-1)));

		const error = (math.square(errors[0])).reduce((sum, a) => sum+a, 0); //вычисление ошибки для формирования количества циклов

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

		return error;
	}
}

class NeuralNetwork_CounterProp extends NeuralNetwork {

	init() {
		super.init({
			input_cnt: 25,
			output_cnt: 5,
			hidden_cnt: 1,
			hidden_neurons_cnt: 6
		});
	}

	#calcActivates(inputs, lay) {
		const activates = [];
		const { cnt, weights, bias } = lay;

		for (let i=0;i<cnt;i++) {
			let net = math.multiply(inputs,weights[i]) + bias; //умножение инпутов и весов + биас
			activates.push(net); //запись в нейроны
		}

		if (lay.constructor.name === 'OutputLayer') {
			return activates;
		}

		const index = activates.indexOf(Math.max(...activates)); //индекс максимального
		return activates.map( (value, i) => {
			return (i === index) ? 1 : 0; //если индекс максимальный то 1, если нет 0
		});
	}

	run(inputs) { //определение результата
		let outputs = [];
		this.layers.forEach( (lay) => {
			lay.activates = this.#calcActivates(inputs,lay);
			inputs = lay.activates;
		});
		outputs = inputs;

		return outputs;
	}

	_counterProp(inputs, outputs, speed=0.25, layers=this.layers) {
		const train_outputs = this.run(inputs);
		const errors = [];
		errors.unshift(math.add(outputs,math.multiply(train_outputs,-1)));
		const error = (math.square(errors[0])).reduce((sum, a) => sum+a, 0);

		inputs = inputs.map( (x) => x/inputs.length); //нормализованный вектор

		layers.forEach( (lay) => {
			if (lay.constructor.name === 'OutputLayer') { //cлой Гроссберга
				
				const index = inputs.indexOf(Math.max(...inputs)); //индекс выигравшего нейрона слоя Кохонена
				const weights = lay.weights; //массив всех весов слоя

				for (let i=0; i<lay.cnt; i++) {
					const weight = weights[i][index]; //значение старого веса соединенного с выигравшем нейроном слоя Кохонена
					const newWeight = weight+0.01*(outputs[i]-weight); //новый вес

					weights[i][index] = newWeight;
				}

				return;
			}

			const activates = this.#calcActivates(inputs,lay); //рассчет активаций
			const index = activates.indexOf(Math.max(...activates)); //индекс выигравшего нейрона слоя Кохонена
			const weights = lay.weights[index]; //веса соединенные с выигравшим нейроном слоя Кохонена

			for (let i=0; i<weights.length; i++) {
				const weight = weights[i]; //текущее значение веса
				const newWeight = weight+speed*(inputs[i]-weight); //новое значение веса

				weights[i] = newWeight;
			}
			
			inputs = activates;
		});

		return error;
	}

	train({ data, speed}) {
		const chart = [
			['Итерация', 'Ошибка']
		];

		const errors = [];

		for(let i=0; i<100; i++) {
			data.forEach( (val) => {
				errors.push(this._counterProp(val.input,val.output,speed));
			});
			const error = errors.reduce((sum, a) => sum+a, 0) / errors.length;

			chart.push([i,error]);
		}

		return chart;
	}
}

module.exports.NeuralNetwork_BackProp = NeuralNetwork_BackProp;
module.exports.NeuralNetwork_CounterProp = NeuralNetwork_CounterProp;