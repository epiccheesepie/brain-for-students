const { NeuralNetwork_BackProp, NeuralNetwork_CounterProp } = require('./NeuralNetwork.js');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('file-system');

const db = JSON.parse(fs.readFileSync('db.json'));

// let net = new NeuralNetwork_BackProp();
// net.load('Sam.json');

const net = new NeuralNetwork_CounterProp();
net.load('Bill.json');

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

app.post('/net', parser, (req, res) => {
	net.clear();

	const {hidden_cnt, hidden_neurons_cnt, speed, err} = req.body;

	net.init({
		input_cnt: 25,
		output_cnt: 5,
		hidden_cnt: hidden_cnt,
		hidden_neurons_cnt: hidden_neurons_cnt
	});

	const count = net.train({
		data: db,
		err: err,
		speed: speed
	});

	console.log(count);
	res.send([count]);
});

// app.post('/load', parser, (req, res) => {
// 	TO DO: написать загрузчик нейронных сетей
// });

app.listen('3000');