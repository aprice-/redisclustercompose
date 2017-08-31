const express = require('express');
const request = require('request');
const process = require('process');
const ip = require('ip');

const app = express();

const clusterAnnounceIp = ip.address(process.env.INTERFACE);

function dockerInspect (id, callback) {
	if (id) {
		request({
			method: 'GET',
			url: 'http://unix:/var/run/docker.sock:/containers/' + id + '/json',
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
        callback(new Error("not found"));
	}
}

app.get('/:id', (req, res) => {  
	dockerInspect(req.params.id, (error, container) => {
		if (error) {
			res.status(400);
			res.send(error);
		} else {
			let port = container.NetworkSettings.Ports["6379/tcp"][0].HostPort;
			let cport = container.NetworkSettings.Ports["16379/tcp"][0].HostPort;
			res.send(clusterAnnounceIp + ":" + port + "@" + cport);
		}
	});
});

let server = app.listen(3000);

process.on('SIGINT', () => {
    server.close(() => {
        process.exit();
    });
});
