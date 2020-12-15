const { NeuralNetwork_BackProp, NeuralNetwork_CounterProp, BAM } = require('./NeuralNetwork.js');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('file-system');

// let net = new NeuralNetwork_BackProp();
// net.load('./BackProp/Sam.json');

// const net = new NeuralNetwork_CounterProp();
// net.load('./CounterProp/Bill.json');

const db = JSON.parse(fs.readFileSync('./BAM/db.json'));
const net = new BAM();
net.init({
	input_cnt: 25,
	output_cnt: 20
});
net.train(db);

const parser = bodyParser.urlencoded({extended: false});
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/', parser, (req, res) => {

	const normalize = (vector) => {
		vector = vector.flat();
		return vector.map(val => {
			if (val < 0.0001) return 0;
			else return 1;
		});
	}

	const vector = req.body.vector;
	const output = normalize(net.run([vector]));

	console.log(output);
	res.send(output);
});

// app.post('/', parser, (req, res) => {
// 	const vector = req.body.vector;
// 	let outp = net.run(vector);
// 	outp = outp.map((val) => {
// 		return (val > 0.8) ? 1 : 0;
// 	});

// 	console.log(outp);
// 	res.send(outp);

// });

// app.post('/net', parser, (req, res) => {
// 	net.clear();

// 	const {hidden_cnt, hidden_neurons_cnt, speed, err} = req.body;

// 	net.init({
// 		input_cnt: 25,
// 		output_cnt: 5,
// 		hidden_cnt: hidden_cnt,
// 		hidden_neurons_cnt: hidden_neurons_cnt
// 	});

// 	const count = net.train({
// 		data: db,
// 		err: err,
// 		speed: speed
// 	});

// 	console.log(count);
// 	res.send([count]);
// });

// // app.post('/load', parser, (req, res) => {
// // 	TO DO: написать загрузчик нейронных сетей
// // });

app.listen('3000');