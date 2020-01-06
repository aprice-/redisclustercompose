const express = require('express');
const http = require('http');
const process = require('process');
const ip = require('ip');
const fs = require('fs');
const app = express();

const clusterAnnounceIp = ip.address(process.env.INTERFACE);

function dockerInspect (id, callback) {
    if (id) {
        console.log(`request url is http://unix:/var/run/docker.sock:/containers/${id}/json`);
        const options = {
            socketPath: '/var/run/docker.sock',
            path: `/containers/${id}/json`,
        };
        const clientRequest = http.request(options, res => {
            console.log(`STATUS: ${res.statusCode}`);
            if (res.statusCode >= 200 && res.statusCode <= 299) {
                var json = '';
                res.on('data', data => {
                    json += data;
                });
                res.on('end', () => callback(null, JSON.parse(json)))
            } else {
                res.on('error', error => callback(error, null));
            }
        });
        clientRequest.end();
    }
}

app.get('/:id', (req, res) => {
    console.log('req id:' + req.params.id);
    dockerInspect(req.params.id, (error, container) => {
        if (error) {
            console.log('docker inspect error:' + error);
            res.status(400);
            res.send(error);
        } else {
            let portInfo = container.NetworkSettings.Ports['6379/tcp'];
            let cportInfo = container.NetworkSettings.Ports['16379/tcp'];

            if (portInfo && cportInfo) {
                let port = portInfo[0].HostPort;
                let cport = cportInfo[0].HostPort;
                console.log('req id ' + req.params.id + ` res: ${clusterAnnounceIp}:${port}@${cport}` );
                res.send(`${clusterAnnounceIp}:${port}@${cport}`);
            } else {
                res.send('');
            }
        }
    });
});

function stopServer(server) {
    server.close(() => {
        console.log("stop discover");
        process.exit();
    });
}

function main() {
    const sock = '/tmp/discover.sock';
    if (fs.existsSync(sock)) {
        fs.unlinkSync(sock);
    }
    let server = app.listen(sock, function(){
        fs.chmodSync(sock, 0777);
    });
    console.log('discover start listen ' + sock);

    process.on('SIGTERM', () => {
        console.log('SIGTERM');
        stopServer(server);
    });

    process.on('SIGINT', () => {
        console.log('SIGINT');
        stopServer(server);
    });
}

main();
