const { NeuralNetwork_BackProp: NeuralNetwork } = require('./NeuralNetwork.js');
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
		values.forEach(val => {
			const outp = {'1.png': false, '2.png': false, '3.png': false, '4.png': false, 'nothing': false};
			const { bin, name } = val;
			let res = net.run(bin);
			if (res[0] > 0.8) outp['1.png'] = true;
			else if (res[1] > 0.8) outp['2.png'] = true;
			else if (res[2] > 0.8) outp['3.png'] = true;
			else if (res[3] > 0.8) outp['4.png'] = true;
			else if (res[4] > 0.8) outp['nothing'] = true;
			console.log(name, outp);
		});
	});

}

const db = JSON.parse(fs.readFileSync('db.json'))

let done = false;

while (!done) {
    const net = new NeuralNetwork();
    net.init({
		input_cnt: 25,
		output_cnt: 5,
		hidden_cnt: 2,
		hidden_neurons_cnt: 8
	});
    // console.log(net.run(db[0].input));
    // console.log(net.run(db[1].input));
    // console.log(net.run(db[2].input));
    // console.log(net.run(db[3].input));
    // console.log(net.run(db[4].input));
    
    let count = net.train({
        data: db,
        speed: 0.14
    });

    let test = [];
    test.push(net.run(db[0].input));
    test.push(net.run(db[1].input));
    test.push(net.run(db[2].input));
    test.push(net.run(db[3].input));
    test.push(net.run(db[4].input));

    console.log(test);

    test = test.map( ans => {
        return ans.indexOf(Math.max(...ans));
    });

	console.log(test);
	console.log(count);
    
    done = (test.join('') === '01234');
    net.save('_Sam.json');

}

