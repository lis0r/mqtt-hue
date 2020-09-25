const { connect } = require('mqtt');

const { Hub } = require('./hub');
const { config } = require('./config');
const { version } = require('./package');

const subscription = {};

const topics = {
	state: () => `${config.mqtt.path}/state`,
	info: () => `${config.mqtt.path}/info`,
	light: (light) => `${config.mqtt.path}/light/${light.id}`,
	lightInfo: (light) => `${config.mqtt.path}/light/${light.id}/info`,
	lightSet: (light) => `${config.mqtt.path}/light/${light.id}/set`,
};

const format = (type, args) => [
	`[${type.toUpperCase()}]`,
	...args,
].join(' ');

const log = (type, ...args) => console.log(format(type, args));

const error = (type, ...args) => console.error(format(type, args));

const mqtt = connect(config.mqtt.host, {
	username: config.mqtt.username,
	password: config.mqtt.password,
	clientId: config.mqtt.id,
	will: {
		topic: topics.state(),
		payload: JSON.stringify({ online: false, version }),
		retain: true,
	},
});

const hue = new Hub(config.hue);

mqtt.on('connect', () => {
	log('mqtt', `connected to ${config.mqtt.host}`);
});

mqtt.on('message', (topic, data) => {
	if (!subscription[topic]) return;

	const light = subscription[topic];

	try {
		const parsed = JSON.parse(data);
		light.set(parsed).catch((e) => {
			error('hue', 'hue error');
			error('hue', `  > ${e.toString()}`);
		});
	} catch(e) {
		console.log(e)
		error('mqtt', 'not able to parse incoming message');
	}
});

hue.connect().then((hub) => {
	mqtt.publish(topics.info(), JSON.stringify({
		name: hub.info.name,
		model: hub.info.modelid,
		firmware: hub.info.swversion,
		api: hub.info.apiversion,
		channel: hub.info.zigbeechannel,
	}), { retain: true });
});

hue.on('status', (online) => {
	mqtt.publish(topics.state(), JSON.stringify({
		online,
		version,
	}), { retain: true });
});

hue.on('light', (light, state) => {
	const topic = topics.lightSet(light);

	subscription[topic] = light;

	mqtt.subscribe(topic);

	mqtt.publish(topics.lightInfo(light), JSON.stringify({
		name: light.light.name,
		type: light.light.type,
		manufacturername: light.light.manufacturername,
		model: light.light.modelid,
		firmware: light.light.swversion,
	}), { retain: true });

	mqtt.publish(topics.light(light), JSON.stringify(state), { retain: true });
});

hue.on('light/change', (light, state) => {
	mqtt.publish(topics.light(light), JSON.stringify(state), { retain: true });
});

hue.on('error', (e) => {
	error('hue', 'hue error');
	error('hue', `  > ${e.toString()}`);
});

mqtt.on('error', (e) => {
	error('mqtt', 'error');
	error('mqtt', `  > ${e.toString()}`);
});