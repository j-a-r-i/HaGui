var redis      = require('redis'),
    config     = require('./config.json');

var redisClient = redis.createClient(6379, config.redisServer),

//--------------------------------------------------------------------------------
function redisKeys() {
    return new Promise((resolve, reject) => {
        redisClient.multi() 
        .keys('*', (err, keys) => {
            if (err) {
                log.error(err);
                return reject(err);
            }
            keys.sort();
        })
        .exec((err,replies) => {
            resolve(replies[0]);
        });
    });
}

function redisValue(key) {
    return new Promise((resolve, reject) => {
        redisClient.get(key, (err, value) => {
            if (err) {
                log.error(err);
                return reject(err);
            }
            resolve(JSON.parse(value));
        });
    });
}


function redisValueList(keys) {
    return new Promise((resolve,reject) => {
        var items = keys.map(redisValue);

        Promise.all(items)
        .then(values => {
            resolve(values);
        })
        .catch(error => {
            reject(error);
        });
    });
}


redisClient.on('connect', () => {
    log.normal('REDIS: connected');
})
.on('error', (err) => {
    log.error('REDIS: ' + err);
    redisClient.quit();
})


/*gCommands[cmd.MEASURES] = (ws,args) => {
    redisKeys()
    .then(keys => {
        return redisValueList(keys);
    })
    .then(values => {
        var keyNames = Object.keys(values[0]);
        var ret = { cmd: cmd.MEASURES, 
                    data: [keyNames]};

        values.forEach((item) => {
            var values = keyNames.map(v => {return item[v];});
            ret.data.push(values);
        });

        WsResponse(ws, ret);
    })
    .catch(err => {
        WsResponse(ws, {cmd: cmd.MEASURES,
                        err: err });
    });
    return null;
};
gCommands[cmd.LATEST] = (ws,args) => {
    redisKeys()
    .then(keys => {
        var lastKey = keys[keys.length - 1];
        return redisValue(lastKey);
    })
    .then(value => {
        var keyNames = Object.keys(value);
        var values = keyNames.map(v => {
            return [v, value[v]];
        });

        WsResponse(ws, {cmd: cmd.LATEST,
                        data: values});
    })
    .catch(err => {
        WsResponse(ws, {cmd: cmd.LATEST,
                        err: err });
    });
    return null;
};*/
