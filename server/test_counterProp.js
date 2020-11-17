const { NeuralNetwork_CounterProp: NeuralNetwork } = require('./NeuralNetwork.js');
const fs = require('file-system');

// const db = [
//     {input: [1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1], output: [1,0,0,0,0]},
//     {input: [0,0,0,0,0,1,0,0,0,1,0,1,1,1,0,0,1,1,1,0,0,0,0,0,0], output: [0,1,0,0,0]},
//     {input: [0,0,0,0,0,0,1,0,1,0,1,1,1,1,1,0,1,1,1,0,0,0,1,0,0], output: [0,0,1,0,0]},
//     {input: [0,0,1,0,0,0,1,1,1,0,1,1,0,1,1,0,1,1,1,0,0,0,1,0,0], output: [0,0,0,1,0]},
//     {input: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], output: [0,0,0,0,1]}
// ];

const db = JSON.parse(fs.readFileSync('db.json'));

let done = false;

while (!done) {
    const net = new NeuralNetwork();
    net.init();
    // console.log(net.run(db[0].input));
    // console.log(net.run(db[1].input));
    // console.log(net.run(db[2].input));
    // console.log(net.run(db[3].input));
    // console.log(net.run(db[4].input));
    
    const chart = net.train({
        data: db,
        speed: 0.14
    });

    let test = [];
    test.push(net.run(db[0].input));
    test.push(net.run(db[1].input));
    test.push(net.run(db[2].input));
    test.push(net.run(db[3].input));
    test.push(net.run(db[4].input));

    //console.log(test);

    test = test.map( ans => {
        return ans.indexOf(Math.max(...ans));
    });

    console.log(test);
    
    done = (test.join('') === '01234');
    fs.writeFileSync('chart.json', JSON.stringify(chart));
    //net.save('Bill.json');


}
    // console.log(net.run(db[0].input));
    // console.log(net.run(db[1].input));
    // console.log(net.run(db[2].input));
    // console.log(net.run(db[3].input));
    // console.log(net.run(db[4].input));

