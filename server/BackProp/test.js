const { NeuralNetwork_BackProp: NeuralNetwork } = require('../NeuralNetwork.js');
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

const db = JSON.parse(fs.readFileSync('../db.json'));

// const db = [
//     {input: [1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1], output: [1,0,0,0,0]},
//     {input: [0,0,0,0,0,1,0,0,0,1,0,1,1,1,0,0,1,1,1,0,0,0,0,0,0], output: [0,1,0,0,0]},
//     {input: [0,0,0,0,0,0,1,0,1,0,1,1,1,1,1,0,1,1,1,0,0,0,1,0,0], output: [0,0,1,0,0]},
//     {input: [0,0,1,0,0,0,1,1,1,0,1,1,0,1,1,0,1,1,1,0,0,0,1,0,0], output: [0,0,0,1,0]},
//     {input: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], output: [0,0,0,0,1]}
// ];

let done = false;
let def;

while (!done) {
    const net = new NeuralNetwork();
    net.init({
		input_cnt: 25,
		output_cnt: 5,
		hidden_cnt: 1,
		hidden_neurons_cnt: 25
	});
    // console.log(net.run(db[0].input));
    // console.log(net.run(db[1].input));
    // console.log(net.run(db[2].input));
    // console.log(net.run(db[3].input));
    // console.log(net.run(db[4].input));
    
    const [count, chart] = net.train({
        data: db,
        speed: 0.14
    });

    let test = [];
    test.push(net.run(db[0].inputs));
    test.push(net.run(db[1].inputs));
    test.push(net.run(db[2].inputs));
    test.push(net.run(db[3].inputs));
    test.push(net.run(db[4].inputs));


    test = test.map( ans => {
        return ans.indexOf(Math.max(...ans));
    });

	console.log(test);
	console.log(count);
    
	done = (test.join('') === '01234');
	// fs.writeFileSync('./chartSam.json', JSON.stringify(chart));
	// net.save('./Sam.json');
	def = net;
}

tests(def,'../../src/png/1');
tests(def,'../../src/png/3');

