const { NeuralNetwork_CounterProp: NeuralNetwork } = require('../NeuralNetwork.js');
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

const db = [
    {inputs: [1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1], outputs: [1,0,0,0,0]},
    {inputs: [0,0,0,0,0,1,0,0,0,1,0,1,1,1,0,0,1,1,1,0,0,0,0,0,0], outputs: [0,1,0,0,0]},
    {inputs: [0,0,0,0,0,0,1,0,1,0,1,1,1,1,1,0,1,1,1,0,0,0,1,0,0], outputs: [0,0,1,0,0]},
    {inputs: [0,0,1,0,0,0,1,1,1,0,1,1,0,1,1,0,1,1,1,0,0,0,1,0,0], outputs: [0,0,0,1,0]},
    {inputs: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0], outputs: [0,0,0,0,1]}
];

//const db = JSON.parse(fs.readFileSync('../db.json'));

let done = false;
let def;

while (!done) {
    const net = new NeuralNetwork();
    net.init({
        hidden_neurons_cnt: 6
    });
    // console.log(net.run(db[0].input));
    // console.log(net.run(db[1].input));
    // console.log(net.run(db[2].input));
    // console.log(net.run(db[3].input));
    // console.log(net.run(db[4].input));
    
    const chart = net.train({
        data: db,
        iteration: 300,
        speedA: 0.14,
        speedB: 0.01
    });

    let test = [];
    test.push(net.run(db[0].inputs));
    test.push(net.run(db[1].inputs));
    test.push(net.run(db[2].inputs));
    test.push(net.run(db[3].inputs));
    test.push(net.run(db[4].inputs));

    //console.log(test);

    test = test.map( ans => {
        return ans.indexOf(Math.max(...ans));
    });

    console.log(test);
    
    done = (test.join('') === '01234');
    // fs.writeFileSync('chartBill.json', JSON.stringify(chart));
    // net.save('./Bill.json');
    def = net;


}

tests(def,'../../src/png/1');
tests(def,'../../src/png/3');
    // console.log(net.run(db[0].input));
    // console.log(net.run(db[1].input));
    // console.log(net.run(db[2].input));
    // console.log(net.run(db[3].input));
    // console.log(net.run(db[4].input));

