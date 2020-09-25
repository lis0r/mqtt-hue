const { EventEmitter } = require('events');

const { Light } = require('./light');

module.exports.Lights = class Lights extends EventEmitter {

	constructor(hub) {
		super();

		this.hub = hub;
		this.node = {};

		this.timer = setInterval(() => this.fetch(), this.hub.interval);
	}

	fetch() {
		return this.hub.hue.lights.getAll()
			.then((data) => {
				data.forEach((light) => this.update(light));
			})
			.catch((e) => {
				this.emit('error', e);
			});
	}

	id(id) {
		return this.node[id];
	}

	update(light) {
		if (this.node[light.id]) {
			return this.node[light.id].update(light);
		}

		const node = new Light(this.hub, light);

		node.on('change', (state) => {
			this.emit('change', node, state);
		});

		this.emit('light', node, node.state.get());

		this.node[light.id] = node;

		return node;
	}

};
