#include <stdio.h>
#include "RxCpp/Rx/CPP/src/cpprx/rx.hpp"

namespace rx=rxcpp;

int main(int argc, char *argv[])
{
    from(rx::Return(1))
        .select([](int v){return v;})
        .subscribe([](int i){printf("%d\n", i);});

    return 0;
}