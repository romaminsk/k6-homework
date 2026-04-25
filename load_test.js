import http from 'k6/http';

export const options = {
    scenarios: {

        // ya.ru
        ya_scenario: {
            executor: 'ramping-arrival-rate',
            startRate: 0,
            timeUnit: '1m',
            preAllocatedVUs: 10,
            maxVUs: 50,
            stages: [
                {duration: '5m', target: 60},
                {duration: '10m', target: 60},
                {duration: '5m', target: 72},
                {duration: '10m', target: 72},
            ],
            exec: 'test_ya',
        },

        // www.ru
        www_scenario: {
            executor: 'ramping-arrival-rate',
            startRate: 0,
            timeUnit: '1m',
            preAllocatedVUs: 10,
            maxVUs: 50,
            stages: [
                {duration: '5m', target: 120},
                {duration: '10m', target: 120},
                {duration: '5m', target: 144},
                {duration: '10m', target: 144},
            ],
            exec: 'test_www',
        },
    },
};

// ya.ru
export function test_ya() {
    http.get('https://ya.ru');
}

// www.ru
export function test_www() {
    http.get('http://www.ru');
}