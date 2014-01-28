#include <stdio.h>
#include <string>
#include <emscripten.h>
#include "RxCpp/Rx/CPP/src/cpprx/rx.hpp"

namespace rx=rxcpp;
using namespace rx;
using namespace std;

extern "C" {

int Scan(int n)
{
    int lastValue = 0;

    auto scheduler = make_shared<ImmediateScheduler>();
    auto obs1 = from(Range(1, n, 1, scheduler)).
        scan(0, [](int x, int y) {
            return x + y;
        }).
        subscribe([&](int i) {
            lastValue = i;
        });

    return lastValue;
}

int Select(int n)
{
    int lastValue = 0;

    auto scheduler = make_shared<ImmediateScheduler>();
    auto obs1 = from(Range(1, n, 1, scheduler)).
        select([](int x) {
            return x * 2;
        }).
        subscribe([&](int i) {
            lastValue = i;
        });

    return lastValue;
}

int Where(int n)
{
    int lastValue = 0;

    auto scheduler = make_shared<ImmediateScheduler>();
    auto obs1 = from(Range(1, n, 1, scheduler)).
        where([](int x) {
            return x >= 0;
        }).
        subscribe([&](int i) {
            lastValue = i;
        });

    return lastValue;
}

}