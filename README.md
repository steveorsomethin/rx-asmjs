rx-asmjs
========

Experimental support for rx-cpp compilation to asm.js

Clone the repo (including submodules) and run quickstart to get going.

Compile hacking.cc with the following until we have a makefile

```C++
    clang++ hacking.cc -stdlib=libc++ -std=c++11
