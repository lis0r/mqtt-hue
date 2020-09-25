const { EventEmitter } = require('events');

const { api } = require('node-hue-api').v3;

const { Lights } = require('./lights');

module.exports.Hub = class Hub extends EventEmitter {

	constructor({ host, key, interval }) {
		super();

		this.host = host;
		this.key = key;
		this.interval = interval;

		this.online = false;
	}

	status(online) {
		if (online === this.online) return this

		this.online = online;
		this.emit('status', online);

		return this;
	}

	connect() {
		return api.createLocal(this.host).connect(this.key)
			.then((hue) => {
				this.hue = hue;

				return hue.configuration.getAll();
			})
			.then(({ config }) => {
				this.info = config;
			})
			.then(() => {
				this.lights = new Lights(this);

				this.lights.on('light', (light, state) => {
					this.emit('light', light, state);
				});

				this.lights.on('change', (light, state) => {
					this.emit('light/change', light, state);
				});

				this.lights.on('error', (e) => {
					this.emit('error', e);
				});

				return this.lights.fetch();
			})
			.then(() => this.status(true))
			// .then(() => {
			// 	const light = this.lights.id(2);
			//
			// 	light.set({ on: false });
			// })
			.catch((e) => {
				this.status(false);
				this.emit('error', e);
			});
	}

};
