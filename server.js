const async = require('async'),
      jwt = require('jsonwebtoken'),
      request = require('request');

const USERS_ENDPOINT = "http://user.rhom.io/users";

const PARALLEL_REQUESTS = 20;
let requestIds = [];
for (let idx = 0; idx < PARALLEL_REQUESTS; idx++) {
    requestIds.push(idx);
}

let accessToken = jwt.sign({
    iss: '10152875766888406'
}, process.env.ACCESS_TOKEN_SIGNING_KEY, {
    expiresIn: process.env.ACCESS_TOKEN_LIFETIME
});

let totalRequests = 0;
let totalLatency = 0;

async.each(requestIds, (requestId, requestCallback) => {
    async.whilst(
        () => { return true; },
        callback => {
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

                    if (totalRequests % 100 === 0) {
                        let averageLatency = totalLatency / totalRequests;
                        console.log(averageLatency);
                    }
                }

                return callback();
            });
        },
        (err, n) => {
        }
    );
});
