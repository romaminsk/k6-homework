import http from 'k6/http';
import {check, sleep} from 'k6';

const BASE_URL = 'http://webtours.load-test.ru:1080';
const CITIES = ['Denver', 'Frankfurt', 'London', 'Los Angeles', 'Paris', 'Portland', 'San Francisco', 'Seattle', 'Sydney', 'Zurich'];

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export const options = {
    vus: 1,
    iterations: 1,
};

export default function () {

    // Открытие главной страницы
    let res = http.get(`${BASE_URL}/webtours/`);
    check(res, {'Главная страница открыта': (r) => r.status === 200});
    sleep(1);

    // Запрос welcome.pl
    res = http.get(`${BASE_URL}/cgi-bin/welcome.pl?signOff=true`);
    sleep(1);

    // Запрос nav.pl
    res = http.get(`${BASE_URL}/cgi-bin/nav.pl?in=home`);

    // Парсим userSession из HTML формы логина
    let sessionMatch = res.body.match(/name="userSession" value="([^"]+)"/);
    let userSession = sessionMatch ? sessionMatch[1] : '';
    console.log(`---> userSession: ${userSession}`);

    // Логин
    let loginData = {
        userSession: userSession,
        username: 'testuser1313',
        password: '123',
        'login.x': '76',
        'login.y': '3',
        JSFormSubmit: 'off'
    };

    // Добавляем Referer
    let loginHeaders = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': `${BASE_URL}/cgi-bin/nav.pl?in=home`,
    };

    res = http.post(`${BASE_URL}/cgi-bin/login.pl`, loginData, {headers: loginHeaders});
    console.log(`---> Ответ логина (первые 500 символов): ${res.body.substring(0, 500)}`);
    check(res, {'Логин успешен': (r) => r.status === 200 && !r.body.includes('Invalid')});
    sleep(1);

    // Переход на страницу Flights
    res = http.get(`${BASE_URL}/cgi-bin/nav.pl?in=flights`);
    check(res, {'Страница Flights открыта': (r) => r.status === 200});
    sleep(1);

    // Поиск рейсов - выбираем случайные города
    let departCity = randomItem(CITIES);
    let arriveCity;
    do {
        arriveCity = randomItem(CITIES);
    } while (arriveCity === departCity);

    console.log(`---> Ищем рейс: ${departCity} -> ${arriveCity}`);

    let searchData = {
        depart: departCity,
        arrive: arriveCity,
        departDate: '12/01/2025',
        returnDate: '12/15/2025',
        numPassengers: '1',
        seatPref: 'None',
        seatType: 'Coach',
        'findFlights.x': '50',
        'findFlights.y': '10',
    };

    res = http.post(`${BASE_URL}/cgi-bin/reservations.pl`, searchData, {
        headers: {'Referer': `${BASE_URL}/cgi-bin/nav.pl?in=flights`}
    });
    check(res, {'Список рейсов получен': (r) => r.status === 200});
    console.log(`---> Ответ поиска рейсов (первые 500 символов): ${res.body.substring(0, 500)}`);
    sleep(1);

    // Выбор случайного рейса из предложенных
    // Парсим все radio-кнопки с рейсами из HTML ответа
    let flightRegex = /name="outboundFlight" value="([^"]+)"/g;
    let flights = [];
    let match;
    while ((match = flightRegex.exec(res.body)) !== null) {
        flights.push(match[1]);
    }
    console.log(`---> Найдено рейсов: ${flights.length}, список: ${flights}`);

    // Если рейсы не найдены - направление не существует, берём запасное
    if (flights.length === 0) {
        console.log('---> Рейсы не найдены, пробуем Denver -> Seattle');
        searchData.depart = 'Denver';
        searchData.arrive = 'Seattle';
        res = http.post(`${BASE_URL}/cgi-bin/reservations.pl`, searchData);
        while ((match = flightRegex.exec(res.body)) !== null) {
            flights.push(match[1]);
        }
    }

    let selectedFlight = randomItem(flights);
    console.log(`---> Выбран рейс: ${selectedFlight}`);

    let flightData = {
        outboundFlight: selectedFlight,
        'reserveFlights.x': '50',
        'reserveFlights.y': '10',
    };

    res = http.post(`${BASE_URL}/cgi-bin/reservations.pl`, flightData);
    check(res, {'Рейс выбран': (r) => r.status === 200});
    sleep(1);

    // Покупка билета
    let purchaseData = {
        firstName: 'Test',
        lastName: 'User',
        address1: '123 Street',
        address2: '',
        city: 'Denver',
        state: 'CO',
        zipCode: '12345',
        creditCard: '1234567890123456',
        expDate: '12/2026',
        'buyFlights.x': '50',
        'buyFlights.y': '10',
    };

    res = http.post(`${BASE_URL}/cgi-bin/reservations.pl`, purchaseData);
    check(res, {'Билет куплен': (r) => r.status === 200});
    sleep(1);

    // Возврат на главную страницу
    res = http.get(`${BASE_URL}/webtours/`);
    check(res, {'Возврат на главную': (r) => r.status === 200});
}