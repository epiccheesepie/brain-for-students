const { BAM } = require('../NeuralNetwork.js');
const fs = require('file-system');
const PNG = require('pngjs').PNG;

const math = require('mathjs');

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
	return db.map(({A,B}) => {
		// const newA = A.flat();

		// for (let i=0;i<q;i++) {
		// 	if (newA[i] === 1) {
		// 		newA[i] = -1;
		// 	} else {
		// 		newA[i] = 1;
		// 	}
		// }
		// return {A: [newA], B};

		const newB = B.flat();

		for (let i=0;i<q;i++) {
			if (newB[i] === 1) {
				newB[i] = -1;
			} else {
				newB[i] = 1;
			}
		}
		return {A, B: [newB]};
	});
}

const db = JSON.parse(fs.readFileSync('./db.json'));

const db_noise_1 = addNoise(db,1);
const db_noise_2 = addNoise(db,2);
const db_noise_4 = addNoise(db,4);
const db_noise_6 = addNoise(db,6);
const db_noise_8 = addNoise(db,8);
const db_noise_9 = addNoise(db,9);
const db_noise_10 = addNoise(db,10);
const db_noise_12 = addNoise(db,12);

const test_db = [
{q: (0/20 * 100).toFixed(0), db: db},
	{q: (1/20 * 100).toFixed(0), db: db_noise_1},
	{q: (2/20 * 100).toFixed(0), db: db_noise_2},
	{q: (4/20 * 100).toFixed(0), db: db_noise_4},
	{q: (6/20 * 100).toFixed(0), db: db_noise_6},
	{q: (8/20 * 100).toFixed(0), db: db_noise_8},
	{q: (9/20 * 100).toFixed(0), db: db_noise_9},
	{q: (10/20 * 100).toFixed(0), db: db_noise_10},
	{q: (12/20 * 100).toFixed(0), db: db_noise_12}
];

const net = new BAM();
net.init({
	input_cnt: 25,
	output_cnt: 20
});

net.train(db);

const defAnswer = ([vector]) => {
	return vector.map(val => {
		if (val < 0.00001) return -1;
		else return 1;
	});
};

const arraysEqual = (a,b) => {
	for (let i=0; i<a.length; i++) {
		if (a[i] !== b[i]) return false;
	}

	return true;
};

const chart = [
	['Процент искажений','Процент верных ответов']
];

test_db.forEach(({q,db}) => {
	let rightCnt = 0;
	db.forEach( (val) => {
		const answer = defAnswer(net.run(val.B));
		const B = val.A.flat();
		if (arraysEqual(answer,B)) {
			rightCnt += 1;
		}
	});

	chart.push([+q,+(rightCnt/5 * 100).toFixed(0)]);
});

fs.writeFileSync('./chartB.json', JSON.stringify(chart));

// console.log(defAnswer(net.run(db[0].A)));
// console.log(defAnswer(net.run(db_1[0].A)));


 
// fs.writeFileSync('./chart.json', JSON.stringify(chart));
// fs.writeFileSync('./chartLength.json', JSON.stringify(chartLength));



