const { Hamming } = require('../NeuralNetwork.js');
const fs = require('file-system');
const PNG = require('pngjs').PNG;

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
	const ANSWER = {'1.png': 0, '2.png': 0, '3.png': 0, '4.png': 0, 'nothing': 0};
	Promise.all(png.map( (path) => {
		return new Promise(resolve => {
			const outp = {
				name: path,
				bin: null
			};

			png_to_text(dir + '/' + path)
			.then(val => {
				outp.bin = val;
				resolve(outp);
			});
		});
	}))
	.then(values => {
		// values.forEach(val => {
		// 	const outp = {'1.png': false, '2.png': false, '3.png': false, '4.png': false, 'nothing': false};
		// 	const { bin, name } = val;
		// 	let res = net.run(bin);
		// 	if (res[0] > 0.8) outp['1.png'] = true;
		// 	else if (res[1] > 0.8) outp['2.png'] = true;
		// 	else if (res[2] > 0.8) outp['3.png'] = true;
		// 	else if (res[3] > 0.8) outp['4.png'] = true;
		// 	else if (res[4] > 0.8) outp['nothing'] = true;
		// 	console.log(name, outp);
		// });

		values.forEach(val => {
			//const outp = {'1.png': 0, '2.png': 0, '3.png': 0, '4.png': 0, 'nothing': 0};
			const { bin } = val;
			let res = net.run(bin);
			if (res[0] > 0.8) ANSWER['1.png'] += 1;
			else if (res[1] > 0.8) ANSWER['2.png'] += 1;
			else if (res[2] > 0.8) ANSWER['3.png'] += 1;
			else if (res[3] > 0.8) ANSWER['4.png'] += 1;
			else if (res[4] > 0.8) ANSWER['nothing'] += 1;
		});

		console.log(ANSWER);
	});

}

function addNoise(db,q) { //quantity
	return db.map(({inputs,outputs}) => {
		const newInputs = inputs.concat();

		for (let i=0;i<q;i++) {
			if (newInputs[i] === 1) {
				newInputs[i] = -1;
			} else {
				newInputs[i] = 1;
			}
		}
		return {inputs: newInputs, outputs};
	});
}

const db = JSON.parse(fs.readFileSync('./db.json'));
const db_noise_1 = addNoise(db,1);
const db_noise_4 = addNoise(db,4);
const db_noise_8 = addNoise(db,8);
const db_noise_12 = addNoise(db,12);
const db_noise_16 = addNoise(db,16);
const db_noise_18 = addNoise(db,18);
const db_noise_20 = addNoise(db,20);
const db_noise_21 = addNoise(db,21);

const test_db = [
	{q: (0/42 * 100).toFixed(0), db: db},
	{q: (1/42 * 100).toFixed(0), db: db_noise_1},
	{q: (4/42 * 100).toFixed(0), db: db_noise_4},
	{q: (8/42 * 100).toFixed(0), db: db_noise_8},
	{q: (12/42 * 100).toFixed(0), db: db_noise_12},
	{q: (16/42 * 100).toFixed(0), db: db_noise_16},
	{q: (18/42 * 100).toFixed(0), db: db_noise_18},
	{q: (20/42 * 100).toFixed(0), db: db_noise_20},
	{q: (21/42 * 100).toFixed(0), db: db_noise_21}
];

const chart = [
	['Процент искажений','Процент верных ответов']
];

 
const net = new Hamming();
net.init({
	input_cnt: 42,
	output_cnt: 14
});
net.train(db);

db.forEach( (val) => {
	const answer = net.run(val.inputs);
	console.log(answer);
});

// test_db.forEach(({q,db}) => {
// 	db.forEach( (val,i) => {
// 		const answer = net.run(val.inputs);
// 		console.log(answer);
// 	});

// });

// fs.writeFileSync('./chart.json', JSON.stringify(chart));



