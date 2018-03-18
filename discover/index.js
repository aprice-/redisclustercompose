const express = require('express');
const request = require('request');
const process = require('process');
const ip = require('ip');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.text());

const clusterAnnounceIp = ip.address(process.env.INTERFACE);

function dockerInspect (id, callback) {
	if (id) {
		request({
			method: 'GET',
			url: `http://unix:/var/run/docker.sock:/containers/${id}/json`,
			headers: {host: 'localhost'},
			json: true
		}, (error, res, body) => {
			if (error) {
                callback(error, null);
                return;
            }
			if (res.statusCode >= 200 && res.statusCode <= 299) {
                callback(null, body);
			} else {
                callback(new Error(body.message));
			}
		})
	} else {
        callback(new Error('not found'));
	}
}

app.get('/network-info/:id', (req, res) => {
	dockerInspect(req.params.id, (error, container) => {
		if (error) {
			res.status(400);
			res.send(error);
		} else {
			let portInfo = container.NetworkSettings.Ports['6379/tcp'];
			let cportInfo = container.NetworkSettings.Ports['16379/tcp'];

			if (portInfo && cportInfo) {
				let port = portInfo[0].HostPort;
				let cport = cportInfo[0].HostPort;

                res.send(`${clusterAnnounceIp}:${port}@${cport}`);
			} else {
				res.send('');
			}
		}
	});
});

let history = {};

app.post('/history/:id/:address', (req, res) => {
    let id = req.params.id;
    let oldAddress = req.params.address;
    let newAddress = req.body;
    history[id+oldAddress] = newAddress;
    res.send('OK');
});

app.get('/history/:id/:address', (req, res) => {
    let id = req.params.id;
    let address = req.params.address;
    let loop = () => {
        if (history[id+address]) {
            res.send(history[id+address]);
        } else {
            setTimeout(loop, 500);
        }
    };
    loop();
});

let server = app.listen(3000);

process.on('SIGINT', () => {
    server.close(() => {
        process.exit();
    });
});
