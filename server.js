const async = require('async'),
      jwt = require('jsonwebtoken'),
      request = require('request');

const USERS_ENDPOINT = "http://user.rhom.io/users";

let accessToken = jwt.sign({
    iss: '10152875766888406'
}, process.env.ACCESS_TOKEN_SIGNING_KEY, {
    expiresIn: process.env.ACCESS_TOKEN_LIFETIME
});

const SETTLE_ITERATIONS = 30;
const MAX_PARALLEL_REQUESTS = 50;

function measureLatency(parallelism, callback) {
    let totalRequests = 0;
    let totalLatency = 0;
    let parallelismStart = Date.now();

    let threads = [];
    for (let idx = 0; idx < parallelism; idx++) {
        threads.push(idx);
    }

    async.each(threads, (thread, threadCallback) => {
        let iterationCount = 0;
        async.whilst(
            () => { return iterationCount < SETTLE_ITERATIONS; },
            callback => {
                iterationCount += 1;
                let startTimestamp = Date.now();
                request.get(USERS_ENDPOINT, {
                    headers: {
                        Authorization: "Bearer " + accessToken,
                    },
                    json: true,
                }, (err, resp) => {
                    if (!err) {
                        totalRequests += 1;
                        totalLatency += (Date.now() - startTimestamp);
                    }

                    return callback();
                });
            },
            threadCallback
        );
    }, err => {
        let averageLatency = totalLatency / totalRequests;
        let wallclockTime = (Date.now() - parallelismStart) / 1000.0;
        let requestsPerSecond = totalRequests / wallclockTime;

        console.log(`${parallelism}: ${averageLatency} @ ${requestsPerSecond}`);
        return callback();
    });
}

let parallelRequests = 0;

async.whilst(
    () => { return parallelRequests < MAX_PARALLEL_REQUESTS; },
    callback => {
        parallelRequests += 1;
        measureLatency(parallelRequests, callback);
    },
    process.exit
);


