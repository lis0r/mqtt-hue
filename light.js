const { EventEmitter } = require('events');
const { State } = require('./state');

module.exports.Light = class Light extends EventEmitter {

	constructor(hub, light) {
		super();

		this.hub = hub;
		this.light = light;

		this.state = new State(light.state);

		this.state.on('change', (state) => this.emit('change', state));
	}

	get id() {
		return this.light.id;
	}

	update(light) {
		this.state.merge(light.state);

		return this;
	}

	set(data) {
		if ('toggle' in data) {
			delete data['toggle'];
			return this.hub.hue.lights.getLightState(this.id).then(old => {
				data['on'] = !old['on'];
				return this.hub.hue.lights.setLightState(this.id, data);
			});
		} else {
			return this.hub.hue.lights.setLightState(this.id, data);
		}
	}

};
