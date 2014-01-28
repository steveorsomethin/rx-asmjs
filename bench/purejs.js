var pure = {};

pure.scan = function(n) {
    var lastValue = 0;

    Rx.Observable.
        range(1, n).
        scan(0, function(x, y) {
            return x + y;
        }).
        subscribe(function(i) {
            lastValue = i;
        });

    return lastValue;
};

pure.select = function(n) {
    var lastValue = 0;

    Rx.Observable.
        range(1, n).
        select(function(x) {
            return x;
        }).
        subscribe(function(i) {
            lastValue = i;
        });

    return lastValue;
};

pure.where = function(n) {
    var lastValue = 0;

    Rx.Observable.
        range(1, n).
        where(function(x) {
            return x >= 0;
        }).
        subscribe(function(i) {
            lastValue = i;
        });

    return lastValue;
};