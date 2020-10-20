class Interface {
	constructor(elem) {
		this.elem = elem;
		this.pixel = 50;
		this.width = 250;
		this.height = 250;
	}

	init(elem=this.elem) {
		for(let x=0; x<this.width; x+=this.pixel) {
			for(let y=0; y<this.height; y+=this.pixel) {
				let div = document.createElement('div');
				div.dataset.id = 0;
				div.addEventListener('click', (e) => {
					if (div.classList.contains('black')) {
						div.classList.remove('black');
						div.dataset.id = 0;
					}
					else {
						div.classList.add('black');
						div.dataset.id = 1;
					}
				});
				elem.appendChild(div);
			}
		}
	}

	calculate(elem=this.elem) {
		return Array.prototype.map.call(elem.children, (child) => {
			return +child.dataset.id;
		});
	}

	clear(elem=this.elem) {
		Array.prototype.forEach.call(elem.children, (child) => {
			child.classList.remove('black');
			child.dataset.id = 0;
		});
	}
}

function buildPng() {
	const arr = [
		{id: '1png', png: [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ]},
		{id: '2png', png: [ 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0 ]},
		{id: '3png', png: [ 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0 ]},
		{id: '4png', png: [ 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0 ]},
		{id: 'nothing', png: [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]},
	];

	arr.forEach((obj) => {
		obj.png.forEach(id => {
			let div = document.createElement('div');
			id && div.classList.add('black');
			document.getElementById(obj.id).appendChild(div);
		})
	});
}

const elem = new Interface(document.getElementById('_screen'));
elem.init();
buildPng();

document.querySelector('#subm').addEventListener('click', (e) => {
	const vector = elem.calculate();
	console.log(vector);
	(async () => {
		const response = await fetch('http://localhost:3000', {
			method: 'POST',
			body: JSON.stringify({'vector': vector}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		const answer = await response.json();
		console.log(answer);

		let index = answer.indexOf(1);
		if (index === -1) index = 4;
		const pngs = document.querySelector('.left__pngs');
		pngs.children[index].classList.add('screen--green');
		setTimeout( () => {
			pngs.children[index].classList.remove('screen--green');
		}, 2000);
	})();
});

document.querySelector('#clear').addEventListener('click', (e) => {
	elem.clear();
});

document.querySelector('#train').addEventListener('click', (e) => {
	const body = [];
	document.querySelectorAll('#_form input').forEach( (inp) => {
		body.push(+inp.value);
	});

	console.log(body);
	(async () => {
		const response = await fetch('http://localhost:3000/net', {
			method: 'POST',
			body: JSON.stringify({'hidden_cnt': body[0], 'hidden_neurons_cnt': body[1], 'speed': body[2], 'err': body[3]}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		const answer = await response.json();
		
		document.querySelector('#count').value = answer[0];
	})();
});

document.querySelector('#sam').addEventListener('click', (e) => {
	(async () => {
		const response = await fetch('http://localhost:3000/net', {
			method: 'POST',
			body: JSON.stringify({type: 'sam'}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		const answer = await response.json();
		
		document.querySelector('#count').value = answer[0];
	})();
});