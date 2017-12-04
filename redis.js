const redis      = require('redis'),
      log        = require('./log'),
      config     = require('./config.json');

var redisClient = redis.createClient(6379, config.redisServer);

//--------------------------------------------------------------------------------
async function redisKeys() {
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

//--------------------------------------------------------------------------------
async function redisValue(key) {
    return new Promise((resolve, reject) => {
        redisClient.lrange(key, 0, -1, (err, values) => {
            if (err) {
                log.error(err);
                return reject(err);
            }
            resolve( values.map((i) => {
                var items = i.split(",");
                return [new Date(parseInt(items[0] * 1000)), 
                        items[1]];
            }));
            //resolve(values);
        });
    });
}

//--------------------------------------------------------------------------------
async function redisLen(key) {
    return new Promise((resolve, reject) => {
        redisClient.llen(key, (err, length) => {
            if (err) {
                log.error(err);
                return reject(err);
            }
            resolve(length);
        });
    });
}


async function redisValueList(keys) {
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


//-----------------------------------------------------------------------------
module.exports = {
    keys: redisKeys,
    value: redisValue,
    length: redisLen,
    valueList: redisValueList
};
