const fs = require('file-system');
const PNG = require('pngjs').PNG;
const NeuralNetwork = require('./NeuralNetwork.js');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

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

const net = new NeuralNetwork();
net.load('net.json');

const parser = bodyParser.urlencoded({extended: false});
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post('/', parser, (req, res) => {
	const vector = req.body.vector;
	let outp = net.run(vector);
	outp = outp.map((val) => {
		return (val > 0.8) ? 1 : 0;
	});
	console.log(outp);
	res.send(outp);
});
app.listen('3000');

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
		hidden_cnt: 4,
		hidden_neurons_cnt: 18
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

/*
const net = new NeuralNetwork();
net.load('net.json');

const dir = './src/png/2'
tests(net,dir);*/