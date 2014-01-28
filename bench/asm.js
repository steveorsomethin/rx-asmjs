// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };
  Module['load'] = function load(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function print(x) {
      console.log(x);
    };
    Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 4,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + Pointer_stringify(code) + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+3)&-4); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+3)&-4); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+3)&-4); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 4,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (HEAPF64[(tempDoublePtr)>>3]=value,HEAP32[((ptr)>>2)]=((HEAP32[((tempDoublePtr)>>2)])|0),HEAP32[(((ptr)+(4))>>2)]=((HEAP32[(((tempDoublePtr)+(4))>>2)])|0)); break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return (HEAP32[((tempDoublePtr)>>2)]=HEAP32[((ptr)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((ptr)+(4))>>2)],(+(HEAPF64[(tempDoublePtr)>>3])));
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;
function demangle(func) {
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}
function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}
function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 4;
STATICTOP = STATIC_BASE + 30864;
var _stdout;
var _stdout=_stdout=allocate([0,0,0,0], "i8", ALLOC_STATIC);
var _stdin;
var _stdin=_stdin=allocate([0,0,0,0], "i8", ALLOC_STATIC);
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0], "i8", ALLOC_STATIC);
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } },{ func: function() { __GLOBAL__I_a() } });
var ___fsmu8;
var ___dso_handle;
var ___dso_handle=___dso_handle=allocate([0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv120__si_class_type_infoE;
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,116,104,0,0,236,2,0,0,182,1,0,0,6,2,0,0,186,1,0,0,8,0,0,0,10,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv117__class_type_infoE;
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,128,104,0,0,236,2,0,0,218,2,0,0,6,2,0,0,186,1,0,0,8,0,0,0,32,0,0,0,4,0,0,0,6,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([101,120,99,101,112,116,105,111,110,95,112,116,114,32,110,111,116,32,121,101,116,32,105,109,112,108,101,109,101,110,116,101,100,0,0,0,0,0,0,0,0,0,36,64,0,0,0,0,0,0,89,64,0,0,0,0,0,136,195,64,0,0,0,0,132,215,151,65,0,128,224,55,121,195,65,67,23,110,5,181,181,184,147,70,245,249,63,233,3,79,56,77,50,29,48,249,72,119,130,90,60,191,115,127,221,79,21,117,74,117,108,0,74,117,110,0,65,112,114,0,77,97,114,0,70,101,98,0,74,97,110,0,68,101,99,101,109,98,101,114,0,0,0,0,78,111,118,101,109,98,101,114,0,0,0,0,79,99,116,111,98,101,114,0,83,101,112,116,101,109,98,101,114,0,0,0,117,110,115,117,112,112,111,114,116,101,100,32,108,111,99,97,108,101,32,102,111,114,32,115,116,97,110,100,97,114,100,32,105,110,112,117,116,0,0,0,65,117,103,117,115,116,0,0,74,117,108,121,0,0,0,0,74,117,110,101,0,0,0,0,77,97,121,0,65,112,114,105,108,0,0,0,77,97,114,99,104,0,0,0,70,101,98,114,117,97,114,121,0,0,0,0,74,97,110,117,97,114,121,0,98,97,115,105,99,95,115,116,114,105,110,103,0,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,0,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,0,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,111,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,109,117,116,101,120,32,108,111,99,107,32,102,97,105,108,101,100,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,116,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,117,0,0,0,115,0,0,0,116,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,121,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,101,0,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,105,0,0,0,108,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,99,0,0,0,104,0,0,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,114,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,80,77,0,0,65,77,0,0,80,0,0,0,77,0,0,0,0,0,0,0,65,0,0,0,77,0,0,0,0,0,0,0,108,111,99,97,108,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,0,103,101,110,101,114,105,99,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,37,0,0,0,97,0,0,0,32,0,0,0,37,0,0,0,98,0,0,0,32,0,0,0,37,0,0,0,100,0,0,0,32,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,89,0,0,0,0,0,0,0,37,97,32,37,98,32,37,100,32,37,72,58,37,77,58,37,83,32,37,89,0,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,0,0,0,0,102,0,0,0,97,0,0,0,108,0,0,0,115,0,0,0,101,0,0,0,0,0,0,0,37,112,0,0,102,97,108,115,101,0,0,0,47,85,115,101,114,115,47,115,116,101,118,101,47,68,111,99,117,109,101,110,116,115,47,101,109,115,99,114,105,112,116,101,110,47,101,109,115,100,107,95,112,111,114,116,97,98,108,101,47,101,109,115,99,114,105,112,116,101,110,47,49,46,56,46,50,47,115,121,115,116,101,109,47,108,105,98,47,108,105,98,99,120,120,47,109,117,116,101,120,46,99,112,112,0,0,0,116,0,0,0,114,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,99,97,115,116,0,0,0,105,111,115,95,98,97,115,101,58,58,99,108,101,97,114,0,67,0,0,0,101,99,32,61,61,32,48,0,118,101,99,116,111,114,0,0,37,46,48,76,102,0,0,0,109,111,110,101,121,95,103,101,116,32,101,114,114,111,114,0,115,121,115,116,101,109,0,0,83,97,116,0,70,114,105,0,105,111,115,116,114,101,97,109,0,0,0,0,37,76,102,0,84,104,117,0,87,101,100,0,84,117,101,0,77,111,110,0,83,117,110,0,83,97,116,117,114,100,97,121,0,0,0,0,70,114,105,100,97,121,0,0,84,104,117,114,115,100,97,121,0,0,0,0,87,101,100,110,101,115,100,97,121,0,0,0,84,117,101,115,100,97,121,0,77,111,110,100,97,121,0,0,83,117,110,100,97,121,0,0,58,32,0,0,83,0,0,0,97,0,0,0,116,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,0,0,0,0,117,110,115,112,101,99,105,102,105,101,100,32,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,32,101,114,114,111,114,0,83,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,83,0,0,0,97,0,0,0,116,0,0,0,117,0,0,0,114,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,114,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,110,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,99,108,111,99,107,95,103,101,116,116,105,109,101,40,67,76,79,67,75,95,77,79,78,79,84,79,78,73,67,41,32,102,97,105,108,101,100,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,68,101,99,0,78,111,118,0,79,99,116,0,83,101,112,0,65,117,103,0,98,97,100,95,119,101,97,107,95,112,116,114,0,0,0,0,115,116,100,58,58,101,120,99,101,112,116,105,111,110,0,0,117,110,108,111,99,107,0,0,0,0,0,0,248,10,0,0,36,1,0,0,232,0,0,0,60,0,0,0,34,0,0,0,190,1,0,0,30,2,0,0,72,0,0,0,90,0,0,0,122,0,0,0,0,0,0,0,4,11,0,0,70,1,0,0,18,1,0,0,136,0,0,0,102,0,0,0,88,0,0,0,68,1,0,0,42,0,0,0,2,0,0,0,232,0,0,0,0,0,0,0,16,11,0,0,164,1,0,0,2,0,0,0,236,0,0,0,70,0,0,0,224,0,0,0,208,1,0,0,2,0,0,0,36,0,0,0,76,0,0,0,0,0,0,0,28,11,0,0,140,1,0,0,56,2,0,0,166,0,0,0,8,0,0,0,98,0,0,0,128,0,0,0,60,0,0,0,10,0,0,0,74,0,0,0,0,0,0,0,40,11,0,0,148,0,0,0,54,2,0,0,172,0,0,0,90,0,0,0,90,0,0,0,244,1,0,0,130,0,0,0,50,0,0,0,58,0,0,0,0,0,0,0,52,11,0,0,10,3,0,0,62,2,0,0,146,0,0,0,74,0,0,0,124,1,0,0,150,1,0,0,36,0,0,0,72,0,0,0,162,0,0,0,90,54,83,101,108,101,99,116,69,51,36,95,51,95,48,0,90,54,83,101,108,101,99,116,69,51,36,95,50,0,0,0,90,53,87,104,101,114,101,69,51,36,95,53,95,48,0,0,90,53,87,104,101,114,101,69,51,36,95,52,0,0,0,0,90,52,83,99,97,110,69,51,36,95,49,95,48,0,0,0,90,52,83,99,97,110,69,51,36,95,48,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,54,83,101,108,101,99,116,69,51,36,95,51,95,48,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,50,95,69,69,70,118,82,75,105,69,69,69,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,54,83,101,108,101,99,116,69,51,36,95,50,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,50,95,69,69,70,105,105,69,69,69,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,53,87,104,101,114,101,69,51,36,95,53,95,48,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,50,95,69,69,70,118,82,75,105,69,69,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,53,87,104,101,114,101,69,51,36,95,52,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,50,95,69,69,70,98,105,69,69,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,52,83,99,97,110,69,51,36,95,49,95,48,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,50,95,69,69,70,118,82,75,105,69,69,69,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,52,83,99,97,110,69,51,36,95,48,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,50,95,69,69,70,105,105,105,69,69,69,0,0,0,0,0,0,0,0,204,8,0,0,0,0,0,0,220,8,0,0,0,0,0,0,236,8,0,0,0,0,0,0,252,8,0,0,0,0,0,0,12,9,0,0,0,0,0,0,28,9,0,0,0,0,0,0,40,9,0,0,120,102,0,0,0,0,0,0,112,9,0,0,144,102,0,0,0,0,0,0,180,9,0,0,120,102,0,0,0,0,0,0,252,9,0,0,152,102,0,0,0,0,0,0,64,10,0,0,120,102,0,0,0,0,0,0,132,10,0,0,136,102,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,48,49,50,51,52,53,54,55,56,57,0,0,37,0,0,0,89,0,0,0,45,0,0,0,37,0,0,0,109,0,0,0,45,0,0,0,37,0,0,0,100,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,72,58,37,77,58,37,83,37,72,58,37,77,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,37,89,45,37,109,45,37,100,37,109,47,37,100,47,37,121,37,72,58,37,77,58,37,83,37,0,0,0,0,0,0,0,37,112,0,0,0,0,0,0,0,0,0,0,56,94,0,0,94,0,0,0,102,1,0,0,164,0,0,0,0,0,0,0,0,0,0,0,68,94,0,0,66,1,0,0,222,1,0,0,78,0,0,0,0,0,0,0,0,0,0,0,80,94,0,0,216,0,0,0,6,3,0,0,84,0,0,0,0,0,0,0,0,0,0,0,92,94,0,0,34,1,0,0,28,0,0,0,206,0,0,0,0,0,0,0,0,0,0,0,104,94,0,0,34,1,0,0,60,0,0,0,206,0,0,0,0,0,0,0,0,0,0,0,124,94,0,0,40,2,0,0,2,1,0,0,140,0,0,0,4,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,156,94,0,0,248,2,0,0,22,2,0,0,140,0,0,0,2,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,188,94,0,0,220,1,0,0,138,0,0,0,140,0,0,0,8,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,220,94,0,0,212,1,0,0,184,0,0,0,140,0,0,0,6,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,116,95,0,0,118,2,0,0,30,1,0,0,140,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,148,95,0,0,216,1,0,0,92,1,0,0,140,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,180,95,0,0,110,0,0,0,94,1,0,0,140,0,0,0,226,0,0,0,4,0,0,0,34,0,0,0,8,0,0,0,32,0,0,0,16,0,0,0,4,0,0,0,248,255,255,255,180,95,0,0,36,0,0,0,14,0,0,0,70,0,0,0,24,0,0,0,4,0,0,0,66,0,0,0,120,0,0,0,0,0,0,0,0,0,0,0,220,95,0,0,214,2,0,0,170,2,0,0,140,0,0,0,34,0,0,0,6,0,0,0,62,0,0,0,26,0,0,0,18,0,0,0,2,0,0,0,2,0,0,0,248,255,255,255,220,95,0,0,142,0,0,0,186,0,0,0,220,0,0,0,230,0,0,0,190,0,0,0,94,0,0,0,110,0,0,0,0,0,0,0,0,0,0,0,4,96,0,0,242,0,0,0,38,2,0,0,140,0,0,0,98,0,0,0,88,0,0,0,22,0,0,0,96,0,0,0,110,0,0,0,0,0,0,0,0,0,0,0,16,96,0,0,188,0,0,0,204,0,0,0,140,0,0,0,90,0,0,0,178,0,0,0,38,0,0,0,172,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,28,96,0,0,222,2,0,0,6,0,0,0,140,0,0,0,28,0,0,0,34,0,0,0,142,0,0,0,0,0,0,0,0,0,0,0,60,96,0,0,130,0,0,0,20,0,0,0,140,0,0,0,44,0,0,0,16,0,0,0,50,0,0,0,0,0,0,0,0,0,0,0,92,96,0,0,146,2,0,0,98,1,0,0,0,0,0,0,0,0,0,0,100,96,0,0,80,0,0,0,166,1,0,0,84,0,0,0,0,0,0,0,0,0,0,0,112,96,0,0,152,0,0,0,236,1,0,0,140,0,0,0,8,0,0,0,6,0,0,0,14,0,0,0,4,0,0,0,12,0,0,0,2,0,0,0,8,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,144,96,0,0,44,1,0,0,56,0,0,0,140,0,0,0,28,0,0,0,30,0,0,0,40,0,0,0,22,0,0,0,38,0,0,0,4,0,0,0,6,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,176,96,0,0,112,0,0,0,64,0,0,0,140,0,0,0,52,0,0,0,50,0,0,0,42,0,0,0,44,0,0,0,30,0,0,0,48,0,0,0,36,0,0,0,58,0,0,0,56,0,0,0,54,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,208,96,0,0,44,2,0,0,10,0,0,0,140,0,0,0,76,0,0,0,70,0,0,0,24,0,0,0,66,0,0,0,60,0,0,0,68,0,0,0,64,0,0,0,28,0,0,0,74,0,0,0,72,0,0,0,46,0,0,0,0,0,0,0,0,0,0,0,240,96,0,0,230,0,0,0,28,1,0,0,140,0,0,0,8,0,0,0,10,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,252,96,0,0,78,0,0,0,96,2,0,0,140,0,0,0,16,0,0,0,18,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,8,97,0,0,176,0,0,0,16,2,0,0,140,0,0,0,2,0,0,0,10,0,0,0,14,0,0,0,52,0,0,0,134,0,0,0,22,0,0,0,210,0,0,0,0,0,0,0,0,0,0,0,40,97,0,0,132,2,0,0,148,1,0,0,140,0,0,0,12,0,0,0,16,0,0,0,24,0,0,0,68,0,0,0,12,0,0,0,18,0,0,0,102,0,0,0,0,0,0,0,0,0,0,0,72,97,0,0,132,2,0,0,62,0,0,0,140,0,0,0,6,0,0,0,4,0,0,0,4,0,0,0,224,0,0,0,118,0,0,0,12,0,0,0,252,0,0,0,0,0,0,0,0,0,0,0,104,97,0,0,132,2,0,0,60,1,0,0,140,0,0,0,14,0,0,0,8,0,0,0,20,0,0,0,62,0,0,0,150,0,0,0,10,0,0,0,6,1,0,0,0,0,0,0,0,0,0,0,136,97,0,0,132,2,0,0,100,0,0,0,140,0,0,0,0,0,0,0,0,0,0,0,148,97,0,0,174,0,0,0,132,1,0,0,140,0,0,0,0,0,0,0,0,0,0,0,160,97,0,0,132,2,0,0,246,0,0,0,140,0,0,0,24,0,0,0,4,0,0,0,6,0,0,0,10,0,0,0,26,0,0,0,34,0,0,0,78,0,0,0,6,0,0,0,14,0,0,0,2,0,0,0,12,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,192,97,0,0,4,3,0,0,106,0,0,0,140,0,0,0,64,0,0,0,4,0,0,0,94,0,0,0,42,0,0,0,18,0,0,0,8,0,0,0,30,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,224,97,0,0,108,1,0,0,188,1,0,0,152,0,0,0,24,0,0,0,16,0,0,0,10,0,0,0,32,0,0,0,0,0,0,0,0,0,0,0,44,98,0,0,136,2,0,0,104,2,0,0,104,0,0,0,6,0,0,0,16,0,0,0,10,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,72,98,0,0,186,0,0,0,134,0,0,0,160,0,0,0,6,0,0,0,232,1,0,0,0,0,0,0,0,0,0,0,84,98,0,0,60,2,0,0,64,1,0,0,154,1,0,0,46,0,0,0,156,2,0,0,0,0,0,0,0,0,0,0,96,98,0,0,118,1,0,0,102,0,0,0,156,0,0,0,40,0,0,0,240,0,0,0,0,0,0,0,0,0,0,0,108,98,0,0,162,1,0,0,114,1,0,0,152,2,0,0,8,0,0,0,48,2,0,0,0,0,0,0,0,0,0,0,120,98,0,0,8,0,0,0,244,2,0,0,226,0,0,0,8,0,0,0,58,1,0,0,0,0,0,0,0,0,0,0,132,98,0,0,24,0,0,0,170,0,0,0,254,1,0,0,8,0,0,0,198,1,0,0,0,0,0,0,0,0,0,0,144,98,0,0,250,1,0,0,198,2,0,0,0,3,0,0,8,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,156,98,0,0,176,1,0,0,190,0,0,0,144,0,0,0,8,0,0,0,8,2,0,0,0,0,0,0,0,0,0,0,168,98,0,0,100,1,0,0,146,1,0,0,14,0,0,0,8,0,0,0,214,0,0,0,0,0,0,0,0,0,0,0,180,98,0,0,22,1,0,0,252,0,0,0,76,2,0,0,8,0,0,0,142,1,0,0,0,0,0,0,0,0,0,0,192,98,0,0,122,1,0,0,94,2,0,0,238,1,0,0,8,0,0,0,86,0,0,0,0,0,0,0,0,0,0,0,204,98,0,0,188,2,0,0,120,0,0,0,36,2,0,0,8,0,0,0,104,0,0,0,0,0,0,0,0,0,0,0,216,98,0,0,52,1,0,0,216,2,0,0,90,1,0,0,8,0,0,0,116,0,0,0,0,0,0,0,0,0,0,0,228,98,0,0,106,2,0,0,180,0,0,0,144,2,0,0,8,0,0,0,44,0,0,0,0,0,0,0,0,0,0,0,240,98,0,0,58,0,0,0,158,0,0,0,58,2,0,0,8,0,0,0,138,1,0,0,0,0,0,0,0,0,0,0,252,98,0,0,162,2,0,0,234,2,0,0,90,2,0,0,8,0,0,0,126,1,0,0,0,0,0,0,0,0,0,0,8,99,0,0,142,2,0,0,14,1,0,0,144,1,0,0,8,0,0,0,194,1,0,0,0,0,0,0,0,0,0,0,20,99,0,0,32,1,0,0,102,2,0,0,220,2,0,0,8,0,0,0,180,1,0,0,0,0,0,0,0,0,0,0,32,99,0,0,174,2,0,0,172,0,0,0,80,2,0,0,8,0,0,0,126,2,0,0,0,0,0,0,0,0,0,0,44,99,0,0,138,2,0,0,150,0,0,0,156,1,0,0,8,0,0,0,8,3,0,0,0,0,0,0,0,0,0,0,56,99,0,0,226,2,0,0,246,2,0,0,50,1,0,0,8,0,0,0,172,2,0,0,0,0,0,0,0,0,0,0,92,99,0,0,208,0,0,0,164,2,0,0,156,0,0,0,24,0,0,0,16,0,0,0,10,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,104,99,0,0,116,1,0,0,160,1,0,0,44,0,0,0,0,0,0,0,0,0,0,0,116,99,0,0,132,2,0,0,130,2,0,0,140,0,0,0,14,0,0,0,8,0,0,0,20,0,0,0,62,0,0,0,150,0,0,0,10,0,0,0,6,1,0,0,0,0,0,0,0,0,0,0,128,99,0,0,132,2,0,0,204,2,0,0,140,0,0,0,14,0,0,0,8,0,0,0,20,0,0,0,62,0,0,0,150,0,0,0,10,0,0,0,6,1,0,0,0,0,0,0,0,0,0,0,140,99,0,0,136,1,0,0,192,2,0,0,54,0,0,0,26,0,0,0,20,0,0,0,4,0,0,0,182,0,0,0,196,0,0,0,40,0,0,0,56,0,0,0,50,0,0,0,104,0,0,0,22,0,0,0,76,0,0,0,0,0,0,0,0,0,0,0,148,99,0,0,32,0,0,0,104,1,0,0,138,0,0,0,46,0,0,0,36,0,0,0,8,0,0,0,100,0,0,0,16,0,0,0,20,0,0,0,8,0,0,0,18,0,0,0,56,0,0,0,18,0,0,0,68,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,196,99,0,0,122,0,0,0,114,2,0,0,252,255,255,255,252,255,255,255,196,99,0,0,174,1,0,0,134,1,0,0,0,0,0,0,4,0,0,0,0,0,0,0,220,99,0,0,150,2,0,0,196,2,0,0,252,255,255,255,252,255,255,255,220,99,0,0,88,1,0,0,78,2,0,0,0,0,0,0,8,0,0,0,0,0,0,0,244,99,0,0,20,1,0,0,232,2,0,0,248,255,255,255,248,255,255,255,244,99,0,0,2,2,0,0,190,2,0,0,0,0,0,0,8,0,0,0,0,0,0,0,12,100,0,0,80,1,0,0,92,2,0,0,248,255,255,255,248,255,255,255,12,100,0,0,158,1,0,0,34,0,0,0,0,0,0,0,0,0,0,0,36,100,0,0,84,2,0,0,4,2,0,0,84,0,0,0,0,0,0,0,0,0,0,0,56,100,0,0,134,2,0,0,200,0,0,0,38,0,0,0,0,0,0,0,0,0,0,0,80,100,0,0,224,2,0,0,178,2,0,0,48,0,0,0,26,0,0,0,20,0,0,0,4,0,0,0,114,0,0,0,196,0,0,0,40,0,0,0,56,0,0,0,50,0,0,0,104,0,0,0,38,0,0,0,98,0,0,0,0,0,0,0,0,0,0,0,92,100,0,0,200,1,0,0,252,1,0,0,80,0,0,0,46,0,0,0,36,0,0,0,8,0,0,0,184,0,0,0,16,0,0,0,20,0,0,0,8,0,0,0,18,0,0,0,56,0,0,0,32,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,136,100,0,0,166,2,0,0,168,1,0,0,140,0,0,0,138,0,0,0,222,0,0,0,106,0,0,0,178,0,0,0,12,0,0,0,68,0,0,0,106,0,0,0,60,0,0,0,94,0,0,0,0,0,0,0,0,0,0,0,168,100,0,0,74,1,0,0,166,0,0,0,140,0,0,0,208,0,0,0,216,0,0,0,146,0,0,0,160,0,0,0,166,0,0,0,62,0,0,0,212,0,0,0,112,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,200,100,0,0,176,2,0,0,84,0,0,0,140,0,0,0,26,0,0,0,116,0,0,0,20,0,0,0,104,0,0,0,170,0,0,0,114,0,0,0,188,0,0,0,174,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,232,100,0,0,238,0,0,0,234,1,0,0,140,0,0,0,176,0,0,0,204,0,0,0,66,0,0,0,156,0,0,0,64,0,0,0,56,0,0,0,158,0,0,0,152,0,0,0,150,0,0,0,0,0,0,0,0,0,0,0,32,101,0,0,64,2,0,0,54,0,0,0,92,0,0,0,26,0,0,0,20,0,0,0,4,0,0,0,182,0,0,0,196,0,0,0,40,0,0,0,144,0,0,0,170,0,0,0,22,0,0,0,22,0,0,0,76,0,0,0,0,0,0,0,0,0,0,0,44,101,0,0,50,0,0,0,16,1,0,0,144,0,0,0,46,0,0,0,36,0,0,0,8,0,0,0,100,0,0,0,16,0,0,0,20,0,0,0,192,0,0,0,46,0,0,0,4,0,0,0,18,0,0,0,68,0,0,0,0,0,0,0,0,0,0,0,56,101,0,0,124,2,0,0,4,0,0,0,132,0,0,0,14,0,0,0,168,2,0,0,52,0,0,0,76,0,0,0,66,0,0,0,242,0,0,0,0,0,0,0,0,0,0,0,68,101,0,0,246,1,0,0,248,0,0,0,30,0,0,0,136,0,0,0,108,0,0,0,182,2,0,0,122,0,0,0,34,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,80,101,0,0,132,0,0,0,26,1,0,0,244,0,0,0,120,0,0,0,186,2,0,0,206,2,0,0,16,0,0,0,58,0,0,0,246,0,0,0,0,0,0,0,0,0,0,0,92,101,0,0,46,2,0,0,26,0,0,0,194,0,0,0,134,0,0,0,222,0,0,0,88,2,0,0,10,2,0,0,52,0,0,0,214,0,0,0,0,0,0,0,0,0,0,0,104,101,0,0,108,2,0,0,206,0,0,0,108,0,0,0,58,0,0,0,140,2,0,0,30,0,0,0,76,0,0,0,102,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,116,101,0,0,202,0,0,0,82,1,0,0,154,0,0,0,108,0,0,0,0,1,0,0,40,1,0,0,240,1,0,0,54,0,0,0,48,0,0,0,0,0,0,0,0,0,0,0,128,101,0,0,70,0,0,0,18,0,0,0,130,0,0,0,182,0,0,0,142,0,0,0,202,1,0,0,68,2,0,0,12,0,0,0,228,0,0,0,0,0,0,0,0,0,0,0,140,101,0,0,248,1,0,0,254,0,0,0,160,0,0,0,98,0,0,0,136,0,0,0,128,1,0,0,120,2,0,0,84,0,0,0,4,1,0,0,0,0,0,0,0,0,0,0,152,101,0,0,20,2,0,0,254,2,0,0,128,0,0,0,32,0,0,0,32,2,0,0,96,0,0,0,72,1,0,0,38,0,0,0,168,0,0,0,0,0,0,0,0,0,0,0,164,101,0,0,12,1,0,0,210,0,0,0,2,1,0,0,154,0,0,0,124,0,0,0,16,0,0,0,250,2,0,0,20,0,0,0,124,0,0,0,0,0,0,0,0,0,0,0,176,101,0,0,164,0,0,0,118,0,0,0,54,0,0,0,116,0,0,0,168,0,0,0,112,2,0,0,42,1,0,0,32,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,188,101,0,0,194,2,0,0,194,0,0,0,174,0,0,0,180,0,0,0,196,1,0,0,24,1,0,0,38,0,0,0,82,0,0,0,248,0,0,0,0,0,0,0,0,0,0,0,200,101,0,0,22,0,0,0,106,1,0,0,202,0,0,0,44,0,0,0,110,1,0,0,206,1,0,0,4,0,0,0,48,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,212,101,0,0,42,2,0,0,34,2,0,0,234,0,0,0,132,0,0,0,212,0,0,0,242,2,0,0,10,0,0,0,30,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,224,101,0,0,24,2,0,0,112,1,0,0,180,0,0,0,148,0,0,0,76,1,0,0,12,2,0,0,100,2,0,0,70,0,0,0,254,0,0,0,0,0,0,0,0,0,0,0,236,101,0,0,62,1,0,0,182,0,0,0,238,0,0,0,86,0,0,0,18,2,0,0,54,1,0,0,26,0,0,0,92,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,248,101,0,0,154,0,0,0,48,1,0,0,198,0,0,0,118,0,0,0,96,1,0,0,198,0,0,0,100,0,0,0,100,0,0,0,112,0,0,0,0,0,0,0,0,0,0,0,4,102,0,0,178,0,0,0,86,2,0,0,140,0,0,0,46,0,0,0,192,1,0,0,66,0,0,0,230,2,0,0,44,0,0,0,82,0,0,0,0,0,0,0,0,0,0,0,16,102,0,0,114,0,0,0,208,2,0,0,126,0,0,0,30,0,0,0,180,2,0,0,126,0,0,0,12,0,0,0,16,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,28,102,0,0,218,1,0,0,170,1,0,0,86,0,0,0,18,0,0,0,160,2,0,0,200,2,0,0,168,0,0,0,86,0,0,0,250,0,0,0,0,0,0,0,0,0,0,0,40,102,0,0,244,0,0,0,82,0,0,0,72,0,0,0,164,0,0,0,38,1,0,0,4,1,0,0,12,0,0,0,96,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,52,102,0,0,116,2,0,0,8,1,0,0,92,0,0,0,40,0,0,0,52,2,0,0,238,2,0,0,18,0,0,0,88,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,64,102,0,0,202,2,0,0,226,1,0,0,200,0,0,0,78,0,0,0,74,2,0,0,10,1,0,0,26,0,0,0,74,0,0,0,32,0,0,0,0,0,0,0,0,0,0,0,76,102,0,0,42,0,0,0,70,2,0,0,148,0,0,0,124,0,0,0,236,0,0,0,122,2,0,0,10,0,0,0,62,0,0,0,80,0,0,0,0,0,0,0,0,0,0,0,88,102,0,0,130,1,0,0,14,2,0,0,40,0,0,0,128,0,0,0,220,0,0,0,224,1,0,0,20,0,0,0,80,0,0,0,96,0,0,0,0,0,0,0,0,0,0,0,100,102,0,0,212,2,0,0,72,2,0,0,218,0,0,0,84,0,0,0,252,2,0,0,240,2,0,0,30,0,0,0,28,0,0,0,240,0,0,0,0,0,0,0,0,0,0,0,224,102,0,0,26,0,0,0,218,0,0,0,176,0,0,0,154,2,0,0,204,1,0,0,0,0,0,0,0,0,0,0,232,102,0,0,22,0,0,0,56,1,0,0,6,1,0,0,0,0,0,0,0,0,0,0,8,103,0,0,14,0,0,0,192,0,0,0,178,1,0,0,0,0,0,0,0,0,0,0,40,103,0,0,18,0,0,0,234,0,0,0,128,2,0,0,0,0,0,0,0,0,0,0,108,103,0,0,22,0,0,0,36,0,0,0,68,0,0,0,0,0,0,0,0,0,0,0,120,103,0,0,184,0,0,0,158,2,0,0,88,0,0,0,184,2,0,0,84,1,0,0,0,0,0,0,0,0,0,0,152,103,0,0,14,0,0,0,210,1,0,0,162,0,0,0,0,0,0,0,0,0,0,0,164,103,0,0,162,0,0,0,28,2,0,0,36,0,0,0,228,2,0,0,46,1,0,0,0,0,0,0,0,0,0,0,196,103,0,0,18,0,0,0,26,2,0,0,12,0,0,0,0,0,0,0,0,0,0,0,208,103,0,0,6,0,0,0,214,1,0,0,52,0,0,0,242,1,0,0,184,1,0,0,0,0,0,0,0,0,0,0,240,103,0,0,158,0,0,0,74,0,0,0,82,0,0,0,152,1,0,0,66,2,0,0,0,0,0,0,0,0,0,0,16,104,0,0,172,1,0,0,228,0,0,0,140,0,0,0,2,0,0,0,20,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,28,104,0,0,12,3,0,0,110,2,0,0,140,0,0,0,2,0,0,0,20,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,40,104,0,0,82,2,0,0,72,0,0,0,140,0,0,0,2,0,0,0,20,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,52,104,0,0,16,0,0,0,146,0,0,0,196,0,0,0,0,0,0,0,0,0,0,0,64,104,0,0,126,0,0,0,210,2,0,0,24,0,0,0,92,0,0,0,98,2,0,0,0,0,0,0,0,0,0,0,104,104,0,0,236,2,0,0,78,1,0,0,6,2,0,0,186,1,0,0,8,0,0,0,2,0,0,0,6,0,0,0,14,0,0,0,0,0,0,0,90,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,48,95,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,78,75,85,108,78,83,54,95,73,78,83,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,95,99,108,69,83,66,95,69,85,108,78,83,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,95,0,90,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,48,95,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,78,75,85,108,78,83,54,95,73,78,83,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,95,99,108,69,83,66,95,69,85,108,78,83,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,95,0,0,0,90,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,48,95,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,78,75,85,108,78,83,54,95,73,78,83,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,95,99,108,69,83,66,95,69,85,108,78,83,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,95,0,0,0,90,90,78,53,114,120,99,112,112,53,82,97,110,103,101,73,105,69,69,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,49,48,79,98,115,101,114,118,97,98,108,101,73,84,95,69,69,69,69,83,52,95,83,52,95,83,52,95,78,83,50,95,73,78,83,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,78,75,83,48,95,73,105,69,85,108,78,83,50,95,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,95,99,108,69,83,67,95,69,85,108,118,69,95,0,90,78,75,53,114,120,99,112,112,57,83,99,104,101,100,117,108,101,114,52,87,111,114,107,99,118,78,83,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,118,69,85,108,118,69,95,0,0,90,78,75,53,114,120,99,112,112,54,100,101,116,97,105,108,52,83,105,110,107,73,78,83,48,95,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,49,95,69,105,69,49,51,71,101,116,68,105,115,112,111,115,97,98,108,101,69,118,69,85,108,118,69,95,0,0,0,0,90,78,75,53,114,120,99,112,112,54,100,101,116,97,105,108,52,83,105,110,107,73,78,83,48,95,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,49,95,69,105,69,49,51,71,101,116,68,105,115,112,111,115,97,98,108,101,69,118,69,85,108,118,69,95,0,0,90,78,75,53,114,120,99,112,112,54,100,101,116,97,105,108,52,83,105,110,107,73,78,83,48,95,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,49,95,69,105,69,49,51,71,101,116,68,105,115,112,111,115,97,98,108,101,69,118,69,85,108,118,69,95,0,0,90,78,75,53,114,120,99,112,112,50,53,67,114,101,97,116,101,100,65,117,116,111,68,101,116,97,99,104,79,98,115,101,114,118,101,114,73,105,69,99,118,78,83,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,118,69,85,108,118,69,95,0,0,0,90,78,75,53,114,120,99,112,112,50,48,67,111,109,112,111,115,97,98,108,101,68,105,115,112,111,115,97,98,108,101,99,118,78,83,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,118,69,85,108,118,69,95,0,0,0,90,78,75,53,114,120,99,112,112,49,54,83,101,114,105,97,108,68,105,115,112,111,115,97,98,108,101,99,118,78,83,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,118,69,85,108,118,69,95,0,0,0,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,48,95,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,85,108,118,69,95,0,0,0,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,48,95,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,85,108,78,83,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,95,0,0,0,0,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,48,95,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,85,108,78,83,54,95,73,78,83,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,95,0,0,0,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,48,95,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,85,108,118,69,95,0,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,48,95,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,85,108,78,83,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,95,0,0,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,48,95,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,85,108,78,83,54,95,73,78,83,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,95,0,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,48,95,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,85,108,118,69,95,0,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,48,95,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69].concat([69,69,85,108,78,83,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,95,0,0,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,48,95,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,85,108,78,83,54,95,73,78,83,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,95,0,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,67,49,69,82,75,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,49,48,79,98,115,101,114,118,97,98,108,101,73,105,69,69,69,69,78,83,51,95,56,102,117,110,99,116,105,111,110,73,70,105,105,69,69,69,69,85,108,78,83,52,95,73,83,50,95,69,69,78,83,52,95,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,79,78,83,95,49,48,68,105,115,112,111,115,97,98,108,101,69,78,83,65,95,73,70,118,83,72,95,69,69,69,69,95,0,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,67,49,69,82,75,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,49,48,79,98,115,101,114,118,97,98,108,101,73,105,69,69,69,69,78,83,51,95,56,102,117,110,99,116,105,111,110,73,70,98,105,69,69,69,69,85,108,78,83,52,95,73,83,50,95,69,69,78,83,52,95,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,79,78,83,95,49,48,68,105,115,112,111,115,97,98,108,101,69,78,83,65,95,73,70,118,83,72,95,69,69,69,69,95,0,0,0,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,67,49,69,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,49,48,79,98,115,101,114,118,97,98,108,101,73,105,69,69,69,69,78,83,95,52,117,116,105,108,53,109,97,121,98,101,73,105,69,69,78,83,51,95,56,102,117,110,99,116,105,111,110,73,70,105,105,105,69,69,69,78,83,66,95,73,70,83,65,95,105,69,69,69,69,85,108,78,83,52,95,73,83,50,95,69,69,78,83,52,95,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,79,78,83,95,49,48,68,105,115,112,111,115,97,98,108,101,69,78,83,66,95,73,70,118,83,75,95,69,69,69,69,95,0,90,78,53,114,120,99,112,112,52,83,99,97,110,73,105,105,69,69,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,49,48,79,98,115,101,114,118,97,98,108,101,73,84,48,95,69,69,69,69,82,75,78,83,50,95,73,78,83,51,95,73,84,95,69,69,69,69,83,52,95,78,83,95,54,100,101,116,97,105,108,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,83,55,95,83,52,95,69,49,49,65,99,99,117,109,117,108,97,116,111,114,69,69,85,108,105,69,95,0,0,0,0,90,78,53,114,120,99,112,112,49,55,67,114,101,97,116,101,100,79,98,115,101,114,118,97,98,108,101,73,105,90,78,83,95,53,82,97,110,103,101,73,105,69,69,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,49,48,79,98,115,101,114,118,97,98,108,101,73,84,95,69,69,69,69,83,53,95,83,53,95,83,53,95,78,83,51,95,73,78,83,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,85,108,78,83,51,95,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,95,69,57,83,117,98,115,99,114,105,98,101,69,83,67,95,69,85,108,83,57,95,69,95,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,83,116,57,101,120,99,101,112,116,105,111,110,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,83,116,56,98,97,100,95,99,97,115,116,0,83,116,49,51,114,117,110,116,105,109,101,95,101,114,114,111,114,0,0,0,83,116,49,50,108,101,110,103,116,104,95,101,114,114,111,114,0,0,0,0,83,116,49,49,108,111,103,105,99,95,101,114,114,111,114,0,78,83,116,51,95,95,49,57,116,105,109,101,95,98,97,115,101,69,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,69,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,55,102,97,105,108,117,114,101,69,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,119,69,69,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,99,69,69,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,119,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,99,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,115,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,105,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,102,97,99,101,116,69,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,95,95,105,109,112,69,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,119,69,69,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,99,69,69,0,0,0,78,83,116,51,95,95,49,50,52,95,95,103,101,110,101,114,105,99,95,101,114,114,111,114,95,99,97,116,101,103,111,114,121,69,0,0,78,83,116,51,95,95,49,50,51,101,110,97,98,108,101,95,115,104,97,114,101,100,95,102,114,111,109,95,116,104,105,115,73,78,53,114,120,99,112,112,57,83,99,104,101,100,117,108,101,114,69,69,69,0,0,0,78,83,116,51,95,95,49,50,51,101,110,97,98,108,101,95,115,104,97,114,101,100,95,102,114,111,109,95,116,104,105,115,73,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,50,51,101,110,97,98,108,101,95,115,104,97,114,101,100,95,102,114,111,109,95,116,104,105,115,73,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,49,95,69,69,69,0,0,78,83,116,51,95,95,49,50,51,101,110,97,98,108,101,95,115,104,97,114,101,100,95,102,114,111,109,95,116,104,105,115,73,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,69,69,69,0,0,78,83,116,51,95,95,49,50,51,101,110,97,98,108,101,95,115,104,97,114,101,100,95,102,114,111,109,95,116,104,105,115,73,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,49,95,69,69,69,0,0,0,0,78,83,116,51,95,95,49,50,51,101,110,97,98,108,101,95,115,104,97,114,101,100,95,102,114,111,109,95,116,104,105,115,73,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,69,69,0,0,78,83,116,51,95,95,49,50,51,101,110,97,98,108,101,95,115,104,97,114,101,100,95,102,114,111,109,95,116,104,105,115,73,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,49,95,69,69,69,0,0,0,0,78,83,116,51,95,95,49,50,51,101,110,97,98,108,101,95,115,104,97,114,101,100,95,102,114,111,109,95,116,104,105,115,73,78,53,114,120,99,112,112,50,53,67,114,101,97,116,101,100,65,117,116,111,68,101,116,97,99,104,79,98,115,101,114,118,101,114,73,105,69,69,69,69,0,0,0,78,83,116,51,95,95,49,50,51,95,95,115,121,115,116,101,109,95,101,114,114,111,114,95,99,97,116,101,103,111,114,121,69,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,119,69,69,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,99,69,69,0,0,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,112,111,105,110,116,101,114,73,80,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,49,95,69,78,83,95,49,52,100,101,102,97,117,108,116,95,100,101,108,101,116,101,73,83,53,95,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,53,95,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,112,111,105,110,116,101,114,73,80,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,49,95,69,78,83,95,49,52,100,101,102,97,117,108,116,95,100,101,108,101,116,101,73,83,53,95,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,53,95,69,69,69,69,0,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,112,111,105,110,116,101,114,73,80,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,49,95,69,78,83,95,49,52,100,101,102,97,117,108,116,95,100,101,108,101,116,101,73,83,53,95,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,53,95,69,69,69,69,0,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,101,109,112,108,97,99,101,73,90,90,78,53,114,120,99,112,112,53,82,97,110,103,101,73,105,69,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,49,95,49,48,79,98,115,101,114,118,97,98,108,101,73,84,95,69,69,69,69,83,53,95,83,53,95,83,53,95,78,83,51,95,73,78,83,49,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,78,75,83,50,95,73,105,69,85,108,78,83,51,95,73,78,83,49,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,95,99,108,69,83,68,95,69,53,83,116,97,116,101,95,49,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,70,95,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,101,109,112,108,97,99,101,73,78,53,114,120,99,112,112,57,83,99,104,101,100,117,108,101,114,52,87,111,114,107,53,83,116,97,116,101,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,52,95,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,101,109,112,108,97,99,101,73,78,53,114,120,99,112,112,56,79,98,115,101,114,118,101,114,73,105,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,51,95,69,69,69,69,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,101,109,112,108,97,99,101,73,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,50,95,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,53,83,116,97,116,101,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,55,95,69,69,69,69,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,101,109,112,108,97,99,101,73,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,50,95,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,69,105,69,53,83,116,97,116,101,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,55,95,69,69,69,69,0,0,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,101,109,112,108,97,99,101,73,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,50,95,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,53,83,116,97,116,101,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,55,95,69,69,69,69,0,0,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,101,109,112,108,97,99,101,73,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,52,95,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,101,109,112,108,97,99,101,73,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,52,95,69,69,69,69,0,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,101,109,112,108,97,99,101,73,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,52,95,69,69,69,69,0,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,101,109,112,108,97,99,101,73,78,53,114,120,99,112,112,50,53,67,114,101,97,116,101,100,65,117,116,111,68,101,116,97,99,104,79,98,115,101,114,118,101,114,73,105,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,51,95,69,69,69,69,0,0,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,101,109,112,108,97,99,101,73,78,53,114,120,99,112,112,50,50,67,117,114,114,101,110,116,84,104,114,101,97,100,83,99,104,101,100,117,108,101,114,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,50,95,69,69,69,69,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,101,109,112,108,97,99,101,73,78,53,114,120,99,112,112,50,50,67,117,114,114,101,110,116,84,104,114,101,97,100,83,99,104,101,100,117,108,101,114,49,48,68,101,114,101,99,117,114,115,101,114,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,51,95,69,69,69,69,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,101,109,112,108,97,99,101,73,78,53,114,120,99,112,112,50,48,67,111,109,112,111,115,97,98,108,101,68,105,115,112,111,115,97,98,108,101,53,83,116,97,116,101,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,51,95,69,69,69,69,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,101,109,112,108,97,99,101,73,78,53,114,120,99,112,112,49,56,73,109,109,101,100,105,97,116,101,83,99,104,101,100,117,108,101,114,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,50,95,69,69,69,69,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,101,109,112,108,97,99,101,73,78,53,114,120,99,112,112,49,55,67,114,101,97,116,101,100,79,98,115,101,114,118,97,98,108,101,73,105,90,78,83,49,95,53,82,97,110,103,101,73,105,69,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,49,95,49,48,79,98,115,101,114,118,97,98,108,101,73,84,95,69,69,69,69,83,54,95,83,54,95,83,54,95,78,83,52,95,73,78,83,49,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,85,108,78,83,52,95,73,78,83,49,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,95,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,70,95,69,69,69,69,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,101,109,112,108,97,99,101,73,78,53,114,120,99,112,112,49,54,83,101,114,105,97,108,68,105,115,112,111,115,97,98,108,101,53,83,116,97,116,101,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,51,95,69,69,69,69,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,101,109,112,108,97,99,101,73,78,53,114,120,99,112,112,49,53,67,114,101,97,116,101,100,79,98,115,101,114,118,101,114,73,105,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,51,95,69,69,69,69,0,78,83,116,51,95,95,49,50,48,95,95,115,104,97,114,101,100,95,112,116,114,95,101,109,112,108,97,99,101,73,78,53,114,120,99,112,112,49,48,68,105,115,112,111,115,97,98,108,101,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,50,95,69,69,69,69,0,78,83,116,51,95,95,49,49,57,95,95,115,104,97,114,101,100,95,119,101,97,107,95,99,111,117,110,116,69,0,0,0,78,83,116,51,95,95,49,49,57,95,95,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,69,0,0,0,78,83,116,51,95,95,49,49,55,98,97,100,95,102,117,110,99,116,105,111,110,95,99,97,108,108,69,0,78,83,116,51,95,95,49,49,55,95,95,119,105,100,101,110,95,102,114,111,109,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,78,83,116,51,95,95,49,49,54,95,95,110,97,114,114,111,119,95,116,111,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,49,52,101,114,114,111,114,95,99,97,116,101,103,111,114,121,69,0,0,0,0,78,83,116,51,95,95,49,49,52,100,101,102,97,117,108,116,95,100,101,108,101,116,101,73,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,49,95,69,69,69,0,0,0,78,83,116,51,95,95,49,49,52,100,101,102,97,117,108,116,95,100,101,108,101,116,101,73,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,49,95,69,69,69,0,78,83,116,51,95,95,49,49,52,100,101,102,97,117,108,116,95,100,101,108,101,116,101,73,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,49,95,69,69,69,0,78,83,116,51,95,95,49,49,52,95,95,115,104,97,114,101,100,95,99,111,117,110,116,69,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,112,117,116,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,103,101,116,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,51,109,101,115,115,97,103,101,115,95,98,97,115,101,69,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,50,115,121,115,116,101,109,95,101,114,114,111,114,69,0,0,78,83,116,51,95,95,49,49,50,99,111,100,101,99,118,116,95,98,97,115,101,69,0,0,78,83,116,51,95,95,49,49,50,98,97,100,95,119,101,97,107,95,112,116,114,69,0,0,78,83,116,51,95,95,49,49,50,95,95,100,111,95,109,101,115,115,97,103,101,69,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,49,69,69,69,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,48,69,69,69,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,49,69,69,69,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,48,69,69,69,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,99,116,121,112,101,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,116,105,109,101,95,112,117,116,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,119,69,69,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,99,69,69,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,51,95,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,78,75,85,108,78,83,56,95,73,78,83,50,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,95,99,108,69,83,68,95,69,85,108,78,83,50,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,71,95,69,69,70,118,83,70,95,69,69,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,51,95,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,78,75,85,108,78,83,56,95,73,78,83,50,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,95,99,108,69,83,68,95,69,85,108,78,83,50,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,71,95,69,69,70,118,83,70,95,69,69,69,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,51,95,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,78,75,85,108,78,83,56,95,73,78,83,50,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,95,99,108,69,83,68,95,69,85,108,78,83,50,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,71,95,69,69,70,118,83,70,95,69,69,69,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,90,78,53,114,120,99,112,112,53,82,97,110,103,101,73,105,69,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,49,48,79,98,115,101,114,118,97,98,108,101,73,84,95,69,69,69,69,83,54,95,83,54,95,83,54,95,78,83,52,95,73,78,83,50,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,78,75,83,51,95,73,105,69,85,108,78,83,52,95,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,95,99,108,69,83,69,95,69,85,108,118,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,71,95,69,69,70,118,118,69,69,69,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,75,53,114,120,99,112,112,57,83,99,104,101,100,117,108,101,114,52,87,111,114,107,99,118,78,83,50,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,118,69,85,108,118,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,54,95,69,69,70,118,118,69,69,69,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,75,53,114,120,99,112,112,54,100,101,116,97,105,108,52,83,105,110,107,73,78,83,51,95,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,49,95,69,105,69,49,51,71,101,116,68,105,115,112,111,115,97,98,108,101,69,118,69,85,108,118,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,57,95,69,69,70,118,118,69,69,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,75,53,114,120,99,112,112,54,100,101,116,97,105,108,52,83,105,110,107,73,78,83,51,95,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,49,95,69,105,69,49,51,71,101,116,68,105,115,112,111,115,97,98,108,101,69,118,69,85,108,118,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,57,95,69,69,70,118,118,69,69,69,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,75,53,114,120,99,112,112,54,100,101,116,97,105,108,52,83,105,110,107,73,78,83,51,95,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,49,95,69,105,69,49,51,71,101,116,68,105,115,112,111,115,97,98,108,101,69,118,69,85,108,118,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,57,95,69,69,70,118,118,69,69,69,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,75,53,114,120,99,112,112,50,53,67,114,101,97,116,101,100,65,117,116,111,68,101,116,97,99,104,79,98,115,101,114,118,101,114,73,105,69,99,118,78,83,50,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,118,69,85,108,118,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,54,95,69,69,70,118,118,69,69,69,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,75,53,114,120,99,112,112,50,48,67,111,109,112,111,115,97,98,108,101,68,105,115,112,111,115,97,98,108,101,99,118,78,83,50,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,118,69,85,108,118,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,53,95,69,69,70,118,118,69,69,69,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,75,53,114,120,99,112,112,49,54,83,101,114,105,97,108,68,105,115,112,111,115,97,98,108,101,99,118,78,83,50,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,118,69,85,108,118,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,53,95,69,69,70,118,118,69,69,69,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,51,95,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,85,108,118,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,67,95,69,69,70,118,118,69,69,69,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,51,95,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,85,108,78,83,56,95,73,78,83,50,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,69,95,69,69,70,78,83,50,95,49,48,68,105,115,112,111,115,97,98,108,101,69,83,68,95,69,69,69,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,51,95,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,85,108,78,83,50,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,68,95,69,69,70,118,83,67,95,69,69,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,51,95,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,85,108,118,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,67,95,69,69,70,118,118,69,69,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,51,95,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,85,108,78,83,56,95,73,78,83,50,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,69,95,69,69,70,78,83,50,95,49,48,68,105,115,112,111,115,97,98,108,101,69,83,68,95,69,69,69,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,51,95,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,85,108,78,83,50,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,68,95,69,69,70,118,83,67,95,69,69,69,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,51,95,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,85,108,118,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,67,95,69,69,70,118,118,69,69,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,51,95,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,85,108,78,83,56,95,73,78,83,50,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,69,95,69,69,70,78,83,50,95,49,48,68,105,115,112,111,115,97,98,108,101,69,83,68,95,69,69,69,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,51,95,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,57,83,117,98,115,99,114,105,98,101,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,85,108,78,83,50,95,49,48,68,105,115,112,111,115,97,98,108,101,69,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,68,95,69,69,70,118,83,67,95,69,69,69,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,67,49,69,82,75,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,49,48,79,98,115,101,114,118,97,98,108,101,73,105,69,69,69,69,78,83,95,56,102,117,110,99,116,105,111,110,73,70,105,105,69,69,69,69,85,108,78,83,54,95,73,83,53,95,69,69,78,83,54,95,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,79,78,83,50,95,49,48,68,105,115,112,111,115,97,98,108,101,69,78,83,67,95,73,70,118,83,74,95,69])
.concat([69,69,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,78,95,69,69,70,83,74,95,83,70,95,83,73,95,83,74,95,83,77,95,69,69,69,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,67,49,69,82,75,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,49,48,79,98,115,101,114,118,97,98,108,101,73,105,69,69,69,69,78,83,95,56,102,117,110,99,116,105,111,110,73,70,98,105,69,69,69,69,85,108,78,83,54,95,73,83,53,95,69,69,78,83,54,95,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,79,78,83,50,95,49,48,68,105,115,112,111,115,97,98,108,101,69,78,83,67,95,73,70,118,83,74,95,69,69,69,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,78,95,69,69,70,83,74,95,83,70,95,83,73,95,83,74,95,83,77,95,69,69,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,67,49,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,49,48,79,98,115,101,114,118,97,98,108,101,73,105,69,69,69,69,78,83,50,95,52,117,116,105,108,53,109,97,121,98,101,73,105,69,69,78,83,95,56,102,117,110,99,116,105,111,110,73,70,105,105,105,69,69,69,78,83,68,95,73,70,83,67,95,105,69,69,69,69,85,108,78,83,54,95,73,83,53,95,69,69,78,83,54,95,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,79,78,83,50,95,49,48,68,105,115,112,111,115,97,98,108,101,69,78,83,68,95,73,70,118,83,77,95,69,69,69,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,81,95,69,69,70,83,77,95,83,73,95,83,76,95,83,77,95,83,80,95,69,69,69,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,53,114,120,99,112,112,52,83,99,97,110,73,105,105,69,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,49,48,79,98,115,101,114,118,97,98,108,101,73,84,48,95,69,69,69,69,82,75,78,83,52,95,73,78,83,53,95,73,84,95,69,69,69,69,83,54,95,78,83,50,95,54,100,101,116,97,105,108,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,83,57,95,83,54,95,69,49,49,65,99,99,117,109,117,108,97,116,111,114,69,69,85,108,105,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,73,95,69,69,70,78,83,50,95,52,117,116,105,108,53,109,97,121,98,101,73,105,69,69,105,69,69,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,53,114,120,99,112,112,49,55,67,114,101,97,116,101,100,79,98,115,101,114,118,97,98,108,101,73,105,90,78,83,50,95,53,82,97,110,103,101,73,105,69,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,49,48,79,98,115,101,114,118,97,98,108,101,73,84,95,69,69,69,69,83,55,95,83,55,95,83,55,95,78,83,53,95,73,78,83,50,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,85,108,78,83,53,95,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,95,69,57,83,117,98,115,99,114,105,98,101,69,83,69,95,69,85,108,83,66,95,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,72,95,69,69,70,78,83,50,95,49,48,68,105,115,112,111,115,97,98,108,101,69,83,66,95,69,69,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,78,53,114,120,99,112,112,49,48,102,105,120,48,95,116,104,117,110,107,73,90,90,78,83,50,95,53,82,97,110,103,101,73,105,69,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,49,48,79,98,115,101,114,118,97,98,108,101,73,84,95,69,69,69,69,83,55,95,83,55,95,83,55,95,78,83,53,95,73,78,83,50,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,78,75,83,52,95,73,105,69,85,108,78,83,53,95,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,95,99,108,69,83,70,95,69,85,108,83,66,95,78,83,95,56,102,117,110,99,116,105,111,110,73,70,78,83,50,95,49,48,68,105,115,112,111,115,97,98,108,101,69,83,66,95,69,69,69,69,95,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,77,95,69,69,83,74,95,69,69,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,98,97,115,101,73,70,118,118,69,69,69,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,98,97,115,101,73,70,118,82,75,105,69,69,69,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,98,97,115,101,73,70,118,78,53,114,120,99,112,112,49,48,68,105,115,112,111,115,97,98,108,101,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,98,97,115,101,73,70,105,105,105,69,69,69,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,98,97,115,101,73,70,105,105,69,69,69,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,98,97,115,101,73,70,98,105,69,69,69,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,98,97,115,101,73,70,78,53,114,120,99,112,112,52,117,116,105,108,53,109,97,121,98,101,73,105,69,69,105,69,69,69,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,98,97,115,101,73,70,78,53,114,120,99,112,112,49,48,68,105,115,112,111,115,97,98,108,101,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,98,97,115,101,73,70,78,53,114,120,99,112,112,49,48,68,105,115,112,111,115,97,98,108,101,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,54,100,101,116,97,105,108,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,69,69,78,83,52,95,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,83,51,95,78,83,95,56,102,117,110,99,116,105,111,110,73,70,118,83,51,95,69,69,69,69,69,69,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,98,97,115,101,73,70,78,53,114,120,99,112,112,49,48,68,105,115,112,111,115,97,98,108,101,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,54,100,101,116,97,105,108,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,69,69,69,78,83,52,95,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,83,51,95,78,83,95,56,102,117,110,99,116,105,111,110,73,70,118,83,51,95,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,98,97,115,101,73,70,78,53,114,120,99,112,112,49,48,68,105,115,112,111,115,97,98,108,101,69,78,83,95,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,50,95,54,100,101,116,97,105,108,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,69,69,78,83,52,95,73,78,83,50,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,83,51,95,78,83,95,56,102,117,110,99,116,105,111,110,73,70,118,83,51,95,69,69,69,69,69,69,0,0,0,78,53,114,120,99,112,112,57,83,99,104,101,100,117,108,101,114,69,0,0,78,53,114,120,99,112,112,56,79,98,115,101,114,118,101,114,73,105,69,69,0,0,0,0,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,48,95,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,69,0,0,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,48,95,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,69,105,69,69,0,0,0,0,78,53,114,120,99,112,112,54,100,101,116,97,105,108,56,80,114,111,100,117,99,101,114,73,78,83,48,95,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,105,69,69,0,0,0,0,78,53,114,120,99,112,112,54,100,101,116,97,105,108,52,83,105,110,107,73,78,83,48,95,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,49,95,69,105,69,69,0,0,0,0,78,53,114,120,99,112,112,54,100,101,116,97,105,108,52,83,105,110,107,73,78,83,48,95,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,49,95,69,105,69,69,0,0,78,53,114,120,99,112,112,54,100,101,116,97,105,108,52,83,105,110,107,73,78,83,48,95,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,49,95,69,105,69,69,0,0,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,0,0,0,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,54,83,101,108,101,99,116,79,98,115,101,114,118,97,98,108,101,73,105,105,69,49,95,69,0,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,69,0,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,53,87,104,101,114,101,79,98,115,101,114,118,97,98,108,101,73,105,69,49,95,69,0,0,0,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,69,0,78,53,114,120,99,112,112,54,100,101,116,97,105,108,49,52,83,99,97,110,79,98,115,101,114,118,97,98,108,101,73,105,105,69,49,95,69,0,0,0,78,53,114,120,99,112,112,50,53,67,114,101,97,116,101,100,65,117,116,111,68,101,116,97,99,104,79,98,115,101,114,118,101,114,73,105,69,69,0,0,78,53,114,120,99,112,112,50,50,67,117,114,114,101,110,116,84,104,114,101,97,100,83,99,104,101,100,117,108,101,114,69,0,0,0,0,78,53,114,120,99,112,112,50,50,67,117,114,114,101,110,116,84,104,114,101,97,100,83,99,104,101,100,117,108,101,114,49,48,68,101,114,101,99,117,114,115,101,114,69,0,0,0,0,78,53,114,120,99,112,112,49,56,73,109,109,101,100,105,97,116,101,83,99,104,101,100,117,108,101,114,69,0,0,0,0,78,53,114,120,99,112,112,49,55,67,114,101,97,116,101,100,79,98,115,101,114,118,97,98,108,101,73,105,90,78,83,95,53,82,97,110,103,101,73,105,69,69,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,49,48,79,98,115,101,114,118,97,98,108,101,73,84,95,69,69,69,69,83,53,95,83,53,95,83,53,95,78,83,51,95,73,78,83,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,85,108,78,83,51,95,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,95,69,69,0,0,0,0,78,53,114,120,99,112,112,49,53,67,114,101,97,116,101,100,79,98,115,101,114,118,101,114,73,105,69,69,0,0,0,0,78,53,114,120,99,112,112,49,52,76,111,99,97,108,83,99,104,101,100,117,108,101,114,69,0,0,0,0,78,53,114,120,99,112,112,49,48,102,105,120,48,95,116,104,117,110,107,73,90,90,78,83,95,53,82,97,110,103,101,73,105,69,69,78,83,116,51,95,95,49,49,48,115,104,97,114,101,100,95,112,116,114,73,78,83,95,49,48,79,98,115,101,114,118,97,98,108,101,73,84,95,69,69,69,69,83,53,95,83,53,95,83,53,95,78,83,51,95,73,78,83,95,57,83,99,104,101,100,117,108,101,114,69,69,69,69,78,75,83,49,95,73,105,69,85,108,78,83,51,95,73,78,83,95,56,79,98,115,101,114,118,101,114,73,105,69,69,69,69,69,95,99,108,69,83,68,95,69,85,108,83,57,95,78,83,50,95,56,102,117,110,99,116,105,111,110,73,70,78,83,95,49,48,68,105,115,112,111,115,97,98,108,101,69,83,57,95,69,69,69,69,95,69,69,0,0,0,0,78,53,114,120,99,112,112,49,48,79,98,115,101,114,118,97,98,108,101,73,105,69,69,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,49,95,95,118,109,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,24,32,0,0,0,0,0,0,184,32,0,0,0,0,0,0,88,33,0,0,0,0,0,0,248,33,0,0,0,0,0,0,132,34,0,0,0,0,0,0,184,34,0,0,0,0,0,0,8,35,0,0,0,0,0,0,84,35,0,0,0,0,0,0,160,35,0,0,0,0,0,0,228,35,0,0,0,0,0,0,32,36,0,0,0,0,0,0,88,36,0,0,0,0,0,0,200,36,0,0,0,0,0,0,72,37,0,0,0,0,0,0,204,37,0,0,0,0,0,0,56,38,0,0,0,0,0,0,180,38,0,0,0,0,0,0,52,39,0,0,0,0,0,0,160,39,0,0,0,0,0,0,28,40,0,0,0,0,0,0,156,40,0,0,0,0,0,0,72,41,0,0,0,0,0,0,244,41,0,0,0,0,0,0,188,42,0,0,0,0,0,0,72,43,0,0,0,0,0,0,240,43,0,0,0,0,0,0,0,44,0,0,0,0,0,0,16,44,0,0,48,94,0,0,0,0,0,0,32,44,0,0,48,94,0,0,0,0,0,0,44,44,0,0,48,94,0,0,0,0,0,0,64,44,0,0,104,94,0,0,0,0,0,0,84,44,0,0,48,94,0,0,0,0,0,0,100,44,0,0,244,31,0,0,120,44,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,104,100,0,0,0,0,0,0,244,31,0,0,192,44,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,112,100,0,0,0,0,0,0,244,31,0,0,8,45,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,120,100,0,0,0,0,0,0,244,31,0,0,80,45,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,128,100,0,0,0,0,0,0,0,0,0,0,152,45,0,0,92,96,0,0,0,0,0,0,196,45,0,0,92,96,0,0,244,31,0,0,240,45,0,0,0,0,0,0,1,0,0,0,172,99,0,0,0,0,0,0,244,31,0,0,8,46,0,0,0,0,0,0,1,0,0,0,172,99,0,0,0,0,0,0,244,31,0,0,32,46,0,0,0,0,0,0,1,0,0,0,180,99,0,0,0,0,0,0,244,31,0,0,56,46,0,0,0,0,0,0,1,0,0,0,180,99,0,0,0,0,0,0,244,31,0,0,80,46,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,24,101,0,0,0,8,0,0,244,31,0,0,152,46,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,24,101,0,0,0,8,0,0,244,31,0,0,224,46,0,0,0,0,0,0,3,0,0,0,136,97,0,0,2,0,0,0,116,94,0,0,2,0,0,0,56,98,0,0,0,8,0,0,244,31,0,0,40,47,0,0,0,0,0,0,3,0,0,0,136,97,0,0,2,0,0,0,116,94,0,0,2,0,0,0,64,98,0,0,0,8,0,0,0,0,0,0,112,47,0,0,136,97,0,0,0,0,0,0,136,47,0,0,136,97,0,0,244,31,0,0,160,47,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,188,99,0,0,2,0,0,0,244,31,0,0,184,47,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,188,99,0,0,2,0,0,0,0,0,0,0,208,47,0,0,0,0,0,0,228,47,0,0,36,100,0,0,244,31,0,0,0,48,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,20,95,0,0,0,0,0,0,244,31,0,0,68,48,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,44,95,0,0,0,0,0,0,244,31,0,0,136,48,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,68,95,0,0,0,0,0,0,244,31,0,0,204,48,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,92,95,0,0,0,0,0,0,0,0,0,0,16,49,0,0,136,97,0,0,0,0,0,0,36,49,0,0,136,97,0,0,244,31,0,0,56,49,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,48,100,0,0,2,0,0,0,244,31,0,0,92,49,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,48,100,0,0,2,0,0,0,244,31,0,0,128,49,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,48,100,0,0,2,0,0,0,244,31,0,0,164,49,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,48,100,0,0,2,0,0,0,0,0,0,0,200,49,0,0,164,99,0,0,0,0,0,0,224,49,0,0,136,97,0,0,244,31,0,0,248,49,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,16,101,0,0,2,0,0,0,244,31,0,0,12,50,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,16,101,0,0,2,0,0,0,0,0,0,0,32,50,0,0,68,100,0,0,0,0,0,0,68,50,0,0,0,0,0,0,124,50,0,0,0,0,0,0,200,50,0,0,0,0,0,0,20,51,0,0,0,0,0,0,92,51,0,0,0,0,0,0,168,51,0,0,0,0,0,0,240,51,0,0,0,0,0,0,60,52,0,0,0,0,0,0,136,52,0,0,68,100,0,0,0,0,0,0,172,52,0,0,0,0,0,0,208,52,0,0,0,0,0,0,244,52,0,0,68,99,0,0,0,0,0,0,108,53,0,0,68,99,0,0,0,0,0,0,224,53,0,0,68,99,0,0,0,0,0,0,84,54,0,0,68,99,0,0,0,0,0,0,24,55,0,0,68,99,0,0,0,0,0,0,108,55,0,0,68,99,0,0,0,0,0,0,180,55,0,0,68,99,0,0,0,0,0,0,36,56,0,0,68,99,0,0,0,0,0,0,148,56,0,0,68,99,0,0,0,0,0,0,4,57,0,0,68,99,0,0,0,0,0,0,96,57,0,0,68,99,0,0,0,0,0,0,184,57,0,0,68,99,0,0,0,0,0,0,16,58,0,0,68,99,0,0,0,0,0,0,108,58,0,0,68,99,0,0,0,0,0,0,192,58,0,0,68,99,0,0,0,0,0,0,32,59,0,0,68,99,0,0,0,0,0,0,120,59,0,0,68,99,0,0,0,0,0,0,200,59,0,0,68,99,0,0,0,0,0,0,140,60,0,0,68,99,0,0,0,0,0,0,224,60,0,0,68,99,0,0,0,0,0,0,48,61,0,0,68,99,0,0,244,31,0,0,120,61,0,0,0,0,0,0,1,0,0,0,164,99,0,0,0,0,0,0,0,0,0,0,152,61,0,0,68,100,0,0,0,0,0,0,184,61,0,0,48,94,0,0,0,0,0,0,212,61,0,0,104,97,0,0,0,0,0,0,248,61,0,0,104,97,0,0,0,0,0,0,28,62,0,0,0,0,0,0,80,62,0,0,0,0,0,0,132,62,0,0,0,0,0,0,100,63,0,0,0,0,0,0,128,63,0,0,0,0,0,0,156,63,0,0,0,0,0,0,184,63,0,0,244,31,0,0,208,63,0,0,0,0,0,0,1,0,0,0,252,94,0,0,3,244,255,255,244,31,0,0,0,64,0,0,0,0,0,0,1,0,0,0,8,95,0,0,3,244,255,255,244,31,0,0,48,64,0,0,0,0,0,0,1,0,0,0,252,94,0,0,3,244,255,255,244,31,0,0,96,64,0,0,0,0,0,0,1,0,0,0,8,95,0,0,3,244,255,255,0,0,0,0,144,64,0,0,80,94,0,0,0,0,0,0,168,64,0,0,0,0,0,0,192,64,0,0,48,94,0,0,0,0,0,0,216,64,0,0,156,99,0,0,0,0,0,0,240,64,0,0,140,99,0,0,0,0,0,0,12,65,0,0,148,99,0,0,0,0,0,0,40,65,0,0,0,0,0,0,68,65,0,0,0,0,0,0,96,65,0,0,0,0,0,0,124,65,0,0,244,31,0,0,152,65,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,8,101,0,0,2,0,0,0,244,31,0,0,180,65,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,8,101,0,0,2,0,0,0,244,31,0,0,208,65,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,8,101,0,0,2,0,0,0,244,31,0,0,236,65,0,0,0,0,0,0,2,0,0,0,136,97,0,0,2,0,0,0,8,101,0,0,2,0,0,0,0,0,0,0,8,66,0,0,0,0,0,0,32,66,0,0,0,0,0,0,56,66,0,0,0,0,0,0,80,66,0,0,140,99,0,0,0,0,0,0,104,66,0,0,148,99,0,0,0,0,0,0,128,66,0,0,128,102,0,0,0,0,0,0,88,67,0,0,128,102,0,0,0,0,0,0,44,68,0,0,128,102,0,0,0,0,0,0,0,69,0,0,112,102,0,0,0,0,0,0,192,69,0,0,112,102,0,0,0,0,0,0,40,70,0,0,112,102,0,0,0,0,0,0,172,70,0,0,112,102,0,0,0,0,0,0,44,71,0,0,112,102,0,0,0,0,0,0,172,71,0,0,112,102,0,0,0,0,0,0,36,72,0,0,112,102,0,0,0,0,0,0,148,72,0,0,112,102,0,0,0,0,0,0,0,73,0,0,112,102,0,0,0,0,0,0,160,73,0,0,168,102,0,0,0,0,0,0,104,74,0,0,128,102,0,0,0,0,0,0,28,75,0,0,112,102,0,0,0,0,0,0,188,75,0,0,168,102,0,0,0,0,0,0,128,76,0,0,128,102,0,0,0,0,0,0,48,77,0,0,112,102,0,0,0,0,0,0,208,77,0,0,168,102,0,0,0,0,0,0,148,78,0,0,128,102,0,0,0,0,0,0,68,79,0,0,176,102,0,0,0,0,0,0,48,80,0,0,184,102,0,0,0,0,0,0,28,81,0,0,192,102,0,0,0,0,0,0,36,82,0,0,160,102,0,0,0,0,0,0,244,82,0,0,168,102,0,0,0,0,0,0,228,83,0,0,168,102,0,0,0,0,0,0,220,84,0,0,0,0,0,0,0,85,0,0,0,0,0,0,36,85,0,0,0,0,0,0,92,85,0,0,0,0,0,0,128,85,0,0,0,0,0,0,164,85,0,0,0,0,0,0,200,85,0,0,0,0,0,0,0,86,0,0,0,0,0,0,88,86,0,0,0,0,0,0,240,86,0,0,0,0,0,0,136,87,0,0,244,31,0,0,32,88,0,0,0,0,0,0,1,0,0,0,236,97,0,0,2,4,0,0,0,0,0,0,52,88,0,0,244,31,0,0,76,88,0,0,0,0,0,0,2,0,0,0,244,97,0,0,2,4,0,0,96,104,0,0,2,0,0,0,244,31,0,0,132,88,0,0,0,0,0,0,2,0,0,0,4,98,0,0,2,4,0,0,96,104,0,0,2,0,0,0,244,31,0,0,188,88,0,0,0,0,0,0,2,0,0,0,20,98,0,0,2,4,0,0,96,104,0,0,2,0,0,0,0,0,0,0,244,88,0,0,252,97,0,0,0,0,0,0,44,89,0,0,12,98,0,0,0,0,0,0,96,89,0,0,28,98,0,0,0,0,0,0,148,89,0,0,232,102,0,0,244,31,0,0,188,89,0,0,0,0,0,0,2,0,0,0,72,103,0,0,2,8,0,0,224,102,0,0,2,0,0,0,0,0,0,0,228,89,0,0,8,103,0,0,244,31,0,0,8,90,0,0,0,0,0,0,2,0,0,0,84,103,0,0,2,8,0,0,224,102,0,0,2,0,0,0,0,0,0,0,48,90,0,0,40,103,0,0,244,31,0,0,84,90,0,0,0,0,0,0,2,0,0,0,96,103,0,0,2,8,0,0,224,102,0,0,2,0,0,0,244,31,0,0,124,90,0,0,0,0,0,0,2,0,0,0,224,102,0,0,2,0,0,0,36,98,0,0,2,4,0,0,0,0,0,0,164,90,0,0,76,104,0,0,0,0,0,0,200,90,0,0,76,104,0,0,0,0,0,0,248,90,0,0,76,104,0,0,0,0,0,0,24,91,0,0,96,104,0,0,0,0,0,0,172,91,0,0,224,102,0,0,0,0,0,0,204,91,0,0,200,102,0,0,0,0,0,0,232,91,0,0,0,0,0,0,176,92,0,0,0,0,0,0,200,92,0,0,128,104,0,0,0,0,0,0,240,92,0,0,128,104,0,0,0,0,0,0,24,93,0,0,140,104,0,0,0,0,0,0,60,93,0,0,40,94,0,0,48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,65,66,67,68,69,70,120,88,43,45,112,80,105,73,110,78,0,0,0,0])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  function ___gxx_personality_v0() {
    }
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }function __ZSt9terminatev() {
      _exit(-1234);
    }
  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  function ___resumeException(ptr) {
      if (HEAP32[((_llvm_eh_exception.buf)>>2)] == 0) HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr;
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = HEAP32[((_llvm_eh_exception.buf)>>2)];
      if (throwntype == -1) throwntype = HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return ((asm["setTempRet0"](typeArray[i]),thrown)|0);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return ((asm["setTempRet0"](throwntype),thrown)|0);
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      return ptr;
    }
  function ___cxa_free_exception(ptr) {
      try {
        return _free(ptr);
      } catch(e) { // XXX FIXME
      }
    }function ___cxa_end_catch() {
      if (___cxa_end_catch.rethrown) {
        ___cxa_end_catch.rethrown = false;
        return;
      }
      // Clear state flag.
      asm['setThrew'](0);
      // Clear type.
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=0
      // Call destructor if one is registered then clear it.
      var ptr = HEAP32[((_llvm_eh_exception.buf)>>2)];
      var destructor = HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)];
      if (destructor) {
        Runtime.dynCall('vi', destructor, [ptr]);
        HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=0
      }
      // Free ptr if it isn't null.
      if (ptr) {
        ___cxa_free_exception(ptr);
        HEAP32[((_llvm_eh_exception.buf)>>2)]=0
      }
    }
  function _abort() {
      Module['abort']();
    }
  var _llvm_memset_p0i8_i64=_memset;
  function ___cxa_rethrow() {
      ___cxa_end_catch.rethrown = true;
      throw HEAP32[((_llvm_eh_exception.buf)>>2)] + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  function _pthread_mutex_lock() {}
  function _pthread_mutex_unlock() {}
  function ___cxa_guard_acquire(variable) {
      if (!HEAP8[(variable)]) { // ignore SAFE_HEAP stuff because llvm mixes i64 and i8 here
        HEAP8[(variable)]=1;
        return 1;
      }
      return 0;
    }
  function ___cxa_guard_release() {}
  function _pthread_cond_broadcast() {
      return 0;
    }
  function _pthread_cond_wait() {
      return 0;
    }
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }var ___cxa_atexit=_atexit;
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
          FS.FSNode.prototype = {};
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
          this.stack = stackTrace();
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureErrnoError();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  var _mkport=undefined;var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      stream = FS.getStream(stream);
      if (!stream) {
        return -1;
      }
      if (c === -1) {
        // do nothing for EOF character
        return c;
      }
      c = unSign(c & 0xFF);
      stream.ungotten.push(c);
      stream.eof = false;
      return c;
    }
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      if (!streamObj) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop()
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }var _getc=_fgetc;
  function ___errno_location() {
      return ___errno_state;
    }
  Module["_strlen"] = _strlen;
  function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          writeAsciiToMemory(msg, strerrbuf);
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }
  Module["_memmove"] = _memmove;var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      return _write(stream, s, _strlen(s));
    }
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc(10, stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
    }
  function _pthread_mutex_destroy() {}
  function ___assert_fail(condition, filename, line, func) {
      ABORT = true;
      throw 'Assertion failed: ' + Pointer_stringify(condition) + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + stackTrace();
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = (HEAP32[((tempDoublePtr)>>2)]=HEAP32[(((varargs)+(argIndex))>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((varargs)+((argIndex)+(4)))>>2)],(+(HEAPF64[(tempDoublePtr)>>3])));
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+4))>>2)]];
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _usleep(useconds) {
      // int usleep(useconds_t useconds);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/usleep.html
      // We're single-threaded, so use a busy loop. Super-ugly.
      var msec = useconds / 1000;
      if (ENVIRONMENT_IS_WEB && window['performance'] && window['performance']['now']) {
        var start = window['performance']['now']();
        while (window['performance']['now']() - start < msec) {
          // Do nothing.
        }
      } else {
        var start = Date.now();
        while (Date.now() - start < msec) {
          // Do nothing.
        }
      }
      return 0;
    }function _nanosleep(rqtp, rmtp) {
      // int nanosleep(const struct timespec  *rqtp, struct timespec *rmtp);
      var seconds = HEAP32[((rqtp)>>2)];
      var nanoseconds = HEAP32[(((rqtp)+(4))>>2)];
      if (rmtp !== 0) {
        HEAP32[((rmtp)>>2)]=0
        HEAP32[(((rmtp)+(4))>>2)]=0
      }
      return _usleep((seconds * 1e6) + (nanoseconds / 1000));
    }
  function ___cxa_guard_abort() {}
  function _emscripten_get_now() {
      if (!_emscripten_get_now.actual) {
        if (ENVIRONMENT_IS_NODE) {
          _emscripten_get_now.actual = function _emscripten_get_now_actual() {
            var t = process['hrtime']();
            return t[0] * 1e3 + t[1] / 1e6;
          }
        } else if (typeof dateNow !== 'undefined') {
          _emscripten_get_now.actual = dateNow;
        } else if (ENVIRONMENT_IS_WEB && window['performance'] && window['performance']['now']) {
          _emscripten_get_now.actual = function _emscripten_get_now_actual() { return window['performance']['now'](); };
        } else {
          _emscripten_get_now.actual = Date.now;
        }
      }
      return _emscripten_get_now.actual();
    }function _clock_gettime(clk_id, tp) {
      // int clock_gettime(clockid_t clk_id, struct timespec *tp);
      var now;
      if (clk_id === 0) {
        now = Date.now();
      } else {
        now = _emscripten_get_now();
      }
      HEAP32[((tp)>>2)]=Math.floor(now/1000); // seconds
      HEAP32[(((tp)+(4))>>2)]=Math.floor((now % 1000)*1000*1000); // nanoseconds
      return 0;
    }
  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }var _isxdigit_l=_isxdigit;
  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }var _isdigit_l=_isdigit;
  function __getFloat(text) {
      return /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(text);
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function get() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function unget() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC);
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
        // handle %[...]
        if (format[formatIndex] === '%' && format.indexOf('[', formatIndex+1) > 0) {
          var match = /\%([0-9]*)\[(\^)?(\]?[^\]]*)\]/.exec(format.substring(formatIndex));
          if (match) {
            var maxNumCharacters = parseInt(match[1]) || Infinity;
            var negateScanList = (match[2] === '^');
            var scanList = match[3];
            // expand "middle" dashs into character sets
            var middleDashMatch;
            while ((middleDashMatch = /([^\-])\-([^\-])/.exec(scanList))) {
              var rangeStartCharCode = middleDashMatch[1].charCodeAt(0);
              var rangeEndCharCode = middleDashMatch[2].charCodeAt(0);
              for (var expanded = ''; rangeStartCharCode <= rangeEndCharCode; expanded += String.fromCharCode(rangeStartCharCode++));
              scanList = scanList.replace(middleDashMatch[1] + '-' + middleDashMatch[2], expanded);
            }
            var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
            argIndex += Runtime.getAlignSize('void*', null, true);
            fields++;
            for (var i = 0; i < maxNumCharacters; i++) {
              next = get();
              if (negateScanList) {
                if (scanList.indexOf(String.fromCharCode(next)) < 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              } else {
                if (scanList.indexOf(String.fromCharCode(next)) >= 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              }
            }
            // write out null-terminating character
            HEAP8[((argPtr++)|0)]=0;
            formatIndex += match[0].length;
            continue;
          }
        }      
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            next = get();
            while (next > 0 && (!(next in __scanString.whiteSpace)))  {
              buffer.push(String.fromCharCode(next));
              next = get();
            }
            var m = __getFloat(buffer.join(''));
            var last = m ? m[0].length : 0;
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            // Strip the optional 0x prefix for %x.
            if ((type == 'x' || type == 'X') && (next == 48)) {
              var peek = get();
              if (peek == 120 || peek == 88) {
                next = get();
              } else {
                unget();
              }
            }
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if (longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,(tempDouble=parseInt(text, 10),(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'X':
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16)
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                (HEAPF64[(tempDoublePtr)>>3]=parseFloat(text),HEAP32[((argPtr)>>2)]=((HEAP32[((tempDoublePtr)>>2)])|0),HEAP32[(((argPtr)+(4))>>2)]=((HEAP32[(((tempDoublePtr)+(4))>>2)])|0))
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text)
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j]
              }
              break;
          }
          fields++;
        } else if (format[formatIndex].charCodeAt(0) in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }function _sscanf(s, format, varargs) {
      // int sscanf(const char *restrict s, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var index = 0;
      function get() { return HEAP8[(((s)+(index++))|0)]; };
      function unget() { index--; };
      return __scanString(format, get, unget, varargs);
    }
  function _catopen() { throw 'TODO: ' + aborter }
  function _catgets() { throw 'TODO: ' + aborter }
  function _catclose() { throw 'TODO: ' + aborter }
  function _newlocale(mask, locale, base) {
      return _malloc(4);
    }
  function _freelocale(locale) {
      _free(locale);
    }
  function _isascii(chr) {
      return chr >= 0 && (chr & 0x80) == 0;
    }
  function ___ctype_b_loc() {
      // http://refspecs.freestandards.org/LSB_3.0.0/LSB-Core-generic/LSB-Core-generic/baselib---ctype-b-loc.html
      var me = ___ctype_b_loc;
      if (!me.ret) {
        var values = [
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,8195,8194,8194,8194,8194,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,24577,49156,49156,49156,
          49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,55304,55304,55304,55304,55304,55304,55304,55304,
          55304,55304,49156,49156,49156,49156,49156,49156,49156,54536,54536,54536,54536,54536,54536,50440,50440,50440,50440,50440,
          50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,49156,49156,49156,49156,49156,
          49156,54792,54792,54792,54792,54792,54792,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,
          50696,50696,50696,50696,50696,50696,50696,49156,49156,49156,49156,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        ];
        var i16size = 2;
        var arr = _malloc(values.length * i16size);
        for (var i = 0; i < values.length; i++) {
          HEAP16[(((arr)+(i * i16size))>>1)]=values[i]
        }
        me.ret = allocate([arr + 128 * i16size], 'i16*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_tolower_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-tolower-loc.html
      var me = ___ctype_tolower_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,91,92,93,94,95,96,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,
          134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,
          164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,
          194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,
          224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,
          254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_toupper_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-toupper-loc.html
      var me = ___ctype_toupper_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,
          73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,
          81,82,83,84,85,86,87,88,89,90,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,
          145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,
          175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,
          205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,
          235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month 
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)]
      };
      var pattern = Pointer_stringify(format);
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      };
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      };
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      };
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      };
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else { 
            return thisDate.getFullYear()-1;
          }
      };
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls(Math.floor(year/100),2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year. 
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes 
          // January 4th, which is also the week that includes the first Thursday of the year, and 
          // is also the first week that contains at least four days in the year. 
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of 
          // the last week of the preceding year; thus, for Saturday 2nd January 1999, 
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th, 
          // or 31st is a Monday, it and any following days are part of week 1 of the following year. 
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          return leadingNulls(date.tm_hour < 13 ? date.tm_hour : date.tm_hour-12, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour > 0 && date.tm_hour < 13) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Sunday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week) 
          // as a decimal number [01,53]. If the week containing 1 January has four 
          // or more days in the new year, then it is considered week 1. 
          // Otherwise, it is the last week of the previous year, and the next week is week 1. 
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          } 
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Monday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ),
          // or by no characters if no timezone is determinable. 
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich). 
          // If tm_isdst is zero, the standard time offset is used. 
          // If tm_isdst is greater than zero, the daylight savings time offset is used. 
          // If tm_isdst is negative, no characters are returned. 
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%Z': function(date) {
          // Replaced by the timezone name or abbreviation, or by no bytes if no timezone information exists. [ tm_isdst]
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      } 
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }var _strftime_l=_strftime;
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }
  function __parseInt64(str, endptr, base, min, max, unsign) {
      var isNegative = false;
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
      // Check for a plus/minus sign.
      if (HEAP8[(str)] == 45) {
        str++;
        isNegative = true;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
      // Find base.
      var ok = false;
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            ok = true; // we saw an initial zero, perhaps the entire thing is just "0"
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      var start = str;
      // Get digits.
      var chr;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          str++;
          ok = true;
        }
      }
      if (!ok) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return ((asm["setTempRet0"](0),0)|0);
      }
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str
      }
      try {
        var numberString = isNegative ? '-'+Pointer_stringify(start, str - start) : Pointer_stringify(start, str - start);
        i64Math.fromString(numberString, finalBase, min, max, unsign);
      } catch(e) {
        ___setErrNo(ERRNO_CODES.ERANGE); // not quite correct
      }
      return ((asm["setTempRet0"](((HEAP32[(((tempDoublePtr)+(4))>>2)])|0)),((HEAP32[((tempDoublePtr)>>2)])|0))|0);
    }function _strtoull(str, endptr, base) {
      return __parseInt64(str, endptr, base, 0, '18446744073709551615', true);  // ULONG_MAX.
    }var _strtoull_l=_strtoull;
  function _strtoll(str, endptr, base) {
      return __parseInt64(str, endptr, base, '-9223372036854775808', '9223372036854775807');  // LLONG_MIN, LLONG_MAX.
    }var _strtoll_l=_strtoll;
  function _uselocale(locale) {
      return 0;
    }
  var _llvm_va_start=undefined;
  function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }function _asprintf(s, format, varargs) {
      return _sprintf(-s, format, varargs);
    }var _vasprintf=_asprintf;
  function _llvm_va_end() {}
  var _vsnprintf=_snprintf;
  var _vsscanf=_sscanf;
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }
  function _llvm_trap() {
      abort('trap!');
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
            var errorInfo = '?';
            function onContextCreationError(event) {
              errorInfo = event.statusMessage || errorInfo;
            }
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");
 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);
var Math_min = Math.min;
function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiid(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiid"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiid(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiid"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    return Module["dynCall_iiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  try {
    Module["dynCall_viiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    Module["dynCall_viiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  try {
    return Module["dynCall_iiiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env._stdin|0;var p=env.__ZTVN10__cxxabiv117__class_type_infoE|0;var q=env.__ZTVN10__cxxabiv120__si_class_type_infoE|0;var r=env._stderr|0;var s=env.___fsmu8|0;var t=env._stdout|0;var u=env.___dso_handle|0;var v=+env.NaN;var w=+env.Infinity;var x=0;var y=0;var z=0;var A=0;var B=0,C=0,D=0,E=0,F=0.0,G=0,H=0,I=0,J=0.0;var K=0;var L=0;var M=0;var N=0;var O=0;var P=0;var Q=0;var R=0;var S=0;var T=0;var U=global.Math.floor;var V=global.Math.abs;var W=global.Math.sqrt;var X=global.Math.pow;var Y=global.Math.cos;var Z=global.Math.sin;var _=global.Math.tan;var $=global.Math.acos;var aa=global.Math.asin;var ab=global.Math.atan;var ac=global.Math.atan2;var ad=global.Math.exp;var ae=global.Math.log;var af=global.Math.ceil;var ag=global.Math.imul;var ah=env.abort;var ai=env.assert;var aj=env.asmPrintInt;var ak=env.asmPrintFloat;var al=env.min;var am=env.invoke_viiiii;var an=env.invoke_viiii;var ao=env.invoke_vi;var ap=env.invoke_vii;var aq=env.invoke_iii;var ar=env.invoke_iiii;var as=env.invoke_viiiiiid;var at=env.invoke_ii;var au=env.invoke_viiiiiii;var av=env.invoke_viiiiid;var aw=env.invoke_v;var ax=env.invoke_iiiiiiiii;var ay=env.invoke_viiiiiiiii;var az=env.invoke_viiiiiiii;var aA=env.invoke_viiiiii;var aB=env.invoke_iiiii;var aC=env.invoke_iiiiii;var aD=env.invoke_viii;var aE=env._llvm_lifetime_end;var aF=env.__scanString;var aG=env._pthread_mutex_lock;var aH=env.___cxa_end_catch;var aI=env._strtoull;var aJ=env._fflush;var aK=env._fputc;var aL=env._fwrite;var aM=env._send;var aN=env._fputs;var aO=env._emscripten_get_now;var aP=env._isspace;var aQ=env._read;var aR=env.___cxa_guard_abort;var aS=env._newlocale;var aT=env.___gxx_personality_v0;var aU=env._pthread_cond_wait;var aV=env.___cxa_rethrow;var aW=env.___resumeException;var aX=env._llvm_va_end;var aY=env._clock_gettime;var aZ=env._snprintf;var a_=env._fgetc;var a$=env.__getFloat;var a0=env._atexit;var a1=env.___cxa_free_exception;var a2=env.___setErrNo;var a3=env._isxdigit;var a4=env._exit;var a5=env._sprintf;var a6=env.___ctype_b_loc;var a7=env._freelocale;var a8=env._catgets;var a9=env.__isLeapYear;var ba=env._asprintf;var bb=env.___cxa_is_number_type;var bc=env.___cxa_does_inherit;var bd=env.___cxa_guard_acquire;var be=env.___cxa_begin_catch;var bf=env._recv;var bg=env.__parseInt64;var bh=env.__ZSt18uncaught_exceptionv;var bi=env.___cxa_call_unexpected;var bj=env.__exit;var bk=env._strftime;var bl=env.___cxa_throw;var bm=env._llvm_eh_exception;var bn=env._pread;var bo=env._usleep;var bp=env.__arraySum;var bq=env._sysconf;var br=env._puts;var bs=env._nanosleep;var bt=env.___cxa_find_matching_catch;var bu=env.__formatString;var bv=env._pthread_cond_broadcast;var bw=env.__ZSt9terminatev;var bx=env._isascii;var by=env._pthread_mutex_unlock;var bz=env._sbrk;var bA=env.___errno_location;var bB=env._strerror;var bC=env._pthread_mutex_destroy;var bD=env._catclose;var bE=env._llvm_lifetime_start;var bF=env.___cxa_guard_release;var bG=env._ungetc;var bH=env._uselocale;var bI=env._sscanf;var bJ=env.___assert_fail;var bK=env._fread;var bL=env._abort;var bM=env._isdigit;var bN=env._strtoll;var bO=env.__addDays;var bP=env.__reallyNegative;var bQ=env._write;var bR=env.___cxa_allocate_exception;var bS=env._catopen;var bT=env.___ctype_toupper_loc;var bU=env.___ctype_tolower_loc;var bV=env._pwrite;var bW=env._strerror_r;var bX=env._llvm_trap;var bY=env._time;var bZ=0.0;
// EMSCRIPTEN_START_FUNCS
function cg(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+3&-4;return b|0}function ch(){return i|0}function ci(a){a=a|0;i=a}function cj(a,b){a=a|0;b=b|0;if((x|0)==0){x=a;y=b}}function ck(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function cl(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function cm(a){a=a|0;K=a}function cn(a){a=a|0;L=a}function co(a){a=a|0;M=a}function cp(a){a=a|0;N=a}function cq(a){a=a|0;O=a}function cr(a){a=a|0;P=a}function cs(a){a=a|0;Q=a}function ct(a){a=a|0;R=a}function cu(a){a=a|0;S=a}function cv(a){a=a|0;T=a}function cw(){c[690]=p+8;c[692]=p+8;c[694]=p+8;c[696]=p+8;c[698]=p+8;c[700]=p+8;c[702]=q+8;c[705]=q+8;c[708]=q+8;c[711]=q+8;c[714]=q+8;c[717]=q+8;c[5976]=p+8;c[5978]=p+8;c[5980]=p+8;c[5982]=p+8;c[5984]=p+8;c[5986]=p+8;c[5988]=p+8;c[5990]=p+8;c[5992]=p+8;c[5994]=p+8;c[5996]=p+8;c[5998]=p+8;c[6e3]=p+8;c[6002]=p+8;c[6004]=p+8;c[6006]=p+8;c[6008]=p+8;c[6010]=p+8;c[6012]=p+8;c[6014]=p+8;c[6016]=p+8;c[6018]=p+8;c[6020]=p+8;c[6022]=p+8;c[6024]=p+8;c[6026]=p+8;c[6028]=p+8;c[6030]=q+8;c[6033]=q+8;c[6036]=q+8;c[6039]=q+8;c[6042]=q+8;c[6045]=p+8;c[6079]=q+8;c[6082]=q+8;c[6145]=q+8;c[6148]=q+8;c[6167]=p+8;c[6169]=q+8;c[6204]=q+8;c[6207]=q+8;c[6242]=q+8;c[6245]=q+8;c[6264]=q+8;c[6267]=p+8;c[6269]=p+8;c[6271]=p+8;c[6273]=p+8;c[6275]=p+8;c[6277]=p+8;c[6279]=p+8;c[6281]=p+8;c[6283]=q+8;c[6286]=p+8;c[6288]=p+8;c[6290]=q+8;c[6293]=q+8;c[6296]=q+8;c[6299]=q+8;c[6302]=q+8;c[6305]=q+8;c[6308]=q+8;c[6311]=q+8;c[6314]=q+8;c[6317]=q+8;c[6320]=q+8;c[6323]=q+8;c[6326]=q+8;c[6329]=q+8;c[6332]=q+8;c[6335]=q+8;c[6338]=q+8;c[6341]=q+8;c[6344]=q+8;c[6347]=q+8;c[6350]=q+8;c[6359]=q+8;c[6362]=q+8;c[6365]=q+8;c[6368]=q+8;c[6371]=p+8;c[6373]=p+8;c[6375]=p+8;c[6377]=p+8;c[6379]=p+8;c[6381]=p+8;c[6383]=p+8;c[6409]=q+8;c[6412]=p+8;c[6414]=q+8;c[6417]=q+8;c[6420]=q+8;c[6423]=q+8;c[6426]=p+8;c[6428]=p+8;c[6430]=p+8;c[6432]=p+8;c[6466]=p+8;c[6468]=p+8;c[6470]=p+8;c[6472]=q+8;c[6475]=q+8;c[6478]=q+8;c[6481]=q+8;c[6484]=q+8;c[6487]=q+8;c[6490]=q+8;c[6493]=q+8;c[6496]=q+8;c[6499]=q+8;c[6502]=q+8;c[6505]=q+8;c[6508]=q+8;c[6511]=q+8;c[6514]=q+8;c[6517]=q+8;c[6520]=q+8;c[6523]=q+8;c[6526]=q+8;c[6529]=q+8;c[6532]=q+8;c[6535]=q+8;c[6538]=q+8;c[6541]=q+8;c[6544]=q+8;c[6547]=q+8;c[6550]=q+8;c[6553]=q+8;c[6556]=p+8;c[6558]=p+8;c[6560]=p+8;c[6562]=p+8;c[6564]=p+8;c[6566]=p+8;c[6568]=p+8;c[6570]=p+8;c[6572]=p+8;c[6574]=p+8;c[6576]=p+8;c[6584]=p+8;c[6610]=q+8;c[6613]=q+8;c[6616]=q+8;c[6619]=q+8;c[6630]=q+8;c[6641]=q+8;c[6660]=q+8;c[6663]=q+8;c[6666]=q+8;c[6669]=q+8;c[6672]=q+8;c[6675]=q+8;c[6678]=p+8;c[6680]=p+8;c[6682]=q+8;c[6685]=q+8;c[6688]=q+8;c[6691]=q+8}function cx(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;d=i;i=i+220|0;e=d|0;f=d+24|0;g=d+48|0;h=d+72|0;j=d+96|0;k=d+120|0;l=d+144|0;m=d+168|0;n=d+172|0;o=d+196|0;p=d+204|0;q=d+212|0;c[m>>2]=0;while(1){r=qH(56)|0;if((r|0)!=0){break}s=(I=c[7664]|0,c[7664]=I+0,I);if((s|0)==0){t=9;break}b8[s&1]()}if((t|0)==9){s=bR(4)|0;c[s>>2]=3284;bl(s|0,24120,94);return 0}s=r+4|0;c[s>>2]=0;u=r+8|0;c[u>>2]=0;c[r>>2]=5264;v=r+12|0;c[r+16>>2]=0;c[r+20>>2]=0;c[v>>2]=8088;c[r+52>>2]=0;qP(r+24|0,0,26)|0;w=r;x=(v|0)==0?0:r+16|0;y=v;do{if((x|0)!=0){I=c[u>>2]|0,c[u>>2]=I+1,I;c[x>>2]=y;v=x+4|0;z=c[v>>2]|0;c[v>>2]=w;if((z|0)==0){break}v=z+8|0;if(((I=c[v>>2]|0,c[v>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[z>>2]|0)+16>>2]&1023](z)}}while(0);c[q>>2]=y;y=q+4|0;c[y>>2]=w;I=c[s>>2]|0,c[s>>2]=I+1,I;cy(p,b,q);q=p|0;b=c[q>>2]|0;x=p+4|0;p=c[x>>2]|0;c[q>>2]=0;c[x>>2]=0;x=l+16|0;q=l;c[x>>2]=q;c[l>>2]=2216;while(1){A=qH(120)|0;if((A|0)!=0){break}z=(I=c[7664]|0,c[7664]=I+0,I);if((z|0)==0){t=26;break}b8[z&1]()}if((t|0)==26){t=bR(4)|0;c[t>>2]=3284;bl(t|0,24120,94);return 0}c[A+4>>2]=0;t=A+8|0;c[t>>2]=0;c[A>>2]=5104;z=A+16|0;v=z;B=(p|0)==0;if(!B){C=p+4|0;I=c[C>>2]|0,c[C>>2]=I+1,I}C=c[x>>2]|0;do{if((C|0)==0){c[f+16>>2]=0}else{if((C|0)==(q|0)){D=f;c[f+16>>2]=D;b1[c[(c[l>>2]|0)+12>>2]&255](q,D);break}else{c[f+16>>2]=C;c[x>>2]=0;break}}}while(0);C=g+16|0;D=g;c[C>>2]=D;c[g>>2]=7568;E=z;c[e+16>>2]=e;c[e>>2]=7520;c[e+4>>2]=z;c[A+20>>2]=0;c[A+24>>2]=0;c[E>>2]=7792;e=A+32|0;c[A+48>>2]=e;if((e|0)!=0){c[e>>2]=7520;c[A+36>>2]=z}c[E>>2]=7928;c[A+56>>2]=b;c[A+60>>2]=p;b=A+64|0;a[b]=0;E=A+68|0;if((E|0)!=0){c[E>>2]=0}a[b]=1;b=A+72|0;E=f+16|0;e=c[E>>2]|0;do{if((e|0)==0){c[A+88>>2]=0}else{if((e|0)==(f|0)){F=b;c[A+88>>2]=F;G=c[E>>2]|0;b1[c[(c[G>>2]|0)+12>>2]&255](G,F);break}else{c[A+88>>2]=e;c[E>>2]=0;break}}}while(0);e=A+96|0;b=c[C>>2]|0;do{if((b|0)==0){c[A+112>>2]=0}else{if((b|0)==(D|0)){F=e;c[A+112>>2]=F;G=c[C>>2]|0;b1[c[(c[G>>2]|0)+12>>2]&255](G,F);break}else{c[A+112>>2]=b;c[C>>2]=0;break}}}while(0);b=c[C>>2]|0;do{if((b|0)==(D|0)){b0[c[(c[g>>2]|0)+16>>2]&1023](D)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[E>>2]|0;do{if((b|0)==(f|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=A;f=(z|0)==0?0:A+20|0;do{if((f|0)!=0){I=c[t>>2]|0,c[t>>2]=I+1,I;c[f>>2]=v;A=f+4|0;E=c[A>>2]|0;c[A>>2]=b;if((E|0)==0){break}A=E+8|0;if(((I=c[A>>2]|0,c[A>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[E>>2]|0)+16>>2]&1023](E)}}while(0);c[o>>2]=z;z=o+4|0;c[z>>2]=b;b=c[x>>2]|0;do{if((b|0)==(q|0)){b0[c[(c[l>>2]|0)+16>>2]&1023](q)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=h+16|0;q=h;c[b>>2]=q;c[h>>2]=2172;c[h+4>>2]=m;l=j+16|0;c[l>>2]=0;x=k+16|0;c[x>>2]=0;cB(n,o|0,h,j,k);o=c[x>>2]|0;do{if((o|0)==(k|0)){b0[c[(c[o>>2]|0)+16>>2]&1023](o)}else{if((o|0)==0){break}b0[c[(c[o>>2]|0)+20>>2]&1023](o)}}while(0);o=c[l>>2]|0;do{if((o|0)==(j|0)){b0[c[(c[o>>2]|0)+16>>2]&1023](o)}else{if((o|0)==0){break}b0[c[(c[o>>2]|0)+20>>2]&1023](o)}}while(0);o=c[b>>2]|0;do{if((o|0)==(q|0)){b0[c[(c[h>>2]|0)+16>>2]&1023](q)}else{if((o|0)==0){break}b0[c[(c[o>>2]|0)+20>>2]&1023](o)}}while(0);o=c[z>>2]|0;do{if((o|0)!=0){z=o+4|0;if(((I=c[z>>2]|0,c[z>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+8>>2]&1023](o|0);z=o+8|0;if(((I=c[z>>2]|0,c[z>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+16>>2]&1023](o)}}while(0);do{if(!B){o=p+4|0;if(((I=c[o>>2]|0,c[o>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[p>>2]|0)+8>>2]&1023](p|0);o=p+8|0;if(((I=c[o>>2]|0,c[o>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[p>>2]|0)+16>>2]&1023](p)}}while(0);p=c[y>>2]|0;do{if((p|0)!=0){y=p+4|0;if(((I=c[y>>2]|0,c[y>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[p>>2]|0)+8>>2]&1023](p|0);y=p+8|0;if(((I=c[y>>2]|0,c[y>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[p>>2]|0)+16>>2]&1023](p)}}while(0);p=c[m>>2]|0;m=c[n+16>>2]|0;do{if((m|0)==(n|0)){b0[c[(c[m>>2]|0)+16>>2]&1023](m)}else{if((m|0)==0){break}b0[c[(c[m>>2]|0)+20>>2]&1023](m)}}while(0);if(((I=c[s>>2]|0,c[s>>2]=I+ -1,I)|0)!=0){i=d;return p|0}b0[c[(c[r>>2]|0)+8>>2]&1023](r);if(((I=c[u>>2]|0,c[u>>2]=I+ -1,I)|0)!=0){i=d;return p|0}b0[c[(c[r>>2]|0)+16>>2]&1023](w);i=d;return p|0}function cy(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=d|0;f=c[e>>2]|0;do{if((f|0)==0){while(1){g=qH(24)|0;if((g|0)!=0){break}h=(I=c[7664]|0,c[7664]=I+0,I);if((h|0)==0){i=10;break}b8[h&1]()}if((i|0)==10){h=bR(4)|0;c[h>>2]=3284;bl(h|0,24120,94)}c[g+4>>2]=0;h=g+8|0;c[h>>2]=0;c[g>>2]=5168;j=g+12|0;c[g+16>>2]=0;c[g+20>>2]=0;c[j>>2]=8016;k=g;l=(j|0)==0?0:g+16|0;m=j;do{if((l|0)!=0){I=c[h>>2]|0,c[h>>2]=I+1,I;c[l>>2]=m;j=l+4|0;n=c[j>>2]|0;c[j>>2]=k;if((n|0)==0){break}j=n+8|0;if(((I=c[j>>2]|0,c[j>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[n>>2]|0)+16>>2]&1023](n)}}while(0);c[e>>2]=m;l=d+4|0;h=c[l>>2]|0;c[l>>2]=k;if((h|0)==0){o=m;p=l;break}n=h+4|0;do{if(((I=c[n>>2]|0,c[n>>2]=I+ -1,I)|0)==0){b0[c[(c[h>>2]|0)+8>>2]&1023](h|0);j=h+8|0;if(((I=c[j>>2]|0,c[j>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[h>>2]|0)+16>>2]&1023](h)}}while(0);o=c[e>>2]|0;p=l}else{o=f;p=d+4|0}}while(0);d=c[p>>2]|0;if((d|0)!=0){p=d+4|0;I=c[p>>2]|0,c[p>>2]=I+1,I}while(1){q=qH(36)|0;if((q|0)!=0){i=34;break}p=(I=c[7664]|0,c[7664]=I+0,I);if((p|0)==0){break}b8[p&1]()}if((i|0)==34){c[q+4>>2]=0;c[q+8>>2]=0;c[q>>2]=5296;i=q+12|0;c[i>>2]=8124;c[q+16>>2]=1;c[q+20>>2]=b;c[q+24>>2]=1;c[q+28>>2]=o;c[q+32>>2]=d;c[a>>2]=i;c[a+4>>2]=q;return}q=bR(4)|0;c[q>>2]=3284;bl(q|0,24120,94)}function cz(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;b=i;i=i+172|0;d=b|0;e=b+24|0;f=b+48|0;g=b+72|0;h=b+96|0;j=b+120|0;k=b+124|0;l=b+148|0;m=b+156|0;n=b+164|0;c[j>>2]=0;while(1){o=qH(56)|0;if((o|0)!=0){break}p=(I=c[7664]|0,c[7664]=I+0,I);if((p|0)==0){q=9;break}b8[p&1]()}if((q|0)==9){p=bR(4)|0;c[p>>2]=3284;bl(p|0,24120,94);return 0}p=o+4|0;c[p>>2]=0;r=o+8|0;c[r>>2]=0;c[o>>2]=5264;s=o+12|0;c[o+16>>2]=0;c[o+20>>2]=0;c[s>>2]=8088;c[o+52>>2]=0;qP(o+24|0,0,26)|0;t=o;u=(s|0)==0?0:o+16|0;v=s;do{if((u|0)!=0){I=c[r>>2]|0,c[r>>2]=I+1,I;c[u>>2]=v;s=u+4|0;w=c[s>>2]|0;c[s>>2]=t;if((w|0)==0){break}s=w+8|0;if(((I=c[s>>2]|0,c[s>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[w>>2]|0)+16>>2]&1023](w)}}while(0);c[n>>2]=v;v=n+4|0;c[v>>2]=t;I=c[p>>2]|0,c[p>>2]=I+1,I;cy(m,a,n);n=m|0;a=c[n>>2]|0;u=m+4|0;m=c[u>>2]|0;c[n>>2]=0;c[u>>2]=0;while(1){x=qH(88)|0;if((x|0)!=0){break}u=(I=c[7664]|0,c[7664]=I+0,I);if((u|0)==0){q=26;break}b8[u&1]()}if((q|0)==26){u=bR(4)|0;c[u>>2]=3284;bl(u|0,24120,94);return 0}c[x+4>>2]=0;u=x+8|0;c[u>>2]=0;c[x>>2]=5040;n=x+16|0;w=h+16|0;s=h;c[w>>2]=s;c[h>>2]=2040;y=n;c[g+16>>2]=g;c[g>>2]=7424;c[g+4>>2]=n;c[x+20>>2]=0;c[x+24>>2]=0;c[y>>2]=7744;g=x+32|0;c[x+48>>2]=g;if((g|0)!=0){c[g>>2]=7424;c[x+36>>2]=n}c[y>>2]=7816;c[x+56>>2]=a;c[x+60>>2]=m;a=(m|0)==0;do{if(a){z=2040;q=35}else{y=m+4|0;I=c[y>>2]|0,c[y>>2]=I+1,I;y=c[w>>2]|0;if((y|0)==0){c[x+80>>2]=0;break}if((y|0)==(s|0)){z=c[h>>2]|0;q=35;break}else{c[x+80>>2]=y;c[w>>2]=0;break}}}while(0);do{if((q|0)==35){y=x+64|0;c[x+80>>2]=y;b1[c[z+12>>2]&255](s,y);y=c[w>>2]|0;if((y|0)==(s|0)){b0[c[(c[h>>2]|0)+16>>2]&1023](s);break}if((y|0)==0){break}b0[c[(c[y>>2]|0)+20>>2]&1023](y)}}while(0);s=x;h=(n|0)==0?0:x+20|0;do{if((h|0)!=0){I=c[u>>2]|0,c[u>>2]=I+1,I;c[h>>2]=n;x=h+4|0;w=c[x>>2]|0;c[x>>2]=s;if((w|0)==0){break}x=w+8|0;if(((I=c[x>>2]|0,c[x>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[w>>2]|0)+16>>2]&1023](w)}}while(0);c[l>>2]=n;n=l+4|0;c[n>>2]=s;s=d+16|0;h=d;c[s>>2]=h;c[d>>2]=1996;c[d+4>>2]=j;u=e+16|0;c[u>>2]=0;w=f+16|0;c[w>>2]=0;cB(k,l|0,d,e,f);l=c[w>>2]|0;do{if((l|0)==(f|0)){b0[c[(c[l>>2]|0)+16>>2]&1023](l)}else{if((l|0)==0){break}b0[c[(c[l>>2]|0)+20>>2]&1023](l)}}while(0);l=c[u>>2]|0;do{if((l|0)==(e|0)){b0[c[(c[l>>2]|0)+16>>2]&1023](l)}else{if((l|0)==0){break}b0[c[(c[l>>2]|0)+20>>2]&1023](l)}}while(0);l=c[s>>2]|0;do{if((l|0)==(h|0)){b0[c[(c[d>>2]|0)+16>>2]&1023](h)}else{if((l|0)==0){break}b0[c[(c[l>>2]|0)+20>>2]&1023](l)}}while(0);l=c[n>>2]|0;do{if((l|0)!=0){n=l+4|0;if(((I=c[n>>2]|0,c[n>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[l>>2]|0)+8>>2]&1023](l|0);n=l+8|0;if(((I=c[n>>2]|0,c[n>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[l>>2]|0)+16>>2]&1023](l)}}while(0);do{if(!a){l=m+4|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[m>>2]|0)+8>>2]&1023](m|0);l=m+8|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[m>>2]|0)+16>>2]&1023](m)}}while(0);m=c[v>>2]|0;do{if((m|0)!=0){v=m+4|0;if(((I=c[v>>2]|0,c[v>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[m>>2]|0)+8>>2]&1023](m|0);v=m+8|0;if(((I=c[v>>2]|0,c[v>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[m>>2]|0)+16>>2]&1023](m)}}while(0);m=c[j>>2]|0;j=c[k+16>>2]|0;do{if((j|0)==(k|0)){b0[c[(c[j>>2]|0)+16>>2]&1023](j)}else{if((j|0)==0){break}b0[c[(c[j>>2]|0)+20>>2]&1023](j)}}while(0);if(((I=c[p>>2]|0,c[p>>2]=I+ -1,I)|0)!=0){i=b;return m|0}b0[c[(c[o>>2]|0)+8>>2]&1023](o);if(((I=c[r>>2]|0,c[r>>2]=I+ -1,I)|0)!=0){i=b;return m|0}b0[c[(c[o>>2]|0)+16>>2]&1023](t);i=b;return m|0}function cA(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;b=i;i=i+172|0;d=b|0;e=b+24|0;f=b+48|0;g=b+72|0;h=b+96|0;j=b+120|0;k=b+124|0;l=b+148|0;m=b+156|0;n=b+164|0;c[j>>2]=0;while(1){o=qH(56)|0;if((o|0)!=0){break}p=(I=c[7664]|0,c[7664]=I+0,I);if((p|0)==0){q=9;break}b8[p&1]()}if((q|0)==9){p=bR(4)|0;c[p>>2]=3284;bl(p|0,24120,94);return 0}p=o+4|0;c[p>>2]=0;r=o+8|0;c[r>>2]=0;c[o>>2]=5264;s=o+12|0;c[o+16>>2]=0;c[o+20>>2]=0;c[s>>2]=8088;c[o+52>>2]=0;qP(o+24|0,0,26)|0;t=o;u=(s|0)==0?0:o+16|0;v=s;do{if((u|0)!=0){I=c[r>>2]|0,c[r>>2]=I+1,I;c[u>>2]=v;s=u+4|0;w=c[s>>2]|0;c[s>>2]=t;if((w|0)==0){break}s=w+8|0;if(((I=c[s>>2]|0,c[s>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[w>>2]|0)+16>>2]&1023](w)}}while(0);c[n>>2]=v;v=n+4|0;c[v>>2]=t;I=c[p>>2]|0,c[p>>2]=I+1,I;cy(m,a,n);n=m|0;a=c[n>>2]|0;u=m+4|0;m=c[u>>2]|0;c[n>>2]=0;c[u>>2]=0;while(1){x=qH(88)|0;if((x|0)!=0){break}u=(I=c[7664]|0,c[7664]=I+0,I);if((u|0)==0){q=26;break}b8[u&1]()}if((q|0)==26){u=bR(4)|0;c[u>>2]=3284;bl(u|0,24120,94);return 0}c[x+4>>2]=0;u=x+8|0;c[u>>2]=0;c[x>>2]=5072;n=x+16|0;w=h+16|0;s=h;c[w>>2]=s;c[h>>2]=2128;y=n;c[g+16>>2]=g;c[g>>2]=7472;c[g+4>>2]=n;c[x+20>>2]=0;c[x+24>>2]=0;c[y>>2]=7768;g=x+32|0;c[x+48>>2]=g;if((g|0)!=0){c[g>>2]=7472;c[x+36>>2]=n}c[y>>2]=7872;c[x+56>>2]=a;c[x+60>>2]=m;a=(m|0)==0;do{if(a){z=2128;q=35}else{y=m+4|0;I=c[y>>2]|0,c[y>>2]=I+1,I;y=c[w>>2]|0;if((y|0)==0){c[x+80>>2]=0;break}if((y|0)==(s|0)){z=c[h>>2]|0;q=35;break}else{c[x+80>>2]=y;c[w>>2]=0;break}}}while(0);do{if((q|0)==35){y=x+64|0;c[x+80>>2]=y;b1[c[z+12>>2]&255](s,y);y=c[w>>2]|0;if((y|0)==(s|0)){b0[c[(c[h>>2]|0)+16>>2]&1023](s);break}if((y|0)==0){break}b0[c[(c[y>>2]|0)+20>>2]&1023](y)}}while(0);s=x;h=(n|0)==0?0:x+20|0;do{if((h|0)!=0){I=c[u>>2]|0,c[u>>2]=I+1,I;c[h>>2]=n;x=h+4|0;w=c[x>>2]|0;c[x>>2]=s;if((w|0)==0){break}x=w+8|0;if(((I=c[x>>2]|0,c[x>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[w>>2]|0)+16>>2]&1023](w)}}while(0);c[l>>2]=n;n=l+4|0;c[n>>2]=s;s=d+16|0;h=d;c[s>>2]=h;c[d>>2]=2084;c[d+4>>2]=j;u=e+16|0;c[u>>2]=0;w=f+16|0;c[w>>2]=0;cB(k,l|0,d,e,f);l=c[w>>2]|0;do{if((l|0)==(f|0)){b0[c[(c[l>>2]|0)+16>>2]&1023](l)}else{if((l|0)==0){break}b0[c[(c[l>>2]|0)+20>>2]&1023](l)}}while(0);l=c[u>>2]|0;do{if((l|0)==(e|0)){b0[c[(c[l>>2]|0)+16>>2]&1023](l)}else{if((l|0)==0){break}b0[c[(c[l>>2]|0)+20>>2]&1023](l)}}while(0);l=c[s>>2]|0;do{if((l|0)==(h|0)){b0[c[(c[d>>2]|0)+16>>2]&1023](h)}else{if((l|0)==0){break}b0[c[(c[l>>2]|0)+20>>2]&1023](l)}}while(0);l=c[n>>2]|0;do{if((l|0)!=0){n=l+4|0;if(((I=c[n>>2]|0,c[n>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[l>>2]|0)+8>>2]&1023](l|0);n=l+8|0;if(((I=c[n>>2]|0,c[n>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[l>>2]|0)+16>>2]&1023](l)}}while(0);do{if(!a){l=m+4|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[m>>2]|0)+8>>2]&1023](m|0);l=m+8|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[m>>2]|0)+16>>2]&1023](m)}}while(0);m=c[v>>2]|0;do{if((m|0)!=0){v=m+4|0;if(((I=c[v>>2]|0,c[v>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[m>>2]|0)+8>>2]&1023](m|0);v=m+8|0;if(((I=c[v>>2]|0,c[v>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[m>>2]|0)+16>>2]&1023](m)}}while(0);m=c[j>>2]|0;j=c[k+16>>2]|0;do{if((j|0)==(k|0)){b0[c[(c[j>>2]|0)+16>>2]&1023](j)}else{if((j|0)==0){break}b0[c[(c[j>>2]|0)+20>>2]&1023](j)}}while(0);if(((I=c[p>>2]|0,c[p>>2]=I+ -1,I)|0)!=0){i=b;return m|0}b0[c[(c[o>>2]|0)+8>>2]&1023](o);if(((I=c[r>>2]|0,c[r>>2]=I+ -1,I)|0)!=0){i=b;return m|0}b0[c[(c[o>>2]|0)+16>>2]&1023](t);i=b;return m|0}function cB(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+80|0;h=g|0;j=g+24|0;k=g+48|0;l=g+72|0;m=d+16|0;n=c[m>>2]|0;do{if((n|0)==0){c[h+16>>2]=0}else{if((n|0)==(d|0)){o=h;c[h+16>>2]=o;b1[c[(c[n>>2]|0)+12>>2]&255](n,o);break}else{c[h+16>>2]=n;c[m>>2]=0;break}}}while(0);m=e+16|0;n=c[m>>2]|0;do{if((n|0)==0){c[j+16>>2]=0}else{if((n|0)==(e|0)){d=j;c[j+16>>2]=d;b1[c[(c[n>>2]|0)+12>>2]&255](n,d);break}else{c[j+16>>2]=n;c[m>>2]=0;break}}}while(0);m=f+16|0;n=c[m>>2]|0;do{if((n|0)==0){c[k+16>>2]=0}else{if((n|0)==(f|0)){e=k;c[k+16>>2]=e;b1[c[(c[n>>2]|0)+12>>2]&255](n,e);break}else{c[k+16>>2]=n;c[m>>2]=0;break}}}while(0);while(1){p=qH(96)|0;if((p|0)!=0){break}m=(I=c[7664]|0,c[7664]=I+0,I);if((m|0)==0){q=27;break}b8[m&1]()}if((q|0)==27){q=bR(4)|0;c[q>>2]=3284;bl(q|0,24120,94)}q=p+4|0;c[q>>2]=0;m=p+8|0;c[m>>2]=0;c[p>>2]=5360;n=p+16|0;c[n>>2]=8148;c[p+40>>2]=0;c[p+64>>2]=0;c[p+88>>2]=0;f=p;e=p+24|0;d=p+40|0;o=e;if((e|0)==0){bX()}c[d>>2]=0;e=h+16|0;r=c[e>>2]|0;do{if((r|0)==0){c[d>>2]=0}else{s=h;if((r|0)==(s|0)){c[d>>2]=o;b1[c[(c[h>>2]|0)+12>>2]&255](s,o);break}else{c[d>>2]=r;c[e>>2]=0;break}}}while(0);r=p+64|0;d=c[r>>2]|0;o=p+48|0;do{if((d|0)==(o|0)){b0[c[(c[d>>2]|0)+16>>2]&1023](d)}else{if((d|0)==0){break}b0[c[(c[d>>2]|0)+20>>2]&1023](d)}}while(0);c[r>>2]=0;d=j+16|0;s=c[d>>2]|0;do{if((s|0)==0){c[r>>2]=0}else{t=j;if((s|0)==(t|0)){c[r>>2]=o;b1[c[(c[j>>2]|0)+12>>2]&255](t,o);break}else{c[r>>2]=s;c[d>>2]=0;break}}}while(0);s=p+88|0;r=c[s>>2]|0;o=p+72|0;do{if((r|0)==(o|0)){b0[c[(c[r>>2]|0)+16>>2]&1023](r)}else{if((r|0)==0){break}b0[c[(c[r>>2]|0)+20>>2]&1023](r)}}while(0);c[s>>2]=0;r=k+16|0;t=c[r>>2]|0;do{if((t|0)==0){c[s>>2]=0}else{u=k;if((t|0)==(u|0)){c[s>>2]=o;b1[c[(c[k>>2]|0)+12>>2]&255](u,o);break}else{c[s>>2]=t;c[r>>2]=0;break}}}while(0);t=n;I=c[q>>2]|0,c[q>>2]=I+1,I;do{if(((I=c[q>>2]|0,c[q>>2]=I+ -1,I)|0)==0){b0[c[(c[p>>2]|0)+8>>2]&1023](p);if(((I=c[m>>2]|0,c[m>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[p>>2]|0)+16>>2]&1023](f)}}while(0);m=c[r>>2]|0;r=k;do{if((m|0)==(r|0)){b0[c[(c[k>>2]|0)+16>>2]&1023](r)}else{if((m|0)==0){break}b0[c[(c[m>>2]|0)+20>>2]&1023](m)}}while(0);m=c[d>>2]|0;d=j;do{if((m|0)==(d|0)){b0[c[(c[j>>2]|0)+16>>2]&1023](d)}else{if((m|0)==0){break}b0[c[(c[m>>2]|0)+20>>2]&1023](m)}}while(0);m=c[e>>2]|0;e=h;do{if((m|0)==(e|0)){b0[c[(c[h>>2]|0)+16>>2]&1023](e)}else{if((m|0)==0){break}b0[c[(c[m>>2]|0)+20>>2]&1023](m)}}while(0);m=c[b>>2]|0;b=c[c[m>>2]>>2]|0;c[l>>2]=t;t=l+4|0;c[t>>2]=f;e=(p|0)==0;if(!e){h=p+4|0;I=c[h>>2]|0,c[h>>2]=I+1,I}cf[b&63](a,m,l);l=c[t>>2]|0;do{if((l|0)!=0){t=l+4|0;if(((I=c[t>>2]|0,c[t>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[l>>2]|0)+8>>2]&1023](l|0);t=l+8|0;if(((I=c[t>>2]|0,c[t>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[l>>2]|0)+16>>2]&1023](l)}}while(0);if(e){i=g;return}e=p+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){i=g;return}b0[c[(c[p>>2]|0)+8>>2]&1023](p);e=p+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){i=g;return}b0[c[(c[p>>2]|0)+16>>2]&1023](f);i=g;return}function cC(a){a=a|0;if((a|0)==0){return}qI(a);return}function cD(a){a=a|0;var b=0,d=0,e=0;while(1){b=qH(8)|0;if((b|0)!=0){d=12;break}e=(I=c[7664]|0,c[7664]=I+0,I);if((e|0)==0){break}b8[e&1]()}if((d|0)==12){c[b>>2]=2084;c[b+4>>2]=c[a+4>>2];return b|0}b=bR(4)|0;c[b>>2]=3284;bl(b|0,24120,94);return 0}function cE(a,b){a=a|0;b=b|0;if((b|0)==0){return}c[b>>2]=2084;c[b+4>>2]=c[a+4>>2];return}function cF(a){a=a|0;return}function cG(a){a=a|0;if((a|0)==0){return}qI(a);return}function cH(a,b){a=a|0;b=b|0;c[c[a+4>>2]>>2]=c[b>>2];return}function cI(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=2284){d=0;return d|0}d=a+4|0;return d|0}function cJ(a){a=a|0;return 2776}function cK(a){a=a|0;return}function cL(a){a=a|0;var b=0;c[a>>2]=5360;c[a+16>>2]=8148;b=c[a+88>>2]|0;do{if((b|0)==(a+72|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+64>>2]|0;do{if((b|0)==(a+48|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+40>>2]|0;if((b|0)==(a+24|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}if((b|0)==0){return}b0[c[(c[b>>2]|0)+20>>2]&1023](b);return}function cM(a){a=a|0;var b=0;c[a>>2]=5360;c[a+16>>2]=8148;b=c[a+88>>2]|0;do{if((b|0)==(a+72|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+64>>2]|0;do{if((b|0)==(a+48|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+40>>2]|0;do{if((b|0)==(a+24|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function cN(a){a=a|0;var b=0;b=a+16|0;b0[c[(c[b>>2]|0)+12>>2]&1023](b);return}function cO(a){a=a|0;if((a|0)==0){return}qI(a);return}function cP(a){a=a|0;var b=0;c[a>>2]=8148;b=c[a+72>>2]|0;do{if((b|0)==(a+56|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+48>>2]|0;do{if((b|0)==(a+32|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+24>>2]|0;if((b|0)==(a+8|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}if((b|0)==0){return}b0[c[(c[b>>2]|0)+20>>2]&1023](b);return}function cQ(a,b){a=a|0;b=b|0;var d=0;d=c[a+24>>2]|0;if((d|0)==0){return}b1[c[(c[d>>2]|0)+24>>2]&255](d,b);return}function cR(a){a=a|0;var b=0;b=c[a+48>>2]|0;if((b|0)==0){return}b0[c[(c[b>>2]|0)+24>>2]&1023](b);return}function cS(a,b){a=a|0;b=b|0;var d=0;d=c[a+72>>2]|0;if((d|0)==0){return}b1[c[(c[d>>2]|0)+24>>2]&255](d,b);return}function cT(a){a=a|0;var b=0;c[a>>2]=8148;b=c[a+72>>2]|0;do{if((b|0)==(a+56|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+48>>2]|0;do{if((b|0)==(a+32|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+24>>2]|0;do{if((b|0)==(a+8|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function cU(a){a=a|0;return}function cV(a){a=a|0;if((a|0)==0){return}qI(a);return}function cW(a){a=a|0;return 1964}function cX(a,b){a=a|0;b=b|0;return}function cY(a){a=a|0;return}function cZ(a,b){a=a|0;b=b|0;return}function c_(a){a=a|0;return}function c$(a){a=a|0;if((a|0)==0){return}qI(a);return}function c0(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5072;b=a+16|0;c[b>>2]=7872;d=c[a+80>>2]|0;do{if((d|0)==(a+64|0)){b0[c[(c[d>>2]|0)+16>>2]&1023](d)}else{if((d|0)==0){break}b0[c[(c[d>>2]|0)+20>>2]&1023](d)}}while(0);d=c[a+60>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);c[b>>2]=7768;b=c[a+48>>2]|0;do{if((b|0)==(a+32|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+24>>2]|0;if((b|0)==0){return}a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function c1(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5072;b=a+16|0;c[b>>2]=7872;d=c[a+80>>2]|0;do{if((d|0)==(a+64|0)){b0[c[(c[d>>2]|0)+16>>2]&1023](d)}else{if((d|0)==0){break}b0[c[(c[d>>2]|0)+20>>2]&1023](d)}}while(0);d=c[a+60>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);c[b>>2]=7768;b=c[a+48>>2]|0;do{if((b|0)==(a+32|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+24>>2]|0;do{if((b|0)!=0){d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function c2(a){a=a|0;var b=0;b=a+16|0;b0[c[(c[b>>2]|0)+4>>2]&1023](b);return}function c3(a){a=a|0;if((a|0)==0){return}qI(a);return}function c4(a){a=a|0;var b=0,d=0,e=0;b=a|0;c[b>>2]=7872;d=c[a+64>>2]|0;do{if((d|0)==(a+48|0)){b0[c[(c[d>>2]|0)+16>>2]&1023](d)}else{if((d|0)==0){break}b0[c[(c[d>>2]|0)+20>>2]&1023](d)}}while(0);d=c[a+44>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);c[b>>2]=7768;b=c[a+32>>2]|0;do{if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+8>>2]|0;if((b|0)==0){return}a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function c5(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;f=i;i=i+192|0;g=f|0;h=f+24|0;j=f+48|0;k=f+72|0;l=f+80|0;m=f+104|0;n=f+112|0;o=f+120|0;p=f+144|0;q=f+168|0;while(1){r=qH(28)|0;if((r|0)!=0){break}s=(I=c[7664]|0,c[7664]=I+0,I);if((s|0)==0){t=9;break}b8[s&1]()}if((t|0)==9){s=bR(4)|0;c[s>>2]=3284;bl(s|0,24120,94)}s=r+4|0;c[s>>2]=0;u=r+8|0;c[u>>2]=0;c[r>>2]=4976;v=r+12|0;while(1){w=qH(72)|0;if((w|0)!=0){break}x=(I=c[7664]|0,c[7664]=I+0,I);if((x|0)==0){t=21;break}b8[x&1]()}if((t|0)==21){x=bR(4)|0;c[x>>2]=3284;bl(x|0,24120,94)}c[w+4>>2]=0;c[w+8>>2]=0;c[w>>2]=5328;c[w+32>>2]=0;a[w+40|0]=0;qP(w+44|0,0,24)|0;c[v>>2]=w+16;c[r+16>>2]=w;while(1){y=qH(72)|0;if((y|0)!=0){break}w=(I=c[7664]|0,c[7664]=I+0,I);if((w|0)==0){t=32;break}b8[w&1]()}if((t|0)==32){w=bR(4)|0;c[w>>2]=3284;bl(w|0,24120,94)}c[y+4>>2]=0;c[y+8>>2]=0;c[y>>2]=5328;c[y+32>>2]=0;a[y+40|0]=0;qP(y+44|0,0,24)|0;c[r+20>>2]=y+16;c[r+24>>2]=y;y=v;w=r;x=c[d+4>>2]|0;z=c[d+8>>2]|0;L25:do{if((z|0)!=0){A=z+4|0;do{B=c[A>>2]|0;if((B|0)==-1){break L25}}while(((I=c[A>>2]|0,(c[A>>2]|0)==(B|0)?(c[A>>2]=B+1)|0:0,I)|0)!=(B|0));B=c[7328]|0;do{if((B|0)==0){t=52}else{C=c[B>>2]|0;D=c[B+4>>2]|0;do{if((D|0)!=0){E=D+4|0;I=c[E>>2]|0,c[E>>2]=I+1,I;if(((I=c[E>>2]|0,c[E>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[D>>2]|0)+8>>2]&1023](D|0);E=D+8|0;if(((I=c[E>>2]|0,c[E>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[D>>2]|0)+16>>2]&1023](D)}}while(0);if((C|0)==0){t=52;break}D=r+20|0;c[m>>2]=x;E=m+4|0;c[E>>2]=z;I=c[A>>2]|0,c[A>>2]=I+1,I;c[n>>2]=c[e>>2];F=n+4|0;G=c[e+4>>2]|0;c[F>>2]=G;if((G|0)!=0){H=G+4|0;I=c[H>>2]|0,c[H>>2]=I+1,I}H=D;D=c[H>>2]|0;G=c[r+24>>2]|0;J=(G|0)==0;if(!J){K=G+4|0;I=c[K>>2]|0,c[K>>2]=I+1,I;I=c[K>>2]|0,c[K>>2]=I+1,I}K=h+16|0;L=h;c[K>>2]=L;c[h>>2]=6944;c[h+4>>2]=D;c[h+8>>2]=G;M=o;N=o+16|0;c[N>>2]=M;c[o>>2]=6944;c[o+4>>2]=D;c[o+8>>2]=G;do{if(J){O=6944;t=158}else{D=G+4|0;I=c[D>>2]|0,c[D>>2]=I+1,I;D=c[K>>2]|0;if((D|0)==(L|0)){O=c[h>>2]|0;t=158;break}if((D|0)==0){break}b0[c[(c[D>>2]|0)+20>>2]&1023](D)}}while(0);if((t|0)==158){b0[c[O+16>>2]&1023](L)}c[K>>2]=0;do{if(!J){C=G+4|0;if(((I=c[C>>2]|0,c[C>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[G>>2]|0)+8>>2]&1023](G|0);C=G+8|0;if(((I=c[C>>2]|0,c[C>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[G>>2]|0)+16>>2]&1023](G)}}while(0);I=c[s>>2]|0,c[s>>2]=I+1,I;G=p+16|0;J=p;c[G>>2]=J;c[p>>2]=7232;c[p+4>>2]=y;c[p+8>>2]=w;K=c[d+32>>2]|0;if((K|0)==0){L=bR(4)|0;c[L>>2]=5464;bl(L|0,25448,372)}cc[c[(c[K>>2]|0)+24>>2]&63](l,K,m,n,o,p);c7(c[H>>2]|0,l);K=c[l+16>>2]|0;do{if((K|0)==(l|0)){b0[c[(c[K>>2]|0)+16>>2]&1023](K)}else{if((K|0)==0){break}b0[c[(c[K>>2]|0)+20>>2]&1023](K)}}while(0);K=c[G>>2]|0;do{if((K|0)==(J|0)){b0[c[(c[p>>2]|0)+16>>2]&1023](J)}else{if((K|0)==0){break}b0[c[(c[K>>2]|0)+20>>2]&1023](K)}}while(0);K=c[N>>2]|0;do{if((K|0)==(M|0)){b0[c[(c[o>>2]|0)+16>>2]&1023](M)}else{if((K|0)==0){break}b0[c[(c[K>>2]|0)+20>>2]&1023](K)}}while(0);K=c[F>>2]|0;do{if((K|0)!=0){M=K+4|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[K>>2]|0)+8>>2]&1023](K|0);M=K+8|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[K>>2]|0)+16>>2]&1023](K)}}while(0);K=c[E>>2]|0;if((K|0)==0){break}F=K+4|0;if(((I=c[F>>2]|0,c[F>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[K>>2]|0)+8>>2]&1023](K|0);F=K+8|0;if(((I=c[F>>2]|0,c[F>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[K>>2]|0)+16>>2]&1023](K)}}while(0);do{if((t|0)==52){while(1){t=0;P=qH(24)|0;if((P|0)!=0){break}B=(I=c[7664]|0,c[7664]=I+0,I);if((B|0)==0){t=60;break}b8[B&1]();t=52}if((t|0)==60){E=bR(4)|0;c[E>>2]=3284;bl(E|0,24120,94)}E=P+4|0;c[E>>2]=0;B=P+8|0;c[B>>2]=0;c[P>>2]=5168;K=P+12|0;c[P+16>>2]=0;c[P+20>>2]=0;c[K>>2]=8016;F=P;M=(K|0)==0?0:P+16|0;do{if((M|0)!=0){N=K;I=c[B>>2]|0,c[B>>2]=I+1,I;c[M>>2]=N;N=M+4|0;J=c[N>>2]|0;c[N>>2]=F;if((J|0)==0){break}N=J+8|0;if(((I=c[N>>2]|0,c[N>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[J>>2]|0)+16>>2]&1023](J)}}while(0);M=K;J=c[(c[K>>2]|0)+12>>2]|0;I=c[s>>2]|0,c[s>>2]=I+1,I;I=c[A>>2]|0,c[A>>2]=I+1,I;N=c[e>>2]|0;G=c[e+4>>2]|0;if((G|0)!=0){H=G+4|0;I=c[H>>2]|0,c[H>>2]=I+1,I}H=k|0;while(1){Q=qH(48)|0;if((Q|0)!=0){break}L=(I=c[7664]|0,c[7664]=I+0,I);if((L|0)==0){t=77;break}b8[L&1]()}if((t|0)==77){K=bR(4)|0;c[K>>2]=3284;bl(K|0,24120,94)}c[Q+4>>2]=0;c[Q+8>>2]=0;c[Q>>2]=4880;c[Q+32>>2]=0;K=k|0;L=k+4|0;c[K>>2]=Q+16;c[L>>2]=Q;C=g+16|0;c[C>>2]=0;while(1){R=qH(32)|0;if((R|0)!=0){break}D=(I=c[7664]|0,c[7664]=I+0,I);if((D|0)==0){t=88;break}b8[D&1]()}if((t|0)==88){D=bR(4)|0;c[D>>2]=3284;bl(D|0,24120,94)}c[R>>2]=7184;c[R+4>>2]=d;c[R+8>>2]=y;c[R+12>>2]=w;c[R+16>>2]=x;c[R+20>>2]=z;c[R+24>>2]=N;c[R+28>>2]=G;c[C>>2]=R;dC(H,g);D=c[C>>2]|0;do{if((D|0)==(g|0)){b0[c[(c[D>>2]|0)+16>>2]&1023](D)}else{if((D|0)==0){break}b0[c[(c[D>>2]|0)+20>>2]&1023](D)}}while(0);a[(c[K>>2]|0)+24|0]=0;cf[J&63](j,M,k);D=c[j+16>>2]|0;do{if((D|0)==(j|0)){b0[c[(c[D>>2]|0)+16>>2]&1023](D)}else{if((D|0)==0){break}b0[c[(c[D>>2]|0)+20>>2]&1023](D)}}while(0);D=c[L>>2]|0;do{if((D|0)!=0){M=D+4|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[D>>2]|0)+8>>2]&1023](D|0);M=D+8|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[D>>2]|0)+16>>2]&1023](D)}}while(0);if(((I=c[E>>2]|0,c[E>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[P>>2]|0)+8>>2]&1023](P);if(((I=c[B>>2]|0,c[B>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[P>>2]|0)+16>>2]&1023](F)}}while(0);I=c[s>>2]|0,c[s>>2]=I+1,I;D=q+16|0;L=q;c[D>>2]=L;c[q>>2]=7136;c[q+4>>2]=y;c[q+8>>2]=w;c[b+16>>2]=b;do{if((b|0)==0){S=7136;t=214}else{c[b>>2]=7136;c[b+4>>2]=v;c[b+8>>2]=r;I=c[s>>2]|0,c[s>>2]=I+1,I;M=c[D>>2]|0;if((M|0)==(L|0)){S=c[q>>2]|0;t=214;break}if((M|0)==0){break}b0[c[(c[M>>2]|0)+20>>2]&1023](M)}}while(0);if((t|0)==214){b0[c[S+16>>2]&1023](L)}c[D>>2]=0;do{if(((I=c[A>>2]|0,c[A>>2]=I+ -1,I)|0)==0){b0[c[(c[z>>2]|0)+8>>2]&1023](z|0);M=z+8|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[z>>2]|0)+16>>2]&1023](z)}}while(0);if(((I=c[s>>2]|0,c[s>>2]=I+ -1,I)|0)!=0){i=f;return}b0[c[(c[r>>2]|0)+8>>2]&1023](r);if(((I=c[u>>2]|0,c[u>>2]=I+ -1,I)|0)!=0){i=f;return}b0[c[(c[r>>2]|0)+16>>2]&1023](w);i=f;return}}while(0);f=bR(4)|0;c[f>>2]=5928;bl(f|0,25656,646)}function c6(a){a=a|0;var b=0,d=0,e=0;b=a|0;c[b>>2]=7872;d=c[a+64>>2]|0;do{if((d|0)==(a+48|0)){b0[c[(c[d>>2]|0)+16>>2]&1023](d)}else{if((d|0)==0){break}b0[c[(c[d>>2]|0)+20>>2]&1023](d)}}while(0);d=c[a+44>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);c[b>>2]=7768;b=c[a+32>>2]|0;do{if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function c7(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+24|0;f=e|0;g=d+16|0;h=c[g>>2]|0;do{if((h|0)==0){c[f+16>>2]=0;j=0;k=d}else{l=d;if((h|0)!=(l|0)){c[f+16>>2]=h;c[g>>2]=0;j=0;k=l;break}l=f;c[f+16>>2]=l;b1[c[(c[h>>2]|0)+12>>2]&255](h,l);j=c[g>>2]|0;k=h}}while(0);do{if((j|0)==(k|0)){b0[c[(c[k>>2]|0)+16>>2]&1023](k)}else{if((j|0)==0){break}b0[c[(c[j>>2]|0)+20>>2]&1023](j)}}while(0);c[g>>2]=0;m;if((m|0)!=0){kB(m,596)}if((a[b+24|0]&1)==0){dB(b|0,f|0)}n;if((n|0)!=0){bJ(1348,1196,46,1980)}n=f+16|0;b=c[n>>2]|0;if((b|0)==0){i=e;return}b0[c[(c[b>>2]|0)+24>>2]&1023](b);b=c[n>>2]|0;do{if((b|0)==(f|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);c[n>>2]=0;i=e;return}function c8(a){a=a|0;var b=0;c[a>>2]=7136;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function c9(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=7136;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function da(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(12)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=7136;c[b+4>>2]=c[a+4>>2];e=c[a+8>>2]|0;c[b+8>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function db(a,b){a=a|0;b=b|0;var d=0;if((b|0)==0){return}c[b>>2]=7136;c[b+4>>2]=c[a+4>>2];d=c[a+8>>2]|0;c[b+8>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function dc(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function dd(a){a=a|0;var b=0,d=0,e=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function de(a){a=a|0;var b=0;b=a+4|0;dh(c[c[b>>2]>>2]|0);dh(c[(c[b>>2]|0)+8>>2]|0);return}function df(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=9676){d=0;return d|0}d=a+4|0;return d|0}function dg(a){a=a|0;return 24016}function dh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;i=i+24|0;e=d|0;f;if((f|0)!=0){kB(f,596)}f=b+24|0;if((a[f]&1)!=0){g;if((g|0)==0){i=d;return}bJ(1348,1196,46,1980)}a[f]=1;f=b+16|0;g=c[f>>2]|0;do{if((g|0)==0){c[e+16>>2]=0;h=0;j=b}else{k=b;if((g|0)!=(k|0)){c[e+16>>2]=g;c[f>>2]=0;h=0;j=k;break}k=e;c[e+16>>2]=k;b1[c[(c[g>>2]|0)+12>>2]&255](g,k);h=c[f>>2]|0;j=g}}while(0);do{if((h|0)==(j|0)){b0[c[(c[j>>2]|0)+16>>2]&1023](j)}else{if((h|0)==0){break}b0[c[(c[h>>2]|0)+20>>2]&1023](h)}}while(0);c[f>>2]=0;l;if((l|0)!=0){bJ(1348,1196,46,1980)}l=e+16|0;f=c[l>>2]|0;if((f|0)==0){i=d;return}b0[c[(c[f>>2]|0)+24>>2]&1023](f);f=c[l>>2]|0;do{if((f|0)==(e|0)){b0[c[(c[f>>2]|0)+16>>2]&1023](f)}else{if((f|0)==0){break}b0[c[(c[f>>2]|0)+20>>2]&1023](f)}}while(0);c[l>>2]=0;i=d;return}function di(a){a=a|0;var b=0;c[a>>2]=7232;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function dj(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=7232;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function dk(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(12)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=7232;c[b+4>>2]=c[a+4>>2];e=c[a+8>>2]|0;c[b+8>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function dl(a,b){a=a|0;b=b|0;var d=0;if((b|0)==0){return}c[b>>2]=7232;c[b+4>>2]=c[a+4>>2];d=c[a+8>>2]|0;c[b+8>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function dm(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function dn(a){a=a|0;var b=0,d=0,e=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function dp(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;i=i+48|0;e=d|0;f=d+24|0;g=b+16|0;h=c[g>>2]|0;do{if((h|0)==0){c[f+16>>2]=0;j=0;k=b}else{l=b;if((h|0)!=(l|0)){c[f+16>>2]=h;c[g>>2]=0;j=0;k=l;break}l=f;c[f+16>>2]=l;b1[c[(c[h>>2]|0)+12>>2]&255](h,l);j=c[g>>2]|0;k=h}}while(0);do{if((j|0)==(k|0)){b0[c[(c[k>>2]|0)+16>>2]&1023](k)}else{if((j|0)==0){break}b0[c[(c[j>>2]|0)+20>>2]&1023](j)}}while(0);c[g>>2]=0;g=c[a+4>>2]|0;a=f+16|0;j=c[a>>2]|0;do{if((j|0)==0){c[e+16>>2]=0}else{if((j|0)!=(f|0)){c[e+16>>2]=j;c[a>>2]=0;break}k=e;c[e+16>>2]=k;b1[c[(c[j>>2]|0)+12>>2]&255](j,k);k=c[a>>2]|0;if((k|0)==(j|0)){b0[c[(c[j>>2]|0)+16>>2]&1023](j);break}if((k|0)==0){break}b0[c[(c[k>>2]|0)+20>>2]&1023](k)}}while(0);c[a>>2]=0;c7(c[g>>2]|0,e);g=c[e+16>>2]|0;do{if((g|0)==(e|0)){b0[c[(c[g>>2]|0)+16>>2]&1023](g)}else{if((g|0)==0){break}b0[c[(c[g>>2]|0)+20>>2]&1023](g)}}while(0);g=c[a>>2]|0;a=f;if((g|0)==(a|0)){b0[c[(c[f>>2]|0)+16>>2]&1023](a);i=d;return}if((g|0)==0){i=d;return}b0[c[(c[g>>2]|0)+20>>2]&1023](g);i=d;return}function dq(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=9784){d=0;return d|0}d=a+4|0;return d|0}function dr(a){a=a|0;return 24024}function ds(a){a=a|0;var b=0;c[a>>2]=6944;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function dt(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=6944;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function du(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(12)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=6944;c[b+4>>2]=c[a+4>>2];e=c[a+8>>2]|0;c[b+8>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function dv(a,b){a=a|0;b=b|0;var d=0;if((b|0)==0){return}c[b>>2]=6944;c[b+4>>2]=c[a+4>>2];d=c[a+8>>2]|0;c[b+8>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function dw(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function dx(a){a=a|0;var b=0,d=0,e=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function dy(a){a=a|0;dh(c[a+4>>2]|0);return}function dz(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=9248){d=0;return d|0}d=a+4|0;return d|0}function dA(a){a=a|0;return 23984}function dB(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;i=i+16|0;e=d|0;f=e|0;g=a+16|0;h=c[g>>2]|0;j=a;a=b+16|0;k=c[a>>2]|0;l=b;m=(k|0)==(l|0);if((h|0)!=(j|0)){if(!m){c[g>>2]=k;c[a>>2]=h;i=d;return}b1[c[(c[b>>2]|0)+12>>2]&255](k,j);b=c[a>>2]|0;b0[c[(c[b>>2]|0)+16>>2]&1023](b);c[a>>2]=c[g>>2];c[g>>2]=j;i=d;return}j=c[(c[h>>2]|0)+12>>2]|0;if(!m){b1[j&255](h,l);m=c[g>>2]|0;b0[c[(c[m>>2]|0)+16>>2]&1023](m);c[g>>2]=c[a>>2];c[a>>2]=l;i=d;return}b1[j&255](h,f);j=c[g>>2]|0;b0[c[(c[j>>2]|0)+16>>2]&1023](j);c[g>>2]=0;j=c[a>>2]|0;b1[c[(c[j>>2]|0)+12>>2]&255](j,h);j=c[a>>2]|0;b0[c[(c[j>>2]|0)+16>>2]&1023](j);c[a>>2]=0;c[g>>2]=h;b1[c[(c[e>>2]|0)+12>>2]&255](f,k);b0[c[(c[e>>2]|0)+16>>2]&1023](f);c[a>>2]=k;i=d;return}function dC(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;d=a|0;e=c[d>>2]|0;do{if((e|0)==0){while(1){f=qH(48)|0;if((f|0)!=0){break}g=(I=c[7664]|0,c[7664]=I+0,I);if((g|0)==0){h=9;break}b8[g&1]()}if((h|0)==9){g=bR(4)|0;c[g>>2]=3284;bl(g|0,24120,94)}c[f+4>>2]=0;c[f+8>>2]=0;c[f>>2]=4880;c[f+32>>2]=0;g=f+16|0;c[d>>2]=g;i=a+4|0;j=c[i>>2]|0;c[i>>2]=f;if((j|0)==0){k=g;break}g=j+4|0;do{if(((I=c[g>>2]|0,c[g>>2]=I+ -1,I)|0)==0){b0[c[(c[j>>2]|0)+8>>2]&1023](j|0);i=j+8|0;if(((I=c[i>>2]|0,c[i>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[j>>2]|0)+16>>2]&1023](j)}}while(0);k=c[d>>2]|0}else{k=e}}while(0);e=k+16|0;d=c[e>>2]|0;f=k;do{if((d|0)==(f|0)){b0[c[(c[d>>2]|0)+16>>2]&1023](d)}else{if((d|0)==0){break}b0[c[(c[d>>2]|0)+20>>2]&1023](d)}}while(0);c[e>>2]=0;d=b+16|0;k=c[d>>2]|0;if((k|0)==0){c[e>>2]=0;return}if((k|0)==(b|0)){c[e>>2]=f;b=c[d>>2]|0;b1[c[(c[b>>2]|0)+12>>2]&255](b,f);return}else{c[e>>2]=k;c[d>>2]=0;return}}function dD(a){a=a|0;var b=0,d=0;c[a>>2]=7184;b=c[a+28>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+20>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+12>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function dE(a){a=a|0;var b=0,d=0;c[a>>2]=7184;b=c[a+28>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+20>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+12>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function dF(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(32)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=7184;c[b+4>>2]=c[a+4>>2];c[b+8>>2]=c[a+8>>2];e=c[a+12>>2]|0;c[b+12>>2]=e;if((e|0)!=0){d=e+4|0;I=c[d>>2]|0,c[d>>2]=I+1,I}c[b+16>>2]=c[a+16>>2];d=c[a+20>>2]|0;c[b+20>>2]=d;if((d|0)!=0){e=d+4|0;I=c[e>>2]|0,c[e>>2]=I+1,I}c[b+24>>2]=c[a+24>>2];e=c[a+28>>2]|0;c[b+28>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function dG(a,b){a=a|0;b=b|0;var d=0,e=0;if((b|0)==0){return}c[b>>2]=7184;c[b+4>>2]=c[a+4>>2];c[b+8>>2]=c[a+8>>2];d=c[a+12>>2]|0;c[b+12>>2]=d;if((d|0)!=0){e=d+4|0;I=c[e>>2]|0,c[e>>2]=I+1,I}c[b+16>>2]=c[a+16>>2];e=c[a+20>>2]|0;c[b+20>>2]=e;if((e|0)!=0){d=e+4|0;I=c[d>>2]|0,c[d>>2]=I+1,I}c[b+24>>2]=c[a+24>>2];d=c[a+28>>2]|0;c[b+28>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function dH(a){a=a|0;var b=0,d=0;b=c[a+28>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+20>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+12>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function dI(a){a=a|0;var b=0,d=0;b=c[a+28>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+20>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+12>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function dJ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;e=i;i=i+112|0;f=e|0;g=e+24|0;h=e+48|0;j=e+56|0;k=e+64|0;l=e+88|0;m=d+4|0;n=c[m>>2]|0;c[d>>2]=0;c[m>>2]=0;m=c[b+4>>2]|0;d=b+8|0;o=c[d>>2]|0;c[h>>2]=c[b+16>>2];p=h+4|0;q=c[b+20>>2]|0;c[p>>2]=q;if((q|0)!=0){r=q+4|0;I=c[r>>2]|0,c[r>>2]=I+1,I}c[j>>2]=c[b+24>>2];r=j+4|0;q=c[b+28>>2]|0;c[r>>2]=q;if((q|0)!=0){s=q+4|0;I=c[s>>2]|0,c[s>>2]=I+1,I}s=c[d>>2]|0;q=c[s+8>>2]|0;t=c[s+12>>2]|0;s=(t|0)==0;if(!s){u=t+4|0;I=c[u>>2]|0,c[u>>2]=I+1,I;I=c[u>>2]|0,c[u>>2]=I+1,I}u=f+16|0;v=f;c[u>>2]=v;c[f>>2]=6944;c[f+4>>2]=q;c[f+8>>2]=t;w=k;x=k+16|0;c[x>>2]=w;c[k>>2]=6944;c[k+4>>2]=q;c[k+8>>2]=t;do{if(s){y=6944;z=10}else{q=t+4|0;I=c[q>>2]|0,c[q>>2]=I+1,I;q=c[u>>2]|0;if((q|0)==(v|0)){y=c[f>>2]|0;z=10;break}if((q|0)==0){break}b0[c[(c[q>>2]|0)+20>>2]&1023](q)}}while(0);if((z|0)==10){b0[c[y+16>>2]&1023](v)}c[u>>2]=0;do{if(!s){u=t+4|0;if(((I=c[u>>2]|0,c[u>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[t>>2]|0)+8>>2]&1023](t|0);u=t+8|0;if(((I=c[u>>2]|0,c[u>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[t>>2]|0)+16>>2]&1023](t)}}while(0);t=c[d>>2]|0;d=c[b+12>>2]|0;if((d|0)!=0){b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I}b=l+16|0;s=l;c[b>>2]=s;c[l>>2]=6512;c[l+4>>2]=t;c[l+8>>2]=d;d=c[m+32>>2]|0;if((d|0)==0){m=bR(4)|0;c[m>>2]=5464;bl(m|0,25448,372)}cc[c[(c[d>>2]|0)+24>>2]&63](g,d,h,j,k,l);c7(c[o+8>>2]|0,g);o=c[g+16>>2]|0;do{if((o|0)==(g|0)){b0[c[(c[o>>2]|0)+16>>2]&1023](o)}else{if((o|0)==0){break}b0[c[(c[o>>2]|0)+20>>2]&1023](o)}}while(0);o=c[b>>2]|0;do{if((o|0)==(s|0)){b0[c[(c[l>>2]|0)+16>>2]&1023](s)}else{if((o|0)==0){break}b0[c[(c[o>>2]|0)+20>>2]&1023](o)}}while(0);o=c[x>>2]|0;do{if((o|0)==(w|0)){b0[c[(c[k>>2]|0)+16>>2]&1023](w)}else{if((o|0)==0){break}b0[c[(c[o>>2]|0)+20>>2]&1023](o)}}while(0);o=c[r>>2]|0;do{if((o|0)!=0){r=o+4|0;if(((I=c[r>>2]|0,c[r>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+8>>2]&1023](o|0);r=o+8|0;if(((I=c[r>>2]|0,c[r>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+16>>2]&1023](o)}}while(0);o=c[p>>2]|0;do{if((o|0)!=0){p=o+4|0;if(((I=c[p>>2]|0,c[p>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+8>>2]&1023](o|0);p=o+8|0;if(((I=c[p>>2]|0,c[p>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+16>>2]&1023](o)}}while(0);c[a+16>>2]=0;if((n|0)==0){i=e;return}a=n+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){i=e;return}b0[c[(c[n>>2]|0)+8>>2]&1023](n|0);a=n+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){i=e;return}b0[c[(c[n>>2]|0)+16>>2]&1023](n);i=e;return}function dK(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=9908){d=0;return d|0}d=a+4|0;return d|0}function dL(a){a=a|0;return 24032}function dM(a){a=a|0;var b=0;c[a>>2]=6512;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function dN(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=6512;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function dO(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(12)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=6512;c[b+4>>2]=c[a+4>>2];e=c[a+8>>2]|0;c[b+8>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function dP(a,b){a=a|0;b=b|0;var d=0;if((b|0)==0){return}c[b>>2]=6512;c[b+4>>2]=c[a+4>>2];d=c[a+8>>2]|0;c[b+8>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function dQ(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function dR(a){a=a|0;var b=0,d=0,e=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function dS(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;i=i+48|0;e=d|0;f=d+24|0;g=b+16|0;h=c[g>>2]|0;do{if((h|0)==0){c[f+16>>2]=0;j=0;k=b}else{l=b;if((h|0)!=(l|0)){c[f+16>>2]=h;c[g>>2]=0;j=0;k=l;break}l=f;c[f+16>>2]=l;b1[c[(c[h>>2]|0)+12>>2]&255](h,l);j=c[g>>2]|0;k=h}}while(0);do{if((j|0)==(k|0)){b0[c[(c[k>>2]|0)+16>>2]&1023](k)}else{if((j|0)==0){break}b0[c[(c[j>>2]|0)+20>>2]&1023](j)}}while(0);c[g>>2]=0;g=c[a+4>>2]|0;a=f+16|0;j=c[a>>2]|0;do{if((j|0)==0){c[e+16>>2]=0}else{if((j|0)!=(f|0)){c[e+16>>2]=j;c[a>>2]=0;break}k=e;c[e+16>>2]=k;b1[c[(c[j>>2]|0)+12>>2]&255](j,k);k=c[a>>2]|0;if((k|0)==(j|0)){b0[c[(c[j>>2]|0)+16>>2]&1023](j);break}if((k|0)==0){break}b0[c[(c[k>>2]|0)+20>>2]&1023](k)}}while(0);c[a>>2]=0;c7(c[g>>2]|0,e);g=c[e+16>>2]|0;do{if((g|0)==(e|0)){b0[c[(c[g>>2]|0)+16>>2]&1023](g)}else{if((g|0)==0){break}b0[c[(c[g>>2]|0)+20>>2]&1023](g)}}while(0);g=c[a>>2]|0;a=f;if((g|0)==(a|0)){b0[c[(c[f>>2]|0)+16>>2]&1023](a);i=d;return}if((g|0)==0){i=d;return}b0[c[(c[g>>2]|0)+20>>2]&1023](g);i=d;return}function dT(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=8376){d=0;return d|0}d=a+4|0;return d|0}function dU(a){a=a|0;return 23912}function dV(a){a=a|0;var b=0;c[a>>2]=4880;b=c[a+32>>2]|0;if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}if((b|0)==0){return}b0[c[(c[b>>2]|0)+20>>2]&1023](b);return}function dW(a){a=a|0;var b=0;c[a>>2]=4880;b=c[a+32>>2]|0;do{if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)!=0){b0[c[(c[b>>2]|0)+20>>2]&1023](b)}if((a|0)!=0){break}return}}while(0);qI(a);return}function dX(a){a=a|0;var b=0;b=c[a+32>>2]|0;if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}if((b|0)==0){return}b0[c[(c[b>>2]|0)+20>>2]&1023](b);return}function dY(a){a=a|0;if((a|0)==0){return}qI(a);return}function dZ(a){a=a|0;var b=0;c[a>>2]=5168;b=c[a+20>>2]|0;if((b|0)==0){return}a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function d_(a){a=a|0;var b=0,d=0;c[a>>2]=5168;b=c[a+20>>2]|0;do{if((b|0)!=0){d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}if((a|0)!=0){break}return}}while(0);qI(a);return}function d$(a){a=a|0;var b=0;b=a+12|0;b0[c[c[b>>2]>>2]&1023](b);return}function d0(a){a=a|0;if((a|0)==0){return}qI(a);return}function d1(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function d2(a){a=a|0;var b=0,d=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}if((a|0)!=0){break}return}}while(0);qI(a);return}function d3(a,b){a=a|0;b=b|0;kR(a);return}function d4(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+24|0;f=e|0;g=e+8|0;h=e+16|0;kR(f);j=c[(c[b>>2]|0)+20>>2]|0;k=f|0;f=c[k+4>>2]|0;l=g|0;c[l>>2]=c[k>>2];c[l+4>>2]=f;f=d|0;c[h>>2]=c[f>>2];l=h+4|0;k=d+4|0;c[l>>2]=c[k>>2];c[f>>2]=0;c[k>>2]=0;b$[j&31](a,b|0,g,h);h=c[l>>2]|0;if((h|0)==0){i=e;return}l=h+4|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){i=e;return}b0[c[(c[h>>2]|0)+8>>2]&1023](h|0);l=h+8|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){i=e;return}b0[c[(c[h>>2]|0)+16>>2]&1023](h);i=e;return}function d5(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;i=i+24|0;g=d;d=i;i=i+8|0;c[d>>2]=c[g>>2];c[d+4>>2]=c[g+4>>2];g=f|0;h=f+8|0;j=f+16|0;kR(g);k=g|0;g=d|0;d=qT(c[g>>2]|0,c[g+4>>2]|0,c[k>>2]|0,c[k+4>>2]|0)|0;k=c[(c[b>>2]|0)+20>>2]|0;g=h|0;c[g>>2]=d;c[g+4>>2]=K;g=e|0;c[j>>2]=c[g>>2];d=j+4|0;l=e+4|0;c[d>>2]=c[l>>2];c[g>>2]=0;c[l>>2]=0;b$[k&31](a,b|0,h,j);j=c[d>>2]|0;if((j|0)==0){i=f;return}d=j+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){i=f;return}b0[c[(c[j>>2]|0)+8>>2]&1023](j|0);d=j+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){i=f;return}b0[c[(c[j>>2]|0)+16>>2]&1023](j);i=f;return}function d6(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;f=i;i=i+84|0;g=d;d=i;i=i+8|0;c[d>>2]=c[g>>2];c[d+4>>2]=c[g+4>>2];g=f|0;h=f+8|0;j=f+16|0;k=f+24|0;l=f+32|0;m=f+36|0;n=f+52|0;o=f+60|0;p=c[7328]|0;do{if((p|0)==0){q=0;r=14}else{s=c[p>>2]|0;t=c[p+4>>2]|0;if((t|0)==0){u=0}else{v=t+4|0;I=c[v>>2]|0,c[v>>2]=I+1,I;u=t}if((s|0)==0){q=u;r=14;break}t=c[(c[s>>2]|0)+20>>2]|0;v=d|0;w=c[v+4>>2]|0;x=j|0;c[x>>2]=c[v>>2];c[x+4>>2]=w;w=e|0;c[k>>2]=c[w>>2];x=k+4|0;v=e+4|0;c[x>>2]=c[v>>2];c[w>>2]=0;c[v>>2]=0;b$[t&31](a,s,j,k);s=c[x>>2]|0;if((s|0)==0){y=u;break}x=s+4|0;if(((I=c[x>>2]|0,c[x>>2]=I+ -1,I)|0)!=0){y=u;break}b0[c[(c[s>>2]|0)+8>>2]&1023](s|0);x=s+8|0;if(((I=c[x>>2]|0,c[x>>2]=I+ -1,I)|0)!=0){y=u;break}b0[c[(c[s>>2]|0)+16>>2]&1023](s);y=u}}while(0);do{if((r|0)==14){while(1){z=qH(24)|0;if((z|0)!=0){break}u=(I=c[7664]|0,c[7664]=I+0,I);if((u|0)==0){r=23;break}b8[u&1]()}if((r|0)==23){u=bR(4)|0;c[u>>2]=3284;bl(u|0,24120,94)}u=z+4|0;c[u>>2]=0;k=z+8|0;c[k>>2]=0;c[z>>2]=5200;j=z+12|0;c[z+16>>2]=0;c[z+20>>2]=0;c[j>>2]=8052;p=z;s=(j|0)==0?0:z+16|0;x=j;do{if((s|0)!=0){I=c[k>>2]|0,c[k>>2]=I+1,I;c[s>>2]=x;j=s+4|0;t=c[j>>2]|0;c[j>>2]=p;if((t|0)==0){break}j=t+8|0;if(((I=c[j>>2]|0,c[j>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[t>>2]|0)+16>>2]&1023](t)}}while(0);if((c[7328]|0)!=0){bL()}while(1){A=qH(24)|0;if((A|0)!=0){break}s=(I=c[7664]|0,c[7664]=I+0,I);if((s|0)==0){r=40;break}b8[s&1]()}if((r|0)==40){s=bR(4)|0;c[s>>2]=3284;bl(s|0,24120,94)}qP(A|0,0,24)|0;qP(A|0,0,20)|0;c[7328]=A;I=c[u>>2]|0,c[u>>2]=I+1,I;s=A+4|0;t=c[s>>2]|0;c[A>>2]=x;c[s>>2]=p;do{if((t|0)!=0){s=t+4|0;if(((I=c[s>>2]|0,c[s>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[t>>2]|0)+8>>2]&1023](t|0);s=t+8|0;if(((I=c[s>>2]|0,c[s>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[t>>2]|0)+16>>2]&1023](t)}}while(0);do{if(((I=c[u>>2]|0,c[u>>2]=I+ -1,I)|0)==0){b0[c[(c[z>>2]|0)+8>>2]&1023](z);if(((I=c[k>>2]|0,c[k>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[z>>2]|0)+16>>2]&1023](p)}}while(0);p=d|0;k=c[p>>2]|0;u=c[p+4>>2]|0;p=e|0;t=c[p>>2]|0;x=e+4|0;s=c[x>>2]|0;c[p>>2]=0;c[x>>2]=0;x=m|0;c[x>>2]=k;c[x+4>>2]=u;c[m+8>>2]=t;t=m+12|0;c[t>>2]=s;d7(m);s=c[t>>2]|0;do{if((s|0)!=0){t=s+4|0;if(((I=c[t>>2]|0,c[t>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[s>>2]|0)+8>>2]&1023](s|0);t=s+8|0;if(((I=c[t>>2]|0,c[t>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[s>>2]|0)+16>>2]&1023](s)}}while(0);s=c[7328]|0;if((s|0)==0){bL()}t=h|0;u=n|0;x=n+4|0;k=b+4|0;p=b+8|0;j=o+16|0;v=o;w=g|0;B=g+4|0;C=o;D=s;L56:while(1){s=c[D+8>>2]|0;E=c[s>>2]|0;F=c[s+4>>2]|0;kR(h);s=qU(E,F,c[t>>2]|0,c[t+4>>2]|0)|0;F=K;E=0;if((F|0)>(E|0)|(F|0)==(E|0)&s>>>0>0>>>0){E=q$(s,F,1e9,0)|0;G=499999999;if((F|0)<(G|0)|(F|0)==(G|0)&s>>>0<-1e9>>>0){c[w>>2]=E;G=q1(E,K,-1e9,-1)|0;E=qT(G,K,s,F)|0;H=E}else{c[w>>2]=2147483647;H=999999999}c[B>>2]=H;bs(g|0,0)|0}E=c[7328]|0;if((E|0)==0){r=64;break}F=c[E+8>>2]|0;c[u>>2]=c[F+8>>2];s=c[F+12>>2]|0;c[x>>2]=s;if((s|0)==0){J=E}else{E=s+4|0;I=c[E>>2]|0,c[E>>2]=I+1,I;E=c[7328]|0;if((E|0)==0){r=68;break}else{J=E}}E=c[J+8>>2]|0;s=J+12|0;F=c[s>>2]|0;G=F-E|0;if((G|0)>16){L=G>>4;G=E|0;M=c[G>>2]|0;N=c[G+4>>2]|0;O=E+8|0;P=c[O>>2]|0;Q=E+12|0;R=c[Q>>2]|0;c[O>>2]=0;c[Q>>2]=0;S=F-16|0;T=c[S+4>>2]|0;c[G>>2]=c[S>>2];c[G+4>>2]=T;T=F-16+8|0;G=c[T>>2]|0;U=F-16+12|0;V=c[U>>2]|0;c[T>>2]=0;c[U>>2]=0;c[O>>2]=G;G=c[Q>>2]|0;c[Q>>2]=V;do{if((G|0)!=0){V=G+4|0;if(((I=c[V>>2]|0,c[V>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[G>>2]|0)+8>>2]&1023](G|0);V=G+8|0;if(((I=c[V>>2]|0,c[V>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[G>>2]|0)+16>>2]&1023](G)}}while(0);c[S>>2]=M;c[S+4>>2]=N;c[T>>2]=P;G=c[U>>2]|0;c[U>>2]=R;do{if((G|0)!=0){V=G+4|0;if(((I=c[V>>2]|0,c[V>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[G>>2]|0)+8>>2]&1023](G|0);V=G+8|0;if(((I=c[V>>2]|0,c[V>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[G>>2]|0)+16>>2]&1023](G)}}while(0);ea(E,L-1|0);W=c[s>>2]|0}else{W=F}G=W-16|0;R=W;while(1){U=R-16|0;c[s>>2]=U;P=c[R-16+12>>2]|0;if((P|0)==0){X=U}else{U=P+4|0;do{if(((I=c[U>>2]|0,c[U>>2]=I+ -1,I)|0)==0){b0[c[(c[P>>2]|0)+8>>2]&1023](P|0);T=P+8|0;if(((I=c[T>>2]|0,c[T>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[P>>2]|0)+16>>2]&1023](P)}}while(0);X=c[s>>2]|0}if((G|0)==(X|0)){break}else{R=X}}R=c[k>>2]|0;G=c[p>>2]|0;if((G|0)==0){r=91;break}s=G+4|0;do{F=c[s>>2]|0;if((F|0)==-1){r=91;break L56}}while(((I=c[s>>2]|0,(c[s>>2]|0)==(F|0)?(c[s>>2]=F+1)|0:0,I)|0)!=(F|0));d8(o,n,R,G);F=c[j>>2]|0;do{if((F|0)==(v|0)){b0[c[(c[C>>2]|0)+16>>2]&1023](v)}else{if((F|0)==0){break}b0[c[(c[F>>2]|0)+20>>2]&1023](F)}}while(0);do{if(((I=c[s>>2]|0,c[s>>2]=I+ -1,I)|0)==0){b0[c[(c[G>>2]|0)+8>>2]&1023](G|0);F=G+8|0;if(((I=c[F>>2]|0,c[F>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[G>>2]|0)+16>>2]&1023](G)}}while(0);G=c[7328]|0;if((G|0)==0){r=102;break}s=(c[G+8>>2]|0)==(c[G+12>>2]|0);G=c[x>>2]|0;do{if((G|0)!=0){F=G+4|0;if(((I=c[F>>2]|0,c[F>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[G>>2]|0)+8>>2]&1023](G|0);F=G+8|0;if(((I=c[F>>2]|0,c[F>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[G>>2]|0)+16>>2]&1023](G)}}while(0);if(s){r=135;break}G=c[7328]|0;if((G|0)==0){r=129;break}else{D=G}}if((r|0)==68){bL()}else if((r|0)==102){bL()}else if((r|0)==64){bL()}else if((r|0)==129){bL()}else if((r|0)==135){c[a+16>>2]=0;d9(l);y=q;break}else if((r|0)==91){D=bR(4)|0;c[D>>2]=5928;bl(D|0,25656,646)}}}while(0);if((y|0)==0){i=f;return}r=y+4|0;if(((I=c[r>>2]|0,c[r>>2]=I+ -1,I)|0)!=0){i=f;return}b0[c[(c[y>>2]|0)+8>>2]&1023](y|0);r=y+8|0;if(((I=c[r>>2]|0,c[r>>2]=I+ -1,I)|0)!=0){i=f;return}b0[c[(c[y>>2]|0)+16>>2]&1023](y);i=f;return}function d7(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;b=c[7328]|0;if((b|0)==0){bL()}d=b+8|0;e=b+12|0;f=c[e>>2]|0;g=b+16|0;b=c[g>>2]|0;if(f>>>0<b>>>0){if((f|0)==0){h=0}else{i=a|0;j=c[i+4>>2]|0;k=f|0;c[k>>2]=c[i>>2];c[k+4>>2]=j;j=a+8|0;c[f+8>>2]=c[j>>2];k=a+12|0;c[f+12>>2]=c[k>>2];c[j>>2]=0;c[k>>2]=0;h=c[e>>2]|0}k=h+16|0;c[e>>2]=k;l=k;m=d|0}else{k=d|0;d=c[k>>2]|0;h=d;j=f-h>>4;i=j+1|0;if(i>>>0>268435455>>>0){oG()}n=b-h|0;if(n>>4>>>0>134217726>>>0){o=268435455;p=11}else{h=n>>3;n=h>>>0<i>>>0?i:h;if((n|0)==0){q=0;r=0}else{o=n;p=11}}do{if((p|0)==11){n=o<<4;h=(n|0)==0?1:n;while(1){s=qH(h)|0;if((s|0)!=0){p=22;break}n=(I=c[7664]|0,c[7664]=I+0,I);if((n|0)==0){break}b8[n&1]()}if((p|0)==22){q=s;r=o;break}h=bR(4)|0;c[h>>2]=3284;bl(h|0,24120,94)}}while(0);o=q+(j<<4)|0;s=q+(r<<4)|0;if((o|0)==0){t=d;u=f}else{f=a|0;d=c[f+4>>2]|0;r=o|0;c[r>>2]=c[f>>2];c[r+4>>2]=d;d=a+8|0;c[q+(j<<4)+8>>2]=c[d>>2];r=a+12|0;c[q+(j<<4)+12>>2]=c[r>>2];c[d>>2]=0;c[r>>2]=0;t=c[k>>2]|0;u=c[e>>2]|0}r=q+(i<<4)|0;do{if((u|0)==(t|0)){c[k>>2]=o;c[e>>2]=r;c[g>>2]=s;v=u}else{i=(u-16+(-t|0)|0)>>>4;d=u;a=o;while(1){f=a-16|0;p=d-16|0;if((f|0)!=0){h=p|0;n=c[h+4>>2]|0;b=f|0;c[b>>2]=c[h>>2];c[b+4>>2]=n;n=d-16+8|0;c[a-16+8>>2]=c[n>>2];b=d-16+12|0;c[a-16+12>>2]=c[b>>2];c[n>>2]=0;c[b>>2]=0}if((p|0)==(t|0)){break}else{d=p;a=f}}a=c[k>>2]|0;d=c[e>>2]|0;c[k>>2]=q+(j-1-i<<4);c[e>>2]=r;c[g>>2]=s;if((a|0)==(d|0)){v=a;break}else{w=d}while(1){d=w-16|0;f=c[w-16+12>>2]|0;do{if((f|0)!=0){p=f+4|0;if(((I=c[p>>2]|0,c[p>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[f>>2]|0)+8>>2]&1023](f|0);p=f+8|0;if(((I=c[p>>2]|0,c[p>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[f>>2]|0)+16>>2]&1023](f)}}while(0);if((a|0)==(d|0)){v=a;break}else{w=d}}}}while(0);if((v|0)!=0){qI(v)}l=c[e>>2]|0;m=k}k=c[m>>2]|0;m=l-k|0;if((m|0)<=16){return}e=((m>>4)-2|0)/2|0;m=k+(e<<4)|0;v=l-16|0;w=v|0;s=c[w>>2]|0;g=c[w+4>>2]|0;w=m|0;r=c[w+4>>2]|0;if(!((g|0)<(r|0)|(g|0)==(r|0)&s>>>0<(c[w>>2]|0)>>>0)){return}r=l-16+8|0;j=c[r>>2]|0;q=l-16+12|0;l=c[q>>2]|0;c[r>>2]=0;c[q>>2]=0;q=e;e=m;m=v;v=c[w+4>>2]|0;r=c[w>>2]|0;while(1){w=m|0;c[w>>2]=r;c[w+4>>2]=v;x=e+8|0;w=c[x>>2]|0;y=e+12|0;t=c[y>>2]|0;c[x>>2]=0;c[y>>2]=0;c[m+8>>2]=w;w=m+12|0;o=c[w>>2]|0;c[w>>2]=t;do{if((o|0)!=0){t=o+4|0;if(((I=c[t>>2]|0,c[t>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+8>>2]&1023](o|0);t=o+8|0;if(((I=c[t>>2]|0,c[t>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+16>>2]&1023](o)}}while(0);if((q|0)==0){break}o=(q-1|0)/2|0;t=k+(o<<4)|0;w=t|0;u=c[w>>2]|0;a=c[w+4>>2]|0;if((g|0)<(a|0)|(g|0)==(a|0)&s>>>0<u>>>0){q=o;m=e;e=t;v=a;r=u}else{break}}r=e|0;c[r>>2]=s;c[r+4>>2]=g;c[x>>2]=j;j=c[y>>2]|0;c[y>>2]=l;if((j|0)==0){return}l=j+4|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[j>>2]|0)+8>>2]&1023](j|0);l=j+8|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[j>>2]|0)+16>>2]&1023](j);return}function d8(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;j=(f|0)==0;if(!j){k=f+4|0;I=c[k>>2]|0,c[k>>2]=I+1,I}k=c[d>>2]|0;do{if((a[k+24|0]&1)==0){d=k+16|0;if((c[d>>2]|0)==0){break}c[h>>2]=e;l=h+4|0;c[l>>2]=f;if(!j){m=f+4|0;I=c[m>>2]|0,c[m>>2]=I+1,I}m=c[d>>2]|0;if((m|0)==0){d=bR(4)|0;c[d>>2]=5464;bl(d|0,25448,372)}cf[c[(c[m>>2]|0)+24>>2]&63](b,m,h);m=c[l>>2]|0;do{if((m|0)!=0){l=m+4|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[m>>2]|0)+8>>2]&1023](m|0);l=m+8|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[m>>2]|0)+16>>2]&1023](m)}}while(0);if(j){i=g;return}m=f+4|0;if(((I=c[m>>2]|0,c[m>>2]=I+ -1,I)|0)!=0){i=g;return}b0[c[(c[f>>2]|0)+8>>2]&1023](f|0);m=f+8|0;if(((I=c[m>>2]|0,c[m>>2]=I+ -1,I)|0)!=0){i=g;return}b0[c[(c[f>>2]|0)+16>>2]&1023](f);i=g;return}}while(0);c[b+16>>2]=0;if(j){i=g;return}j=f+4|0;if(((I=c[j>>2]|0,c[j>>2]=I+ -1,I)|0)!=0){i=g;return}b0[c[(c[f>>2]|0)+8>>2]&1023](f|0);j=f+8|0;if(((I=c[j>>2]|0,c[j>>2]=I+ -1,I)|0)!=0){i=g;return}b0[c[(c[f>>2]|0)+16>>2]&1023](f);i=g;return}function d9(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;if((a|0)==0){return}a=c[7328]|0;if((a|0)==0){bL()}b=a+8|0;d=c[b>>2]|0;do{if((d|0)!=0){e=a+12|0;f=c[e>>2]|0;if((d|0)==(f|0)){g=d}else{h=f;while(1){f=h-16|0;c[e>>2]=f;i=c[h-16+12>>2]|0;if((i|0)==0){j=f}else{f=i+4|0;do{if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)==0){b0[c[(c[i>>2]|0)+8>>2]&1023](i|0);k=i+8|0;if(((I=c[k>>2]|0,c[k>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[i>>2]|0)+16>>2]&1023](i)}}while(0);j=c[e>>2]|0}if((d|0)==(j|0)){break}else{h=j}}h=c[b>>2]|0;if((h|0)==0){break}else{g=h}}qI(g)}}while(0);g=c[a+4>>2]|0;do{if((g|0)!=0){b=g+4|0;if(((I=c[b>>2]|0,c[b>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[g>>2]|0)+8>>2]&1023](g|0);b=g+8|0;if(((I=c[b>>2]|0,c[b>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[g>>2]|0)+16>>2]&1023](g)}}while(0);qI(a);c[7328]=0;return}function ea(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;if((b|0)<=1){return}d=a+32|0;if((b|0)==2){e=a+16|0;f=e|0;g=1;h=e;i=c[f+4>>2]|0;j=c[f>>2]|0}else{f=a+16|0;e=c[f>>2]|0;k=c[f+4>>2]|0;f=d|0;l=c[f>>2]|0;m=c[f+4>>2]|0;f=(k|0)<(m|0)|(k|0)==(m|0)&e>>>0<l>>>0;g=f?1:2;h=f?a+16|0:d;i=f?k:m;j=f?e:l}l=a|0;e=c[l>>2]|0;f=c[l+4>>2]|0;if(!((i|0)<(f|0)|(i|0)==(f|0)&j>>>0<e>>>0)){return}j=h|0;i=a+8|0;l=c[i>>2]|0;m=a+12|0;k=c[m>>2]|0;c[i>>2]=0;c[m>>2]=0;m=g;g=h;h=a;i=c[j+4>>2]|0;d=c[j>>2]|0;while(1){j=h|0;c[j>>2]=d;c[j+4>>2]=i;n=g+8|0;j=c[n>>2]|0;o=g+12|0;p=c[o>>2]|0;c[n>>2]=0;c[o>>2]=0;c[h+8>>2]=j;j=h+12|0;q=c[j>>2]|0;c[j>>2]=p;do{if((q|0)!=0){p=q+4|0;if(((I=c[p>>2]|0,c[p>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[q>>2]|0)+8>>2]&1023](q|0);p=q+8|0;if(((I=c[p>>2]|0,c[p>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[q>>2]|0)+16>>2]&1023](q)}}while(0);q=m<<1;p=q+2|0;if((p|0)>(b|0)){break}j=a+(p<<4)|0;r=q|1;do{if((p|0)==(b|0)){q=a+(r<<4)|0;s=q|0;t=r;u=q;v=c[s+4>>2]|0;w=c[s>>2]|0}else{s=a+(r<<4)|0;q=c[s>>2]|0;x=c[s+4>>2]|0;s=j|0;y=c[s>>2]|0;z=c[s+4>>2]|0;if(!((x|0)<(z|0)|(x|0)==(z|0)&q>>>0<y>>>0)){t=p;u=j;v=z;w=y;break}t=r;u=a+(r<<4)|0;v=x;w=q}}while(0);if((v|0)<(f|0)|(v|0)==(f|0)&w>>>0<e>>>0){m=t;h=g;g=u;i=v;d=w}else{break}}w=g|0;c[w>>2]=e;c[w+4>>2]=f;c[n>>2]=l;l=c[o>>2]|0;c[o>>2]=k;if((l|0)==0){return}k=l+4|0;if(((I=c[k>>2]|0,c[k>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[l>>2]|0)+8>>2]&1023](l|0);k=l+8|0;if(((I=c[k>>2]|0,c[k>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[l>>2]|0)+16>>2]&1023](l);return}function eb(a){a=a|0;var b=0;c[a>>2]=5200;b=c[a+20>>2]|0;if((b|0)==0){return}a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function ec(a){a=a|0;var b=0,d=0;c[a>>2]=5200;b=c[a+20>>2]|0;do{if((b|0)!=0){d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}if((a|0)!=0){break}return}}while(0);qI(a);return}function ed(a){a=a|0;var b=0;b=a+12|0;b0[c[c[b>>2]>>2]&1023](b);return}function ee(a){a=a|0;if((a|0)==0){return}qI(a);return}function ef(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function eg(a){a=a|0;var b=0,d=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}if((a|0)!=0){break}return}}while(0);qI(a);return}function eh(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;d=i;i=i+40|0;g=e;e=i;i=i+8|0;c[e>>2]=c[g>>2];c[e+4>>2]=c[g+4>>2];g=d|0;h=d+24|0;j=e|0;e=c[j>>2]|0;k=c[j+4>>2]|0;while(1){l=qH(48)|0;if((l|0)!=0){break}j=(I=c[7664]|0,c[7664]=I+0,I);if((j|0)==0){m=9;break}b8[j&1]()}if((m|0)==9){j=bR(4)|0;c[j>>2]=3284;bl(j|0,24120,94)}j=l+4|0;c[j>>2]=0;n=l+8|0;c[n>>2]=0;c[l>>2]=4880;c[l+32>>2]=0;o=l;p=f|0;q=c[p>>2]|0;r=f+4|0;f=c[r>>2]|0;if((f|0)!=0){s=f+4|0;I=c[s>>2]|0,c[s>>2]=I+1,I}do{if(((I=c[j>>2]|0,c[j>>2]=I+ -1,I)|0)==0){b0[c[(c[l>>2]|0)+8>>2]&1023](l);if(((I=c[n>>2]|0,c[n>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[l>>2]|0)+16>>2]&1023](o)}}while(0);a[q+24|0]=0;o=h|0;c[o>>2]=e;c[o+4>>2]=k;c[h+8>>2]=q;q=h+12|0;c[q>>2]=f;d7(h);h=c[q>>2]|0;do{if((h|0)!=0){q=h+4|0;if(((I=c[q>>2]|0,c[q>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[h>>2]|0)+8>>2]&1023](h|0);q=h+8|0;if(((I=c[q>>2]|0,c[q>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[h>>2]|0)+16>>2]&1023](h)}}while(0);h=c[p>>2]|0;p=c[r>>2]|0;r=(p|0)==0;if(!r){q=p+4|0;I=c[q>>2]|0,c[q>>2]=I+1,I;I=c[q>>2]|0,c[q>>2]=I+1,I}q=g+16|0;f=g;c[q>>2]=f;c[g>>2]=6656;c[g+4>>2]=h;c[g+8>>2]=p;c[b+16>>2]=b;do{if((b|0)==0){t=6656;m=28}else{c[b>>2]=6656;c[b+4>>2]=h;c[b+8>>2]=p;if(r){t=6656;m=28;break}k=p+4|0;I=c[k>>2]|0,c[k>>2]=I+1,I;k=c[q>>2]|0;if((k|0)==(f|0)){t=c[g>>2]|0;m=28;break}if((k|0)==0){break}b0[c[(c[k>>2]|0)+20>>2]&1023](k)}}while(0);if((m|0)==28){b0[c[t+16>>2]&1023](f)}c[q>>2]=0;if(r){i=d;return}r=p+4|0;if(((I=c[r>>2]|0,c[r>>2]=I+ -1,I)|0)!=0){i=d;return}b0[c[(c[p>>2]|0)+8>>2]&1023](p|0);r=p+8|0;if(((I=c[r>>2]|0,c[r>>2]=I+ -1,I)|0)!=0){i=d;return}b0[c[(c[p>>2]|0)+16>>2]&1023](p);i=d;return}function ei(a){a=a|0;var b=0;c[a>>2]=6656;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function ej(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=6656;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function ek(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(12)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=6656;c[b+4>>2]=c[a+4>>2];e=c[a+8>>2]|0;c[b+8>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function el(a,b){a=a|0;b=b|0;var d=0;if((b|0)==0){return}c[b>>2]=6656;c[b+4>>2]=c[a+4>>2];d=c[a+8>>2]|0;c[b+8>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function em(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function en(a){a=a|0;var b=0,d=0,e=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function eo(b){b=b|0;a[(c[b+4>>2]|0)+24|0]=1;return}function ep(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=8836){d=0;return d|0}d=a+4|0;return d|0}function eq(a){a=a|0;return 23936}function er(a){a=a|0;var b=0,d=0;c[a>>2]=4976;b=c[a+24>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+16>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function es(a){a=a|0;var b=0,d=0;c[a>>2]=4976;b=c[a+24>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+16>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function et(a){a=a|0;var b=0,d=0;b=c[a+24>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+16>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function eu(a){a=a|0;if((a|0)==0){return}qI(a);return}function ev(a){a=a|0;var b=0;c[a>>2]=5328;b;b=c[a+32>>2]|0;if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}if((b|0)==0){return}b0[c[(c[b>>2]|0)+20>>2]&1023](b);return}function ew(a){a=a|0;var b=0;c[a>>2]=5328;b;b=c[a+32>>2]|0;do{if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function ex(a){a=a|0;var b=0;b;b=c[a+32>>2]|0;if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}if((b|0)==0){return}b0[c[(c[b>>2]|0)+20>>2]&1023](b);return}function ey(a){a=a|0;if((a|0)==0){return}qI(a);return}function ez(a){a=a|0;var b=0;c[a>>2]=7768;b=c[a+32>>2]|0;do{if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+8>>2]|0;if((b|0)==0){return}a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function eA(a){a=a|0;var b=0,d=0;c[a>>2]=7768;b=c[a+32>>2]|0;do{if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function eB(a){a=a|0;if((a|0)==0){return}qI(a);return}function eC(a){a=a|0;var b=0,d=0;while(1){b=qH(8)|0;if((b|0)!=0){d=12;break}a=(I=c[7664]|0,c[7664]=I+0,I);if((a|0)==0){break}b8[a&1]()}if((d|0)==12){c[b>>2]=2128;return b|0}b=bR(4)|0;c[b>>2]=3284;bl(b|0,24120,94);return 0}function eD(a,b){a=a|0;b=b|0;if((b|0)==0){return}c[b>>2]=2128;return}function eE(a){a=a|0;return}function eF(a){a=a|0;if((a|0)==0){return}qI(a);return}function eG(a,b){a=a|0;b=b|0;return(c[b>>2]|0)>-1|0}function eH(a,b){a=a|0;b=b|0;return((c[b+4>>2]|0)==2300?a+4|0:0)|0}function eI(a){a=a|0;return 2784}function eJ(a){a=a|0;return}function eK(a){a=a|0;return}function eL(a){a=a|0;if((a|0)==0){return}qI(a);return}function eM(a){a=a|0;var b=0,d=0,e=0;while(1){b=qH(8)|0;if((b|0)!=0){d=12;break}e=(I=c[7664]|0,c[7664]=I+0,I);if((e|0)==0){break}b8[e&1]()}if((d|0)==12){c[b>>2]=7472;c[b+4>>2]=c[a+4>>2];return b|0}b=bR(4)|0;c[b>>2]=3284;bl(b|0,24120,94);return 0}function eN(a,b){a=a|0;b=b|0;if((b|0)==0){return}c[b>>2]=7472;c[b+4>>2]=c[a+4>>2];return}function eO(a){a=a|0;return}function eP(a){a=a|0;if((a|0)==0){return}qI(a);return}function eQ(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;j=i;i=i+152|0;k=j|0;l=j+24|0;m=j+48|0;n=j+72|0;o=j+96|0;p=j+120|0;q=j+128|0;r=e|0;s=c[r>>2]|0;t=e+4|0;e=c[t>>2]|0;c[r>>2]=0;c[t>>2]=0;t=f|0;r=c[t>>2]|0;u=f+4|0;f=c[u>>2]|0;c[t>>2]=0;c[u>>2]=0;u=h+16|0;t=c[u>>2]|0;do{if((t|0)==0){c[q+16>>2]=0}else{if((t|0)==(h|0)){v=q;c[q+16>>2]=v;b1[c[(c[t>>2]|0)+12>>2]&255](t,v);break}else{c[q+16>>2]=t;c[u>>2]=0;break}}}while(0);u=c[d+4>>2]|0;while(1){w=qH(72)|0;if((w|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){x=16;break}b8[d&1]()}if((x|0)==16){d=bR(4)|0;c[d>>2]=3284;bl(d|0,24120,94)}d=w;t=(e|0)==0;if(!t){h=e+4|0;I=c[h>>2]|0,c[h>>2]=I+1,I}h=(f|0)==0;if(!h){v=f+4|0;I=c[v>>2]|0,c[v>>2]=I+1,I}v=g+16|0;y=c[v>>2]|0;do{if((y|0)==0){c[n+16>>2]=0;z=0;A=g}else{B=g;if((y|0)!=(B|0)){c[n+16>>2]=y;c[v>>2]=0;z=0;A=B;break}B=n;c[n+16>>2]=B;b1[c[(c[y>>2]|0)+12>>2]&255](y,B);z=c[v>>2]|0;A=y}}while(0);do{if((z|0)==(A|0)){b0[c[(c[A>>2]|0)+16>>2]&1023](A)}else{if((z|0)==0){break}b0[c[(c[z>>2]|0)+20>>2]&1023](z)}}while(0);c[v>>2]=0;v=n+16|0;z=c[v>>2]|0;do{if((z|0)==0){c[m+16>>2]=0}else{if((z|0)!=(n|0)){c[m+16>>2]=z;c[v>>2]=0;break}A=m;c[m+16>>2]=A;b1[c[(c[z>>2]|0)+12>>2]&255](z,A);A=c[v>>2]|0;if((A|0)==(z|0)){b0[c[(c[z>>2]|0)+16>>2]&1023](z);break}if((A|0)==0){break}b0[c[(c[A>>2]|0)+20>>2]&1023](A)}}while(0);c[v>>2]=0;z=w+8|0;A=z;c[A>>2]=0;y=w+12|0;c[y>>2]=0;g=w+16|0;B=g;a[g]=0;c[w+48>>2]=0;c[w+52>>2]=0;g=w+56|0;c[g>>2]=r;r=w+60|0;c[r>>2]=f;C=m+16|0;D=c[C>>2]|0;do{if((D|0)==0){c[l+16>>2]=0}else{if((D|0)!=(m|0)){c[l+16>>2]=D;c[C>>2]=0;break}E=l;c[l+16>>2]=E;b1[c[(c[D>>2]|0)+12>>2]&255](D,E);E=c[C>>2]|0;if((E|0)==(D|0)){b0[c[(c[D>>2]|0)+16>>2]&1023](D);break}if((E|0)==0){break}b0[c[(c[E>>2]|0)+20>>2]&1023](E)}}while(0);c[C>>2]=0;fa(B,l);B=c[l+16>>2]|0;do{if((B|0)==(l|0)){b0[c[(c[B>>2]|0)+16>>2]&1023](B)}else{if((B|0)==0){break}b0[c[(c[B>>2]|0)+20>>2]&1023](B)}}while(0);do{if((c[g>>2]|0)==0){while(1){F=qH(16)|0;if((F|0)!=0){break}B=(I=c[7664]|0,c[7664]=I+0,I);if((B|0)==0){x=66;break}b8[B&1]()}if((x|0)==66){B=bR(4)|0;c[B>>2]=3284;bl(B|0,24120,94)}c[F+4>>2]=0;c[F+8>>2]=0;c[F>>2]=4912;B=F+12|0;c[B>>2]=7712;c[g>>2]=B;B=c[r>>2]|0;c[r>>2]=F;if((B|0)==0){break}l=B+4|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[B>>2]|0)+8>>2]&1023](B|0);l=B+8|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[B>>2]|0)+16>>2]&1023](B)}}while(0);F=c[C>>2]|0;C=m;do{if((F|0)==(C|0)){b0[c[(c[m>>2]|0)+16>>2]&1023](C)}else{if((F|0)==0){break}b0[c[(c[F>>2]|0)+20>>2]&1023](F)}}while(0);c[w>>2]=7896;c[w+64>>2]=s;c[w+68>>2]=e;if(!t){s=e+4|0;I=c[s>>2]|0,c[s>>2]=I+1,I}while(1){G=qH(16)|0;if((G|0)!=0){break}s=(I=c[7664]|0,c[7664]=I+0,I);if((s|0)==0){x=107;break}b8[s&1]()}if((x|0)==107){x=bR(4)|0;c[x>>2]=3284;bl(x|0,24120,94)}x=G;s=G+4|0;c[s>>2]=0;F=G+8|0;c[F>>2]=0;c[G>>2]=4784;c[G+12>>2]=d;do{if((z|0)!=0){I=c[F>>2]|0,c[F>>2]=I+1,I;c[z>>2]=d;C=w+12|0;m=c[C>>2]|0;c[C>>2]=x;if((m|0)==0){break}C=m+8|0;if(((I=c[C>>2]|0,c[C>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[m>>2]|0)+16>>2]&1023](m)}}while(0);d=c[v>>2]|0;v=n;do{if((d|0)==(v|0)){b0[c[(c[n>>2]|0)+16>>2]&1023](v)}else{if((d|0)==0){break}b0[c[(c[d>>2]|0)+20>>2]&1023](d)}}while(0);do{if(!t){d=e+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[e>>2]|0)+8>>2]&1023](e|0);d=e+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[e>>2]|0)+16>>2]&1023](e)}}while(0);d=c[A>>2]|0;A=c[y>>2]|0;L107:do{if((A|0)!=0){y=A+4|0;do{v=c[y>>2]|0;if((v|0)==-1){break L107}}while(((I=c[y>>2]|0,(c[y>>2]|0)==(v|0)?(c[y>>2]=v+1)|0:0,I)|0)!=(v|0));I=c[y>>2]|0,c[y>>2]=I+1,I;v=k+16|0;n=k;c[v>>2]=n;c[k>>2]=6752;c[k+4>>2]=d;c[k+8>>2]=A;z=o;m=o+16|0;c[m>>2]=z;c[o>>2]=6752;c[o+4>>2]=d;c[o+8>>2]=A;I=c[y>>2]|0,c[y>>2]=I+1,I;C=c[v>>2]|0;do{if((C|0)==(n|0)){b0[c[(c[k>>2]|0)+16>>2]&1023](n)}else{if((C|0)==0){break}b0[c[(c[C>>2]|0)+20>>2]&1023](C)}}while(0);c[v>>2]=0;do{if(((I=c[y>>2]|0,c[y>>2]=I+ -1,I)|0)==0){b0[c[(c[A>>2]|0)+8>>2]&1023](A|0);C=A+8|0;if(((I=c[C>>2]|0,c[C>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[A>>2]|0)+16>>2]&1023](A)}}while(0);y=q+16|0;v=c[y>>2]|0;if((v|0)==0){C=bR(4)|0;c[C>>2]=5464;bl(C|0,25448,372)}b1[c[(c[v>>2]|0)+24>>2]&255](v,o);v=c[m>>2]|0;do{if((v|0)==(z|0)){b0[c[(c[o>>2]|0)+16>>2]&1023](z)}else{if((v|0)==0){break}b0[c[(c[v>>2]|0)+20>>2]&1023](v)}}while(0);v=c[u+40>>2]|0;z=c[c[v>>2]>>2]|0;c[p>>2]=w;m=p+4|0;c[m>>2]=x;I=c[s>>2]|0,c[s>>2]=I+1,I;cf[z&63](b,v,p);v=c[m>>2]|0;do{if((v|0)!=0){m=v+4|0;if(((I=c[m>>2]|0,c[m>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[v>>2]|0)+8>>2]&1023](v|0);m=v+8|0;if(((I=c[m>>2]|0,c[m>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[v>>2]|0)+16>>2]&1023](v)}}while(0);do{if(((I=c[s>>2]|0,c[s>>2]=I+ -1,I)|0)==0){b0[c[(c[G>>2]|0)+8>>2]&1023](G);if(((I=c[F>>2]|0,c[F>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[G>>2]|0)+16>>2]&1023](x)}}while(0);v=c[y>>2]|0;m=q;do{if((v|0)==(m|0)){b0[c[(c[q>>2]|0)+16>>2]&1023](m)}else{if((v|0)==0){break}b0[c[(c[v>>2]|0)+20>>2]&1023](v)}}while(0);do{if(!h){v=f+4|0;if(((I=c[v>>2]|0,c[v>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[f>>2]|0)+8>>2]&1023](f|0);v=f+8|0;if(((I=c[v>>2]|0,c[v>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[f>>2]|0)+16>>2]&1023](f)}}while(0);if(t){i=j;return}v=e+4|0;if(((I=c[v>>2]|0,c[v>>2]=I+ -1,I)|0)!=0){i=j;return}b0[c[(c[e>>2]|0)+8>>2]&1023](e|0);v=e+8|0;if(((I=c[v>>2]|0,c[v>>2]=I+ -1,I)|0)!=0){i=j;return}b0[c[(c[e>>2]|0)+16>>2]&1023](e);i=j;return}}while(0);j=bR(4)|0;c[j>>2]=5928;bl(j|0,25656,646)}function eR(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=10568){d=0;return d|0}d=a+4|0;return d|0}function eS(a){a=a|0;return 24072}function eT(a){a=a|0;var b=0;c[a>>2]=6752;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function eU(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=6752;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function eV(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(12)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=6752;c[b+4>>2]=c[a+4>>2];e=c[a+8>>2]|0;c[b+8>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function eW(a,b){a=a|0;b=b|0;var d=0;if((b|0)==0){return}c[b>>2]=6752;c[b+4>>2]=c[a+4>>2];d=c[a+8>>2]|0;c[b+8>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function eX(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function eY(a){a=a|0;var b=0,d=0,e=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function eZ(a){a=a|0;e0((c[a+4>>2]|0)+8|0);return}function e_(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=8968){d=0;return d|0}d=a+4|0;return d|0}function e$(a){a=a|0;return 23952}function e0(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;while(1){d=qH(16)|0;if((d|0)!=0){break}e=(I=c[7664]|0,c[7664]=I+0,I);if((e|0)==0){f=9;break}b8[e&1]()}if((f|0)==9){f=bR(4)|0;c[f>>2]=3284;bl(f|0,24120,94)}c[d+4>>2]=0;c[d+8>>2]=0;c[d>>2]=4912;f=d+12|0;c[f>>2]=7712;e=f;f=d;d=b+40|0;c[d>>2]=e;g=b+44|0;h=c[g>>2]|0;c[g>>2]=f;if((h|0)==0){i=e;j=f}else{f=h+4|0;do{if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)==0){b0[c[(c[h>>2]|0)+8>>2]&1023](h|0);e=h+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[h>>2]|0)+16>>2]&1023](h)}}while(0);i=c[d>>2]|0;j=c[g>>2]|0}h=b+48|0;f=c[h>>2]|0;c[h>>2]=i;c[d>>2]=f;f=b+52|0;d=c[f>>2]|0;c[f>>2]=j;c[g>>2]=d;d=b+8|0;g=a[d]|0;if((g&1)==0){return}j=b+16|0;if((j|0)==0){return}f=b+32|0;b=c[f>>2]|0;if((b|0)==0){k=g}else{b0[c[(c[b>>2]|0)+24>>2]&1023](b);b=c[f>>2]|0;do{if((b|0)==(j|0)){b0[c[(c[j>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);c[f>>2]=0;k=a[d]|0}if((k&1)==0){return}a[d]=0;return}function e1(a){a=a|0;return}function e2(a){a=a|0;if((a|0)==0){return}qI(a);return}function e3(a){a=a|0;var b=0;b=a+12|0;b0[c[(c[b>>2]|0)+12>>2]&1023](b);return}function e4(a){a=a|0;if((a|0)==0){return}qI(a);return}function e5(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+4|0;e=d|0;f=c[a+64>>2]|0;c[e>>2]=c[b>>2];g=c[f+64>>2]|0;if((g|0)==0){f=bR(4)|0;c[f>>2]=5464;bl(f|0,25448,372)}if(!(b2[c[(c[g>>2]|0)+24>>2]&127](g,e)|0)){i=d;return}e=c[a+56>>2]|0;b1[c[c[e>>2]>>2]&255](e,b);i=d;return}function e6(a){a=a|0;var b=0;b=c[a+56>>2]|0;b0[c[(c[b>>2]|0)+4>>2]&1023](b);e0(a+8|0);return}function e7(a,b){a=a|0;b=b|0;var d=0;d=c[a+56>>2]|0;b1[c[(c[d>>2]|0)+8>>2]&255](d,b);e0(a+8|0);return}function e8(b){b=b|0;var d=0,e=0;c[b>>2]=7896;d=c[b+68>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=c[b+60>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=c[b+52>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=b+16|0;do{if((a[d]&1)!=0){a[d]=0;e=c[b+40>>2]|0;if((e|0)==(b+24|0)){b0[c[(c[e>>2]|0)+16>>2]&1023](e);break}if((e|0)==0){break}b0[c[(c[e>>2]|0)+20>>2]&1023](e)}}while(0);d=c[b+12>>2]|0;if((d|0)==0){return}b=d+8|0;if(((I=c[b>>2]|0,c[b>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[d>>2]|0)+16>>2]&1023](d);return}function e9(b){b=b|0;var d=0,e=0;c[b>>2]=7896;d=c[b+68>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=c[b+60>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=c[b+52>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=b+16|0;do{if((a[d]&1)!=0){a[d]=0;e=c[b+40>>2]|0;if((e|0)==(b+24|0)){b0[c[(c[e>>2]|0)+16>>2]&1023](e);break}if((e|0)==0){break}b0[c[(c[e>>2]|0)+20>>2]&1023](e)}}while(0);d=c[b+12>>2]|0;do{if((d|0)!=0){e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);if((b|0)==0){return}qI(b);return}function fa(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;e=i;i=i+24|0;f=e|0;g=b|0;h=b+8|0;if((a[g]&1)==0){if((h|0)!=0){j=d+16|0;k=c[j>>2]|0;do{if((k|0)==0){c[b+24>>2]=0;l=d;m=24}else{n=d;if((k|0)==(n|0)){o=h;c[b+24>>2]=o;p=c[j>>2]|0;b1[c[(c[p>>2]|0)+12>>2]&255](p,o);l=k;m=24;break}else{c[b+24>>2]=k;c[j>>2]=0;q=0;r=n;break}}}while(0);if((m|0)==24){q=c[j>>2]|0;r=l}do{if((q|0)==(r|0)){b0[c[(c[r>>2]|0)+16>>2]&1023](r)}else{if((q|0)==0){break}b0[c[(c[q>>2]|0)+20>>2]&1023](q)}}while(0);c[j>>2]=0}a[g]=1;i=e;return}g=d+16|0;j=c[g>>2]|0;do{if((j|0)==0){c[f+16>>2]=0;s=0;t=d}else{q=d;if((j|0)!=(q|0)){c[f+16>>2]=j;c[g>>2]=0;s=0;t=q;break}r=f;c[f+16>>2]=r;b1[c[(c[d>>2]|0)+12>>2]&255](q,r);s=c[g>>2]|0;t=q}}while(0);do{if((s|0)==(t|0)){b0[c[(c[t>>2]|0)+16>>2]&1023](t)}else{if((s|0)==0){break}b0[c[(c[s>>2]|0)+20>>2]&1023](s)}}while(0);c[g>>2]=0;dB(h,f|0);h=c[f+16>>2]|0;if((h|0)==(f|0)){b0[c[(c[h>>2]|0)+16>>2]&1023](h);i=e;return}if((h|0)==0){i=e;return}b0[c[(c[h>>2]|0)+20>>2]&1023](h);i=e;return}function fb(a){a=a|0;return}function fc(a){a=a|0;if((a|0)==0){return}qI(a);return}function fd(a){a=a|0;var b=0;b=c[a+12>>2]|0;if((b|0)==0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function fe(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)==16100){d=a+12|0}else{d=0}return d|0}function ff(a){a=a|0;if((a|0)==0){return}qI(a);return}function fg(a){a=a|0;if((a|0)==0){return}qI(a);return}function fh(a){a=a|0;var b=0,d=0,e=0;while(1){b=qH(8)|0;if((b|0)!=0){d=12;break}e=(I=c[7664]|0,c[7664]=I+0,I);if((e|0)==0){break}b8[e&1]()}if((d|0)==12){c[b>>2]=1996;c[b+4>>2]=c[a+4>>2];return b|0}b=bR(4)|0;c[b>>2]=3284;bl(b|0,24120,94);return 0}function fi(a,b){a=a|0;b=b|0;if((b|0)==0){return}c[b>>2]=1996;c[b+4>>2]=c[a+4>>2];return}function fj(a){a=a|0;return}function fk(a){a=a|0;if((a|0)==0){return}qI(a);return}function fl(a,b){a=a|0;b=b|0;c[c[a+4>>2]>>2]=c[b>>2];return}function fm(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=2252){d=0;return d|0}d=a+4|0;return d|0}function fn(a){a=a|0;return 2760}function fo(a){a=a|0;return}function fp(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5040;b=a+16|0;c[b>>2]=7816;d=c[a+80>>2]|0;do{if((d|0)==(a+64|0)){b0[c[(c[d>>2]|0)+16>>2]&1023](d)}else{if((d|0)==0){break}b0[c[(c[d>>2]|0)+20>>2]&1023](d)}}while(0);d=c[a+60>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);c[b>>2]=7744;b=c[a+48>>2]|0;do{if((b|0)==(a+32|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+24>>2]|0;if((b|0)==0){return}a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function fq(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5040;b=a+16|0;c[b>>2]=7816;d=c[a+80>>2]|0;do{if((d|0)==(a+64|0)){b0[c[(c[d>>2]|0)+16>>2]&1023](d)}else{if((d|0)==0){break}b0[c[(c[d>>2]|0)+20>>2]&1023](d)}}while(0);d=c[a+60>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);c[b>>2]=7744;b=c[a+48>>2]|0;do{if((b|0)==(a+32|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+24>>2]|0;do{if((b|0)!=0){d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function fr(a){a=a|0;var b=0;b=a+16|0;b0[c[(c[b>>2]|0)+4>>2]&1023](b);return}function fs(a){a=a|0;if((a|0)==0){return}qI(a);return}function ft(a){a=a|0;var b=0,d=0,e=0;b=a|0;c[b>>2]=7816;d=c[a+64>>2]|0;do{if((d|0)==(a+48|0)){b0[c[(c[d>>2]|0)+16>>2]&1023](d)}else{if((d|0)==0){break}b0[c[(c[d>>2]|0)+20>>2]&1023](d)}}while(0);d=c[a+44>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);c[b>>2]=7744;b=c[a+32>>2]|0;do{if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+8>>2]|0;if((b|0)==0){return}a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function fu(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;f=i;i=i+192|0;g=f|0;h=f+24|0;j=f+48|0;k=f+72|0;l=f+80|0;m=f+104|0;n=f+112|0;o=f+120|0;p=f+144|0;q=f+168|0;while(1){r=qH(28)|0;if((r|0)!=0){break}s=(I=c[7664]|0,c[7664]=I+0,I);if((s|0)==0){t=9;break}b8[s&1]()}if((t|0)==9){s=bR(4)|0;c[s>>2]=3284;bl(s|0,24120,94)}s=r+4|0;c[s>>2]=0;u=r+8|0;c[u>>2]=0;c[r>>2]=4944;v=r+12|0;while(1){w=qH(72)|0;if((w|0)!=0){break}x=(I=c[7664]|0,c[7664]=I+0,I);if((x|0)==0){t=21;break}b8[x&1]()}if((t|0)==21){x=bR(4)|0;c[x>>2]=3284;bl(x|0,24120,94)}c[w+4>>2]=0;c[w+8>>2]=0;c[w>>2]=5328;c[w+32>>2]=0;a[w+40|0]=0;qP(w+44|0,0,24)|0;c[v>>2]=w+16;c[r+16>>2]=w;while(1){y=qH(72)|0;if((y|0)!=0){break}w=(I=c[7664]|0,c[7664]=I+0,I);if((w|0)==0){t=32;break}b8[w&1]()}if((t|0)==32){w=bR(4)|0;c[w>>2]=3284;bl(w|0,24120,94)}c[y+4>>2]=0;c[y+8>>2]=0;c[y>>2]=5328;c[y+32>>2]=0;a[y+40|0]=0;qP(y+44|0,0,24)|0;c[r+20>>2]=y+16;c[r+24>>2]=y;y=v;w=r;x=c[d+4>>2]|0;z=c[d+8>>2]|0;L25:do{if((z|0)!=0){A=z+4|0;do{B=c[A>>2]|0;if((B|0)==-1){break L25}}while(((I=c[A>>2]|0,(c[A>>2]|0)==(B|0)?(c[A>>2]=B+1)|0:0,I)|0)!=(B|0));B=c[7328]|0;do{if((B|0)==0){t=52}else{C=c[B>>2]|0;D=c[B+4>>2]|0;do{if((D|0)!=0){E=D+4|0;I=c[E>>2]|0,c[E>>2]=I+1,I;if(((I=c[E>>2]|0,c[E>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[D>>2]|0)+8>>2]&1023](D|0);E=D+8|0;if(((I=c[E>>2]|0,c[E>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[D>>2]|0)+16>>2]&1023](D)}}while(0);if((C|0)==0){t=52;break}D=r+20|0;c[m>>2]=x;E=m+4|0;c[E>>2]=z;I=c[A>>2]|0,c[A>>2]=I+1,I;c[n>>2]=c[e>>2];F=n+4|0;G=c[e+4>>2]|0;c[F>>2]=G;if((G|0)!=0){H=G+4|0;I=c[H>>2]|0,c[H>>2]=I+1,I}H=D;D=c[H>>2]|0;G=c[r+24>>2]|0;J=(G|0)==0;if(!J){K=G+4|0;I=c[K>>2]|0,c[K>>2]=I+1,I;I=c[K>>2]|0,c[K>>2]=I+1,I}K=h+16|0;L=h;c[K>>2]=L;c[h>>2]=6944;c[h+4>>2]=D;c[h+8>>2]=G;M=o;N=o+16|0;c[N>>2]=M;c[o>>2]=6944;c[o+4>>2]=D;c[o+8>>2]=G;do{if(J){O=6944;t=158}else{D=G+4|0;I=c[D>>2]|0,c[D>>2]=I+1,I;D=c[K>>2]|0;if((D|0)==(L|0)){O=c[h>>2]|0;t=158;break}if((D|0)==0){break}b0[c[(c[D>>2]|0)+20>>2]&1023](D)}}while(0);if((t|0)==158){b0[c[O+16>>2]&1023](L)}c[K>>2]=0;do{if(!J){C=G+4|0;if(((I=c[C>>2]|0,c[C>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[G>>2]|0)+8>>2]&1023](G|0);C=G+8|0;if(((I=c[C>>2]|0,c[C>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[G>>2]|0)+16>>2]&1023](G)}}while(0);I=c[s>>2]|0,c[s>>2]=I+1,I;G=p+16|0;J=p;c[G>>2]=J;c[p>>2]=7088;c[p+4>>2]=y;c[p+8>>2]=w;K=c[d+32>>2]|0;if((K|0)==0){L=bR(4)|0;c[L>>2]=5464;bl(L|0,25448,372)}cc[c[(c[K>>2]|0)+24>>2]&63](l,K,m,n,o,p);c7(c[H>>2]|0,l);K=c[l+16>>2]|0;do{if((K|0)==(l|0)){b0[c[(c[K>>2]|0)+16>>2]&1023](K)}else{if((K|0)==0){break}b0[c[(c[K>>2]|0)+20>>2]&1023](K)}}while(0);K=c[G>>2]|0;do{if((K|0)==(J|0)){b0[c[(c[p>>2]|0)+16>>2]&1023](J)}else{if((K|0)==0){break}b0[c[(c[K>>2]|0)+20>>2]&1023](K)}}while(0);K=c[N>>2]|0;do{if((K|0)==(M|0)){b0[c[(c[o>>2]|0)+16>>2]&1023](M)}else{if((K|0)==0){break}b0[c[(c[K>>2]|0)+20>>2]&1023](K)}}while(0);K=c[F>>2]|0;do{if((K|0)!=0){M=K+4|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[K>>2]|0)+8>>2]&1023](K|0);M=K+8|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[K>>2]|0)+16>>2]&1023](K)}}while(0);K=c[E>>2]|0;if((K|0)==0){break}F=K+4|0;if(((I=c[F>>2]|0,c[F>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[K>>2]|0)+8>>2]&1023](K|0);F=K+8|0;if(((I=c[F>>2]|0,c[F>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[K>>2]|0)+16>>2]&1023](K)}}while(0);do{if((t|0)==52){while(1){t=0;P=qH(24)|0;if((P|0)!=0){break}B=(I=c[7664]|0,c[7664]=I+0,I);if((B|0)==0){t=60;break}b8[B&1]();t=52}if((t|0)==60){E=bR(4)|0;c[E>>2]=3284;bl(E|0,24120,94)}E=P+4|0;c[E>>2]=0;B=P+8|0;c[B>>2]=0;c[P>>2]=5168;K=P+12|0;c[P+16>>2]=0;c[P+20>>2]=0;c[K>>2]=8016;F=P;M=(K|0)==0?0:P+16|0;do{if((M|0)!=0){N=K;I=c[B>>2]|0,c[B>>2]=I+1,I;c[M>>2]=N;N=M+4|0;J=c[N>>2]|0;c[N>>2]=F;if((J|0)==0){break}N=J+8|0;if(((I=c[N>>2]|0,c[N>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[J>>2]|0)+16>>2]&1023](J)}}while(0);M=K;J=c[(c[K>>2]|0)+12>>2]|0;I=c[s>>2]|0,c[s>>2]=I+1,I;I=c[A>>2]|0,c[A>>2]=I+1,I;N=c[e>>2]|0;G=c[e+4>>2]|0;if((G|0)!=0){H=G+4|0;I=c[H>>2]|0,c[H>>2]=I+1,I}H=k|0;while(1){Q=qH(48)|0;if((Q|0)!=0){break}L=(I=c[7664]|0,c[7664]=I+0,I);if((L|0)==0){t=77;break}b8[L&1]()}if((t|0)==77){K=bR(4)|0;c[K>>2]=3284;bl(K|0,24120,94)}c[Q+4>>2]=0;c[Q+8>>2]=0;c[Q>>2]=4880;c[Q+32>>2]=0;K=k|0;L=k+4|0;c[K>>2]=Q+16;c[L>>2]=Q;C=g+16|0;c[C>>2]=0;while(1){R=qH(32)|0;if((R|0)!=0){break}D=(I=c[7664]|0,c[7664]=I+0,I);if((D|0)==0){t=88;break}b8[D&1]()}if((t|0)==88){D=bR(4)|0;c[D>>2]=3284;bl(D|0,24120,94)}c[R>>2]=7040;c[R+4>>2]=d;c[R+8>>2]=y;c[R+12>>2]=w;c[R+16>>2]=x;c[R+20>>2]=z;c[R+24>>2]=N;c[R+28>>2]=G;c[C>>2]=R;dC(H,g);D=c[C>>2]|0;do{if((D|0)==(g|0)){b0[c[(c[D>>2]|0)+16>>2]&1023](D)}else{if((D|0)==0){break}b0[c[(c[D>>2]|0)+20>>2]&1023](D)}}while(0);a[(c[K>>2]|0)+24|0]=0;cf[J&63](j,M,k);D=c[j+16>>2]|0;do{if((D|0)==(j|0)){b0[c[(c[D>>2]|0)+16>>2]&1023](D)}else{if((D|0)==0){break}b0[c[(c[D>>2]|0)+20>>2]&1023](D)}}while(0);D=c[L>>2]|0;do{if((D|0)!=0){M=D+4|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[D>>2]|0)+8>>2]&1023](D|0);M=D+8|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[D>>2]|0)+16>>2]&1023](D)}}while(0);if(((I=c[E>>2]|0,c[E>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[P>>2]|0)+8>>2]&1023](P);if(((I=c[B>>2]|0,c[B>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[P>>2]|0)+16>>2]&1023](F)}}while(0);I=c[s>>2]|0,c[s>>2]=I+1,I;D=q+16|0;L=q;c[D>>2]=L;c[q>>2]=6992;c[q+4>>2]=y;c[q+8>>2]=w;c[b+16>>2]=b;do{if((b|0)==0){S=6992;t=214}else{c[b>>2]=6992;c[b+4>>2]=v;c[b+8>>2]=r;I=c[s>>2]|0,c[s>>2]=I+1,I;M=c[D>>2]|0;if((M|0)==(L|0)){S=c[q>>2]|0;t=214;break}if((M|0)==0){break}b0[c[(c[M>>2]|0)+20>>2]&1023](M)}}while(0);if((t|0)==214){b0[c[S+16>>2]&1023](L)}c[D>>2]=0;do{if(((I=c[A>>2]|0,c[A>>2]=I+ -1,I)|0)==0){b0[c[(c[z>>2]|0)+8>>2]&1023](z|0);M=z+8|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[z>>2]|0)+16>>2]&1023](z)}}while(0);if(((I=c[s>>2]|0,c[s>>2]=I+ -1,I)|0)!=0){i=f;return}b0[c[(c[r>>2]|0)+8>>2]&1023](r);if(((I=c[u>>2]|0,c[u>>2]=I+ -1,I)|0)!=0){i=f;return}b0[c[(c[r>>2]|0)+16>>2]&1023](w);i=f;return}}while(0);f=bR(4)|0;c[f>>2]=5928;bl(f|0,25656,646)}function fv(a){a=a|0;var b=0,d=0,e=0;b=a|0;c[b>>2]=7816;d=c[a+64>>2]|0;do{if((d|0)==(a+48|0)){b0[c[(c[d>>2]|0)+16>>2]&1023](d)}else{if((d|0)==0){break}b0[c[(c[d>>2]|0)+20>>2]&1023](d)}}while(0);d=c[a+44>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);c[b>>2]=7744;b=c[a+32>>2]|0;do{if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function fw(a){a=a|0;var b=0;c[a>>2]=6992;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function fx(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=6992;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function fy(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(12)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=6992;c[b+4>>2]=c[a+4>>2];e=c[a+8>>2]|0;c[b+8>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function fz(a,b){a=a|0;b=b|0;var d=0;if((b|0)==0){return}c[b>>2]=6992;c[b+4>>2]=c[a+4>>2];d=c[a+8>>2]|0;c[b+8>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function fA(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function fB(a){a=a|0;var b=0,d=0,e=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function fC(a){a=a|0;var b=0;b=a+4|0;dh(c[c[b>>2]>>2]|0);dh(c[(c[b>>2]|0)+8>>2]|0);return}function fD(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=9304){d=0;return d|0}d=a+4|0;return d|0}function fE(a){a=a|0;return 23992}function fF(a){a=a|0;var b=0;c[a>>2]=7088;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function fG(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=7088;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function fH(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(12)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=7088;c[b+4>>2]=c[a+4>>2];e=c[a+8>>2]|0;c[b+8>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function fI(a,b){a=a|0;b=b|0;var d=0;if((b|0)==0){return}c[b>>2]=7088;c[b+4>>2]=c[a+4>>2];d=c[a+8>>2]|0;c[b+8>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function fJ(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function fK(a){a=a|0;var b=0,d=0,e=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function fL(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;i=i+48|0;e=d|0;f=d+24|0;g=b+16|0;h=c[g>>2]|0;do{if((h|0)==0){c[f+16>>2]=0;j=0;k=b}else{l=b;if((h|0)!=(l|0)){c[f+16>>2]=h;c[g>>2]=0;j=0;k=l;break}l=f;c[f+16>>2]=l;b1[c[(c[h>>2]|0)+12>>2]&255](h,l);j=c[g>>2]|0;k=h}}while(0);do{if((j|0)==(k|0)){b0[c[(c[k>>2]|0)+16>>2]&1023](k)}else{if((j|0)==0){break}b0[c[(c[j>>2]|0)+20>>2]&1023](j)}}while(0);c[g>>2]=0;g=c[a+4>>2]|0;a=f+16|0;j=c[a>>2]|0;do{if((j|0)==0){c[e+16>>2]=0}else{if((j|0)!=(f|0)){c[e+16>>2]=j;c[a>>2]=0;break}k=e;c[e+16>>2]=k;b1[c[(c[j>>2]|0)+12>>2]&255](j,k);k=c[a>>2]|0;if((k|0)==(j|0)){b0[c[(c[j>>2]|0)+16>>2]&1023](j);break}if((k|0)==0){break}b0[c[(c[k>>2]|0)+20>>2]&1023](k)}}while(0);c[a>>2]=0;c7(c[g>>2]|0,e);g=c[e+16>>2]|0;do{if((g|0)==(e|0)){b0[c[(c[g>>2]|0)+16>>2]&1023](g)}else{if((g|0)==0){break}b0[c[(c[g>>2]|0)+20>>2]&1023](g)}}while(0);g=c[a>>2]|0;a=f;if((g|0)==(a|0)){b0[c[(c[f>>2]|0)+16>>2]&1023](a);i=d;return}if((g|0)==0){i=d;return}b0[c[(c[g>>2]|0)+20>>2]&1023](g);i=d;return}function fM(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=9416){d=0;return d|0}d=a+4|0;return d|0}function fN(a){a=a|0;return 24e3}function fO(a){a=a|0;var b=0,d=0;c[a>>2]=7040;b=c[a+28>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+20>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+12>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function fP(a){a=a|0;var b=0,d=0;c[a>>2]=7040;b=c[a+28>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+20>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+12>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function fQ(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(32)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=7040;c[b+4>>2]=c[a+4>>2];c[b+8>>2]=c[a+8>>2];e=c[a+12>>2]|0;c[b+12>>2]=e;if((e|0)!=0){d=e+4|0;I=c[d>>2]|0,c[d>>2]=I+1,I}c[b+16>>2]=c[a+16>>2];d=c[a+20>>2]|0;c[b+20>>2]=d;if((d|0)!=0){e=d+4|0;I=c[e>>2]|0,c[e>>2]=I+1,I}c[b+24>>2]=c[a+24>>2];e=c[a+28>>2]|0;c[b+28>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function fR(a,b){a=a|0;b=b|0;var d=0,e=0;if((b|0)==0){return}c[b>>2]=7040;c[b+4>>2]=c[a+4>>2];c[b+8>>2]=c[a+8>>2];d=c[a+12>>2]|0;c[b+12>>2]=d;if((d|0)!=0){e=d+4|0;I=c[e>>2]|0,c[e>>2]=I+1,I}c[b+16>>2]=c[a+16>>2];e=c[a+20>>2]|0;c[b+20>>2]=e;if((e|0)!=0){d=e+4|0;I=c[d>>2]|0,c[d>>2]=I+1,I}c[b+24>>2]=c[a+24>>2];d=c[a+28>>2]|0;c[b+28>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function fS(a){a=a|0;var b=0,d=0;b=c[a+28>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+20>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+12>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function fT(a){a=a|0;var b=0,d=0;b=c[a+28>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+20>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+12>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function fU(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;e=i;i=i+112|0;f=e|0;g=e+24|0;h=e+48|0;j=e+56|0;k=e+64|0;l=e+88|0;m=d+4|0;n=c[m>>2]|0;c[d>>2]=0;c[m>>2]=0;m=c[b+4>>2]|0;d=b+8|0;o=c[d>>2]|0;c[h>>2]=c[b+16>>2];p=h+4|0;q=c[b+20>>2]|0;c[p>>2]=q;if((q|0)!=0){r=q+4|0;I=c[r>>2]|0,c[r>>2]=I+1,I}c[j>>2]=c[b+24>>2];r=j+4|0;q=c[b+28>>2]|0;c[r>>2]=q;if((q|0)!=0){s=q+4|0;I=c[s>>2]|0,c[s>>2]=I+1,I}s=c[d>>2]|0;q=c[s+8>>2]|0;t=c[s+12>>2]|0;s=(t|0)==0;if(!s){u=t+4|0;I=c[u>>2]|0,c[u>>2]=I+1,I;I=c[u>>2]|0,c[u>>2]=I+1,I}u=f+16|0;v=f;c[u>>2]=v;c[f>>2]=6944;c[f+4>>2]=q;c[f+8>>2]=t;w=k;x=k+16|0;c[x>>2]=w;c[k>>2]=6944;c[k+4>>2]=q;c[k+8>>2]=t;do{if(s){y=6944;z=10}else{q=t+4|0;I=c[q>>2]|0,c[q>>2]=I+1,I;q=c[u>>2]|0;if((q|0)==(v|0)){y=c[f>>2]|0;z=10;break}if((q|0)==0){break}b0[c[(c[q>>2]|0)+20>>2]&1023](q)}}while(0);if((z|0)==10){b0[c[y+16>>2]&1023](v)}c[u>>2]=0;do{if(!s){u=t+4|0;if(((I=c[u>>2]|0,c[u>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[t>>2]|0)+8>>2]&1023](t|0);u=t+8|0;if(((I=c[u>>2]|0,c[u>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[t>>2]|0)+16>>2]&1023](t)}}while(0);t=c[d>>2]|0;d=c[b+12>>2]|0;if((d|0)!=0){b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I}b=l+16|0;s=l;c[b>>2]=s;c[l>>2]=6464;c[l+4>>2]=t;c[l+8>>2]=d;d=c[m+32>>2]|0;if((d|0)==0){m=bR(4)|0;c[m>>2]=5464;bl(m|0,25448,372)}cc[c[(c[d>>2]|0)+24>>2]&63](g,d,h,j,k,l);c7(c[o+8>>2]|0,g);o=c[g+16>>2]|0;do{if((o|0)==(g|0)){b0[c[(c[o>>2]|0)+16>>2]&1023](o)}else{if((o|0)==0){break}b0[c[(c[o>>2]|0)+20>>2]&1023](o)}}while(0);o=c[b>>2]|0;do{if((o|0)==(s|0)){b0[c[(c[l>>2]|0)+16>>2]&1023](s)}else{if((o|0)==0){break}b0[c[(c[o>>2]|0)+20>>2]&1023](o)}}while(0);o=c[x>>2]|0;do{if((o|0)==(w|0)){b0[c[(c[k>>2]|0)+16>>2]&1023](w)}else{if((o|0)==0){break}b0[c[(c[o>>2]|0)+20>>2]&1023](o)}}while(0);o=c[r>>2]|0;do{if((o|0)!=0){r=o+4|0;if(((I=c[r>>2]|0,c[r>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+8>>2]&1023](o|0);r=o+8|0;if(((I=c[r>>2]|0,c[r>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+16>>2]&1023](o)}}while(0);o=c[p>>2]|0;do{if((o|0)!=0){p=o+4|0;if(((I=c[p>>2]|0,c[p>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+8>>2]&1023](o|0);p=o+8|0;if(((I=c[p>>2]|0,c[p>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+16>>2]&1023](o)}}while(0);c[a+16>>2]=0;if((n|0)==0){i=e;return}a=n+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){i=e;return}b0[c[(c[n>>2]|0)+8>>2]&1023](n|0);a=n+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){i=e;return}b0[c[(c[n>>2]|0)+16>>2]&1023](n);i=e;return}function fV(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=9544){d=0;return d|0}d=a+4|0;return d|0}function fW(a){a=a|0;return 24008}function fX(a){a=a|0;var b=0;c[a>>2]=6464;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function fY(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=6464;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function fZ(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(12)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=6464;c[b+4>>2]=c[a+4>>2];e=c[a+8>>2]|0;c[b+8>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function f_(a,b){a=a|0;b=b|0;var d=0;if((b|0)==0){return}c[b>>2]=6464;c[b+4>>2]=c[a+4>>2];d=c[a+8>>2]|0;c[b+8>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function f$(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function f0(a){a=a|0;var b=0,d=0,e=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function f1(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;i=i+48|0;e=d|0;f=d+24|0;g=b+16|0;h=c[g>>2]|0;do{if((h|0)==0){c[f+16>>2]=0;j=0;k=b}else{l=b;if((h|0)!=(l|0)){c[f+16>>2]=h;c[g>>2]=0;j=0;k=l;break}l=f;c[f+16>>2]=l;b1[c[(c[h>>2]|0)+12>>2]&255](h,l);j=c[g>>2]|0;k=h}}while(0);do{if((j|0)==(k|0)){b0[c[(c[k>>2]|0)+16>>2]&1023](k)}else{if((j|0)==0){break}b0[c[(c[j>>2]|0)+20>>2]&1023](j)}}while(0);c[g>>2]=0;g=c[a+4>>2]|0;a=f+16|0;j=c[a>>2]|0;do{if((j|0)==0){c[e+16>>2]=0}else{if((j|0)!=(f|0)){c[e+16>>2]=j;c[a>>2]=0;break}k=e;c[e+16>>2]=k;b1[c[(c[j>>2]|0)+12>>2]&255](j,k);k=c[a>>2]|0;if((k|0)==(j|0)){b0[c[(c[j>>2]|0)+16>>2]&1023](j);break}if((k|0)==0){break}b0[c[(c[k>>2]|0)+20>>2]&1023](k)}}while(0);c[a>>2]=0;c7(c[g>>2]|0,e);g=c[e+16>>2]|0;do{if((g|0)==(e|0)){b0[c[(c[g>>2]|0)+16>>2]&1023](g)}else{if((g|0)==0){break}b0[c[(c[g>>2]|0)+20>>2]&1023](g)}}while(0);g=c[a>>2]|0;a=f;if((g|0)==(a|0)){b0[c[(c[f>>2]|0)+16>>2]&1023](a);i=d;return}if((g|0)==0){i=d;return}b0[c[(c[g>>2]|0)+20>>2]&1023](g);i=d;return}function f2(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=8216){d=0;return d|0}d=a+4|0;return d|0}function f3(a){a=a|0;return 23904}function f4(a){a=a|0;var b=0,d=0;c[a>>2]=4944;b=c[a+24>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+16>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function f5(a){a=a|0;var b=0,d=0;c[a>>2]=4944;b=c[a+24>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+16>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function f6(a){a=a|0;var b=0,d=0;b=c[a+24>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+16>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function f7(a){a=a|0;if((a|0)==0){return}qI(a);return}function f8(a){a=a|0;var b=0;c[a>>2]=7744;b=c[a+32>>2]|0;do{if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+8>>2]|0;if((b|0)==0){return}a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function f9(a){a=a|0;var b=0,d=0;c[a>>2]=7744;b=c[a+32>>2]|0;do{if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function ga(a){a=a|0;if((a|0)==0){return}qI(a);return}function gb(a){a=a|0;var b=0,d=0;while(1){b=qH(8)|0;if((b|0)!=0){d=12;break}a=(I=c[7664]|0,c[7664]=I+0,I);if((a|0)==0){break}b8[a&1]()}if((d|0)==12){c[b>>2]=2040;return b|0}b=bR(4)|0;c[b>>2]=3284;bl(b|0,24120,94);return 0}function gc(a,b){a=a|0;b=b|0;if((b|0)==0){return}c[b>>2]=2040;return}function gd(a){a=a|0;return}function ge(a){a=a|0;if((a|0)==0){return}qI(a);return}function gf(a,b){a=a|0;b=b|0;return c[b>>2]<<1|0}function gg(a,b){a=a|0;b=b|0;return((c[b+4>>2]|0)==2268?a+4|0:0)|0}function gh(a){a=a|0;return 2768}function gi(a){a=a|0;return}function gj(a){a=a|0;return}function gk(a){a=a|0;if((a|0)==0){return}qI(a);return}function gl(a){a=a|0;var b=0,d=0,e=0;while(1){b=qH(8)|0;if((b|0)!=0){d=12;break}e=(I=c[7664]|0,c[7664]=I+0,I);if((e|0)==0){break}b8[e&1]()}if((d|0)==12){c[b>>2]=7424;c[b+4>>2]=c[a+4>>2];return b|0}b=bR(4)|0;c[b>>2]=3284;bl(b|0,24120,94);return 0}function gm(a,b){a=a|0;b=b|0;if((b|0)==0){return}c[b>>2]=7424;c[b+4>>2]=c[a+4>>2];return}function gn(a){a=a|0;return}function go(a){a=a|0;if((a|0)==0){return}qI(a);return}function gp(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;j=i;i=i+152|0;k=j|0;l=j+24|0;m=j+48|0;n=j+72|0;o=j+96|0;p=j+120|0;q=j+128|0;r=e|0;s=c[r>>2]|0;t=e+4|0;e=c[t>>2]|0;c[r>>2]=0;c[t>>2]=0;t=f|0;r=c[t>>2]|0;u=f+4|0;f=c[u>>2]|0;c[t>>2]=0;c[u>>2]=0;u=h+16|0;t=c[u>>2]|0;do{if((t|0)==0){c[q+16>>2]=0}else{if((t|0)==(h|0)){v=q;c[q+16>>2]=v;b1[c[(c[t>>2]|0)+12>>2]&255](t,v);break}else{c[q+16>>2]=t;c[u>>2]=0;break}}}while(0);u=c[d+4>>2]|0;while(1){w=qH(72)|0;if((w|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){x=16;break}b8[d&1]()}if((x|0)==16){d=bR(4)|0;c[d>>2]=3284;bl(d|0,24120,94)}d=w;t=(e|0)==0;if(!t){h=e+4|0;I=c[h>>2]|0,c[h>>2]=I+1,I}h=(f|0)==0;if(!h){v=f+4|0;I=c[v>>2]|0,c[v>>2]=I+1,I}v=g+16|0;y=c[v>>2]|0;do{if((y|0)==0){c[n+16>>2]=0;z=0;A=g}else{B=g;if((y|0)!=(B|0)){c[n+16>>2]=y;c[v>>2]=0;z=0;A=B;break}B=n;c[n+16>>2]=B;b1[c[(c[y>>2]|0)+12>>2]&255](y,B);z=c[v>>2]|0;A=y}}while(0);do{if((z|0)==(A|0)){b0[c[(c[A>>2]|0)+16>>2]&1023](A)}else{if((z|0)==0){break}b0[c[(c[z>>2]|0)+20>>2]&1023](z)}}while(0);c[v>>2]=0;v=n+16|0;z=c[v>>2]|0;do{if((z|0)==0){c[m+16>>2]=0}else{if((z|0)!=(n|0)){c[m+16>>2]=z;c[v>>2]=0;break}A=m;c[m+16>>2]=A;b1[c[(c[z>>2]|0)+12>>2]&255](z,A);A=c[v>>2]|0;if((A|0)==(z|0)){b0[c[(c[z>>2]|0)+16>>2]&1023](z);break}if((A|0)==0){break}b0[c[(c[A>>2]|0)+20>>2]&1023](A)}}while(0);c[v>>2]=0;z=w+8|0;A=z;c[A>>2]=0;y=w+12|0;c[y>>2]=0;g=w+16|0;B=g;a[g]=0;c[w+48>>2]=0;c[w+52>>2]=0;g=w+56|0;c[g>>2]=r;r=w+60|0;c[r>>2]=f;C=m+16|0;D=c[C>>2]|0;do{if((D|0)==0){c[l+16>>2]=0}else{if((D|0)!=(m|0)){c[l+16>>2]=D;c[C>>2]=0;break}E=l;c[l+16>>2]=E;b1[c[(c[D>>2]|0)+12>>2]&255](D,E);E=c[C>>2]|0;if((E|0)==(D|0)){b0[c[(c[D>>2]|0)+16>>2]&1023](D);break}if((E|0)==0){break}b0[c[(c[E>>2]|0)+20>>2]&1023](E)}}while(0);c[C>>2]=0;fa(B,l);B=c[l+16>>2]|0;do{if((B|0)==(l|0)){b0[c[(c[B>>2]|0)+16>>2]&1023](B)}else{if((B|0)==0){break}b0[c[(c[B>>2]|0)+20>>2]&1023](B)}}while(0);do{if((c[g>>2]|0)==0){while(1){F=qH(16)|0;if((F|0)!=0){break}B=(I=c[7664]|0,c[7664]=I+0,I);if((B|0)==0){x=66;break}b8[B&1]()}if((x|0)==66){B=bR(4)|0;c[B>>2]=3284;bl(B|0,24120,94)}c[F+4>>2]=0;c[F+8>>2]=0;c[F>>2]=4912;B=F+12|0;c[B>>2]=7712;c[g>>2]=B;B=c[r>>2]|0;c[r>>2]=F;if((B|0)==0){break}l=B+4|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[B>>2]|0)+8>>2]&1023](B|0);l=B+8|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[B>>2]|0)+16>>2]&1023](B)}}while(0);F=c[C>>2]|0;C=m;do{if((F|0)==(C|0)){b0[c[(c[m>>2]|0)+16>>2]&1023](C)}else{if((F|0)==0){break}b0[c[(c[F>>2]|0)+20>>2]&1023](F)}}while(0);c[w>>2]=7840;c[w+64>>2]=s;c[w+68>>2]=e;if(!t){s=e+4|0;I=c[s>>2]|0,c[s>>2]=I+1,I}while(1){G=qH(16)|0;if((G|0)!=0){break}s=(I=c[7664]|0,c[7664]=I+0,I);if((s|0)==0){x=107;break}b8[s&1]()}if((x|0)==107){x=bR(4)|0;c[x>>2]=3284;bl(x|0,24120,94)}x=G;s=G+4|0;c[s>>2]=0;F=G+8|0;c[F>>2]=0;c[G>>2]=4752;c[G+12>>2]=d;do{if((z|0)!=0){I=c[F>>2]|0,c[F>>2]=I+1,I;c[z>>2]=d;C=w+12|0;m=c[C>>2]|0;c[C>>2]=x;if((m|0)==0){break}C=m+8|0;if(((I=c[C>>2]|0,c[C>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[m>>2]|0)+16>>2]&1023](m)}}while(0);d=c[v>>2]|0;v=n;do{if((d|0)==(v|0)){b0[c[(c[n>>2]|0)+16>>2]&1023](v)}else{if((d|0)==0){break}b0[c[(c[d>>2]|0)+20>>2]&1023](d)}}while(0);do{if(!t){d=e+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[e>>2]|0)+8>>2]&1023](e|0);d=e+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[e>>2]|0)+16>>2]&1023](e)}}while(0);d=c[A>>2]|0;A=c[y>>2]|0;L107:do{if((A|0)!=0){y=A+4|0;do{v=c[y>>2]|0;if((v|0)==-1){break L107}}while(((I=c[y>>2]|0,(c[y>>2]|0)==(v|0)?(c[y>>2]=v+1)|0:0,I)|0)!=(v|0));I=c[y>>2]|0,c[y>>2]=I+1,I;v=k+16|0;n=k;c[v>>2]=n;c[k>>2]=6704;c[k+4>>2]=d;c[k+8>>2]=A;z=o;m=o+16|0;c[m>>2]=z;c[o>>2]=6704;c[o+4>>2]=d;c[o+8>>2]=A;I=c[y>>2]|0,c[y>>2]=I+1,I;C=c[v>>2]|0;do{if((C|0)==(n|0)){b0[c[(c[k>>2]|0)+16>>2]&1023](n)}else{if((C|0)==0){break}b0[c[(c[C>>2]|0)+20>>2]&1023](C)}}while(0);c[v>>2]=0;do{if(((I=c[y>>2]|0,c[y>>2]=I+ -1,I)|0)==0){b0[c[(c[A>>2]|0)+8>>2]&1023](A|0);C=A+8|0;if(((I=c[C>>2]|0,c[C>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[A>>2]|0)+16>>2]&1023](A)}}while(0);y=q+16|0;v=c[y>>2]|0;if((v|0)==0){C=bR(4)|0;c[C>>2]=5464;bl(C|0,25448,372)}b1[c[(c[v>>2]|0)+24>>2]&255](v,o);v=c[m>>2]|0;do{if((v|0)==(z|0)){b0[c[(c[o>>2]|0)+16>>2]&1023](z)}else{if((v|0)==0){break}b0[c[(c[v>>2]|0)+20>>2]&1023](v)}}while(0);v=c[u+40>>2]|0;z=c[c[v>>2]>>2]|0;c[p>>2]=w;m=p+4|0;c[m>>2]=x;I=c[s>>2]|0,c[s>>2]=I+1,I;cf[z&63](b,v,p);v=c[m>>2]|0;do{if((v|0)!=0){m=v+4|0;if(((I=c[m>>2]|0,c[m>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[v>>2]|0)+8>>2]&1023](v|0);m=v+8|0;if(((I=c[m>>2]|0,c[m>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[v>>2]|0)+16>>2]&1023](v)}}while(0);do{if(((I=c[s>>2]|0,c[s>>2]=I+ -1,I)|0)==0){b0[c[(c[G>>2]|0)+8>>2]&1023](G);if(((I=c[F>>2]|0,c[F>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[G>>2]|0)+16>>2]&1023](x)}}while(0);v=c[y>>2]|0;m=q;do{if((v|0)==(m|0)){b0[c[(c[q>>2]|0)+16>>2]&1023](m)}else{if((v|0)==0){break}b0[c[(c[v>>2]|0)+20>>2]&1023](v)}}while(0);do{if(!h){v=f+4|0;if(((I=c[v>>2]|0,c[v>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[f>>2]|0)+8>>2]&1023](f|0);v=f+8|0;if(((I=c[v>>2]|0,c[v>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[f>>2]|0)+16>>2]&1023](f)}}while(0);if(t){i=j;return}v=e+4|0;if(((I=c[v>>2]|0,c[v>>2]=I+ -1,I)|0)!=0){i=j;return}b0[c[(c[e>>2]|0)+8>>2]&1023](e|0);v=e+8|0;if(((I=c[v>>2]|0,c[v>>2]=I+ -1,I)|0)!=0){i=j;return}b0[c[(c[e>>2]|0)+16>>2]&1023](e);i=j;return}}while(0);j=bR(4)|0;c[j>>2]=5928;bl(j|0,25656,646)}function gq(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=10396){d=0;return d|0}d=a+4|0;return d|0}function gr(a){a=a|0;return 24064}function gs(a){a=a|0;var b=0;c[a>>2]=6704;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function gt(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=6704;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function gu(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(12)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=6704;c[b+4>>2]=c[a+4>>2];e=c[a+8>>2]|0;c[b+8>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function gv(a,b){a=a|0;b=b|0;var d=0;if((b|0)==0){return}c[b>>2]=6704;c[b+4>>2]=c[a+4>>2];d=c[a+8>>2]|0;c[b+8>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function gw(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function gx(a){a=a|0;var b=0,d=0,e=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function gy(a){a=a|0;gB((c[a+4>>2]|0)+8|0);return}function gz(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=8888){d=0;return d|0}d=a+4|0;return d|0}function gA(a){a=a|0;return 23944}function gB(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;while(1){d=qH(16)|0;if((d|0)!=0){break}e=(I=c[7664]|0,c[7664]=I+0,I);if((e|0)==0){f=9;break}b8[e&1]()}if((f|0)==9){f=bR(4)|0;c[f>>2]=3284;bl(f|0,24120,94)}c[d+4>>2]=0;c[d+8>>2]=0;c[d>>2]=4912;f=d+12|0;c[f>>2]=7712;e=f;f=d;d=b+40|0;c[d>>2]=e;g=b+44|0;h=c[g>>2]|0;c[g>>2]=f;if((h|0)==0){i=e;j=f}else{f=h+4|0;do{if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)==0){b0[c[(c[h>>2]|0)+8>>2]&1023](h|0);e=h+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[h>>2]|0)+16>>2]&1023](h)}}while(0);i=c[d>>2]|0;j=c[g>>2]|0}h=b+48|0;f=c[h>>2]|0;c[h>>2]=i;c[d>>2]=f;f=b+52|0;d=c[f>>2]|0;c[f>>2]=j;c[g>>2]=d;d=b+8|0;g=a[d]|0;if((g&1)==0){return}j=b+16|0;if((j|0)==0){return}f=b+32|0;b=c[f>>2]|0;if((b|0)==0){k=g}else{b0[c[(c[b>>2]|0)+24>>2]&1023](b);b=c[f>>2]|0;do{if((b|0)==(j|0)){b0[c[(c[j>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);c[f>>2]=0;k=a[d]|0}if((k&1)==0){return}a[d]=0;return}function gC(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+12|0;f=e|0;g=e+4|0;h=g|0;a[h]=0;j=c[b+64>>2]|0;c[f>>2]=c[d>>2];d=c[j+64>>2]|0;if((d|0)==0){j=bR(4)|0;c[j>>2]=5464;bl(j|0,25448,372)}c[g+4>>2]=b2[c[(c[d>>2]|0)+24>>2]&127](d,f)|0;a[h]=1;f=c[b+56>>2]|0;b1[c[c[f>>2]>>2]&255](f,g+4|0);if((a[h]&1)==0){i=e;return}a[h]=0;i=e;return}function gD(a){a=a|0;var b=0;b=c[a+56>>2]|0;b0[c[(c[b>>2]|0)+4>>2]&1023](b);gB(a+8|0);return}function gE(a,b){a=a|0;b=b|0;var d=0;d=c[a+56>>2]|0;b1[c[(c[d>>2]|0)+8>>2]&255](d,b);gB(a+8|0);return}function gF(b){b=b|0;var d=0,e=0;c[b>>2]=7840;d=c[b+68>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=c[b+60>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=c[b+52>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=b+16|0;do{if((a[d]&1)!=0){a[d]=0;e=c[b+40>>2]|0;if((e|0)==(b+24|0)){b0[c[(c[e>>2]|0)+16>>2]&1023](e);break}if((e|0)==0){break}b0[c[(c[e>>2]|0)+20>>2]&1023](e)}}while(0);d=c[b+12>>2]|0;if((d|0)==0){return}b=d+8|0;if(((I=c[b>>2]|0,c[b>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[d>>2]|0)+16>>2]&1023](d);return}function gG(b){b=b|0;var d=0,e=0;c[b>>2]=7840;d=c[b+68>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=c[b+60>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=c[b+52>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=b+16|0;do{if((a[d]&1)!=0){a[d]=0;e=c[b+40>>2]|0;if((e|0)==(b+24|0)){b0[c[(c[e>>2]|0)+16>>2]&1023](e);break}if((e|0)==0){break}b0[c[(c[e>>2]|0)+20>>2]&1023](e)}}while(0);d=c[b+12>>2]|0;do{if((d|0)!=0){e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);if((b|0)==0){return}qI(b);return}function gH(a){a=a|0;return}function gI(a){a=a|0;if((a|0)==0){return}qI(a);return}function gJ(a){a=a|0;var b=0;b=c[a+12>>2]|0;if((b|0)==0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function gK(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)==16032){d=a+12|0}else{d=0}return d|0}function gL(a){a=a|0;if((a|0)==0){return}qI(a);return}function gM(a){a=a|0;if((a|0)==0){return}qI(a);return}function gN(a){a=a|0;var b=0,d=0,e=0;while(1){b=qH(8)|0;if((b|0)!=0){d=12;break}e=(I=c[7664]|0,c[7664]=I+0,I);if((e|0)==0){break}b8[e&1]()}if((d|0)==12){c[b>>2]=2172;c[b+4>>2]=c[a+4>>2];return b|0}b=bR(4)|0;c[b>>2]=3284;bl(b|0,24120,94);return 0}function gO(a,b){a=a|0;b=b|0;if((b|0)==0){return}c[b>>2]=2172;c[b+4>>2]=c[a+4>>2];return}function gP(a){a=a|0;return}function gQ(a){a=a|0;if((a|0)==0){return}qI(a);return}function gR(a,b){a=a|0;b=b|0;c[c[a+4>>2]>>2]=c[b>>2];return}function gS(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=2316){d=0;return d|0}d=a+4|0;return d|0}function gT(a){a=a|0;return 2792}function gU(a){a=a|0;return}function gV(a){a=a|0;if((a|0)==0){return}qI(a);return}function gW(a){a=a|0;var b=0,d=0;while(1){b=qH(8)|0;if((b|0)!=0){d=12;break}a=(I=c[7664]|0,c[7664]=I+0,I);if((a|0)==0){break}b8[a&1]()}if((d|0)==12){c[b>>2]=2216;return b|0}b=bR(4)|0;c[b>>2]=3284;bl(b|0,24120,94);return 0}function gX(a,b){a=a|0;b=b|0;if((b|0)==0){return}c[b>>2]=2216;return}function gY(a){a=a|0;return}function gZ(a){a=a|0;if((a|0)==0){return}qI(a);return}function g_(a,b,d){a=a|0;b=b|0;d=d|0;return(c[d>>2]|0)+(c[b>>2]|0)|0}function g$(a,b){a=a|0;b=b|0;return((c[b+4>>2]|0)==2332?a+4|0:0)|0}function g0(a){a=a|0;return 2800}function g1(a){a=a|0;return}function g2(a){a=a|0;c[a>>2]=5104;g7(a+16|0);return}function g3(a){a=a|0;c[a>>2]=5104;g7(a+16|0);if((a|0)==0){return}qI(a);return}function g4(a){a=a|0;var b=0;b=a+16|0;b0[c[(c[b>>2]|0)+4>>2]&1023](b);return}function g5(a){a=a|0;if((a|0)==0){return}qI(a);return}function g6(a){a=a|0;g7(a);return}function g7(b){b=b|0;var d=0,e=0,f=0;d=b|0;c[d>>2]=7928;e=c[b+96>>2]|0;do{if((e|0)==(b+80|0)){b0[c[(c[e>>2]|0)+16>>2]&1023](e)}else{if((e|0)==0){break}b0[c[(c[e>>2]|0)+20>>2]&1023](e)}}while(0);e=c[b+72>>2]|0;do{if((e|0)==(b+56|0)){b0[c[(c[e>>2]|0)+16>>2]&1023](e)}else{if((e|0)==0){break}b0[c[(c[e>>2]|0)+20>>2]&1023](e)}}while(0);e=b+48|0;if((a[e]&1)!=0){a[e]=0}e=c[b+44>>2]|0;do{if((e|0)!=0){f=e+4|0;if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[e>>2]|0)+8>>2]&1023](e|0);f=e+8|0;if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[e>>2]|0)+16>>2]&1023](e)}}while(0);c[d>>2]=7792;d=c[b+32>>2]|0;do{if((d|0)==(b+16|0)){b0[c[(c[d>>2]|0)+16>>2]&1023](d)}else{if((d|0)==0){break}b0[c[(c[d>>2]|0)+20>>2]&1023](d)}}while(0);d=c[b+8>>2]|0;if((d|0)==0){return}b=d+8|0;if(((I=c[b>>2]|0,c[b>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[d>>2]|0)+16>>2]&1023](d);return}function g8(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;f=i;i=i+192|0;g=f|0;h=f+24|0;j=f+48|0;k=f+72|0;l=f+80|0;m=f+104|0;n=f+112|0;o=f+120|0;p=f+144|0;q=f+168|0;while(1){r=qH(28)|0;if((r|0)!=0){break}s=(I=c[7664]|0,c[7664]=I+0,I);if((s|0)==0){t=9;break}b8[s&1]()}if((t|0)==9){s=bR(4)|0;c[s>>2]=3284;bl(s|0,24120,94)}s=r+4|0;c[s>>2]=0;u=r+8|0;c[u>>2]=0;c[r>>2]=5008;v=r+12|0;while(1){w=qH(72)|0;if((w|0)!=0){break}x=(I=c[7664]|0,c[7664]=I+0,I);if((x|0)==0){t=21;break}b8[x&1]()}if((t|0)==21){x=bR(4)|0;c[x>>2]=3284;bl(x|0,24120,94)}c[w+4>>2]=0;c[w+8>>2]=0;c[w>>2]=5328;c[w+32>>2]=0;a[w+40|0]=0;qP(w+44|0,0,24)|0;c[v>>2]=w+16;c[r+16>>2]=w;while(1){y=qH(72)|0;if((y|0)!=0){break}w=(I=c[7664]|0,c[7664]=I+0,I);if((w|0)==0){t=32;break}b8[w&1]()}if((t|0)==32){w=bR(4)|0;c[w>>2]=3284;bl(w|0,24120,94)}c[y+4>>2]=0;c[y+8>>2]=0;c[y>>2]=5328;c[y+32>>2]=0;a[y+40|0]=0;qP(y+44|0,0,24)|0;c[r+20>>2]=y+16;c[r+24>>2]=y;y=v;w=r;x=c[d+4>>2]|0;z=c[d+8>>2]|0;L25:do{if((z|0)!=0){A=z+4|0;do{B=c[A>>2]|0;if((B|0)==-1){break L25}}while(((I=c[A>>2]|0,(c[A>>2]|0)==(B|0)?(c[A>>2]=B+1)|0:0,I)|0)!=(B|0));B=c[7328]|0;do{if((B|0)==0){t=52}else{C=c[B>>2]|0;D=c[B+4>>2]|0;do{if((D|0)!=0){E=D+4|0;I=c[E>>2]|0,c[E>>2]=I+1,I;if(((I=c[E>>2]|0,c[E>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[D>>2]|0)+8>>2]&1023](D|0);E=D+8|0;if(((I=c[E>>2]|0,c[E>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[D>>2]|0)+16>>2]&1023](D)}}while(0);if((C|0)==0){t=52;break}D=r+20|0;c[m>>2]=x;E=m+4|0;c[E>>2]=z;I=c[A>>2]|0,c[A>>2]=I+1,I;c[n>>2]=c[e>>2];F=n+4|0;G=c[e+4>>2]|0;c[F>>2]=G;if((G|0)!=0){H=G+4|0;I=c[H>>2]|0,c[H>>2]=I+1,I}H=D;D=c[H>>2]|0;G=c[r+24>>2]|0;J=(G|0)==0;if(!J){K=G+4|0;I=c[K>>2]|0,c[K>>2]=I+1,I;I=c[K>>2]|0,c[K>>2]=I+1,I}K=h+16|0;L=h;c[K>>2]=L;c[h>>2]=6944;c[h+4>>2]=D;c[h+8>>2]=G;M=o;N=o+16|0;c[N>>2]=M;c[o>>2]=6944;c[o+4>>2]=D;c[o+8>>2]=G;do{if(J){O=6944;t=158}else{D=G+4|0;I=c[D>>2]|0,c[D>>2]=I+1,I;D=c[K>>2]|0;if((D|0)==(L|0)){O=c[h>>2]|0;t=158;break}if((D|0)==0){break}b0[c[(c[D>>2]|0)+20>>2]&1023](D)}}while(0);if((t|0)==158){b0[c[O+16>>2]&1023](L)}c[K>>2]=0;do{if(!J){C=G+4|0;if(((I=c[C>>2]|0,c[C>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[G>>2]|0)+8>>2]&1023](G|0);C=G+8|0;if(((I=c[C>>2]|0,c[C>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[G>>2]|0)+16>>2]&1023](G)}}while(0);I=c[s>>2]|0,c[s>>2]=I+1,I;G=p+16|0;J=p;c[G>>2]=J;c[p>>2]=7376;c[p+4>>2]=y;c[p+8>>2]=w;K=c[d+32>>2]|0;if((K|0)==0){L=bR(4)|0;c[L>>2]=5464;bl(L|0,25448,372)}cc[c[(c[K>>2]|0)+24>>2]&63](l,K,m,n,o,p);c7(c[H>>2]|0,l);K=c[l+16>>2]|0;do{if((K|0)==(l|0)){b0[c[(c[K>>2]|0)+16>>2]&1023](K)}else{if((K|0)==0){break}b0[c[(c[K>>2]|0)+20>>2]&1023](K)}}while(0);K=c[G>>2]|0;do{if((K|0)==(J|0)){b0[c[(c[p>>2]|0)+16>>2]&1023](J)}else{if((K|0)==0){break}b0[c[(c[K>>2]|0)+20>>2]&1023](K)}}while(0);K=c[N>>2]|0;do{if((K|0)==(M|0)){b0[c[(c[o>>2]|0)+16>>2]&1023](M)}else{if((K|0)==0){break}b0[c[(c[K>>2]|0)+20>>2]&1023](K)}}while(0);K=c[F>>2]|0;do{if((K|0)!=0){M=K+4|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[K>>2]|0)+8>>2]&1023](K|0);M=K+8|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[K>>2]|0)+16>>2]&1023](K)}}while(0);K=c[E>>2]|0;if((K|0)==0){break}F=K+4|0;if(((I=c[F>>2]|0,c[F>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[K>>2]|0)+8>>2]&1023](K|0);F=K+8|0;if(((I=c[F>>2]|0,c[F>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[K>>2]|0)+16>>2]&1023](K)}}while(0);do{if((t|0)==52){while(1){t=0;P=qH(24)|0;if((P|0)!=0){break}B=(I=c[7664]|0,c[7664]=I+0,I);if((B|0)==0){t=60;break}b8[B&1]();t=52}if((t|0)==60){E=bR(4)|0;c[E>>2]=3284;bl(E|0,24120,94)}E=P+4|0;c[E>>2]=0;B=P+8|0;c[B>>2]=0;c[P>>2]=5168;K=P+12|0;c[P+16>>2]=0;c[P+20>>2]=0;c[K>>2]=8016;F=P;M=(K|0)==0?0:P+16|0;do{if((M|0)!=0){N=K;I=c[B>>2]|0,c[B>>2]=I+1,I;c[M>>2]=N;N=M+4|0;J=c[N>>2]|0;c[N>>2]=F;if((J|0)==0){break}N=J+8|0;if(((I=c[N>>2]|0,c[N>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[J>>2]|0)+16>>2]&1023](J)}}while(0);M=K;J=c[(c[K>>2]|0)+12>>2]|0;I=c[s>>2]|0,c[s>>2]=I+1,I;I=c[A>>2]|0,c[A>>2]=I+1,I;N=c[e>>2]|0;G=c[e+4>>2]|0;if((G|0)!=0){H=G+4|0;I=c[H>>2]|0,c[H>>2]=I+1,I}H=k|0;while(1){Q=qH(48)|0;if((Q|0)!=0){break}L=(I=c[7664]|0,c[7664]=I+0,I);if((L|0)==0){t=77;break}b8[L&1]()}if((t|0)==77){K=bR(4)|0;c[K>>2]=3284;bl(K|0,24120,94)}c[Q+4>>2]=0;c[Q+8>>2]=0;c[Q>>2]=4880;c[Q+32>>2]=0;K=k|0;L=k+4|0;c[K>>2]=Q+16;c[L>>2]=Q;C=g+16|0;c[C>>2]=0;while(1){R=qH(32)|0;if((R|0)!=0){break}D=(I=c[7664]|0,c[7664]=I+0,I);if((D|0)==0){t=88;break}b8[D&1]()}if((t|0)==88){D=bR(4)|0;c[D>>2]=3284;bl(D|0,24120,94)}c[R>>2]=7328;c[R+4>>2]=d;c[R+8>>2]=y;c[R+12>>2]=w;c[R+16>>2]=x;c[R+20>>2]=z;c[R+24>>2]=N;c[R+28>>2]=G;c[C>>2]=R;dC(H,g);D=c[C>>2]|0;do{if((D|0)==(g|0)){b0[c[(c[D>>2]|0)+16>>2]&1023](D)}else{if((D|0)==0){break}b0[c[(c[D>>2]|0)+20>>2]&1023](D)}}while(0);a[(c[K>>2]|0)+24|0]=0;cf[J&63](j,M,k);D=c[j+16>>2]|0;do{if((D|0)==(j|0)){b0[c[(c[D>>2]|0)+16>>2]&1023](D)}else{if((D|0)==0){break}b0[c[(c[D>>2]|0)+20>>2]&1023](D)}}while(0);D=c[L>>2]|0;do{if((D|0)!=0){M=D+4|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[D>>2]|0)+8>>2]&1023](D|0);M=D+8|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[D>>2]|0)+16>>2]&1023](D)}}while(0);if(((I=c[E>>2]|0,c[E>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[P>>2]|0)+8>>2]&1023](P);if(((I=c[B>>2]|0,c[B>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[P>>2]|0)+16>>2]&1023](F)}}while(0);I=c[s>>2]|0,c[s>>2]=I+1,I;D=q+16|0;L=q;c[D>>2]=L;c[q>>2]=7280;c[q+4>>2]=y;c[q+8>>2]=w;c[b+16>>2]=b;do{if((b|0)==0){S=7280;t=214}else{c[b>>2]=7280;c[b+4>>2]=v;c[b+8>>2]=r;I=c[s>>2]|0,c[s>>2]=I+1,I;M=c[D>>2]|0;if((M|0)==(L|0)){S=c[q>>2]|0;t=214;break}if((M|0)==0){break}b0[c[(c[M>>2]|0)+20>>2]&1023](M)}}while(0);if((t|0)==214){b0[c[S+16>>2]&1023](L)}c[D>>2]=0;do{if(((I=c[A>>2]|0,c[A>>2]=I+ -1,I)|0)==0){b0[c[(c[z>>2]|0)+8>>2]&1023](z|0);M=z+8|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[z>>2]|0)+16>>2]&1023](z)}}while(0);if(((I=c[s>>2]|0,c[s>>2]=I+ -1,I)|0)!=0){i=f;return}b0[c[(c[r>>2]|0)+8>>2]&1023](r);if(((I=c[u>>2]|0,c[u>>2]=I+ -1,I)|0)!=0){i=f;return}b0[c[(c[r>>2]|0)+16>>2]&1023](w);i=f;return}}while(0);f=bR(4)|0;c[f>>2]=5928;bl(f|0,25656,646)}function g9(a){a=a|0;g7(a);if((a|0)==0){return}qI(a);return}function ha(a){a=a|0;var b=0;c[a>>2]=7280;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function hb(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=7280;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function hc(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(12)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=7280;c[b+4>>2]=c[a+4>>2];e=c[a+8>>2]|0;c[b+8>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function hd(a,b){a=a|0;b=b|0;var d=0;if((b|0)==0){return}c[b>>2]=7280;c[b+4>>2]=c[a+4>>2];d=c[a+8>>2]|0;c[b+8>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function he(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function hf(a){a=a|0;var b=0,d=0,e=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function hg(a){a=a|0;var b=0;b=a+4|0;dh(c[c[b>>2]>>2]|0);dh(c[(c[b>>2]|0)+8>>2]|0);return}function hh(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=10036){d=0;return d|0}d=a+4|0;return d|0}function hi(a){a=a|0;return 24040}function hj(a){a=a|0;var b=0;c[a>>2]=7376;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function hk(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=7376;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function hl(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(12)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=7376;c[b+4>>2]=c[a+4>>2];e=c[a+8>>2]|0;c[b+8>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function hm(a,b){a=a|0;b=b|0;var d=0;if((b|0)==0){return}c[b>>2]=7376;c[b+4>>2]=c[a+4>>2];d=c[a+8>>2]|0;c[b+8>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function hn(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function ho(a){a=a|0;var b=0,d=0,e=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function hp(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;i=i+48|0;e=d|0;f=d+24|0;g=b+16|0;h=c[g>>2]|0;do{if((h|0)==0){c[f+16>>2]=0;j=0;k=b}else{l=b;if((h|0)!=(l|0)){c[f+16>>2]=h;c[g>>2]=0;j=0;k=l;break}l=f;c[f+16>>2]=l;b1[c[(c[h>>2]|0)+12>>2]&255](h,l);j=c[g>>2]|0;k=h}}while(0);do{if((j|0)==(k|0)){b0[c[(c[k>>2]|0)+16>>2]&1023](k)}else{if((j|0)==0){break}b0[c[(c[j>>2]|0)+20>>2]&1023](j)}}while(0);c[g>>2]=0;g=c[a+4>>2]|0;a=f+16|0;j=c[a>>2]|0;do{if((j|0)==0){c[e+16>>2]=0}else{if((j|0)!=(f|0)){c[e+16>>2]=j;c[a>>2]=0;break}k=e;c[e+16>>2]=k;b1[c[(c[j>>2]|0)+12>>2]&255](j,k);k=c[a>>2]|0;if((k|0)==(j|0)){b0[c[(c[j>>2]|0)+16>>2]&1023](j);break}if((k|0)==0){break}b0[c[(c[k>>2]|0)+20>>2]&1023](k)}}while(0);c[a>>2]=0;c7(c[g>>2]|0,e);g=c[e+16>>2]|0;do{if((g|0)==(e|0)){b0[c[(c[g>>2]|0)+16>>2]&1023](g)}else{if((g|0)==0){break}b0[c[(c[g>>2]|0)+20>>2]&1023](g)}}while(0);g=c[a>>2]|0;a=f;if((g|0)==(a|0)){b0[c[(c[f>>2]|0)+16>>2]&1023](a);i=d;return}if((g|0)==0){i=d;return}b0[c[(c[g>>2]|0)+20>>2]&1023](g);i=d;return}function hq(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=10144){d=0;return d|0}d=a+4|0;return d|0}function hr(a){a=a|0;return 24048}function hs(a){a=a|0;var b=0,d=0;c[a>>2]=7328;b=c[a+28>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+20>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+12>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function ht(a){a=a|0;var b=0,d=0;c[a>>2]=7328;b=c[a+28>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+20>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+12>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function hu(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(32)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=7328;c[b+4>>2]=c[a+4>>2];c[b+8>>2]=c[a+8>>2];e=c[a+12>>2]|0;c[b+12>>2]=e;if((e|0)!=0){d=e+4|0;I=c[d>>2]|0,c[d>>2]=I+1,I}c[b+16>>2]=c[a+16>>2];d=c[a+20>>2]|0;c[b+20>>2]=d;if((d|0)!=0){e=d+4|0;I=c[e>>2]|0,c[e>>2]=I+1,I}c[b+24>>2]=c[a+24>>2];e=c[a+28>>2]|0;c[b+28>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function hv(a,b){a=a|0;b=b|0;var d=0,e=0;if((b|0)==0){return}c[b>>2]=7328;c[b+4>>2]=c[a+4>>2];c[b+8>>2]=c[a+8>>2];d=c[a+12>>2]|0;c[b+12>>2]=d;if((d|0)!=0){e=d+4|0;I=c[e>>2]|0,c[e>>2]=I+1,I}c[b+16>>2]=c[a+16>>2];e=c[a+20>>2]|0;c[b+20>>2]=e;if((e|0)!=0){d=e+4|0;I=c[d>>2]|0,c[d>>2]=I+1,I}c[b+24>>2]=c[a+24>>2];d=c[a+28>>2]|0;c[b+28>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function hw(a){a=a|0;var b=0,d=0;b=c[a+28>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+20>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+12>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function hx(a){a=a|0;var b=0,d=0;b=c[a+28>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+20>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+12>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function hy(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;e=i;i=i+112|0;f=e|0;g=e+24|0;h=e+48|0;j=e+56|0;k=e+64|0;l=e+88|0;m=d+4|0;n=c[m>>2]|0;c[d>>2]=0;c[m>>2]=0;m=c[b+4>>2]|0;d=b+8|0;o=c[d>>2]|0;c[h>>2]=c[b+16>>2];p=h+4|0;q=c[b+20>>2]|0;c[p>>2]=q;if((q|0)!=0){r=q+4|0;I=c[r>>2]|0,c[r>>2]=I+1,I}c[j>>2]=c[b+24>>2];r=j+4|0;q=c[b+28>>2]|0;c[r>>2]=q;if((q|0)!=0){s=q+4|0;I=c[s>>2]|0,c[s>>2]=I+1,I}s=c[d>>2]|0;q=c[s+8>>2]|0;t=c[s+12>>2]|0;s=(t|0)==0;if(!s){u=t+4|0;I=c[u>>2]|0,c[u>>2]=I+1,I;I=c[u>>2]|0,c[u>>2]=I+1,I}u=f+16|0;v=f;c[u>>2]=v;c[f>>2]=6944;c[f+4>>2]=q;c[f+8>>2]=t;w=k;x=k+16|0;c[x>>2]=w;c[k>>2]=6944;c[k+4>>2]=q;c[k+8>>2]=t;do{if(s){y=6944;z=10}else{q=t+4|0;I=c[q>>2]|0,c[q>>2]=I+1,I;q=c[u>>2]|0;if((q|0)==(v|0)){y=c[f>>2]|0;z=10;break}if((q|0)==0){break}b0[c[(c[q>>2]|0)+20>>2]&1023](q)}}while(0);if((z|0)==10){b0[c[y+16>>2]&1023](v)}c[u>>2]=0;do{if(!s){u=t+4|0;if(((I=c[u>>2]|0,c[u>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[t>>2]|0)+8>>2]&1023](t|0);u=t+8|0;if(((I=c[u>>2]|0,c[u>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[t>>2]|0)+16>>2]&1023](t)}}while(0);t=c[d>>2]|0;d=c[b+12>>2]|0;if((d|0)!=0){b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I}b=l+16|0;s=l;c[b>>2]=s;c[l>>2]=6560;c[l+4>>2]=t;c[l+8>>2]=d;d=c[m+32>>2]|0;if((d|0)==0){m=bR(4)|0;c[m>>2]=5464;bl(m|0,25448,372)}cc[c[(c[d>>2]|0)+24>>2]&63](g,d,h,j,k,l);c7(c[o+8>>2]|0,g);o=c[g+16>>2]|0;do{if((o|0)==(g|0)){b0[c[(c[o>>2]|0)+16>>2]&1023](o)}else{if((o|0)==0){break}b0[c[(c[o>>2]|0)+20>>2]&1023](o)}}while(0);o=c[b>>2]|0;do{if((o|0)==(s|0)){b0[c[(c[l>>2]|0)+16>>2]&1023](s)}else{if((o|0)==0){break}b0[c[(c[o>>2]|0)+20>>2]&1023](o)}}while(0);o=c[x>>2]|0;do{if((o|0)==(w|0)){b0[c[(c[k>>2]|0)+16>>2]&1023](w)}else{if((o|0)==0){break}b0[c[(c[o>>2]|0)+20>>2]&1023](o)}}while(0);o=c[r>>2]|0;do{if((o|0)!=0){r=o+4|0;if(((I=c[r>>2]|0,c[r>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+8>>2]&1023](o|0);r=o+8|0;if(((I=c[r>>2]|0,c[r>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+16>>2]&1023](o)}}while(0);o=c[p>>2]|0;do{if((o|0)!=0){p=o+4|0;if(((I=c[p>>2]|0,c[p>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+8>>2]&1023](o|0);p=o+8|0;if(((I=c[p>>2]|0,c[p>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+16>>2]&1023](o)}}while(0);c[a+16>>2]=0;if((n|0)==0){i=e;return}a=n+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){i=e;return}b0[c[(c[n>>2]|0)+8>>2]&1023](n|0);a=n+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){i=e;return}b0[c[(c[n>>2]|0)+16>>2]&1023](n);i=e;return}function hz(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=10268){d=0;return d|0}d=a+4|0;return d|0}function hA(a){a=a|0;return 24056}function hB(a){a=a|0;var b=0;c[a>>2]=6560;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function hC(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=6560;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function hD(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(12)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=6560;c[b+4>>2]=c[a+4>>2];e=c[a+8>>2]|0;c[b+8>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function hE(a,b){a=a|0;b=b|0;var d=0;if((b|0)==0){return}c[b>>2]=6560;c[b+4>>2]=c[a+4>>2];d=c[a+8>>2]|0;c[b+8>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function hF(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function hG(a){a=a|0;var b=0,d=0,e=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function hH(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;i=i+48|0;e=d|0;f=d+24|0;g=b+16|0;h=c[g>>2]|0;do{if((h|0)==0){c[f+16>>2]=0;j=0;k=b}else{l=b;if((h|0)!=(l|0)){c[f+16>>2]=h;c[g>>2]=0;j=0;k=l;break}l=f;c[f+16>>2]=l;b1[c[(c[h>>2]|0)+12>>2]&255](h,l);j=c[g>>2]|0;k=h}}while(0);do{if((j|0)==(k|0)){b0[c[(c[k>>2]|0)+16>>2]&1023](k)}else{if((j|0)==0){break}b0[c[(c[j>>2]|0)+20>>2]&1023](j)}}while(0);c[g>>2]=0;g=c[a+4>>2]|0;a=f+16|0;j=c[a>>2]|0;do{if((j|0)==0){c[e+16>>2]=0}else{if((j|0)!=(f|0)){c[e+16>>2]=j;c[a>>2]=0;break}k=e;c[e+16>>2]=k;b1[c[(c[j>>2]|0)+12>>2]&255](j,k);k=c[a>>2]|0;if((k|0)==(j|0)){b0[c[(c[j>>2]|0)+16>>2]&1023](j);break}if((k|0)==0){break}b0[c[(c[k>>2]|0)+20>>2]&1023](k)}}while(0);c[a>>2]=0;c7(c[g>>2]|0,e);g=c[e+16>>2]|0;do{if((g|0)==(e|0)){b0[c[(c[g>>2]|0)+16>>2]&1023](g)}else{if((g|0)==0){break}b0[c[(c[g>>2]|0)+20>>2]&1023](g)}}while(0);g=c[a>>2]|0;a=f;if((g|0)==(a|0)){b0[c[(c[f>>2]|0)+16>>2]&1023](a);i=d;return}if((g|0)==0){i=d;return}b0[c[(c[g>>2]|0)+20>>2]&1023](g);i=d;return}function hI(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=8536){d=0;return d|0}d=a+4|0;return d|0}function hJ(a){a=a|0;return 23920}function hK(a){a=a|0;var b=0,d=0;c[a>>2]=5008;b=c[a+24>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+16>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function hL(a){a=a|0;var b=0,d=0;c[a>>2]=5008;b=c[a+24>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+16>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function hM(a){a=a|0;var b=0,d=0;b=c[a+24>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+16>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function hN(a){a=a|0;if((a|0)==0){return}qI(a);return}function hO(a){a=a|0;var b=0;c[a>>2]=7792;b=c[a+32>>2]|0;do{if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+8>>2]|0;if((b|0)==0){return}a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function hP(a){a=a|0;var b=0,d=0;c[a>>2]=7792;b=c[a+32>>2]|0;do{if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function hQ(a){a=a|0;return}function hR(a){a=a|0;if((a|0)==0){return}qI(a);return}function hS(a){a=a|0;var b=0,d=0;while(1){b=qH(8)|0;if((b|0)!=0){d=12;break}a=(I=c[7664]|0,c[7664]=I+0,I);if((a|0)==0){break}b8[a&1]()}if((d|0)==12){c[b>>2]=7568;return b|0}b=bR(4)|0;c[b>>2]=3284;bl(b|0,24120,94);return 0}function hT(a,b){a=a|0;b=b|0;if((b|0)==0){return}c[b>>2]=7568;return}function hU(a){a=a|0;return}function hV(a){a=a|0;if((a|0)==0){return}qI(a);return}function hW(a,b,c){a=a|0;b=b|0;c=c|0;bL()}function hX(a,b){a=a|0;b=b|0;return((c[b+4>>2]|0)==10940?a+4|0:0)|0}function hY(a){a=a|0;return 24088}function hZ(a){a=a|0;return}function h_(a){a=a|0;if((a|0)==0){return}qI(a);return}function h$(a){a=a|0;var b=0,d=0,e=0;while(1){b=qH(8)|0;if((b|0)!=0){d=12;break}e=(I=c[7664]|0,c[7664]=I+0,I);if((e|0)==0){break}b8[e&1]()}if((d|0)==12){c[b>>2]=7520;c[b+4>>2]=c[a+4>>2];return b|0}b=bR(4)|0;c[b>>2]=3284;bl(b|0,24120,94);return 0}function h0(a,b){a=a|0;b=b|0;if((b|0)==0){return}c[b>>2]=7520;c[b+4>>2]=c[a+4>>2];return}function h1(a){a=a|0;return}function h2(a){a=a|0;if((a|0)==0){return}qI(a);return}function h3(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;j=i;i=i+152|0;k=j|0;l=j+24|0;m=j+48|0;n=j+72|0;o=j+96|0;p=j+120|0;q=j+128|0;r=e|0;s=c[r>>2]|0;t=e+4|0;e=c[t>>2]|0;c[r>>2]=0;c[t>>2]=0;t=f|0;r=c[t>>2]|0;u=f+4|0;f=c[u>>2]|0;c[t>>2]=0;c[u>>2]=0;u=h+16|0;t=c[u>>2]|0;do{if((t|0)==0){c[q+16>>2]=0}else{if((t|0)==(h|0)){v=q;c[q+16>>2]=v;b1[c[(c[t>>2]|0)+12>>2]&255](t,v);break}else{c[q+16>>2]=t;c[u>>2]=0;break}}}while(0);u=c[d+4>>2]|0;while(1){w=qH(80)|0;if((w|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){x=16;break}b8[d&1]()}if((x|0)==16){d=bR(4)|0;c[d>>2]=3284;bl(d|0,24120,94)}d=w;t=(e|0)==0;if(!t){h=e+4|0;I=c[h>>2]|0,c[h>>2]=I+1,I}h=(f|0)==0;if(!h){v=f+4|0;I=c[v>>2]|0,c[v>>2]=I+1,I}v=g+16|0;y=c[v>>2]|0;do{if((y|0)==0){c[n+16>>2]=0;z=0;A=g}else{B=g;if((y|0)!=(B|0)){c[n+16>>2]=y;c[v>>2]=0;z=0;A=B;break}B=n;c[n+16>>2]=B;b1[c[(c[y>>2]|0)+12>>2]&255](y,B);z=c[v>>2]|0;A=y}}while(0);do{if((z|0)==(A|0)){b0[c[(c[A>>2]|0)+16>>2]&1023](A)}else{if((z|0)==0){break}b0[c[(c[z>>2]|0)+20>>2]&1023](z)}}while(0);c[v>>2]=0;v=w+8|0;z=n+16|0;A=c[z>>2]|0;do{if((A|0)==0){c[m+16>>2]=0}else{if((A|0)!=(n|0)){c[m+16>>2]=A;c[z>>2]=0;break}y=m;c[m+16>>2]=y;b1[c[(c[A>>2]|0)+12>>2]&255](A,y);y=c[z>>2]|0;if((y|0)==(A|0)){b0[c[(c[A>>2]|0)+16>>2]&1023](A);break}if((y|0)==0){break}b0[c[(c[y>>2]|0)+20>>2]&1023](y)}}while(0);c[z>>2]=0;A=v;c[A>>2]=0;y=w+12|0;c[y>>2]=0;g=w+16|0;B=g;a[g]=0;c[w+48>>2]=0;c[w+52>>2]=0;g=w+56|0;c[g>>2]=r;r=w+60|0;c[r>>2]=f;C=m+16|0;D=c[C>>2]|0;do{if((D|0)==0){c[l+16>>2]=0}else{if((D|0)!=(m|0)){c[l+16>>2]=D;c[C>>2]=0;break}E=l;c[l+16>>2]=E;b1[c[(c[D>>2]|0)+12>>2]&255](D,E);E=c[C>>2]|0;if((E|0)==(D|0)){b0[c[(c[D>>2]|0)+16>>2]&1023](D);break}if((E|0)==0){break}b0[c[(c[E>>2]|0)+20>>2]&1023](E)}}while(0);c[C>>2]=0;fa(B,l);B=c[l+16>>2]|0;do{if((B|0)==(l|0)){b0[c[(c[B>>2]|0)+16>>2]&1023](B)}else{if((B|0)==0){break}b0[c[(c[B>>2]|0)+20>>2]&1023](B)}}while(0);do{if((c[g>>2]|0)==0){while(1){F=qH(16)|0;if((F|0)!=0){break}B=(I=c[7664]|0,c[7664]=I+0,I);if((B|0)==0){x=66;break}b8[B&1]()}if((x|0)==66){B=bR(4)|0;c[B>>2]=3284;bl(B|0,24120,94)}c[F+4>>2]=0;c[F+8>>2]=0;c[F>>2]=4912;B=F+12|0;c[B>>2]=7712;c[g>>2]=B;B=c[r>>2]|0;c[r>>2]=F;if((B|0)==0){break}l=B+4|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[B>>2]|0)+8>>2]&1023](B|0);l=B+8|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[B>>2]|0)+16>>2]&1023](B)}}while(0);F=c[C>>2]|0;C=m;do{if((F|0)==(C|0)){b0[c[(c[m>>2]|0)+16>>2]&1023](C)}else{if((F|0)==0){break}b0[c[(c[F>>2]|0)+20>>2]&1023](F)}}while(0);c[w>>2]=7952;c[w+64>>2]=s;c[w+68>>2]=e;if(!t){s=e+4|0;I=c[s>>2]|0,c[s>>2]=I+1,I}a[w+72|0]=0;while(1){G=qH(16)|0;if((G|0)!=0){break}s=(I=c[7664]|0,c[7664]=I+0,I);if((s|0)==0){x=108;break}b8[s&1]()}if((x|0)==108){x=bR(4)|0;c[x>>2]=3284;bl(x|0,24120,94)}x=G;s=G+4|0;c[s>>2]=0;F=G+8|0;c[F>>2]=0;c[G>>2]=4816;c[G+12>>2]=d;do{if((v|0)!=0){I=c[F>>2]|0,c[F>>2]=I+1,I;c[v>>2]=d;C=w+12|0;m=c[C>>2]|0;c[C>>2]=x;if((m|0)==0){break}C=m+8|0;if(((I=c[C>>2]|0,c[C>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[m>>2]|0)+16>>2]&1023](m)}}while(0);d=c[z>>2]|0;z=n;do{if((d|0)==(z|0)){b0[c[(c[n>>2]|0)+16>>2]&1023](z)}else{if((d|0)==0){break}b0[c[(c[d>>2]|0)+20>>2]&1023](d)}}while(0);do{if(!t){d=e+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[e>>2]|0)+8>>2]&1023](e|0);d=e+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[e>>2]|0)+16>>2]&1023](e)}}while(0);d=c[A>>2]|0;A=c[y>>2]|0;L108:do{if((A|0)!=0){y=A+4|0;do{z=c[y>>2]|0;if((z|0)==-1){break L108}}while(((I=c[y>>2]|0,(c[y>>2]|0)==(z|0)?(c[y>>2]=z+1)|0:0,I)|0)!=(z|0));I=c[y>>2]|0,c[y>>2]=I+1,I;z=k+16|0;n=k;c[z>>2]=n;c[k>>2]=6800;c[k+4>>2]=d;c[k+8>>2]=A;v=o;m=o+16|0;c[m>>2]=v;c[o>>2]=6800;c[o+4>>2]=d;c[o+8>>2]=A;I=c[y>>2]|0,c[y>>2]=I+1,I;C=c[z>>2]|0;do{if((C|0)==(n|0)){b0[c[(c[k>>2]|0)+16>>2]&1023](n)}else{if((C|0)==0){break}b0[c[(c[C>>2]|0)+20>>2]&1023](C)}}while(0);c[z>>2]=0;do{if(((I=c[y>>2]|0,c[y>>2]=I+ -1,I)|0)==0){b0[c[(c[A>>2]|0)+8>>2]&1023](A|0);C=A+8|0;if(((I=c[C>>2]|0,c[C>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[A>>2]|0)+16>>2]&1023](A)}}while(0);y=q+16|0;z=c[y>>2]|0;if((z|0)==0){C=bR(4)|0;c[C>>2]=5464;bl(C|0,25448,372)}b1[c[(c[z>>2]|0)+24>>2]&255](z,o);z=c[m>>2]|0;do{if((z|0)==(v|0)){b0[c[(c[o>>2]|0)+16>>2]&1023](v)}else{if((z|0)==0){break}b0[c[(c[z>>2]|0)+20>>2]&1023](z)}}while(0);z=c[u+40>>2]|0;v=c[c[z>>2]>>2]|0;c[p>>2]=w;m=p+4|0;c[m>>2]=x;I=c[s>>2]|0,c[s>>2]=I+1,I;cf[v&63](b,z,p);z=c[m>>2]|0;do{if((z|0)!=0){m=z+4|0;if(((I=c[m>>2]|0,c[m>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[z>>2]|0)+8>>2]&1023](z|0);m=z+8|0;if(((I=c[m>>2]|0,c[m>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[z>>2]|0)+16>>2]&1023](z)}}while(0);do{if(((I=c[s>>2]|0,c[s>>2]=I+ -1,I)|0)==0){b0[c[(c[G>>2]|0)+8>>2]&1023](G);if(((I=c[F>>2]|0,c[F>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[G>>2]|0)+16>>2]&1023](x)}}while(0);z=c[y>>2]|0;m=q;do{if((z|0)==(m|0)){b0[c[(c[q>>2]|0)+16>>2]&1023](m)}else{if((z|0)==0){break}b0[c[(c[z>>2]|0)+20>>2]&1023](z)}}while(0);do{if(!h){z=f+4|0;if(((I=c[z>>2]|0,c[z>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[f>>2]|0)+8>>2]&1023](f|0);z=f+8|0;if(((I=c[z>>2]|0,c[z>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[f>>2]|0)+16>>2]&1023](f)}}while(0);if(t){i=j;return}z=e+4|0;if(((I=c[z>>2]|0,c[z>>2]=I+ -1,I)|0)!=0){i=j;return}b0[c[(c[e>>2]|0)+8>>2]&1023](e|0);z=e+8|0;if(((I=c[z>>2]|0,c[z>>2]=I+ -1,I)|0)!=0){i=j;return}b0[c[(c[e>>2]|0)+16>>2]&1023](e);i=j;return}}while(0);j=bR(4)|0;c[j>>2]=5928;bl(j|0,25656,646)}function h4(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=10740){d=0;return d|0}d=a+4|0;return d|0}function h5(a){a=a|0;return 24080}function h6(a){a=a|0;var b=0;c[a>>2]=6800;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function h7(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=6800;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function h8(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(12)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=6800;c[b+4>>2]=c[a+4>>2];e=c[a+8>>2]|0;c[b+8>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function h9(a,b){a=a|0;b=b|0;var d=0;if((b|0)==0){return}c[b>>2]=6800;c[b+4>>2]=c[a+4>>2];d=c[a+8>>2]|0;c[b+8>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function ia(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function ib(a){a=a|0;var b=0,d=0,e=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function ic(a){a=a|0;ig((c[a+4>>2]|0)+8|0);return}function id(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=9044){d=0;return d|0}d=a+4|0;return d|0}function ie(a){a=a|0;return 23960}function ig(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;while(1){d=qH(16)|0;if((d|0)!=0){break}e=(I=c[7664]|0,c[7664]=I+0,I);if((e|0)==0){f=9;break}b8[e&1]()}if((f|0)==9){f=bR(4)|0;c[f>>2]=3284;bl(f|0,24120,94)}c[d+4>>2]=0;c[d+8>>2]=0;c[d>>2]=4912;f=d+12|0;c[f>>2]=7712;e=f;f=d;d=b+40|0;c[d>>2]=e;g=b+44|0;h=c[g>>2]|0;c[g>>2]=f;if((h|0)==0){i=e;j=f}else{f=h+4|0;do{if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)==0){b0[c[(c[h>>2]|0)+8>>2]&1023](h|0);e=h+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[h>>2]|0)+16>>2]&1023](h)}}while(0);i=c[d>>2]|0;j=c[g>>2]|0}h=b+48|0;f=c[h>>2]|0;c[h>>2]=i;c[d>>2]=f;f=b+52|0;d=c[f>>2]|0;c[f>>2]=j;c[g>>2]=d;d=b+8|0;g=a[d]|0;if((g&1)==0){return}j=b+16|0;if((j|0)==0){return}f=b+32|0;b=c[f>>2]|0;if((b|0)==0){k=g}else{b0[c[(c[b>>2]|0)+24>>2]&1023](b);b=c[f>>2]|0;do{if((b|0)==(j|0)){b0[c[(c[j>>2]|0)+16>>2]&1023](b)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);c[f>>2]=0;k=a[d]|0}if((k&1)==0){return}a[d]=0;return}function ih(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;e=i;i=i+28|0;f=e|0;g=e+4|0;h=e+8|0;j=e+12|0;k=e+16|0;l=e+20|0;m=b+72|0;do{if((a[m]&1)==0){n=c[b+64>>2]|0;o=13}else{p=b+76|0;q=c[b+64>>2]|0;if((p|0)==0){n=q;o=13;break}r=p;p=c[d>>2]|0;c[j>>2]=c[r>>2];c[k>>2]=p;p=c[q+72>>2]|0;if((p|0)==0){q=bR(4)|0;c[q>>2]=5464;bl(q|0,25448,372)}q=b3[c[(c[p>>2]|0)+24>>2]&63](p,j,k)|0;p=a[m]|0;if((p&1)!=0){c[r>>2]=q;s=p;o=35;break}p=b+76|0;if((p|0)==0){o=34;break}c[p>>2]=q;o=34}}while(0);L14:do{if((o|0)==13){do{if((a[n+48|0]&1)!=0){k=n+52|0;if((k|0)==0){break}j=c[d>>2]|0;c[f>>2]=c[k>>2];c[g>>2]=j;j=c[n+72>>2]|0;if((j|0)==0){k=bR(4)|0;c[k>>2]=5464;bl(k|0,25448,372)}k=b3[c[(c[j>>2]|0)+24>>2]&63](j,f,g)|0;j=a[m]|0;if((j&1)!=0){c[b+76>>2]=k;s=j;o=35;break L14}j=b+76|0;if((j|0)==0){o=34;break L14}c[j>>2]=k;o=34;break L14}}while(0);c[h>>2]=c[d>>2];k=c[n+96>>2]|0;if((k|0)==0){j=bR(4)|0;c[j>>2]=5464;bl(j|0,25448,372)}cf[c[(c[k>>2]|0)+24>>2]&63](l,k,h);k=l|0;j=c[l+4>>2]|0;q=a[m]|0;if((q&1)==0){p=b+76|0;if((p|0)!=0){c[p>>2]=j}a[m]=1;t=1}else{c[b+76>>2]=j;t=q}if((a[k]&1)==0){s=t;o=35;break}a[k]=0;s=t;o=35}}while(0);do{if((o|0)==34){a[m]=1;t=c[b+56>>2]|0;u=t;v=c[c[t>>2]>>2]|0}else if((o|0)==35){t=c[b+56>>2]|0;l=c[c[t>>2]>>2]|0;if((s&1)==0){w=0;x=t;y=l}else{u=t;v=l;break}b1[y&255](x,w);i=e;return}}while(0);w=b+76|0;x=u;y=v;b1[y&255](x,w);i=e;return}function ii(b){b=b|0;var d=0,e=0,f=0;if((a[b+72|0]&1)==0){d=3}else{if((b+76|0)==0){d=3}}do{if((d|0)==3){e=c[b+64>>2]|0;if((a[e+48|0]&1)==0){break}f=e+52|0;if((f|0)==0){break}e=c[b+56>>2]|0;b1[c[c[e>>2]>>2]&255](e,f)}}while(0);d=c[b+56>>2]|0;b0[c[(c[d>>2]|0)+4>>2]&1023](d);ig(b+8|0);return}function ij(a,b){a=a|0;b=b|0;var d=0;d=c[a+56>>2]|0;b1[c[(c[d>>2]|0)+8>>2]&255](d,b);ig(a+8|0);return}function ik(b){b=b|0;var d=0,e=0;c[b>>2]=7952;d=b+72|0;if((a[d]&1)!=0){a[d]=0}d=c[b+68>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=c[b+60>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=c[b+52>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=b+16|0;do{if((a[d]&1)!=0){a[d]=0;e=c[b+40>>2]|0;if((e|0)==(b+24|0)){b0[c[(c[e>>2]|0)+16>>2]&1023](e);break}if((e|0)==0){break}b0[c[(c[e>>2]|0)+20>>2]&1023](e)}}while(0);d=c[b+12>>2]|0;if((d|0)==0){return}b=d+8|0;if(((I=c[b>>2]|0,c[b>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[d>>2]|0)+16>>2]&1023](d);return}function il(b){b=b|0;var d=0,e=0;c[b>>2]=7952;d=b+72|0;if((a[d]&1)!=0){a[d]=0}d=c[b+68>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=c[b+60>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=c[b+52>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=b+16|0;do{if((a[d]&1)!=0){a[d]=0;e=c[b+40>>2]|0;if((e|0)==(b+24|0)){b0[c[(c[e>>2]|0)+16>>2]&1023](e);break}if((e|0)==0){break}b0[c[(c[e>>2]|0)+20>>2]&1023](e)}}while(0);d=c[b+12>>2]|0;do{if((d|0)!=0){e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);if((b|0)==0){return}qI(b);return}function im(a){a=a|0;return}function io(a){a=a|0;if((a|0)==0){return}qI(a);return}function ip(a){a=a|0;var b=0;b=c[a+12>>2]|0;if((b|0)==0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function iq(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)==16164){d=a+12|0}else{d=0}return d|0}function ir(a){a=a|0;if((a|0)==0){return}qI(a);return}function is(a){a=a|0;var b=0;c[a>>2]=5296;c[a+12>>2]=8124;b=c[a+32>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function it(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5296;c[a+12>>2]=8124;b=c[a+32>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function iu(a){a=a|0;var b=0;b=a+12|0;b0[c[(c[b>>2]|0)+4>>2]&1023](b);return}function iv(a){a=a|0;if((a|0)==0){return}qI(a);return}function iw(a){a=a|0;var b=0;c[a>>2]=8124;b=c[a+20>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function ix(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;f=i;i=i+88|0;g=f|0;h=f+24|0;j=f+48|0;k=f+56|0;l=f+80|0;m=e|0;n=c[m>>2]|0;o=e+4|0;e=c[o>>2]|0;c[m>>2]=0;c[o>>2]=0;while(1){p=qH(44)|0;if((p|0)!=0){break}o=(I=c[7664]|0,c[7664]=I+0,I);if((o|0)==0){q=10;break}b8[o&1]()}if((q|0)==10){o=bR(4)|0;c[o>>2]=3284;bl(o|0,24120,94)}c[p+4>>2]=0;o=p+8|0;c[o>>2]=0;c[p>>2]=5136;m=p+12|0;c[p+16>>2]=0;c[p+20>>2]=0;c[m>>2]=7984;c[p+24>>2]=0;c[p+28>>2]=0;a[p+32|0]=0;while(1){r=qH(72)|0;if((r|0)!=0){break}s=(I=c[7664]|0,c[7664]=I+0,I);if((s|0)==0){q=21;break}b8[s&1]()}if((q|0)==21){s=bR(4)|0;c[s>>2]=3284;bl(s|0,24120,94)}c[r+4>>2]=0;c[r+8>>2]=0;c[r>>2]=5328;c[r+32>>2]=0;a[r+40|0]=0;qP(r+44|0,0,24)|0;c[p+36>>2]=r+16;c[p+40>>2]=r;r=m;s=p;t=(m|0)==0?0:p+16|0;do{if((t|0)!=0){I=c[o>>2]|0,c[o>>2]=I+1,I;c[t>>2]=r;u=t+4|0;v=c[u>>2]|0;c[u>>2]=s;if((v|0)==0){break}u=v+8|0;if(((I=c[u>>2]|0,c[u>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[v>>2]|0)+16>>2]&1023](v)}}while(0);c[p+24>>2]=n;n=p+28|0;t=c[n>>2]|0;c[n>>2]=e;do{if((t|0)!=0){e=t+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[t>>2]|0)+8>>2]&1023](t|0);e=t+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[t>>2]|0)+16>>2]&1023](t)}}while(0);t=c[7328]|0;do{if((t|0)==0){q=39}else{e=c[t>>2]|0;n=c[t+4>>2]|0;do{if((n|0)!=0){o=n+4|0;I=c[o>>2]|0,c[o>>2]=I+1,I;if(((I=c[o>>2]|0,c[o>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[n>>2]|0)+8>>2]&1023](n|0);o=n+8|0;if(((I=c[o>>2]|0,c[o>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[n>>2]|0)+16>>2]&1023](n)}}while(0);if((e|0)==0){q=39;break}c[l>>2]=m;n=l+4|0;c[n>>2]=s;if((p|0)!=0){o=p+4|0;I=c[o>>2]|0,c[o>>2]=I+1,I}iA(k,d+4|0,l);c7(c[p+36>>2]|0,k);o=c[k+16>>2]|0;do{if((o|0)==(k|0)){b0[c[(c[o>>2]|0)+16>>2]&1023](o)}else{if((o|0)==0){break}b0[c[(c[o>>2]|0)+20>>2]&1023](o)}}while(0);o=c[n>>2]|0;do{if((o|0)!=0){e=o+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+8>>2]&1023](o|0);e=o+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+16>>2]&1023](o)}}while(0);iz(b,c[p+16>>2]|0,c[p+20>>2]|0)}}while(0);do{if((q|0)==39){while(1){q=0;w=qH(24)|0;if((w|0)!=0){break}k=(I=c[7664]|0,c[7664]=I+0,I);if((k|0)==0){q=47;break}b8[k&1]();q=39}if((q|0)==47){k=bR(4)|0;c[k>>2]=3284;bl(k|0,24120,94)}k=w+4|0;c[k>>2]=0;l=w+8|0;c[l>>2]=0;c[w>>2]=5168;m=w+12|0;c[w+16>>2]=0;c[w+20>>2]=0;c[m>>2]=8016;t=w;o=(m|0)==0?0:w+16|0;do{if((o|0)!=0){n=m;I=c[l>>2]|0,c[l>>2]=I+1,I;c[o>>2]=n;n=o+4|0;e=c[n>>2]|0;c[n>>2]=t;if((e|0)==0){break}n=e+8|0;if(((I=c[n>>2]|0,c[n>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[e>>2]|0)+16>>2]&1023](e)}}while(0);o=m;e=c[(c[m>>2]|0)+12>>2]|0;if((p|0)!=0){n=p+4|0;I=c[n>>2]|0,c[n>>2]=I+1,I}n=j|0;while(1){x=qH(48)|0;if((x|0)!=0){break}v=(I=c[7664]|0,c[7664]=I+0,I);if((v|0)==0){q=64;break}b8[v&1]()}if((q|0)==64){m=bR(4)|0;c[m>>2]=3284;bl(m|0,24120,94)}c[x+4>>2]=0;c[x+8>>2]=0;c[x>>2]=4880;c[x+32>>2]=0;m=j|0;v=j+4|0;c[m>>2]=x+16;c[v>>2]=x;u=g+16|0;y=g;c[u>>2]=y;c[g>>2]=7616;c[g+4>>2]=d;c[g+8>>2]=r;c[g+12>>2]=s;dC(n,g);z=c[u>>2]|0;do{if((z|0)==(y|0)){b0[c[(c[g>>2]|0)+16>>2]&1023](y)}else{if((z|0)==0){break}b0[c[(c[z>>2]|0)+20>>2]&1023](z)}}while(0);a[(c[m>>2]|0)+24|0]=0;cf[e&63](h,o,j);z=c[h+16>>2]|0;do{if((z|0)==(h|0)){b0[c[(c[z>>2]|0)+16>>2]&1023](z)}else{if((z|0)==0){break}b0[c[(c[z>>2]|0)+20>>2]&1023](z)}}while(0);z=c[v>>2]|0;do{if((z|0)!=0){o=z+4|0;if(((I=c[o>>2]|0,c[o>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[z>>2]|0)+8>>2]&1023](z|0);o=z+8|0;if(((I=c[o>>2]|0,c[o>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[z>>2]|0)+16>>2]&1023](z)}}while(0);iz(b,c[p+16>>2]|0,c[p+20>>2]|0);if(((I=c[k>>2]|0,c[k>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[w>>2]|0)+8>>2]&1023](w);if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[w>>2]|0)+16>>2]&1023](t)}}while(0);if((p|0)==0){i=f;return}w=p+4|0;if(((I=c[w>>2]|0,c[w>>2]=I+ -1,I)|0)!=0){i=f;return}b0[c[(c[p>>2]|0)+8>>2]&1023](p);w=p+8|0;if(((I=c[w>>2]|0,c[w>>2]=I+ -1,I)|0)!=0){i=f;return}b0[c[(c[p>>2]|0)+16>>2]&1023](s);i=f;return}function iy(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=8124;b=c[a+20>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function iz(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+24|0;f=e|0;if((d|0)==0){g=bR(4)|0;h=g;c[h>>2]=5928;bl(g|0,25656,646)}j=d+4|0;do{k=c[j>>2]|0;if((k|0)==-1){l=16;break}}while(((I=c[j>>2]|0,(c[j>>2]|0)==(k|0)?(c[j>>2]=k+1)|0:0,I)|0)!=(k|0));if((l|0)==16){g=bR(4)|0;h=g;c[h>>2]=5928;bl(g|0,25656,646)}I=c[j>>2]|0,c[j>>2]=I+1,I;g=f+16|0;h=f;c[g>>2]=h;c[f>>2]=6848;c[f+4>>2]=b;c[f+8>>2]=d;c[a+16>>2]=a;do{if((a|0)==0){m=6848;l=9}else{c[a>>2]=6848;c[a+4>>2]=b;c[a+8>>2]=d;I=c[j>>2]|0,c[j>>2]=I+1,I;k=c[g>>2]|0;if((k|0)==(h|0)){m=c[f>>2]|0;l=9;break}if((k|0)==0){break}b0[c[(c[k>>2]|0)+20>>2]&1023](k)}}while(0);if((l|0)==9){b0[c[m+16>>2]&1023](h)}c[g>>2]=0;if(((I=c[j>>2]|0,c[j>>2]=I+ -1,I)|0)!=0){i=e;return}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);j=d+8|0;if(((I=c[j>>2]|0,c[j>>2]=I+ -1,I)|0)!=0){i=e;return}b0[c[(c[d>>2]|0)+16>>2]&1023](d);i=e;return}function iA(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;i=i+144|0;g=f|0;h=f+24|0;j=f+48|0;k=f+56|0;l=f+80|0;m=f+104|0;n=f+112|0;o=f+136|0;while(1){p=qH(24)|0;if((p|0)!=0){break}q=(I=c[7664]|0,c[7664]=I+0,I);if((q|0)==0){r=9;break}b8[q&1]()}if((r|0)==9){q=bR(4)|0;c[q>>2]=3284;bl(q|0,24120,94)}q=p+4|0;c[q>>2]=0;s=p+8|0;c[s>>2]=0;c[p>>2]=4848;t=p+12|0;u=t;v=p;a[t]=0;w=c[d>>2]|0;c[p+16>>2]=w;x=d+8|0;y=c[x>>2]|0;c[p+20>>2]=((c[d+4>>2]|0)-w+y|0)/(y|0)|0;while(1){z=qH(52)|0;if((z|0)!=0){break}y=(I=c[7664]|0,c[7664]=I+0,I);if((y|0)==0){r=21;break}b8[y&1]()}if((r|0)==21){y=bR(4)|0;c[y>>2]=3284;bl(y|0,24120,94)}c[z+4>>2]=0;c[z+8>>2]=0;c[z>>2]=5232;y=z+12|0;qP(y|0,0,37)|0;w=y;A=z;I=c[q>>2]|0,c[q>>2]=I+1,I;B=l+16|0;C=l;c[B>>2]=C;c[l>>2]=6608;c[l+4>>2]=u;c[l+8>>2]=v;D=k;E=k+16|0;c[E>>2]=D;c[k>>2]=6608;c[k+4>>2]=t;c[k+8>>2]=p;I=c[q>>2]|0,c[q>>2]=I+1,I;t=c[B>>2]|0;do{if((t|0)==(C|0)){b0[c[(c[l>>2]|0)+16>>2]&1023](C)}else{if((t|0)==0){break}b0[c[(c[t>>2]|0)+20>>2]&1023](t)}}while(0);c[B>>2]=0;iB(j,w,k);t=c[j+4>>2]|0;do{if((t|0)!=0){j=t+8|0;if(((I=c[j>>2]|0,c[j>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[t>>2]|0)+16>>2]&1023](t)}}while(0);t=c[E>>2]|0;do{if((t|0)==(D|0)){b0[c[(c[k>>2]|0)+16>>2]&1023](D)}else{if((t|0)==0){break}b0[c[(c[t>>2]|0)+20>>2]&1023](t)}}while(0);t=c[B>>2]|0;do{if((t|0)==(C|0)){b0[c[(c[l>>2]|0)+16>>2]&1023](C)}else{if((t|0)==0){break}b0[c[(c[t>>2]|0)+20>>2]&1023](t)}}while(0);t=c[d+12>>2]|0;d=c[(c[t>>2]|0)+12>>2]|0;I=c[q>>2]|0,c[q>>2]=I+1,I;C=c[e>>2]|0;l=c[e+4>>2]|0;if((l|0)!=0){e=l+4|0;I=c[e>>2]|0,c[e>>2]=I+1,I}e=c[x>>2]|0;x=o|0;while(1){F=qH(48)|0;if((F|0)!=0){break}B=(I=c[7664]|0,c[7664]=I+0,I);if((B|0)==0){r=50;break}b8[B&1]()}if((r|0)==50){B=bR(4)|0;c[B>>2]=3284;bl(B|0,24120,94)}c[F+4>>2]=0;c[F+8>>2]=0;c[F>>2]=4880;c[F+32>>2]=0;B=o|0;D=o+4|0;c[B>>2]=F+16;c[D>>2]=F;F=g+16|0;c[F>>2]=0;while(1){G=qH(24)|0;if((G|0)!=0){break}k=(I=c[7664]|0,c[7664]=I+0,I);if((k|0)==0){r=61;break}b8[k&1]()}if((r|0)==61){k=bR(4)|0;c[k>>2]=3284;bl(k|0,24120,94)}c[G>>2]=7664;c[G+4>>2]=u;c[G+8>>2]=v;c[G+12>>2]=C;c[G+16>>2]=l;c[G+20>>2]=e;c[F>>2]=G;dC(x,g);x=c[F>>2]|0;do{if((x|0)==(g|0)){b0[c[(c[x>>2]|0)+16>>2]&1023](x)}else{if((x|0)==0){break}b0[c[(c[x>>2]|0)+20>>2]&1023](x)}}while(0);a[(c[B>>2]|0)+24|0]=0;cf[d&63](n,t,o);iB(m,w,n);o=c[m+4>>2]|0;do{if((o|0)!=0){m=o+8|0;if(((I=c[m>>2]|0,c[m>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+16>>2]&1023](o)}}while(0);o=c[n+16>>2]|0;do{if((o|0)==(n|0)){b0[c[(c[o>>2]|0)+16>>2]&1023](o)}else{if((o|0)==0){break}b0[c[(c[o>>2]|0)+20>>2]&1023](o)}}while(0);o=c[D>>2]|0;do{if((o|0)!=0){D=o+4|0;if(((I=c[D>>2]|0,c[D>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+8>>2]&1023](o|0);D=o+8|0;if(((I=c[D>>2]|0,c[D>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[o>>2]|0)+16>>2]&1023](o)}}while(0);o=(z|0)==0;if(!o){D=z+4|0;I=c[D>>2]|0,c[D>>2]=I+1,I;I=c[D>>2]|0,c[D>>2]=I+1,I}D=h+16|0;n=h;c[D>>2]=n;c[h>>2]=6896;c[h+4>>2]=w;c[h+8>>2]=A;c[b+16>>2]=b;do{if((b|0)==0){H=6896;r=105}else{c[b>>2]=6896;c[b+4>>2]=y;c[b+8>>2]=z;if(o){H=6896;r=105;break}w=z+4|0;I=c[w>>2]|0,c[w>>2]=I+1,I;w=c[D>>2]|0;if((w|0)==(n|0)){H=c[h>>2]|0;r=105;break}if((w|0)==0){break}b0[c[(c[w>>2]|0)+20>>2]&1023](w)}}while(0);if((r|0)==105){b0[c[H+16>>2]&1023](n)}c[D>>2]=0;do{if(!o){D=z+4|0;if(((I=c[D>>2]|0,c[D>>2]=I+ -1,I)|0)==0){b0[c[(c[z>>2]|0)+8>>2]&1023](z);D=z+8|0;if(((I=c[D>>2]|0,c[D>>2]=I+ -1,I)|0)==0){b0[c[(c[z>>2]|0)+16>>2]&1023](A)}if(o){break}}D=z+4|0;if(((I=c[D>>2]|0,c[D>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[z>>2]|0)+8>>2]&1023](z);D=z+8|0;if(((I=c[D>>2]|0,c[D>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[z>>2]|0)+16>>2]&1023](A)}}while(0);if(((I=c[q>>2]|0,c[q>>2]=I+ -1,I)|0)!=0){i=f;return}b0[c[(c[p>>2]|0)+8>>2]&1023](p);if(((I=c[s>>2]|0,c[s>>2]=I+ -1,I)|0)!=0){i=f;return}b0[c[(c[p>>2]|0)+16>>2]&1023](v);i=f;return}function iB(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0;while(1){f=qH(40)|0;if((f|0)!=0){break}g=(I=c[7664]|0,c[7664]=I+0,I);if((g|0)==0){h=9;break}b8[g&1]()}if((h|0)==9){g=bR(4)|0;c[g>>2]=3284;bl(g|0,24120,94)}c[f+4>>2]=0;c[f+8>>2]=0;c[f>>2]=5392;g=f+16|0;i=e+16|0;j=c[i>>2]|0;do{if((j|0)==0){c[f+32>>2]=0;k=0;l=e}else{m=e;if((j|0)!=(m|0)){c[f+32>>2]=j;c[i>>2]=0;k=0;l=m;break}m=g;c[f+32>>2]=m;b1[c[(c[j>>2]|0)+12>>2]&255](j,m);k=c[i>>2]|0;l=j}}while(0);do{if((k|0)==(l|0)){b0[c[(c[l>>2]|0)+16>>2]&1023](l)}else{if((k|0)==0){break}b0[c[(c[k>>2]|0)+20>>2]&1023](k)}}while(0);c[i>>2]=0;i=g;k=f;n;if((n|0)!=0){kB(n,596)}L27:do{if((a[d+36|0]&1)==0){n=d+4|0;l=c[n>>2]|0;j=d|0;e=c[j>>2]|0;m=e;while(1){if((m|0)==(l|0)){break}if((c[m>>2]|0)==(i|0)){o=1;break L27}else{m=m+8|0}}m=d+8|0;p=c[m>>2]|0;if(l>>>0<p>>>0){do{if((l|0)!=0){c[l>>2]=i;c[l+4>>2]=k;if((f|0)==0){break}q=f+4|0;I=c[q>>2]|0,c[q>>2]=I+1,I}}while(0);c[n>>2]=(c[n>>2]|0)+8;o=1;break}q=e;r=l-q>>3;s=r+1|0;if(s>>>0>536870911>>>0){oG()}t=p-q|0;if(t>>3>>>0>268435454>>>0){u=536870911;h=60}else{q=t>>2;t=q>>>0<s>>>0?s:q;if((t|0)==0){v=0;w=0}else{u=t;h=60}}do{if((h|0)==60){t=u<<3;q=(t|0)==0?1:t;while(1){x=qH(q)|0;if((x|0)!=0){h=71;break}t=(I=c[7664]|0,c[7664]=I+0,I);if((t|0)==0){break}b8[t&1]()}if((h|0)==71){v=x;w=u;break}q=bR(4)|0;c[q>>2]=3284;bl(q|0,24120,94)}}while(0);p=v+(r<<3)|0;q=v+(w<<3)|0;do{if((p|0)==0){y=e;z=l}else{c[p>>2]=i;c[v+(r<<3)+4>>2]=k;if((f|0)==0){y=e;z=l;break}t=f+4|0;I=c[t>>2]|0,c[t>>2]=I+1,I;y=c[j>>2]|0;z=c[n>>2]|0}}while(0);l=v+(s<<3)|0;do{if((z|0)==(y|0)){c[j>>2]=p;c[n>>2]=l;c[m>>2]=q;A=z}else{e=(z-8+(-y|0)|0)>>>3;t=z;B=p;while(1){C=B-8|0;D=t-8|0;if((C|0)!=0){E=D|0;c[C>>2]=c[E>>2];F=t-8+4|0;c[B-8+4>>2]=c[F>>2];c[E>>2]=0;c[F>>2]=0}if((D|0)==(y|0)){break}else{t=D;B=C}}B=c[j>>2]|0;t=c[n>>2]|0;c[j>>2]=v+(r-1-e<<3);c[n>>2]=l;c[m>>2]=q;if((B|0)==(t|0)){A=B;break}else{G=t}while(1){t=G-8|0;C=c[G-8+4>>2]|0;do{if((C|0)!=0){D=C+4|0;if(((I=c[D>>2]|0,c[D>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[C>>2]|0)+8>>2]&1023](C|0);D=C+8|0;if(((I=c[D>>2]|0,c[D>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[C>>2]|0)+16>>2]&1023](C)}}while(0);if((B|0)==(t|0)){A=B;break}else{G=t}}}}while(0);if((A|0)==0){o=1;break}qI(A);o=1}else{H;if((H|0)!=0){bJ(1348,1196,46,1980)}q=f+32|0;m=c[q>>2]|0;if((m|0)==0){o=0;break}b0[c[(c[m>>2]|0)+24>>2]&1023](m);m=c[q>>2]|0;do{if((m|0)==(g|0)){b0[c[(c[m>>2]|0)+16>>2]&1023](m)}else{if((m|0)==0){break}b0[c[(c[m>>2]|0)+20>>2]&1023](m)}}while(0);c[q>>2]=0;o=0}}while(0);c[b>>2]=i;c[b+4>>2]=k;b=(f|0)==0;if(!b){i=f+8|0;I=c[i>>2]|0,c[i>>2]=I+1,I}do{if(o<<24>>24!=0){J;if((J|0)==0){break}bJ(1348,1196,46,1980)}}while(0);if(b){return}b=f+4|0;if(((I=c[b>>2]|0,c[b>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[f>>2]|0)+8>>2]&1023](f);b=f+8|0;if(((I=c[b>>2]|0,c[b>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[f>>2]|0)+16>>2]&1023](k);return}function iC(a){a=a|0;var b=0;c[a>>2]=6896;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function iD(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=6896;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function iE(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(12)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=6896;c[b+4>>2]=c[a+4>>2];e=c[a+8>>2]|0;c[b+8>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function iF(a,b){a=a|0;b=b|0;var d=0;if((b|0)==0){return}c[b>>2]=6896;c[b+4>>2]=c[a+4>>2];d=c[a+8>>2]|0;c[b+8>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function iG(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function iH(a){a=a|0;var b=0,d=0,e=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function iI(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=c[b+4>>2]|0;e;if((e|0)!=0){kB(e,596)}e=d+36|0;if((a[e]&1)!=0){f;if((f|0)==0){return}bJ(1348,1196,46,1980)}a[e]=1;e=d|0;f=c[e>>2]|0;b=d+4|0;g=c[b>>2]|0;c[d+8>>2]=0;c[b>>2]=0;c[e>>2]=0;h;if((h|0)!=0){bJ(1348,1196,46,1980)}h=(f|0)==(g|0);if(!h){e=f;do{b=c[e>>2]|0;d=b+16|0;i=c[d>>2]|0;if((i|0)!=0){b0[c[(c[i>>2]|0)+24>>2]&1023](i);i=c[d>>2]|0;do{if((i|0)==(b|0)){b0[c[(c[i>>2]|0)+16>>2]&1023](i)}else{if((i|0)==0){break}b0[c[(c[i>>2]|0)+20>>2]&1023](i)}}while(0);c[d>>2]=0}e=e+8|0;}while((e|0)!=(g|0))}if((f|0)==0){return}if(!h){h=g;while(1){g=h-8|0;e=c[h-8+4>>2]|0;do{if((e|0)!=0){i=e+4|0;if(((I=c[i>>2]|0,c[i>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[e>>2]|0)+8>>2]&1023](e|0);i=e+8|0;if(((I=c[i>>2]|0,c[i>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[e>>2]|0)+16>>2]&1023](e)}}while(0);if((f|0)==(g|0)){break}else{h=g}}}qI(f);return}function iJ(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=9188){d=0;return d|0}d=a+4|0;return d|0}function iK(a){a=a|0;return 23976}function iL(a){a=a|0;var b=0,d=0;c[a>>2]=7664;b=c[a+16>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function iM(a){a=a|0;var b=0,d=0;c[a>>2]=7664;b=c[a+16>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function iN(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;while(1){b=qH(24)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=7664;c[b+4>>2]=c[a+4>>2];e=c[a+8>>2]|0;c[b+8>>2]=e;if((e|0)!=0){d=e+4|0;I=c[d>>2]|0,c[d>>2]=I+1,I}c[b+12>>2]=c[a+12>>2];d=c[a+16>>2]|0;c[b+16>>2]=d;if((d|0)==0){f=b+20|0;g=f;h=a+20|0;i=c[h>>2]|0;c[g>>2]=i;j=b;return j|0}e=d+4|0;I=c[e>>2]|0,c[e>>2]=I+1,I;f=b+20|0;g=f;h=a+20|0;i=c[h>>2]|0;c[g>>2]=i;j=b;return j|0}function iO(a,b){a=a|0;b=b|0;var d=0,e=0;if((b|0)==0){return}c[b>>2]=7664;c[b+4>>2]=c[a+4>>2];d=c[a+8>>2]|0;c[b+8>>2]=d;if((d|0)!=0){e=d+4|0;I=c[e>>2]|0,c[e>>2]=I+1,I}c[b+12>>2]=c[a+12>>2];e=c[a+16>>2]|0;c[b+16>>2]=e;if((e|0)!=0){d=e+4|0;I=c[d>>2]|0,c[d>>2]=I+1,I}c[b+20>>2]=c[a+20>>2];return}function iP(a){a=a|0;var b=0,d=0;b=c[a+16>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function iQ(a){a=a|0;var b=0,d=0;b=c[a+16>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function iR(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;i=i+56|0;g=f|0;h=f+24|0;j=f+32|0;k=e|0;l=c[k>>2]|0;m=e+4|0;e=c[m>>2]|0;c[k>>2]=0;c[m>>2]=0;m=(e|0)==0;if(!m){k=e+4|0;I=c[k>>2]|0,c[k>>2]=I+1,I}k=d+4|0;n=c[k>>2]|0;o=c[d+8>>2]|0;if((o|0)!=0){p=o+4|0;I=c[p>>2]|0,c[p>>2]=I+1,I}p=d+12|0;q=c[p>>2]|0;r=c[d+16>>2]|0;if((r|0)!=0){s=r+4|0;I=c[s>>2]|0,c[s>>2]=I+1,I}s=d+20|0;d=c[s>>2]|0;t=j+16|0;c[t>>2]=0;while(1){u=qH(24)|0;if((u|0)!=0){break}v=(I=c[7664]|0,c[7664]=I+0,I);if((v|0)==0){w=16;break}b8[v&1]()}if((w|0)==16){v=bR(4)|0;c[v>>2]=3284;bl(v|0,24120,94)}c[u>>2]=7664;c[u+4>>2]=n;c[u+8>>2]=o;c[u+12>>2]=q;c[u+16>>2]=r;c[u+20>>2]=d;c[t>>2]=u;u=c[k>>2]|0;do{if((a[u|0]&1)==0){d=c[p>>2]|0;if((c[u+8>>2]|0)==0){b0[c[(c[d>>2]|0)+4>>2]&1023](d);c[b+16>>2]=0;break}b1[c[c[d>>2]>>2]&255](d,u+4|0);d=(c[k>>2]|0)+8|0;c[d>>2]=(c[d>>2]|0)-1;d=(c[k>>2]|0)+4|0;c[d>>2]=(c[d>>2]|0)+(c[s>>2]|0);d=c[(c[l>>2]|0)+12>>2]|0;r=h|0;while(1){x=qH(48)|0;if((x|0)!=0){break}q=(I=c[7664]|0,c[7664]=I+0,I);if((q|0)==0){w=33;break}b8[q&1]()}if((w|0)==33){q=bR(4)|0;c[q>>2]=3284;bl(q|0,24120,94)}c[x+4>>2]=0;c[x+8>>2]=0;c[x>>2]=4880;c[x+32>>2]=0;q=h|0;o=h+4|0;c[q>>2]=x+16;c[o>>2]=x;n=c[t>>2]|0;do{if((n|0)==0){c[g+16>>2]=0}else{v=j;if((n|0)==(v|0)){y=g;c[g+16>>2]=y;b1[c[(c[j>>2]|0)+12>>2]&255](v,y);break}else{c[g+16>>2]=n;c[t>>2]=0;break}}}while(0);dC(r,g);n=c[g+16>>2]|0;do{if((n|0)==(g|0)){b0[c[(c[n>>2]|0)+16>>2]&1023](n)}else{if((n|0)==0){break}b0[c[(c[n>>2]|0)+20>>2]&1023](n)}}while(0);a[(c[q>>2]|0)+24|0]=0;cf[d&63](b,l,h);n=c[o>>2]|0;if((n|0)==0){break}r=n+4|0;if(((I=c[r>>2]|0,c[r>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[n>>2]|0)+8>>2]&1023](n|0);r=n+8|0;if(((I=c[r>>2]|0,c[r>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[n>>2]|0)+16>>2]&1023](n)}else{c[b+16>>2]=0}}while(0);b=c[t>>2]|0;t=j;do{if((b|0)==(t|0)){b0[c[(c[j>>2]|0)+16>>2]&1023](t)}else{if((b|0)==0){break}b0[c[(c[b>>2]|0)+20>>2]&1023](b)}}while(0);if(m){i=f;return}b=e+4|0;do{if(((I=c[b>>2]|0,c[b>>2]=I+ -1,I)|0)==0){b0[c[(c[e>>2]|0)+8>>2]&1023](e|0);t=e+8|0;if(((I=c[t>>2]|0,c[t>>2]=I+ -1,I)|0)==0){b0[c[(c[e>>2]|0)+16>>2]&1023](e)}if(!m){break}i=f;return}}while(0);m=e+4|0;if(((I=c[m>>2]|0,c[m>>2]=I+ -1,I)|0)!=0){i=f;return}b0[c[(c[e>>2]|0)+8>>2]&1023](e|0);m=e+8|0;if(((I=c[m>>2]|0,c[m>>2]=I+ -1,I)|0)!=0){i=f;return}b0[c[(c[e>>2]|0)+16>>2]&1023](e);i=f;return}function iS(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=23528){d=0;return d|0}d=a+4|0;return d|0}function iT(a){a=a|0;return 26712}function iU(a){a=a|0;var b=0;c[a>>2]=6608;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function iV(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=6608;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function iW(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(12)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=6608;c[b+4>>2]=c[a+4>>2];e=c[a+8>>2]|0;c[b+8>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function iX(a,b){a=a|0;b=b|0;var d=0;if((b|0)==0){return}c[b>>2]=6608;c[b+4>>2]=c[a+4>>2];d=c[a+8>>2]|0;c[b+8>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function iY(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function iZ(a){a=a|0;var b=0,d=0,e=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function i_(b){b=b|0;a[c[b+4>>2]|0]=1;return}function i$(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=8696){d=0;return d|0}d=a+4|0;return d|0}function i0(a){a=a|0;return 23928}function i1(a){a=a|0;var b=0;c[a>>2]=5392;b=c[a+32>>2]|0;if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}if((b|0)==0){return}b0[c[(c[b>>2]|0)+20>>2]&1023](b);return}function i2(a){a=a|0;var b=0;c[a>>2]=5392;b=c[a+32>>2]|0;do{if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b)}else{if((b|0)!=0){b0[c[(c[b>>2]|0)+20>>2]&1023](b)}if((a|0)!=0){break}return}}while(0);qI(a);return}function i3(a){a=a|0;var b=0;b=c[a+32>>2]|0;if((b|0)==(a+16|0)){b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}if((b|0)==0){return}b0[c[(c[b>>2]|0)+20>>2]&1023](b);return}function i4(a){a=a|0;if((a|0)==0){return}qI(a);return}function i5(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;c[a>>2]=5232;b;b=a+12|0;d=c[b>>2]|0;if((d|0)==0){return}e=a+16|0;a=c[e>>2]|0;do{if((d|0)==(a|0)){f=d}else{g=a;while(1){h=g-8|0;c[e>>2]=h;i=c[g-8+4>>2]|0;if((i|0)==0){j=h}else{h=i+4|0;do{if(((I=c[h>>2]|0,c[h>>2]=I+ -1,I)|0)==0){b0[c[(c[i>>2]|0)+8>>2]&1023](i|0);k=i+8|0;if(((I=c[k>>2]|0,c[k>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[i>>2]|0)+16>>2]&1023](i)}}while(0);j=c[e>>2]|0}if((d|0)==(j|0)){break}else{g=j}}g=c[b>>2]|0;if((g|0)!=0){f=g;break}return}}while(0);qI(f);return}function i6(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;c[a>>2]=5232;b;b=a+12|0;d=c[b>>2]|0;do{if((d|0)!=0){e=a+16|0;f=c[e>>2]|0;if((d|0)==(f|0)){g=d}else{h=f;while(1){f=h-8|0;c[e>>2]=f;i=c[h-8+4>>2]|0;if((i|0)==0){j=f}else{f=i+4|0;do{if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)==0){b0[c[(c[i>>2]|0)+8>>2]&1023](i|0);k=i+8|0;if(((I=c[k>>2]|0,c[k>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[i>>2]|0)+16>>2]&1023](i)}}while(0);j=c[e>>2]|0}if((d|0)==(j|0)){break}else{h=j}}h=c[b>>2]|0;if((h|0)==0){break}else{g=h}}qI(g)}}while(0);if((a|0)==0){return}qI(a);return}function i7(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;b;b=a+12|0;d=c[b>>2]|0;if((d|0)==0){return}e=a+16|0;a=c[e>>2]|0;do{if((d|0)==(a|0)){f=d}else{g=a;while(1){h=g-8|0;c[e>>2]=h;i=c[g-8+4>>2]|0;if((i|0)==0){j=h}else{h=i+4|0;do{if(((I=c[h>>2]|0,c[h>>2]=I+ -1,I)|0)==0){b0[c[(c[i>>2]|0)+8>>2]&1023](i|0);k=i+8|0;if(((I=c[k>>2]|0,c[k>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[i>>2]|0)+16>>2]&1023](i)}}while(0);j=c[e>>2]|0}if((d|0)==(j|0)){break}else{g=j}}g=c[b>>2]|0;if((g|0)!=0){f=g;break}return}}while(0);qI(f);return}function i8(a){a=a|0;if((a|0)==0){return}qI(a);return}function i9(a){a=a|0;if((a|0)==0){return}qI(a);return}function ja(a){a=a|0;return}function jb(a){a=a|0;if((a|0)==0){return}qI(a);return}function jc(a){a=a|0;return}function jd(a){a=a|0;var b=0;c[a>>2]=6848;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function je(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=6848;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function jf(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(12)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=6848;c[b+4>>2]=c[a+4>>2];e=c[a+8>>2]|0;c[b+8>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function jg(a,b){a=a|0;b=b|0;var d=0;if((b|0)==0){return}c[b>>2]=6848;c[b+4>>2]=c[a+4>>2];d=c[a+8>>2]|0;c[b+8>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function jh(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function ji(a){a=a|0;var b=0,d=0,e=0;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function jj(b){b=b|0;var d=0;d=c[b+4>>2]|0;a[d+20|0]=1;dh(c[d+24>>2]|0);return}function jk(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=9120){d=0;return d|0}d=a+4|0;return d|0}function jl(a){a=a|0;return 23968}function jm(a){a=a|0;var b=0;c[a>>2]=7616;b=c[a+12>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function jn(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=7616;b=c[a+12>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function jo(a){a=a|0;var b=0,d=0,e=0,f=0;while(1){b=qH(16)|0;if((b|0)!=0){break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){e=9;break}b8[d&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}c[b>>2]=7616;c[b+4>>2]=c[a+4>>2];c[b+8>>2]=c[a+8>>2];e=c[a+12>>2]|0;c[b+12>>2]=e;if((e|0)==0){f=b;return f|0}a=e+4|0;I=c[a>>2]|0,c[a>>2]=I+1,I;f=b;return f|0}function jp(a,b){a=a|0;b=b|0;var d=0;if((b|0)==0){return}c[b>>2]=7616;c[b+4>>2]=c[a+4>>2];c[b+8>>2]=c[a+8>>2];d=c[a+12>>2]|0;c[b+12>>2]=d;if((d|0)==0){return}b=d+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function jq(a){a=a|0;var b=0;b=c[a+12>>2]|0;if((b|0)==0){return}a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function jr(a){a=a|0;var b=0,d=0,e=0;b=c[a+12>>2]|0;do{if((b|0)!=0){d=b+4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=b+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)!=0){break}return}}while(0);qI(a);return}function js(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+32|0;f=e|0;g=e+24|0;h=d+4|0;j=c[h>>2]|0;c[d>>2]=0;c[h>>2]=0;h=c[b+8>>2]|0;d=(c[b+4>>2]|0)+4|0;c[g>>2]=h;k=g+4|0;l=c[b+12>>2]|0;c[k>>2]=l;if((l|0)!=0){b=l+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I}iA(f,d,g);c7(c[h+24>>2]|0,f);h=c[f+16>>2]|0;do{if((h|0)==(f|0)){b0[c[(c[h>>2]|0)+16>>2]&1023](h)}else{if((h|0)==0){break}b0[c[(c[h>>2]|0)+20>>2]&1023](h)}}while(0);h=c[k>>2]|0;do{if((h|0)!=0){k=h+4|0;if(((I=c[k>>2]|0,c[k>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[h>>2]|0)+8>>2]&1023](h|0);k=h+8|0;if(((I=c[k>>2]|0,c[k>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[h>>2]|0)+16>>2]&1023](h)}}while(0);c[a+16>>2]=0;if((j|0)==0){i=e;return}a=j+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){i=e;return}b0[c[(c[j>>2]|0)+8>>2]&1023](j|0);a=j+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){i=e;return}b0[c[(c[j>>2]|0)+16>>2]&1023](j);i=e;return}function jt(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=11080){d=0;return d|0}d=a+4|0;return d|0}function ju(a){a=a|0;return 24096}function jv(a){a=a|0;c[a>>2]=5136;jA(a+12|0);return}function jw(a){a=a|0;c[a>>2]=5136;jA(a+12|0);if((a|0)==0){return}qI(a);return}function jx(a){a=a|0;var b=0;b=a+12|0;b0[c[(c[b>>2]|0)+12>>2]&1023](b);return}function jy(a){a=a|0;if((a|0)==0){return}qI(a);return}function jz(a){a=a|0;jA(a);return}function jA(b){b=b|0;var d=0,e=0;c[b>>2]=7984;if((a[b+20|0]&1)==0){bL()}d=c[b+28>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=c[b+16>>2]|0;do{if((d|0)!=0){e=d+4|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);e=d+8|0;if(((I=c[e>>2]|0,c[e>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[d>>2]|0)+16>>2]&1023](d)}}while(0);d=c[b+8>>2]|0;if((d|0)==0){return}b=d+8|0;if(((I=c[b>>2]|0,c[b>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[d>>2]|0)+16>>2]&1023](d);return}function jB(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;if((a[b+20|0]&1)!=0){return}e=c[b+8>>2]|0;if((e|0)==0){f=bR(4)|0;g=f;c[g>>2]=5928;bl(f|0,25656,646)}h=e+4|0;do{i=c[h>>2]|0;if((i|0)==-1){j=26;break}}while(((I=c[h>>2]|0,(c[h>>2]|0)==(i|0)?(c[h>>2]=i+1)|0:0,I)|0)!=(i|0));if((j|0)==26){f=bR(4)|0;g=f;c[g>>2]=5928;bl(f|0,25656,646)}f=c[b+12>>2]|0;b1[c[c[f>>2]>>2]&255](f,d);if(((I=c[h>>2]|0,c[h>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[e>>2]|0)+8>>2]&1023](e|0);h=e+8|0;if(((I=c[h>>2]|0,c[h>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[e>>2]|0)+16>>2]&1023](e);return}function jC(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=a+20|0;if(((I=c[b>>2]|0,c[b>>2]=1,I)&1)!=0){return}b=c[a+8>>2]|0;if((b|0)==0){d=bR(4)|0;e=d;c[e>>2]=5928;bl(d|0,25656,646)}f=b+4|0;do{g=c[f>>2]|0;if((g|0)==-1){h=32;break}}while(((I=c[f>>2]|0,(c[f>>2]|0)==(g|0)?(c[f>>2]=g+1)|0:0,I)|0)!=(g|0));if((h|0)==32){d=bR(4)|0;e=d;c[e>>2]=5928;bl(d|0,25656,646)}d=c[a+12>>2]|0;b0[c[(c[d>>2]|0)+4>>2]&1023](d);dh(c[a+24>>2]|0);if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);f=b+8|0;if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function jD(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=a+20|0;if(((I=c[d>>2]|0,c[d>>2]=1,I)&1)!=0){return}d=c[a+8>>2]|0;if((d|0)==0){e=bR(4)|0;f=e;c[f>>2]=5928;bl(e|0,25656,646)}g=d+4|0;do{h=c[g>>2]|0;if((h|0)==-1){i=29;break}}while(((I=c[g>>2]|0,(c[g>>2]|0)==(h|0)?(c[g>>2]=h+1)|0:0,I)|0)!=(h|0));if((i|0)==29){e=bR(4)|0;f=e;c[f>>2]=5928;bl(e|0,25656,646)}e=c[a+12>>2]|0;b1[c[(c[e>>2]|0)+8>>2]&255](e,b);dh(c[a+24>>2]|0);if(((I=c[g>>2]|0,c[g>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[d>>2]|0)+8>>2]&1023](d|0);g=d+8|0;if(((I=c[g>>2]|0,c[g>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[d>>2]|0)+16>>2]&1023](d);return}function jE(a){a=a|0;jA(a);if((a|0)==0){return}qI(a);return}function jF(a){a=a|0;var b=0;c[a>>2]=5264;c[a+12>>2]=8088;b;b=c[a+20>>2]|0;if((b|0)==0){return}a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function jG(a){a=a|0;var b=0,d=0;c[a>>2]=5264;c[a+12>>2]=8088;b;b=c[a+20>>2]|0;do{if((b|0)!=0){d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function jH(a){a=a|0;var b=0;b=a+12|0;b0[c[c[b>>2]>>2]&1023](b);return}function jI(a){a=a|0;if((a|0)==0){return}qI(a);return}function jJ(a){a=a|0;var b=0;c[a>>2]=8088;b;b=c[a+8>>2]|0;if((b|0)==0){return}a=b+8|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+16>>2]&1023](b);return}function jK(a){a=a|0;var b=0,d=0;c[a>>2]=8088;b;b=c[a+8>>2]|0;do{if((b|0)!=0){d=b+8|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[b>>2]|0)+16>>2]&1023](b)}}while(0);if((a|0)==0){return}qI(a);return}function jL(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0;g=i;i=i+80|0;h=e;e=i;i=i+8|0;c[e>>2]=c[h>>2];c[e+4>>2]=c[h+4>>2];h=g|0;j=g+8|0;k=g+32|0;l=g+40|0;m=g+56|0;n=e|0;e=c[n>>2]|0;o=c[n+4>>2]|0;n=f|0;p=c[n>>2]|0;q=f+4|0;f=c[q>>2]|0;c[n>>2]=0;c[q>>2]=0;q=l|0;c[q>>2]=e;c[q+4>>2]=o;n=l+8|0;c[n>>2]=p;r=l+12|0;c[r>>2]=f;s;if((s|0)!=0){kB(s,596)}L6:do{if((a[d+36|0]&1)==0){s=d+40|0;if((c[s>>2]|0)!=0){t;if((t|0)==0){u=154;break}bJ(1348,1196,46,1980)}v=d+37|0;if((a[v]&1)!=0){w;if((w|0)==0){u=154;break}bJ(1348,1196,46,1980)}x=c[d+4>>2]|0;y=c[d+8>>2]|0;L20:do{if((y|0)!=0){z=y+4|0;do{A=c[z>>2]|0;if((A|0)==-1){break L20}}while(((I=c[z>>2]|0,(c[z>>2]|0)==(A|0)?(c[z>>2]=A+1)|0:0,I)|0)!=(A|0));while(1){B=qH(24)|0;if((B|0)!=0){break}z=(I=c[7664]|0,c[7664]=I+0,I);if((z|0)==0){u=22;break}b8[z&1]()}if((u|0)==22){z=bR(4)|0;c[z>>2]=3284;bl(z|0,24120,94)}qP(B|0,0,24)|0;qP(B|0,0,20)|0;c[B>>2]=x;c[B+4>>2]=y;c[s>>2]=B;z=a[v]|0;a[v]=1;A=(z&1)==0;C;if((C|0)!=0){bJ(1348,1196,46,1980)}if(!A){u=154;break L6}A=k|0;z=l+8|0;D=m+16|0;E=m;F=h|0;G=h+4|0;H=m;J=o;L=e;while(1){kR(k);M=qU(L,J,c[A>>2]|0,c[A+4>>2]|0)|0;N=K;O=0;if((N|0)>(O|0)|(N|0)==(O|0)&M>>>0>0>>>0){O=q$(M,N,1e9,0)|0;P=499999999;if((N|0)<(P|0)|(N|0)==(P|0)&M>>>0<-1e9>>>0){c[F>>2]=O;P=q1(O,K,-1e9,-1)|0;O=qT(P,K,M,N)|0;Q=O}else{c[F>>2]=2147483647;Q=999999999}c[G>>2]=Q;bs(h|0,0)|0}O=c[s>>2]|0;d8(m,z,c[O>>2]|0,c[O+4>>2]|0);O=c[D>>2]|0;do{if((O|0)==(E|0)){b0[c[(c[H>>2]|0)+16>>2]&1023](E)}else{if((O|0)==0){break}b0[c[(c[O>>2]|0)+20>>2]&1023](O)}}while(0);R;if((R|0)!=0){u=49;break}O=c[s>>2]|0;N=c[O+8>>2]|0;if((N|0)==(c[O+12>>2]|0)){u=121;break}O=N|0;M=c[O>>2]|0;P=c[O+4>>2]|0;c[q>>2]=M;c[q+4>>2]=P;O=c[N+8>>2]|0;S=c[N+12>>2]|0;if((S|0)!=0){N=S+4|0;I=c[N>>2]|0,c[N>>2]=I+1,I}c[n>>2]=O;O=c[r>>2]|0;c[r>>2]=S;do{if((O|0)!=0){S=O+4|0;if(((I=c[S>>2]|0,c[S>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[O>>2]|0)+8>>2]&1023](O|0);S=O+8|0;if(((I=c[S>>2]|0,c[S>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[O>>2]|0)+16>>2]&1023](O)}}while(0);O=c[s>>2]|0;S=c[O+8>>2]|0;N=O+12|0;O=c[N>>2]|0;T=O-S|0;if((T|0)>16){U=T>>4;T=S|0;V=c[T>>2]|0;W=c[T+4>>2]|0;X=S+8|0;Y=c[X>>2]|0;Z=S+12|0;_=c[Z>>2]|0;c[X>>2]=0;c[Z>>2]=0;$=O-16|0;aa=c[$+4>>2]|0;c[T>>2]=c[$>>2];c[T+4>>2]=aa;aa=O-16+8|0;T=c[aa>>2]|0;ab=O-16+12|0;ac=c[ab>>2]|0;c[aa>>2]=0;c[ab>>2]=0;c[X>>2]=T;T=c[Z>>2]|0;c[Z>>2]=ac;do{if((T|0)!=0){ac=T+4|0;if(((I=c[ac>>2]|0,c[ac>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[T>>2]|0)+8>>2]&1023](T|0);ac=T+8|0;if(((I=c[ac>>2]|0,c[ac>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[T>>2]|0)+16>>2]&1023](T)}}while(0);c[$>>2]=V;c[$+4>>2]=W;c[aa>>2]=Y;T=c[ab>>2]|0;c[ab>>2]=_;do{if((T|0)!=0){ac=T+4|0;if(((I=c[ac>>2]|0,c[ac>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[T>>2]|0)+8>>2]&1023](T|0);ac=T+8|0;if(((I=c[ac>>2]|0,c[ac>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[T>>2]|0)+16>>2]&1023](T)}}while(0);ea(S,U-1|0);ad=c[N>>2]|0}else{ad=O}T=ad-16|0;_=ad;while(1){ab=_-16|0;c[N>>2]=ab;Y=c[_-16+12>>2]|0;if((Y|0)==0){ae=ab}else{ab=Y+4|0;do{if(((I=c[ab>>2]|0,c[ab>>2]=I+ -1,I)|0)==0){b0[c[(c[Y>>2]|0)+8>>2]&1023](Y|0);aa=Y+8|0;if(((I=c[aa>>2]|0,c[aa>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[Y>>2]|0)+16>>2]&1023](Y)}}while(0);ae=c[N>>2]|0}if((T|0)==(ae|0)){break}else{_=ae}}af;if((af|0)==0){J=P;L=M}else{u=110;break}}if((u|0)==110){bJ(1348,1196,46,1980)}else if((u|0)==121){ag;if((ag|0)==0){c[b+16>>2]=0;jM(d);ah=c[r>>2]|0;break L6}else{bJ(1348,1196,46,1980)}}else if((u|0)==49){kB(R,596)}}}while(0);s=bR(4)|0;c[s>>2]=5928;bl(s|0,25656,646)}else{ai;if((ai|0)==0){u=154;break}bJ(1348,1196,46,1980)}}while(0);do{if((u|0)==154){aj;if((aj|0)!=0){kB(aj,596)}ai=c[d+40>>2]|0;R=ai+8|0;ag=ai+12|0;af=c[ag>>2]|0;ae=ai+16|0;if((af|0)==(c[ae>>2]|0)){ai=R|0;ad=c[ai>>2]|0;m=af-ad|0;h=m>>4;Q=h+1|0;if(Q>>>0>268435455>>>0){oG()}if(h>>>0>134217726>>>0){ak=268435455;u=168}else{k=m>>3;m=k>>>0<Q>>>0?Q:k;if((m|0)==0){al=0;am=0}else{ak=m;u=168}}do{if((u|0)==168){m=ak<<4;k=(m|0)==0?1:m;while(1){an=qH(k)|0;if((an|0)!=0){u=179;break}m=(I=c[7664]|0,c[7664]=I+0,I);if((m|0)==0){break}b8[m&1]()}if((u|0)==179){al=an;am=ak;break}k=bR(4)|0;c[k>>2]=3284;bl(k|0,24120,94)}}while(0);k=al+(h<<4)|0;m=al+(am<<4)|0;do{if((k|0)==0){ao=ad;ap=af}else{l=c[q+4>>2]|0;C=k|0;c[C>>2]=c[q>>2];c[C+4>>2]=l;c[al+(h<<4)+8>>2]=c[n>>2];l=c[r>>2]|0;c[al+(h<<4)+12>>2]=l;if((l|0)==0){ao=ad;ap=af;break}C=l+4|0;I=c[C>>2]|0,c[C>>2]=I+1,I;ao=c[ai>>2]|0;ap=c[ag>>2]|0}}while(0);ad=al+(Q<<4)|0;do{if((ap|0)==(ao|0)){c[ai>>2]=k;c[ag>>2]=ad;c[ae>>2]=m;aq=ap}else{C=(ap-16+(-ao|0)|0)>>>4;l=ap;B=k;while(1){w=B-16|0;t=l-16|0;if((w|0)!=0){s=t|0;v=c[s+4>>2]|0;y=w|0;c[y>>2]=c[s>>2];c[y+4>>2]=v;v=l-16+8|0;c[B-16+8>>2]=c[v>>2];y=l-16+12|0;c[B-16+12>>2]=c[y>>2];c[v>>2]=0;c[y>>2]=0}if((t|0)==(ao|0)){break}else{l=t;B=w}}B=c[ai>>2]|0;l=c[ag>>2]|0;c[ai>>2]=al+(h-1-C<<4);c[ag>>2]=ad;c[ae>>2]=m;if((B|0)==(l|0)){aq=B;break}else{ar=l}while(1){l=ar-16|0;w=c[ar-16+12>>2]|0;do{if((w|0)!=0){t=w+4|0;if(((I=c[t>>2]|0,c[t>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[w>>2]|0)+8>>2]&1023](w|0);t=w+8|0;if(((I=c[t>>2]|0,c[t>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[w>>2]|0)+16>>2]&1023](w)}}while(0);if((B|0)==(l|0)){aq=B;break}else{ar=l}}}}while(0);if((aq|0)!=0){qI(aq)}as=c[ag>>2]|0;at=ai}else{do{if((af|0)!=0){m=af|0;c[m>>2]=e;c[m+4>>2]=o;c[af+8>>2]=p;c[af+12>>2]=f;if((f|0)==0){break}m=f+4|0;I=c[m>>2]|0,c[m>>2]=I+1,I}}while(0);af=(c[ag>>2]|0)+16|0;c[ag>>2]=af;as=af;at=R|0}af=c[at>>2]|0;ai=as-af|0;do{if((ai|0)>16){m=((ai>>4)-2|0)/2|0;ae=af+(m<<4)|0;ad=as-16|0;h=ad|0;k=c[h>>2]|0;Q=c[h+4>>2]|0;h=ae|0;B=c[h+4>>2]|0;if(!((Q|0)<(B|0)|(Q|0)==(B|0)&k>>>0<(c[h>>2]|0)>>>0)){break}B=as-16+8|0;C=c[B>>2]|0;w=as-16+12|0;M=c[w>>2]|0;c[B>>2]=0;c[w>>2]=0;w=m;m=ae;ae=ad;ad=c[h+4>>2]|0;B=c[h>>2]|0;while(1){h=ae|0;c[h>>2]=B;c[h+4>>2]=ad;au=m+8|0;h=c[au>>2]|0;av=m+12|0;P=c[av>>2]|0;c[au>>2]=0;c[av>>2]=0;c[ae+8>>2]=h;h=ae+12|0;t=c[h>>2]|0;c[h>>2]=P;do{if((t|0)!=0){P=t+4|0;if(((I=c[P>>2]|0,c[P>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[t>>2]|0)+8>>2]&1023](t|0);P=t+8|0;if(((I=c[P>>2]|0,c[P>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[t>>2]|0)+16>>2]&1023](t)}}while(0);if((w|0)==0){break}t=(w-1|0)/2|0;l=af+(t<<4)|0;P=l|0;h=c[P>>2]|0;y=c[P+4>>2]|0;if((Q|0)<(y|0)|(Q|0)==(y|0)&k>>>0<h>>>0){w=t;ae=m;m=l;ad=y;B=h}else{break}}B=m|0;c[B>>2]=k;c[B+4>>2]=Q;c[au>>2]=C;B=c[av>>2]|0;c[av>>2]=M;if((B|0)==0){break}ad=B+4|0;if(((I=c[ad>>2]|0,c[ad>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[B>>2]|0)+8>>2]&1023](B|0);ad=B+8|0;if(((I=c[ad>>2]|0,c[ad>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[B>>2]|0)+16>>2]&1023](B)}}while(0);af=c[n>>2]|0;ai=c[r>>2]|0;R=(ai|0)==0;if(!R){ag=ai+4|0;I=c[ag>>2]|0,c[ag>>2]=I+1,I;I=c[ag>>2]|0,c[ag>>2]=I+1,I}ag=j+16|0;B=j;c[ag>>2]=B;c[j>>2]=6656;c[j+4>>2]=af;c[j+8>>2]=ai;c[b+16>>2]=b;do{if((b|0)==0){aw=6656;u=217}else{c[b>>2]=6656;c[b+4>>2]=af;c[b+8>>2]=ai;if(R){aw=6656;u=217;break}ad=ai+4|0;I=c[ad>>2]|0,c[ad>>2]=I+1,I;ad=c[ag>>2]|0;if((ad|0)==(B|0)){aw=c[j>>2]|0;u=217;break}if((ad|0)==0){break}b0[c[(c[ad>>2]|0)+20>>2]&1023](ad)}}while(0);if((u|0)==217){b0[c[aw+16>>2]&1023](B)}c[ag>>2]=0;do{if(!R){af=ai+4|0;if(((I=c[af>>2]|0,c[af>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[ai>>2]|0)+8>>2]&1023](ai|0);af=ai+8|0;if(((I=c[af>>2]|0,c[af>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[ai>>2]|0)+16>>2]&1023](ai)}}while(0);ax;if((ax|0)==0){ah=ai;break}bJ(1348,1196,46,1980)}}while(0);if((ah|0)==0){i=g;return}ax=ah+4|0;if(((I=c[ax>>2]|0,c[ax>>2]=I+ -1,I)|0)!=0){i=g;return}b0[c[(c[ah>>2]|0)+8>>2]&1023](ah|0);ax=ah+8|0;if(((I=c[ax>>2]|0,c[ax>>2]=I+ -1,I)|0)!=0){i=g;return}b0[c[(c[ah>>2]|0)+16>>2]&1023](ah);i=g;return}function jM(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;d;if((d|0)!=0){kB(d,596)}d=b+40|0;e=c[d>>2]|0;if((e|0)!=0){f=e+8|0;g=c[f>>2]|0;do{if((g|0)!=0){h=e+12|0;i=c[h>>2]|0;if((g|0)==(i|0)){j=g}else{k=i;while(1){i=k-16|0;c[h>>2]=i;l=c[k-16+12>>2]|0;if((l|0)==0){m=i}else{i=l+4|0;do{if(((I=c[i>>2]|0,c[i>>2]=I+ -1,I)|0)==0){b0[c[(c[l>>2]|0)+8>>2]&1023](l|0);n=l+8|0;if(((I=c[n>>2]|0,c[n>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[l>>2]|0)+16>>2]&1023](l)}}while(0);m=c[h>>2]|0}if((g|0)==(m|0)){break}else{k=m}}k=c[f>>2]|0;if((k|0)==0){break}else{j=k}}qI(j)}}while(0);j=c[e+4>>2]|0;do{if((j|0)!=0){f=j+4|0;if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[j>>2]|0)+8>>2]&1023](j|0);f=j+8|0;if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)!=0){break}b0[c[(c[j>>2]|0)+16>>2]&1023](j)}}while(0);qI(e)}c[d>>2]=0;a[b+37|0]=0;o;if((o|0)==0){return}bJ(1348,1196,46,1980)}function jN(a){a=a|0;lq(30276);lq(30360);lv(29920);lv(30004);return}function jO(a){a=a|0;var b=0;c[a>>2]=5592;b=c[a+4>>2]|0;a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);return}function jP(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5592;b=c[a+4>>2]|0;d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){e=a;qI(e);return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=a;qI(e);return}function jQ(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+12|0;f=e|0;b5[c[(c[b>>2]|0)+24>>2]&511](b)|0;g=c[d>>2]|0;if((c[7471]|0)!=-1){c[f>>2]=29884;c[f+4>>2]=48;c[f+8>>2]=0;kE(29884,f)}f=(c[7472]|0)-1|0;d=c[g+8>>2]|0;if((c[g+12>>2]|0)-d>>2>>>0<=f>>>0){h=bR(4)|0;j=h;c[j>>2]=3308;bl(h|0,24132,322)}g=c[d+(f<<2)>>2]|0;if((g|0)==0){h=bR(4)|0;j=h;c[j>>2]=3308;bl(h|0,24132,322)}else{h=g;c[b+36>>2]=h;a[b+44|0]=(b5[c[(c[g>>2]|0)+28>>2]&511](h)|0)&1;i=e;return}}function jR(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;i=i+12|0;d=b|0;e=b+8|0;f=a+36|0;g=a+40|0;h=d|0;j=d+8|0;k=d;d=a+32|0;while(1){a=c[f>>2]|0;l=ce[c[(c[a>>2]|0)+20>>2]&31](a,c[g>>2]|0,h,j,e)|0;a=(c[e>>2]|0)-k|0;if((aL(h|0,1,a|0,c[d>>2]|0)|0)!=(a|0)){m=-1;n=8;break}if((l|0)==2){m=-1;n=7;break}else if((l|0)!=1){n=4;break}}if((n|0)==4){m=((aJ(c[d>>2]|0)|0)!=0)<<31>>31;i=b;return m|0}else if((n|0)==8){i=b;return m|0}else if((n|0)==7){i=b;return m|0}return 0}function jS(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;if((a[b+44|0]&1)!=0){f=aL(d|0,4,e|0,c[b+32>>2]|0)|0;return f|0}g=b;if((e|0)>0){h=d;i=0}else{f=0;return f|0}while(1){if((b2[c[(c[g>>2]|0)+52>>2]&127](b,c[h>>2]|0)|0)==-1){f=i;j=10;break}d=i+1|0;if((d|0)<(e|0)){h=h+4|0;i=d}else{f=d;j=7;break}}if((j|0)==7){return f|0}else if((j|0)==10){return f|0}return 0}function jT(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+20|0;f=e|0;g=e+8|0;h=e+12|0;j=e+16|0;k=(d|0)==-1;L1:do{if(!k){c[g>>2]=d;if((a[b+44|0]&1)!=0){if((aL(g|0,4,1,c[b+32>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}m=f|0;c[h>>2]=m;n=g+4|0;o=b+36|0;p=b+40|0;q=f+8|0;r=f;s=b+32|0;t=g;while(1){u=c[o>>2]|0;v=b9[c[(c[u>>2]|0)+12>>2]&31](u,c[p>>2]|0,t,n,j,m,q,h)|0;if((c[j>>2]|0)==(t|0)){l=-1;w=16;break}if((v|0)==3){w=7;break}u=(v|0)==1;if(v>>>0>=2>>>0){l=-1;w=18;break}v=(c[h>>2]|0)-r|0;if((aL(m|0,1,v|0,c[s>>2]|0)|0)!=(v|0)){l=-1;w=14;break}if(u){t=u?c[j>>2]|0:t}else{break L1}}if((w|0)==7){if((aL(t|0,1,1,c[s>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}else if((w|0)==14){i=e;return l|0}else if((w|0)==16){i=e;return l|0}else if((w|0)==18){i=e;return l|0}}}while(0);l=k?0:d;i=e;return l|0}function jU(a){a=a|0;var b=0;c[a>>2]=5592;b=c[a+4>>2]|0;a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);return}function jV(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5592;b=c[a+4>>2]|0;d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){e=a;qI(e);return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=a;qI(e);return}function jW(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+12|0;f=e|0;g=c[d>>2]|0;if((c[7471]|0)!=-1){c[f>>2]=29884;c[f+4>>2]=48;c[f+8>>2]=0;kE(29884,f)}f=(c[7472]|0)-1|0;d=c[g+8>>2]|0;if((c[g+12>>2]|0)-d>>2>>>0<=f>>>0){h=bR(4)|0;j=h;c[j>>2]=3308;bl(h|0,24132,322)}g=c[d+(f<<2)>>2]|0;if((g|0)==0){h=bR(4)|0;j=h;c[j>>2]=3308;bl(h|0,24132,322)}h=g;j=b+36|0;c[j>>2]=h;f=b+44|0;c[f>>2]=b5[c[(c[g>>2]|0)+24>>2]&511](h)|0;h=c[j>>2]|0;a[b+53|0]=(b5[c[(c[h>>2]|0)+28>>2]&511](h)|0)&1;if((c[f>>2]|0)>8){oa(180)}else{i=e;return}}function jX(a){a=a|0;return j_(a,0)|0}function jY(a){a=a|0;return j_(a,1)|0}function jZ(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+20|0;f=e|0;g=e+8|0;h=e+12|0;j=e+16|0;k=b+52|0;l=(a[k]&1)!=0;if((d|0)==-1){if(l){m=-1;i=e;return m|0}n=c[b+48>>2]|0;a[k]=(n|0)!=-1|0;m=n;i=e;return m|0}n=b+48|0;L8:do{if(l){c[h>>2]=c[n>>2];o=c[b+36>>2]|0;p=f|0;q=b9[c[(c[o>>2]|0)+12>>2]&31](o,c[b+40>>2]|0,h,h+4|0,j,p,f+8|0,g)|0;if((q|0)==3){a[p]=c[n>>2];c[g>>2]=f+1}else if((q|0)==2|(q|0)==1){m=-1;i=e;return m|0}q=b+32|0;while(1){o=c[g>>2]|0;if(o>>>0<=p>>>0){break L8}r=o-1|0;c[g>>2]=r;if((bG(a[r]|0,c[q>>2]|0)|0)==-1){m=-1;break}}i=e;return m|0}}while(0);c[n>>2]=d;a[k]=1;m=d;i=e;return m|0}function j_(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;e=i;i=i+20|0;f=e|0;g=e+8|0;h=e+12|0;j=e+16|0;k=b+52|0;if((a[k]&1)!=0){l=b+48|0;m=c[l>>2]|0;if(!d){n=m;i=e;return n|0}c[l>>2]=-1;a[k]=0;n=m;i=e;return n|0}m=c[b+44>>2]|0;k=(m|0)>1?m:1;L8:do{if((k|0)>0){m=b+32|0;l=0;while(1){o=a_(c[m>>2]|0)|0;if((o|0)==-1){n=-1;break}a[f+l|0]=o;l=l+1|0;if((l|0)>=(k|0)){break L8}}i=e;return n|0}}while(0);L15:do{if((a[b+53|0]&1)==0){l=b+40|0;m=b+36|0;o=f|0;p=g+4|0;q=b+32|0;r=k;while(1){s=c[l>>2]|0;t=s;u=c[t>>2]|0;v=c[t+4>>2]|0;t=c[m>>2]|0;w=f+r|0;x=b9[c[(c[t>>2]|0)+16>>2]&31](t,s,o,w,h,g,p,j)|0;if((x|0)==3){y=14;break}else if((x|0)==2){n=-1;y=24;break}else if((x|0)!=1){z=r;break L15}x=c[l>>2]|0;c[x>>2]=u;c[x+4>>2]=v;if((r|0)==8){n=-1;y=25;break}v=a_(c[q>>2]|0)|0;if((v|0)==-1){n=-1;y=26;break}a[w]=v;r=r+1|0}if((y|0)==14){c[g>>2]=a[o]|0;z=r;break}else if((y|0)==24){i=e;return n|0}else if((y|0)==25){i=e;return n|0}else if((y|0)==26){i=e;return n|0}}else{c[g>>2]=a[f|0]|0;z=k}}while(0);if(d){d=c[g>>2]|0;c[b+48>>2]=d;n=d;i=e;return n|0}d=b+32|0;b=z;while(1){if((b|0)<=0){break}z=b-1|0;if((bG(a[f+z|0]|0,c[d>>2]|0)|0)==-1){n=-1;y=29;break}else{b=z}}if((y|0)==29){i=e;return n|0}n=c[g>>2]|0;i=e;return n|0}function j$(a){a=a|0;var b=0;c[a>>2]=5660;b=c[a+4>>2]|0;a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);return}function j0(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5660;b=c[a+4>>2]|0;d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){e=a;qI(e);return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=a;qI(e);return}function j1(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+12|0;f=e|0;b5[c[(c[b>>2]|0)+24>>2]&511](b)|0;g=c[d>>2]|0;if((c[7473]|0)!=-1){c[f>>2]=29892;c[f+4>>2]=48;c[f+8>>2]=0;kE(29892,f)}f=(c[7474]|0)-1|0;d=c[g+8>>2]|0;if((c[g+12>>2]|0)-d>>2>>>0<=f>>>0){h=bR(4)|0;j=h;c[j>>2]=3308;bl(h|0,24132,322)}g=c[d+(f<<2)>>2]|0;if((g|0)==0){h=bR(4)|0;j=h;c[j>>2]=3308;bl(h|0,24132,322)}else{h=g;c[b+36>>2]=h;a[b+44|0]=(b5[c[(c[g>>2]|0)+28>>2]&511](h)|0)&1;i=e;return}}function j2(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;i=i+12|0;d=b|0;e=b+8|0;f=a+36|0;g=a+40|0;h=d|0;j=d+8|0;k=d;d=a+32|0;while(1){a=c[f>>2]|0;l=ce[c[(c[a>>2]|0)+20>>2]&31](a,c[g>>2]|0,h,j,e)|0;a=(c[e>>2]|0)-k|0;if((aL(h|0,1,a|0,c[d>>2]|0)|0)!=(a|0)){m=-1;n=6;break}if((l|0)==2){m=-1;n=7;break}else if((l|0)!=1){n=4;break}}if((n|0)==6){i=b;return m|0}else if((n|0)==7){i=b;return m|0}else if((n|0)==4){m=((aJ(c[d>>2]|0)|0)!=0)<<31>>31;i=b;return m|0}return 0}function j3(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;if((a[b+44|0]&1)!=0){g=aL(e|0,1,f|0,c[b+32>>2]|0)|0;return g|0}h=b;if((f|0)>0){i=e;j=0}else{g=0;return g|0}while(1){if((b2[c[(c[h>>2]|0)+52>>2]&127](b,d[i]|0)|0)==-1){g=j;k=9;break}e=j+1|0;if((e|0)<(f|0)){i=i+1|0;j=e}else{g=e;k=10;break}}if((k|0)==9){return g|0}else if((k|0)==10){return g|0}return 0}function j4(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+20|0;f=e|0;g=e+8|0;h=e+12|0;j=e+16|0;k=(d|0)==-1;L1:do{if(!k){a[g]=d;if((a[b+44|0]&1)!=0){if((aL(g|0,1,1,c[b+32>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}m=f|0;c[h>>2]=m;n=g+1|0;o=b+36|0;p=b+40|0;q=f+8|0;r=f;s=b+32|0;t=g;while(1){u=c[o>>2]|0;v=b9[c[(c[u>>2]|0)+12>>2]&31](u,c[p>>2]|0,t,n,j,m,q,h)|0;if((c[j>>2]|0)==(t|0)){l=-1;w=14;break}if((v|0)==3){w=7;break}u=(v|0)==1;if(v>>>0>=2>>>0){l=-1;w=15;break}v=(c[h>>2]|0)-r|0;if((aL(m|0,1,v|0,c[s>>2]|0)|0)!=(v|0)){l=-1;w=18;break}if(u){t=u?c[j>>2]|0:t}else{break L1}}if((w|0)==14){i=e;return l|0}else if((w|0)==15){i=e;return l|0}else if((w|0)==7){if((aL(t|0,1,1,c[s>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}else if((w|0)==18){i=e;return l|0}}}while(0);l=k?0:d;i=e;return l|0}function j5(a){a=a|0;var b=0;c[a>>2]=5660;b=c[a+4>>2]|0;a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);return}function j6(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5660;b=c[a+4>>2]|0;d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){e=a;qI(e);return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=a;qI(e);return}function j7(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+12|0;f=e|0;g=c[d>>2]|0;if((c[7473]|0)!=-1){c[f>>2]=29892;c[f+4>>2]=48;c[f+8>>2]=0;kE(29892,f)}f=(c[7474]|0)-1|0;d=c[g+8>>2]|0;if((c[g+12>>2]|0)-d>>2>>>0<=f>>>0){h=bR(4)|0;j=h;c[j>>2]=3308;bl(h|0,24132,322)}g=c[d+(f<<2)>>2]|0;if((g|0)==0){h=bR(4)|0;j=h;c[j>>2]=3308;bl(h|0,24132,322)}h=g;j=b+36|0;c[j>>2]=h;f=b+44|0;c[f>>2]=b5[c[(c[g>>2]|0)+24>>2]&511](h)|0;h=c[j>>2]|0;a[b+53|0]=(b5[c[(c[h>>2]|0)+28>>2]&511](h)|0)&1;if((c[f>>2]|0)>8){oa(180)}else{i=e;return}}function j8(a){a=a|0;return kb(a,0)|0}function j9(a){a=a|0;return kb(a,1)|0}function ka(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+20|0;f=e|0;g=e+8|0;h=e+12|0;j=e+16|0;k=b+52|0;l=(a[k]&1)!=0;if((d|0)==-1){if(l){m=-1;i=e;return m|0}n=c[b+48>>2]|0;a[k]=(n|0)!=-1|0;m=n;i=e;return m|0}n=b+48|0;L8:do{if(l){a[h]=c[n>>2];o=c[b+36>>2]|0;p=f|0;q=b9[c[(c[o>>2]|0)+12>>2]&31](o,c[b+40>>2]|0,h,h+1|0,j,p,f+8|0,g)|0;if((q|0)==2|(q|0)==1){m=-1;i=e;return m|0}else if((q|0)==3){a[p]=c[n>>2];c[g>>2]=f+1}q=b+32|0;while(1){o=c[g>>2]|0;if(o>>>0<=p>>>0){break L8}r=o-1|0;c[g>>2]=r;if((bG(a[r]|0,c[q>>2]|0)|0)==-1){m=-1;break}}i=e;return m|0}}while(0);c[n>>2]=d;a[k]=1;m=d;i=e;return m|0}function kb(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;f=i;i=i+20|0;g=f|0;h=f+8|0;j=f+12|0;k=f+16|0;l=b+52|0;if((a[l]&1)!=0){m=b+48|0;n=c[m>>2]|0;if(!e){o=n;i=f;return o|0}c[m>>2]=-1;a[l]=0;o=n;i=f;return o|0}n=c[b+44>>2]|0;l=(n|0)>1?n:1;L8:do{if((l|0)>0){n=b+32|0;m=0;while(1){p=a_(c[n>>2]|0)|0;if((p|0)==-1){o=-1;break}a[g+m|0]=p;m=m+1|0;if((m|0)>=(l|0)){break L8}}i=f;return o|0}}while(0);L15:do{if((a[b+53|0]&1)==0){m=b+40|0;n=b+36|0;p=g|0;q=h+1|0;r=b+32|0;s=l;while(1){t=c[m>>2]|0;u=t;v=c[u>>2]|0;w=c[u+4>>2]|0;u=c[n>>2]|0;x=g+s|0;y=b9[c[(c[u>>2]|0)+16>>2]&31](u,t,p,x,j,h,q,k)|0;if((y|0)==3){z=14;break}else if((y|0)==2){o=-1;z=29;break}else if((y|0)!=1){A=s;break L15}y=c[m>>2]|0;c[y>>2]=v;c[y+4>>2]=w;if((s|0)==8){o=-1;z=24;break}w=a_(c[r>>2]|0)|0;if((w|0)==-1){o=-1;z=31;break}a[x]=w;s=s+1|0}if((z|0)==14){a[h]=a[p]|0;A=s;break}else if((z|0)==24){i=f;return o|0}else if((z|0)==29){i=f;return o|0}else if((z|0)==31){i=f;return o|0}}else{a[h]=a[g|0]|0;A=l}}while(0);do{if(e){l=a[h]|0;c[b+48>>2]=l&255;B=l}else{l=b+32|0;k=A;while(1){if((k|0)<=0){z=21;break}j=k-1|0;if((bG(d[g+j|0]|0|0,c[l>>2]|0)|0)==-1){o=-1;z=26;break}else{k=j}}if((z|0)==21){B=a[h]|0;break}else if((z|0)==26){i=f;return o|0}}}while(0);o=B&255;i=f;return o|0}function kc(){var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,p=0,q=0,s=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;b=i;i=i+72|0;d=b|0;e=b+12|0;f=b+24|0;g=b+36|0;h=b+48|0;j=b+60|0;k=c[o>>2]|0;c[7391]=5660;l=c[(oJ()|0)>>2]|0;c[7392]=l;m=l+4|0;I=c[m>>2]|0,c[m>>2]=I+1,I;qP(29572,0,24)|0;c[7391]=6396;c[7399]=k;c[7401]=29692;c[7403]=-1;a[29616]=0;m=c[7392]|0;l=m+4|0;I=c[l>>2]|0,c[l>>2]=I+1,I;if((c[7473]|0)!=-1){c[e>>2]=29892;c[e+4>>2]=48;c[e+8>>2]=0;kE(29892,e)}e=(c[7474]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>e>>>0){p=c[n+(e<<2)>>2]|0;if((p|0)==0){break}q=p;c[7400]=q;c[7402]=b5[c[(c[p>>2]|0)+24>>2]&511](q)|0;q=c[7400]|0;a[29617]=(b5[c[(c[q>>2]|0)+28>>2]&511](q)|0)&1;if((c[7402]|0)>8){q=bR(8)|0;c[q>>2]=3332;p=q+4|0;s=p;do{if((p|0)!=0){while(1){v=qH(50)|0;if((v|0)!=0){w=21;break}x=(I=c[7664]|0,c[7664]=I+0,I);if((x|0)==0){break}b8[x&1]()}if((w|0)==21){c[v+4>>2]=37;c[v>>2]=37;x=v+12|0;c[s>>2]=x;c[v+8>>2]=0;qQ(x|0,180,38)|0;break}x=bR(4)|0;c[x>>2]=3284;bl(x|0,24120,94)}}while(0);bl(q|0,24144,216)}if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)==0){b0[c[(c[m>>2]|0)+8>>2]&1023](m|0)}c[7632]=5864;c[7634]=5884;c[7633]=0;c[7640]=29564;c[7638]=0;c[7639]=0;c[7635]=4098;c[7637]=0;c[7636]=6;qP(30568,0,40)|0;s=c[(oJ()|0)>>2]|0;c[7641]=s;p=s+4|0;I=c[p>>2]|0,c[p>>2]=I+1,I;c[7652]=0;c[7653]=-1;p=c[t>>2]|0;c[7367]=5660;s=c[(oJ()|0)>>2]|0;c[7368]=s;x=s+4|0;I=c[x>>2]|0,c[x>>2]=I+1,I;qP(29476,0,24)|0;c[7367]=6020;c[7375]=p;x=c[7368]|0;s=x+4|0;I=c[s>>2]|0,c[s>>2]=I+1,I;if((c[7473]|0)!=-1){c[j>>2]=29892;c[j+4>>2]=48;c[j+8>>2]=0;kE(29892,j)}y=(c[7474]|0)-1|0;z=c[x+8>>2]|0;do{if((c[x+12>>2]|0)-z>>2>>>0>y>>>0){A=c[z+(y<<2)>>2]|0;if((A|0)==0){break}B=A;if(((I=c[s>>2]|0,c[s>>2]=I+ -1,I)|0)==0){b0[c[(c[x>>2]|0)+8>>2]&1023](x|0)}c[7376]=B;c[7377]=29700;a[29512]=(b5[c[(c[A>>2]|0)+28>>2]&511](B)|0)&1;c[7569]=5776;c[7570]=5796;c[7576]=29468;c[7574]=0;c[7575]=0;c[7571]=4098;c[7573]=0;c[7572]=6;qP(30312,0,40)|0;B=c[(oJ()|0)>>2]|0;c[7577]=B;A=B+4|0;I=c[A>>2]|0,c[A>>2]=I+1,I;c[7588]=0;c[7589]=-1;A=c[r>>2]|0;c[7379]=5660;B=c[(oJ()|0)>>2]|0;c[7380]=B;C=B+4|0;I=c[C>>2]|0,c[C>>2]=I+1,I;qP(29524,0,24)|0;c[7379]=6020;c[7387]=A;C=c[7380]|0;B=C+4|0;I=c[B>>2]|0,c[B>>2]=I+1,I;if((c[7473]|0)!=-1){c[h>>2]=29892;c[h+4>>2]=48;c[h+8>>2]=0;kE(29892,h)}D=(c[7474]|0)-1|0;E=c[C+8>>2]|0;do{if((c[C+12>>2]|0)-E>>2>>>0>D>>>0){F=c[E+(D<<2)>>2]|0;if((F|0)==0){break}G=F;if(((I=c[B>>2]|0,c[B>>2]=I+ -1,I)|0)==0){b0[c[(c[C>>2]|0)+8>>2]&1023](C|0)}c[7388]=G;c[7389]=29708;a[29560]=(b5[c[(c[F>>2]|0)+28>>2]&511](G)|0)&1;c[7611]=5776;c[7612]=5796;c[7618]=29516;c[7616]=0;c[7617]=0;c[7613]=4098;c[7615]=0;c[7614]=6;qP(30480,0,40)|0;G=c[(oJ()|0)>>2]|0;c[7619]=G;F=G+4|0;I=c[F>>2]|0,c[F>>2]=I+1,I;c[7630]=0;c[7631]=-1;F=c[(c[(c[7611]|0)-12>>2]|0)+30468>>2]|0;c[7590]=5776;c[7591]=5796;c[7597]=F;c[7595]=(F|0)==0;c[7596]=0;c[7592]=4098;c[7594]=0;c[7593]=6;qP(30396,0,40)|0;F=c[(oJ()|0)>>2]|0;c[7598]=F;G=F+4|0;I=c[G>>2]|0,c[G>>2]=I+1,I;c[7609]=0;c[7610]=-1;c[(c[(c[7632]|0)-12>>2]|0)+30600>>2]=30276;G=(c[(c[7611]|0)-12>>2]|0)+30448|0;c[G>>2]=c[G>>2]|8192;c[(c[(c[7611]|0)-12>>2]|0)+30516>>2]=30276;c[7353]=5592;G=c[(oJ()|0)>>2]|0;c[7354]=G;F=G+4|0;I=c[F>>2]|0,c[F>>2]=I+1,I;qP(29420,0,24)|0;c[7353]=6328;c[7361]=k;c[7363]=29716;c[7365]=-1;a[29464]=0;F=c[7354]|0;G=F+4|0;I=c[G>>2]|0,c[G>>2]=I+1,I;if((c[7471]|0)!=-1){c[d>>2]=29884;c[d+4>>2]=48;c[d+8>>2]=0;kE(29884,d)}H=(c[7472]|0)-1|0;J=c[F+8>>2]|0;do{if((c[F+12>>2]|0)-J>>2>>>0>H>>>0){K=c[J+(H<<2)>>2]|0;if((K|0)==0){break}L=K;c[7362]=L;c[7364]=b5[c[(c[K>>2]|0)+24>>2]&511](L)|0;L=c[7362]|0;a[29465]=(b5[c[(c[L>>2]|0)+28>>2]&511](L)|0)&1;if((c[7364]|0)>8){L=bR(8)|0;c[L>>2]=3332;K=L+4|0;M=K;do{if((K|0)!=0){while(1){N=qH(50)|0;if((N|0)!=0){w=96;break}O=(I=c[7664]|0,c[7664]=I+0,I);if((O|0)==0){break}b8[O&1]()}if((w|0)==96){c[N+4>>2]=37;c[N>>2]=37;O=N+12|0;c[M>>2]=O;c[N+8>>2]=0;qQ(O|0,180,38)|0;break}O=bR(4)|0;c[O>>2]=3284;bl(O|0,24120,94)}}while(0);bl(L|0,24144,216)}if(((I=c[G>>2]|0,c[G>>2]=I+ -1,I)|0)==0){b0[c[(c[F>>2]|0)+8>>2]&1023](F|0)}c[7547]=5820;c[7549]=5840;c[7548]=0;c[7555]=29412;c[7553]=0;c[7554]=0;c[7550]=4098;c[7552]=0;c[7551]=6;qP(30228,0,40)|0;M=c[(oJ()|0)>>2]|0;c[7556]=M;K=M+4|0;I=c[K>>2]|0,c[K>>2]=I+1,I;c[7567]=0;c[7568]=-1;c[7329]=5592;K=c[(oJ()|0)>>2]|0;c[7330]=K;M=K+4|0;I=c[M>>2]|0,c[M>>2]=I+1,I;qP(29324,0,24)|0;c[7329]=5952;c[7337]=p;M=c[7330]|0;K=M+4|0;I=c[K>>2]|0,c[K>>2]=I+1,I;if((c[7471]|0)!=-1){c[g>>2]=29884;c[g+4>>2]=48;c[g+8>>2]=0;kE(29884,g)}O=(c[7472]|0)-1|0;P=c[M+8>>2]|0;do{if((c[M+12>>2]|0)-P>>2>>>0>O>>>0){Q=c[P+(O<<2)>>2]|0;if((Q|0)==0){break}R=Q;if(((I=c[K>>2]|0,c[K>>2]=I+ -1,I)|0)==0){b0[c[(c[M>>2]|0)+8>>2]&1023](M|0)}c[7338]=R;c[7339]=29724;a[29360]=(b5[c[(c[Q>>2]|0)+28>>2]&511](R)|0)&1;c[7480]=5732;c[7481]=5752;c[7487]=29316;c[7485]=0;c[7486]=0;c[7482]=4098;c[7484]=0;c[7483]=6;qP(29956,0,40)|0;R=c[(oJ()|0)>>2]|0;c[7488]=R;Q=R+4|0;I=c[Q>>2]|0,c[Q>>2]=I+1,I;c[7499]=0;c[7500]=-1;c[7341]=5592;Q=c[(oJ()|0)>>2]|0;c[7342]=Q;R=Q+4|0;I=c[R>>2]|0,c[R>>2]=I+1,I;qP(29372,0,24)|0;c[7341]=5952;c[7349]=A;R=c[7342]|0;Q=R+4|0;I=c[Q>>2]|0,c[Q>>2]=I+1,I;if((c[7471]|0)!=-1){c[f>>2]=29884;c[f+4>>2]=48;c[f+8>>2]=0;kE(29884,f)}S=(c[7472]|0)-1|0;T=c[R+8>>2]|0;do{if((c[R+12>>2]|0)-T>>2>>>0>S>>>0){U=c[T+(S<<2)>>2]|0;if((U|0)==0){break}V=U;if(((I=c[Q>>2]|0,c[Q>>2]=I+ -1,I)|0)==0){b0[c[(c[R>>2]|0)+8>>2]&1023](R|0)}c[7350]=V;c[7351]=29732;a[29408]=(b5[c[(c[U>>2]|0)+28>>2]&511](V)|0)&1;c[7522]=5732;c[7523]=5752;c[7529]=29364;c[7527]=0;c[7528]=0;c[7524]=4098;c[7526]=0;c[7525]=6;qP(30124,0,40)|0;V=c[(oJ()|0)>>2]|0;c[7530]=V;U=V+4|0;I=c[U>>2]|0,c[U>>2]=I+1,I;c[7541]=0;c[7542]=-1;U=c[(c[(c[7522]|0)-12>>2]|0)+30112>>2]|0;c[7501]=5732;c[7502]=5752;c[7508]=U;c[7506]=(U|0)==0;c[7507]=0;c[7503]=4098;c[7505]=0;c[7504]=6;qP(30040,0,40)|0;U=c[(oJ()|0)>>2]|0;c[7509]=U;V=U+4|0;I=c[V>>2]|0,c[V>>2]=I+1,I;c[7520]=0;c[7521]=-1;c[(c[(c[7547]|0)-12>>2]|0)+30260>>2]=29920;V=(c[(c[7522]|0)-12>>2]|0)+30092|0;c[V>>2]=c[V>>2]|8192;c[(c[(c[7522]|0)-12>>2]|0)+30160>>2]=29920;a0(46,30616,u|0)|0;i=b;return}}while(0);R=bR(4)|0;c[R>>2]=3308;bl(R|0,24132,322)}}while(0);M=bR(4)|0;c[M>>2]=3308;bl(M|0,24132,322)}}while(0);F=bR(4)|0;c[F>>2]=3308;bl(F|0,24132,322)}}while(0);A=bR(4)|0;c[A>>2]=3308;bl(A|0,24132,322)}}while(0);p=bR(4)|0;c[p>>2]=3308;bl(p|0,24132,322)}}while(0);b=bR(4)|0;c[b>>2]=3308;bl(b|0,24132,322)}function kd(a){a=a|0;if((a|0)==0){return}qI(a);return}function ke(a){a=a|0;return}function kf(a){a=a|0;return 1948}function kg(a,b){a=a|0;b=b|0;return 0}function kh(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=3380;b=a+4|0;d=(c[b>>2]|0)-4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)-1|0)<0){e=(c[b>>2]|0)-12|0;if((e|0)!=0){qI(e)}if((a|0)!=0){break}return}}while(0);qI(a);return}function ki(a){a=a|0;var b=0;c[a>>2]=3380;b=a+4|0;a=(c[b>>2]|0)-4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)-1|0)>=0){return}a=(c[b>>2]|0)-12|0;if((a|0)==0){return}qI(a);return}function kj(a){a=a|0;return c[a+4>>2]|0}function kk(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=3332;b=a+4|0;d=(c[b>>2]|0)-4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)-1|0)<0){e=(c[b>>2]|0)-12|0;if((e|0)!=0){qI(e)}if((a|0)!=0){break}return}}while(0);qI(a);return}function kl(a){a=a|0;var b=0;c[a>>2]=3332;b=a+4|0;a=(c[b>>2]|0)-4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)-1|0)>=0){return}a=(c[b>>2]|0)-12|0;if((a|0)==0){return}qI(a);return}function km(a){a=a|0;return c[a+4>>2]|0}function kn(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=3380;b=a+4|0;d=(c[b>>2]|0)-4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)-1|0)<0){e=(c[b>>2]|0)-12|0;if((e|0)!=0){qI(e)}if((a|0)!=0){break}return}}while(0);qI(a);return}function ko(a,b,d){a=a|0;b=b|0;d=d|0;c[a>>2]=d;c[a+4>>2]=b;return}function kp(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;cf[c[(c[a>>2]|0)+12>>2]&63](f,a,b);if((c[f+4>>2]|0)!=(c[d+4>>2]|0)){g=0;i=e;return g|0}g=(c[f>>2]|0)==(c[d>>2]|0);i=e;return g|0}function kq(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if((c[b+4>>2]|0)!=(a|0)){e=0;return e|0}e=(c[b>>2]|0)==(d|0);return e|0}function kr(a){a=a|0;return 896}function ks(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;d=bB(e|0)|0;e=qR(d|0)|0;if(e>>>0>4294967279>>>0){kF()}if(e>>>0<11>>>0){a[b]=e<<1;f=b+1|0;qQ(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}h=e+16&-16;i=(h|0)==0?1:h;while(1){j=qH(i)|0;if((j|0)!=0){k=16;break}l=(I=c[7664]|0,c[7664]=I+0,I);if((l|0)==0){k=13;break}b8[l&1]()}if((k|0)==16){c[b+8>>2]=j;c[b>>2]=h|1;c[b+4>>2]=e;f=j;qQ(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}else if((k|0)==13){k=bR(4)|0;c[k>>2]=3284;bl(k|0,24120,94)}}function kt(a){a=a|0;return}function ku(a){a=a|0;return 1388}function kv(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;d=bB(e|0)|0;e=qR(d|0)|0;if(e>>>0>4294967279>>>0){kF()}if(e>>>0<11>>>0){a[b]=e<<1;f=b+1|0;qQ(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}h=e+16&-16;i=(h|0)==0?1:h;while(1){j=qH(i)|0;if((j|0)!=0){k=16;break}l=(I=c[7664]|0,c[7664]=I+0,I);if((l|0)==0){k=13;break}b8[l&1]()}if((k|0)==13){i=bR(4)|0;c[i>>2]=3284;bl(i|0,24120,94)}else if((k|0)==16){c[b+8>>2]=j;c[b>>2]=h|1;c[b+4>>2]=e;f=j;qQ(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}}function kw(b,d,e){b=b|0;d=d|0;e=e|0;do{if((a[30740]|0)==0){if((bd(30740)|0)==0){break}c[7206]=4672}}while(0);c[b>>2]=e;c[b+4>>2]=28824;return}function kx(a){a=a|0;return}function ky(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;h=i;i=i+36|0;j=h|0;k=h+12|0;l=h+24|0;m=qR(g|0)|0;if(m>>>0>4294967279>>>0){kF()}do{if(m>>>0<11>>>0){n=l;a[n]=m<<1;o=l+1|0;p=n}else{n=m+16&-16;q=(n|0)==0?1:n;while(1){r=qH(q)|0;if((r|0)!=0){s=16;break}t=(I=c[7664]|0,c[7664]=I+0,I);if((t|0)==0){break}b8[t&1]()}if((s|0)==16){c[l+8>>2]=r;c[l>>2]=n|1;c[l+4>>2]=m;o=r;p=l;break}q=bR(4)|0;c[q>>2]=3284;bl(q|0,24120,94)}}while(0);qQ(o|0,g|0,m)|0;a[o+m|0]=0;m=j;do{if((e|0)!=0){o=d[p]|0;if((o&1|0)==0){u=o>>>1}else{u=c[l+4>>2]|0}if((u|0)!=0){kK(l,1508,2)}cf[c[(c[f>>2]|0)+24>>2]&63](j,f,e);o=a[m]|0;if((o&1)==0){v=j+1|0}else{v=c[j+8>>2]|0}g=o&255;if((g&1|0)==0){w=g>>>1}else{w=c[j+4>>2]|0}kK(l,v,w);if((a[m]&1)==0){break}g=c[j+8>>2]|0;if((g|0)==0){break}qI(g)}}while(0);j=k;c[j>>2]=c[p>>2];c[j+4>>2]=c[p+4>>2];c[j+8>>2]=c[p+8>>2];qP(p|0,0,12)|0;m=b|0;c[m>>2]=3332;w=b+4|0;v=a[j]&1;do{if((w|0)==0){x=v}else{if(v<<24>>24==0){y=k+1|0}else{y=c[k+8>>2]|0}j=qR(y|0)|0;u=j+13|0;g=(u|0)==0?1:u;while(1){z=qH(g)|0;if((z|0)!=0){s=56;break}u=(I=c[7664]|0,c[7664]=I+0,I);if((u|0)==0){break}b8[u&1]()}if((s|0)==56){c[z+4>>2]=j;c[z>>2]=j;g=z+12|0;c[w>>2]=g;c[z+8>>2]=0;qQ(g|0,y|0,j+1|0)|0;x=v;break}g=bR(4)|0;c[g>>2]=3284;bl(g|0,24120,94)}}while(0);do{if(x<<24>>24!=0){v=c[k+8>>2]|0;if((v|0)==0){break}qI(v)}}while(0);do{if((a[p]&1)!=0){k=c[l+8>>2]|0;if((k|0)==0){break}qI(k)}}while(0);c[m>>2]=5904;m=b+8|0;c[m>>2]=e;c[m+4>>2]=f;i=h;return}function kz(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=3332;b=a+4|0;d=(c[b>>2]|0)-4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)-1|0)<0){e=(c[b>>2]|0)-12|0;if((e|0)!=0){qI(e)}if((a|0)!=0){break}return}}while(0);qI(a);return}function kA(a){a=a|0;var b=0;c[a>>2]=3332;b=a+4|0;a=(c[b>>2]|0)-4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)-1|0)>=0){return}a=(c[b>>2]|0)-12|0;if((a|0)==0){return}qI(a);return}function kB(b,d){b=b|0;d=d|0;var e=0,f=0;e=bR(16)|0;f=e;do{if((a[30748]|0)==0){if((bd(30748)|0)==0){break}c[7207]=4712}}while(0);ky(f,b,28828,d);bl(e|0,25636,596)}function kC(a){a=a|0;if((a|0)==0){return}qI(a);return}function kD(a){a=a|0;if((a|0)==0){return}qI(a);return}function kE(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d;if((c[a>>2]|0)==1){do{aU(29644,29620)|0;}while((c[a>>2]|0)==1)}if((c[a>>2]|0)!=0){e;return}c[a>>2]=1;f;f=b+4|0;e=(c[b>>2]|0)+(c[f+4>>2]|0)|0;b=c[f>>2]|0;if((b&1|0)==0){g=b}else{g=c[(c[e>>2]|0)+(b-1)>>2]|0}b0[g&1023](e);h;c[a>>2]=-1;i;bv(29644)|0;return}function kF(){var a=0,b=0,d=0,e=0,f=0,g=0;a=bR(8)|0;c[a>>2]=3380;b=a+4|0;d=b;if((b|0)==0){e=a;c[e>>2]=3356;bl(a|0,24156,290)}while(1){f=qH(25)|0;if((f|0)!=0){g=16;break}b=(I=c[7664]|0,c[7664]=I+0,I);if((b|0)==0){g=10;break}b8[b&1]()}if((g|0)==10){b=bR(4)|0;c[b>>2]=3284;bl(b|0,24120,94)}else if((g|0)==16){c[f+4>>2]=12;c[f>>2]=12;g=f+12|0;c[d>>2]=g;c[f+8>>2]=0;qQ(g|0,284,13)|0;e=a;c[e>>2]=3356;bl(a|0,24156,290)}}function kG(b){b=b|0;var d=0;if((a[b]&1)==0){return}d=c[b+8>>2]|0;if((d|0)==0){return}qI(d);return}function kH(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=qR(d|0)|0;f=b;g=b;h=a[g]|0;if((h&1)==0){i=10;j=h}else{h=c[b>>2]|0;i=(h&-2)-1|0;j=h&255}if(i>>>0<e>>>0){h=j&255;if((h&1|0)==0){k=h>>>1}else{k=c[b+4>>2]|0}kL(b,i,e-i|0,k,0,k,e,d);return}if((j&1)==0){l=f+1|0}else{l=c[b+8>>2]|0}qS(l|0,d|0,e|0)|0;a[l+e|0]=0;if((a[g]&1)==0){a[g]=e<<1;return}else{c[b+4>>2]=e;return}}function kI(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;if((d|0)==0){return}e=b;f=a[e]|0;if((f&1)==0){g=10;h=f}else{f=c[b>>2]|0;g=(f&-2)-1|0;h=f&255}f=h&255;if((f&1|0)==0){i=f>>>1}else{i=c[b+4>>2]|0}if((g-i|0)>>>0<d>>>0){kM(b,g,d-g+i|0,i,i,0);j=a[e]|0}else{j=h}if((j&1)==0){k=b+1|0}else{k=c[b+8>>2]|0}qP(k+i|0,0,d|0)|0;j=i+d|0;if((a[e]&1)==0){a[e]=j<<1}else{c[b+4>>2]=j}a[k+j|0]=0;return}function kJ(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=b;e=b;f=a[e]|0;if((f&1)==0){g=10;h=f}else{f=c[b>>2]|0;g=(f&-2)-1|0;h=f&255}f=h&255;i=(f&1|0)==0;if(i){j=f>>>1}else{j=c[b+4>>2]|0}if(j>>>0<11>>>0){k=11}else{k=j+16&-16}l=k-1|0;if((l|0)==(g|0)){return}if((l|0)==10){m=d+1|0;n=c[b+8>>2]|0;o=1;p=0}else{q=(k|0)==0?1:k;L17:do{if(l>>>0>g>>>0){while(1){r=qH(q)|0;if((r|0)!=0){s=r;break L17}r=(I=c[7664]|0,c[7664]=I+0,I);if((r|0)==0){break}b8[r&1]()}r=bR(4)|0;c[r>>2]=3284;bl(r|0,24120,94)}else{while(1){r=qH(q)|0;if((r|0)!=0){s=r;break L17}r=(I=c[7664]|0,c[7664]=I+0,I);if((r|0)==0){break}b8[r&1]()}r=bR(4)|0;c[r>>2]=3284;bl(r|0,24120,94)}}while(0);q=h&1;if(q<<24>>24==0){t=d+1|0}else{t=c[b+8>>2]|0}m=s;n=t;o=q<<24>>24!=0;p=1}if(i){u=f>>>1}else{u=c[b+4>>2]|0}qQ(m|0,n|0,u+1|0)|0;if(!(o^1|(n|0)==0)){qI(n)}if(p){c[b>>2]=k|1;c[b+4>>2]=j;c[b+8>>2]=m;return}else{a[e]=j<<1;return}}function kK(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=b;g=a[f]|0;if((g&1)==0){h=10;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}g=i&255;if((g&1|0)==0){j=g>>>1}else{j=c[b+4>>2]|0}if((h-j|0)>>>0<e>>>0){kL(b,h,e-h+j|0,j,j,0,e,d);return}if((e|0)==0){return}if((i&1)==0){k=b+1|0}else{k=c[b+8>>2]|0}qQ(k+j|0,d|0,e)|0;d=j+e|0;if((a[f]&1)==0){a[f]=d<<1}else{c[b+4>>2]=d}a[k+d|0]=0;return}function kL(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((-18-d|0)>>>0<e>>>0){kF()}if((a[b]&1)==0){k=b+1|0}else{k=c[b+8>>2]|0}do{if(d>>>0<2147483623>>>0){l=e+d|0;m=d<<1;n=l>>>0<m>>>0?m:l;if(n>>>0<11>>>0){o=11;break}o=n+16&-16}else{o=-17}}while(0);e=(o|0)==0?1:o;while(1){p=qH(e)|0;if((p|0)!=0){break}n=(I=c[7664]|0,c[7664]=I+0,I);if((n|0)==0){q=17;break}b8[n&1]()}if((q|0)==17){q=bR(4)|0;c[q>>2]=3284;bl(q|0,24120,94)}if((g|0)!=0){qQ(p|0,k|0,g)|0}if((i|0)!=0){qQ(p+g|0,j|0,i)|0}j=f-h|0;if((j|0)!=(g|0)){qQ(p+(i+g)|0,k+(h+g)|0,j-g|0)|0}if((d|0)==10|(k|0)==0){r=b+8|0;c[r>>2]=p;s=o|1;t=b|0;c[t>>2]=s;u=j+i|0;v=b+4|0;c[v>>2]=u;w=p+u|0;a[w]=0;return}qI(k);r=b+8|0;c[r>>2]=p;s=o|1;t=b|0;c[t>>2]=s;u=j+i|0;v=b+4|0;c[v>>2]=u;w=p+u|0;a[w]=0;return}function kM(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;if((-17-d|0)>>>0<e>>>0){kF()}if((a[b]&1)==0){i=b+1|0}else{i=c[b+8>>2]|0}do{if(d>>>0<2147483623>>>0){j=e+d|0;k=d<<1;l=j>>>0<k>>>0?k:j;if(l>>>0<11>>>0){m=11;break}m=l+16&-16}else{m=-17}}while(0);e=(m|0)==0?1:m;while(1){n=qH(e)|0;if((n|0)!=0){break}l=(I=c[7664]|0,c[7664]=I+0,I);if((l|0)==0){o=17;break}b8[l&1]()}if((o|0)==17){o=bR(4)|0;c[o>>2]=3284;bl(o|0,24120,94)}if((g|0)!=0){qQ(n|0,i|0,g)|0}if((f|0)!=(g|0)){qQ(n+(h+g)|0,i+g|0,f-g|0)|0}if((d|0)==10|(i|0)==0){p=b+8|0;c[p>>2]=n;q=m|1;r=b|0;c[r>>2]=q;return}qI(i);p=b+8|0;c[p>>2]=n;q=m|1;r=b|0;c[r>>2]=q;return}function kN(b){b=b|0;var d=0;if((a[b]&1)==0){return}d=c[b+8>>2]|0;if((d|0)==0){return}qI(d);return}function kO(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=b;g=a[f]|0;if((g&1)==0){h=1;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}if(h>>>0>=e>>>0){if((i&1)==0){j=b+4|0}else{j=c[b+8>>2]|0}g=(e|0)==0;do{if(j-d>>2>>>0<e>>>0){if(g){break}else{k=e}do{k=k-1|0;c[j+(k<<2)>>2]=c[d+(k<<2)>>2];}while((k|0)!=0)}else{if(g){break}else{l=d;m=e;n=j}while(1){o=m-1|0;c[n>>2]=c[l>>2];if((o|0)==0){break}else{l=l+4|0;m=o;n=n+4|0}}}}while(0);c[j+(e<<2)>>2]=0;if((a[f]&1)==0){a[f]=e<<1;return}else{c[b+4>>2]=e;return}}if((1073741806-h|0)>>>0<(e-h|0)>>>0){kF()}if((i&1)==0){p=b+4|0}else{p=c[b+8>>2]|0}do{if(h>>>0<536870887>>>0){i=h<<1;f=i>>>0>e>>>0?i:e;if(f>>>0<2>>>0){q=2;break}q=f+4&-4}else{q=1073741807}}while(0);f=q<<2;i=(f|0)==0?1:f;while(1){r=qH(i)|0;if((r|0)!=0){break}f=(I=c[7664]|0,c[7664]=I+0,I);if((f|0)==0){s=31;break}b8[f&1]()}if((s|0)==31){s=bR(4)|0;c[s>>2]=3284;bl(s|0,24120,94)}s=r;if((e|0)!=0){r=d;d=e;i=s;while(1){f=d-1|0;c[i>>2]=c[r>>2];if((f|0)==0){break}else{r=r+4|0;d=f;i=i+4|0}}}if(!((h|0)==1|(p|0)==0)){qI(p)}c[b+8>>2]=s;c[b>>2]=q|1;c[b+4>>2]=e;c[s+(e<<2)>>2]=0;return}function kP(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;d=b;e=a[d]|0;if((e&1)==0){f=1;g=e}else{e=c[b>>2]|0;f=(e&-2)-1|0;g=e&255}e=g&255;h=(e&1|0)==0;if(h){i=e>>>1}else{i=c[b+4>>2]|0}if(i>>>0<2>>>0){j=2}else{j=i+4&-4}k=j-1|0;if((k|0)==(f|0)){return}if((k|0)==1){l=b+4|0;m=c[b+8>>2]|0;n=1;o=0}else{p=j<<2;q=(p|0)==0?1:p;L17:do{if(k>>>0>f>>>0){while(1){p=qH(q)|0;if((p|0)!=0){r=p;break L17}p=(I=c[7664]|0,c[7664]=I+0,I);if((p|0)==0){break}b8[p&1]()}p=bR(4)|0;c[p>>2]=3284;bl(p|0,24120,94)}else{while(1){p=qH(q)|0;if((p|0)!=0){r=p;break L17}p=(I=c[7664]|0,c[7664]=I+0,I);if((p|0)==0){break}b8[p&1]()}p=bR(4)|0;c[p>>2]=3284;bl(p|0,24120,94)}}while(0);q=g&1;if(q<<24>>24==0){s=b+4|0}else{s=c[b+8>>2]|0}l=r;m=s;n=q<<24>>24!=0;o=1}q=l;if(h){t=e>>>1}else{t=c[b+4>>2]|0}e=t+1|0;if((e|0)!=0){t=m;h=e;e=q;while(1){l=h-1|0;c[e>>2]=c[t>>2];if((l|0)==0){break}else{t=t+4|0;h=l;e=e+4|0}}}if(!(n^1|(m|0)==0)){qI(m)}if(o){c[b>>2]=j|1;c[b+4>>2]=i;c[b+8>>2]=q;return}else{a[d]=i<<1;return}}function kQ(b,d,e,f,g,h,i){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;if((1073741807-d|0)>>>0<e>>>0){kF()}if((a[b]&1)==0){j=b+4|0}else{j=c[b+8>>2]|0}do{if(d>>>0<536870887>>>0){k=e+d|0;l=d<<1;m=k>>>0<l>>>0?l:k;if(m>>>0<2>>>0){n=2;break}n=m+4&-4}else{n=1073741807}}while(0);e=n<<2;m=(e|0)==0?1:e;while(1){o=qH(m)|0;if((o|0)!=0){break}e=(I=c[7664]|0,c[7664]=I+0,I);if((e|0)==0){p=17;break}b8[e&1]()}if((p|0)==17){p=bR(4)|0;c[p>>2]=3284;bl(p|0,24120,94)}p=o;if((g|0)!=0){o=j;m=g;e=p;while(1){k=m-1|0;c[e>>2]=c[o>>2];if((k|0)==0){break}else{o=o+4|0;m=k;e=e+4|0}}}e=f-h|0;if((e|0)!=(g|0)){f=j+(h+g<<2)|0;h=e-g|0;e=p+(i+g<<2)|0;while(1){g=h-1|0;c[e>>2]=c[f>>2];if((g|0)==0){break}else{f=f+4|0;h=g;e=e+4|0}}}if((d|0)==1|(j|0)==0){q=b+8|0;c[q>>2]=p;r=n|1;s=b|0;c[s>>2]=r;return}qI(j);q=b+8|0;c[q>>2]=p;r=n|1;s=b|0;c[s>>2]=r;return}function kR(b){b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+8|0;e=d|0;if((aY(1,e|0)|0)==0){f=c[e>>2]|0;g=c[e+4>>2]|0;e=q1(f,(f|0)<0|0?-1:0,1e9,0)|0;f=qT(e,K,g,(g|0)<0|0?-1:0)|0;g=b|0;c[g>>2]=f;c[g+4>>2]=K;i=d;return}d=c[(bA()|0)>>2]|0;g=bR(16)|0;f=g;do{if((a[30748]|0)==0){if((bd(30748)|0)==0){break}c[7207]=4712}}while(0);ky(f,d,28828,1800);bl(g|0,25636,596)}function kS(){b8[(I=c[7663]|0,c[7663]=I+0|0,I)&1]();bw()}function kT(){br(4)|0;bL()}function kU(b,d){b=b|0;d=d|0;var e=0;e=(c[b+24>>2]|0)==0;if(e){c[b+16>>2]=d|1}else{c[b+16>>2]=d}if((c[b+20>>2]&(e&1|d)|0)==0){return}d=bR(16)|0;do{if((a[30732]|0)==0){if((bd(30732)|0)==0){break}c[7205]=5424}}while(0);ky(d,1,28820,1328);c[d>>2]=3944;bl(d|0,24676,80)}function kV(a){a=a|0;var b=0,d=0,e=0,f=0;c[a>>2]=3924;b=c[a+40>>2]|0;d=a+32|0;e=a+36|0;if((b|0)!=0){f=b;do{f=f-1|0;cf[c[(c[d>>2]|0)+(f<<2)>>2]&63](0,a,c[(c[e>>2]|0)+(f<<2)>>2]|0);}while((f|0)!=0)}f=c[a+28>>2]|0;b=f+4|0;if(((I=c[b>>2]|0,c[b>>2]=I+ -1,I)|0)==0){b0[c[(c[f>>2]|0)+8>>2]&1023](f)}qI(c[d>>2]|0);qI(c[e>>2]|0);qI(c[a+48>>2]|0);qI(c[a+60>>2]|0);return}function kW(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5660;b=c[a+4>>2]|0;d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){e=a;qI(e);return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=a;qI(e);return}function kX(a){a=a|0;var b=0;c[a>>2]=5660;b=c[a+4>>2]|0;a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);return}function kY(a,b){a=a|0;b=b|0;return}function kZ(a,b,c){a=a|0;b=b|0;c=c|0;return a|0}function k_(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;g=a;c[g>>2]=0;c[g+4>>2]=0;g=a+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}function k$(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;e=i;b=d;d=i;i=i+16|0;c[d>>2]=c[b>>2];c[d+4>>2]=c[b+4>>2];c[d+8>>2]=c[b+8>>2];c[d+12>>2]=c[b+12>>2];b=a;c[b>>2]=0;c[b+4>>2]=0;b=a+8|0;c[b>>2]=-1;c[b+4>>2]=-1;i=e;return}function k0(a){a=a|0;return 0}function k1(a){a=a|0;return 0}function k2(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=b;if((e|0)<=0){g=0;return g|0}h=b+12|0;i=b+16|0;j=d;d=0;while(1){k=c[h>>2]|0;if(k>>>0<(c[i>>2]|0)>>>0){c[h>>2]=k+1;l=a[k]|0}else{k=b5[c[(c[f>>2]|0)+40>>2]&511](b)|0;if((k|0)==-1){g=d;m=9;break}l=k&255}a[j]=l;k=d+1|0;if((k|0)<(e|0)){j=j+1|0;d=k}else{g=k;m=10;break}}if((m|0)==10){return g|0}else if((m|0)==9){return g|0}return 0}function k3(a){a=a|0;return-1|0}function k4(a){a=a|0;var b=0,e=0;if((b5[c[(c[a>>2]|0)+36>>2]&511](a)|0)==-1){b=-1;return b|0}e=a+12|0;a=c[e>>2]|0;c[e>>2]=a+1;b=d[a]|0;return b|0}function k5(a,b){a=a|0;b=b|0;return-1|0}function k6(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;g=b;if((f|0)<=0){h=0;return h|0}i=b+24|0;j=b+28|0;k=0;l=e;while(1){e=c[i>>2]|0;if(e>>>0<(c[j>>2]|0)>>>0){m=a[l]|0;c[i>>2]=e+1;a[e]=m}else{if((b2[c[(c[g>>2]|0)+52>>2]&127](b,d[l]|0)|0)==-1){h=k;n=10;break}}m=k+1|0;if((m|0)<(f|0)){k=m;l=l+1|0}else{h=m;n=9;break}}if((n|0)==9){return h|0}else if((n|0)==10){return h|0}return 0}function k7(a,b){a=a|0;b=b|0;return-1|0}function k8(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5592;b=c[a+4>>2]|0;d=b+4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)!=0){e=a;qI(e);return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=a;qI(e);return}function k9(a){a=a|0;var b=0;c[a>>2]=5592;b=c[a+4>>2]|0;a=b+4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)|0)!=0){return}b0[c[(c[b>>2]|0)+8>>2]&1023](b|0);return}function la(a,b){a=a|0;b=b|0;return}function lb(a,b,c){a=a|0;b=b|0;c=c|0;return a|0}function lc(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;g=a;c[g>>2]=0;c[g+4>>2]=0;g=a+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}function ld(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;e=i;b=d;d=i;i=i+16|0;c[d>>2]=c[b>>2];c[d+4>>2]=c[b+4>>2];c[d+8>>2]=c[b+8>>2];c[d+12>>2]=c[b+12>>2];b=a;c[b>>2]=0;c[b+4>>2]=0;b=a+8|0;c[b>>2]=-1;c[b+4>>2]=-1;i=e;return}function le(a){a=a|0;return 0}function lf(a){a=a|0;return 0}function lg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a;if((d|0)<=0){f=0;return f|0}g=a+12|0;h=a+16|0;i=b;b=0;while(1){j=c[g>>2]|0;if(j>>>0<(c[h>>2]|0)>>>0){c[g>>2]=j+4;k=c[j>>2]|0}else{j=b5[c[(c[e>>2]|0)+40>>2]&511](a)|0;if((j|0)==-1){f=b;l=10;break}else{k=j}}c[i>>2]=k;j=b+1|0;if((j|0)<(d|0)){i=i+4|0;b=j}else{f=j;l=8;break}}if((l|0)==10){return f|0}else if((l|0)==8){return f|0}return 0}function lh(a){a=a|0;return-1|0}function li(a){a=a|0;var b=0,d=0;if((b5[c[(c[a>>2]|0)+36>>2]&511](a)|0)==-1){b=-1;return b|0}d=a+12|0;a=c[d>>2]|0;c[d>>2]=a+4;b=c[a>>2]|0;return b|0}function lj(a,b){a=a|0;b=b|0;return-1|0}function lk(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a;if((d|0)<=0){f=0;return f|0}g=a+24|0;h=a+28|0;i=0;j=b;while(1){b=c[g>>2]|0;if(b>>>0<(c[h>>2]|0)>>>0){k=c[j>>2]|0;c[g>>2]=b+4;c[b>>2]=k}else{if((b2[c[(c[e>>2]|0)+52>>2]&127](a,c[j>>2]|0)|0)==-1){f=i;l=8;break}}k=i+1|0;if((k|0)<(d|0)){i=k;j=j+4|0}else{f=k;l=10;break}}if((l|0)==8){return f|0}else if((l|0)==10){return f|0}return 0}function ll(a,b){a=a|0;b=b|0;return-1|0}function lm(a){a=a|0;kV(a+8|0);if((a|0)==0){return}qI(a);return}function ln(a){a=a|0;kV(a+8|0);return}function lo(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;a=b+d|0;kV(b+(d+8)|0);if((a|0)==0){return}qI(a);return}function lp(a){a=a|0;kV(a+((c[(c[a>>2]|0)-12>>2]|0)+8)|0);return}function lq(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+8|0;e=d|0;f=b;g=c[(c[f>>2]|0)-12>>2]|0;h=b;if((c[h+(g+24)>>2]|0)==0){i=d;return}j=e|0;a[j]=0;c[e+4>>2]=b;do{if((c[h+(g+16)>>2]|0)==0){b=c[h+(g+72)>>2]|0;if((b|0)==0){k=g}else{lq(b);k=c[(c[f>>2]|0)-12>>2]|0}a[j]=1;b=c[h+(k+24)>>2]|0;if((b5[c[(c[b>>2]|0)+24>>2]&511](b)|0)!=-1){break}b=c[(c[f>>2]|0)-12>>2]|0;kU(h+b|0,c[h+(b+16)>>2]|1)}}while(0);lA(e);i=d;return}function lr(a){a=a|0;kV(a+8|0);if((a|0)==0){return}qI(a);return}function ls(a){a=a|0;kV(a+8|0);return}function lt(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;a=b+d|0;kV(b+(d+8)|0);if((a|0)==0){return}qI(a);return}function lu(a){a=a|0;kV(a+((c[(c[a>>2]|0)-12>>2]|0)+8)|0);return}function lv(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+8|0;e=d|0;f=b;g=c[(c[f>>2]|0)-12>>2]|0;h=b;if((c[h+(g+24)>>2]|0)==0){i=d;return}j=e|0;a[j]=0;c[e+4>>2]=b;do{if((c[h+(g+16)>>2]|0)==0){b=c[h+(g+72)>>2]|0;if((b|0)==0){k=g}else{lv(b);k=c[(c[f>>2]|0)-12>>2]|0}a[j]=1;b=c[h+(k+24)>>2]|0;if((b5[c[(c[b>>2]|0)+24>>2]&511](b)|0)!=-1){break}b=c[(c[f>>2]|0)-12>>2]|0;kU(h+b|0,c[h+(b+16)>>2]|1)}}while(0);lF(e);i=d;return}function lw(a){a=a|0;kV(a+4|0);if((a|0)==0){return}qI(a);return}function lx(a){a=a|0;kV(a+4|0);return}function ly(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;a=b+d|0;kV(b+(d+4)|0);if((a|0)==0){return}qI(a);return}function lz(a){a=a|0;kV(a+((c[(c[a>>2]|0)-12>>2]|0)+4)|0);return}function lA(a){a=a|0;var b=0,d=0,e=0;b=a+4|0;a=c[b>>2]|0;d=c[(c[a>>2]|0)-12>>2]|0;e=a;if((c[e+(d+24)>>2]|0)==0){return}if((c[e+(d+16)>>2]|0)!=0){return}if((c[e+(d+4)>>2]&8192|0)==0){return}if(bh()|0){return}d=c[b>>2]|0;e=c[d+((c[(c[d>>2]|0)-12>>2]|0)+24)>>2]|0;if((b5[c[(c[e>>2]|0)+24>>2]&511](e)|0)!=-1){return}e=c[b>>2]|0;b=c[(c[e>>2]|0)-12>>2]|0;d=e;kU(d+b|0,c[d+(b+16)>>2]|1);return}function lB(a){a=a|0;kV(a+4|0);if((a|0)==0){return}qI(a);return}function lC(a){a=a|0;kV(a+4|0);return}function lD(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;a=b+d|0;kV(b+(d+4)|0);if((a|0)==0){return}qI(a);return}function lE(a){a=a|0;kV(a+((c[(c[a>>2]|0)-12>>2]|0)+4)|0);return}function lF(a){a=a|0;var b=0,d=0,e=0;b=a+4|0;a=c[b>>2]|0;d=c[(c[a>>2]|0)-12>>2]|0;e=a;if((c[e+(d+24)>>2]|0)==0){return}if((c[e+(d+16)>>2]|0)!=0){return}if((c[e+(d+4)>>2]&8192|0)==0){return}if(bh()|0){return}d=c[b>>2]|0;e=c[d+((c[(c[d>>2]|0)-12>>2]|0)+24)>>2]|0;if((b5[c[(c[e>>2]|0)+24>>2]&511](e)|0)!=-1){return}e=c[b>>2]|0;b=c[(c[e>>2]|0)-12>>2]|0;d=e;kU(d+b|0,c[d+(b+16)>>2]|1);return}function lG(a){a=a|0;return 1404}function lH(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;if((e|0)==1){while(1){f=qH(48)|0;if((f|0)!=0){g=29;break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){g=26;break}b8[d&1]()}if((g|0)==26){d=bR(4)|0;c[d>>2]=3284;bl(d|0,24120,94)}else if((g|0)==29){c[b+8>>2]=f;c[b>>2]=49;c[b+4>>2]=35;qQ(f|0,1608,35)|0;a[f+35|0]=0;return}}f=bB(e|0)|0;e=qR(f|0)|0;if(e>>>0>4294967279>>>0){kF()}do{if(e>>>0<11>>>0){a[b]=e<<1;h=b+1|0}else{d=e+16&-16;i=(d|0)==0?1:d;while(1){j=qH(i)|0;if((j|0)!=0){g=17;break}k=(I=c[7664]|0,c[7664]=I+0,I);if((k|0)==0){break}b8[k&1]()}if((g|0)==17){c[b+8>>2]=j;c[b>>2]=d|1;c[b+4>>2]=e;h=j;break}i=bR(4)|0;c[i>>2]=3284;bl(i|0,24120,94)}}while(0);qQ(h|0,f|0,e)|0;a[h+e|0]=0;return}function lI(a){a=a|0;return}function lJ(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=3332;b=a+4|0;d=(c[b>>2]|0)-4|0;do{if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)-1|0)<0){e=(c[b>>2]|0)-12|0;if((e|0)!=0){qI(e)}if((a|0)!=0){break}return}}while(0);qI(a);return}function lK(a){a=a|0;var b=0;c[a>>2]=3332;b=a+4|0;a=(c[b>>2]|0)-4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)-1|0)>=0){return}a=(c[b>>2]|0)-12|0;if((a|0)==0){return}qI(a);return}function lL(a){a=a|0;kV(a);if((a|0)==0){return}qI(a);return}function lM(a){a=a|0;if((a|0)==0){return}qI(a);return}function lN(a){a=a|0;if((a|0)==0){return}qI(a);return}function lO(a){a=a|0;return}function lP(a){a=a|0;return}function lQ(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;L1:do{if((e|0)==(f|0)){g=c}else{b=c;h=e;while(1){if((b|0)==(d|0)){i=-1;j=11;break}k=a[b]|0;l=a[h]|0;if(k<<24>>24<l<<24>>24){i=-1;j=9;break}if(l<<24>>24<k<<24>>24){i=1;j=8;break}k=b+1|0;l=h+1|0;if((l|0)==(f|0)){g=k;break L1}else{b=k;h=l}}if((j|0)==9){return i|0}else if((j|0)==11){return i|0}else if((j|0)==8){return i|0}}}while(0);i=(g|0)!=(d|0)|0;return i|0}function lR(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;d=e;g=f-d|0;if(g>>>0>4294967279>>>0){kF()}do{if(g>>>0<11>>>0){a[b]=g<<1;h=b+1|0}else{i=g+16&-16;j=(i|0)==0?1:i;while(1){k=qH(j)|0;if((k|0)!=0){l=16;break}m=(I=c[7664]|0,c[7664]=I+0,I);if((m|0)==0){break}b8[m&1]()}if((l|0)==16){c[b+8>>2]=k;c[b>>2]=i|1;c[b+4>>2]=g;h=k;break}j=bR(4)|0;c[j>>2]=3284;bl(j|0,24120,94)}}while(0);if((e|0)==(f|0)){n=h;a[n]=0;return}k=-d|0;d=h;g=e;while(1){a[d]=a[g]|0;e=g+1|0;if((e|0)==(f|0)){break}else{d=d+1|0;g=e}}n=h+(f+k)|0;a[n]=0;return}function lS(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;if((c|0)==(d|0)){e=0;return e|0}else{f=c;g=0}while(1){c=(a[f]|0)+(g<<4)|0;b=c&-268435456;h=(b>>>24|b)^c;c=f+1|0;if((c|0)==(d|0)){e=h;break}else{f=c;g=h}}return e|0}function lT(a){a=a|0;if((a|0)==0){return}qI(a);return}function lU(a){a=a|0;return}function lV(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;L1:do{if((e|0)==(f|0)){g=b}else{a=b;h=e;while(1){if((a|0)==(d|0)){i=-1;j=10;break}k=c[a>>2]|0;l=c[h>>2]|0;if((k|0)<(l|0)){i=-1;j=11;break}if((l|0)<(k|0)){i=1;j=8;break}k=a+4|0;l=h+4|0;if((l|0)==(f|0)){g=k;break L1}else{a=k;h=l}}if((j|0)==10){return i|0}else if((j|0)==8){return i|0}else if((j|0)==11){return i|0}}}while(0);i=(g|0)!=(d|0)|0;return i|0}function lW(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;d=e;g=f-d|0;h=g>>2;if(h>>>0>1073741807>>>0){kF()}do{if(h>>>0<2>>>0){a[b]=g>>>1;i=b+4|0}else{j=h+4&-4;k=j<<2;l=(k|0)==0?1:k;while(1){m=qH(l)|0;if((m|0)!=0){n=16;break}k=(I=c[7664]|0,c[7664]=I+0,I);if((k|0)==0){break}b8[k&1]()}if((n|0)==16){l=m;c[b+8>>2]=l;c[b>>2]=j|1;c[b+4>>2]=h;i=l;break}l=bR(4)|0;c[l>>2]=3284;bl(l|0,24120,94)}}while(0);if((e|0)==(f|0)){o=i;c[o>>2]=0;return}h=f-4+(-d|0)|0;d=i;b=e;while(1){c[d>>2]=c[b>>2];e=b+4|0;if((e|0)==(f|0)){break}else{d=d+4|0;b=e}}o=i+((h>>>2)+1<<2)|0;c[o>>2]=0;return}function lX(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;if((b|0)==(d|0)){e=0;return e|0}else{f=b;g=0}while(1){b=(c[f>>2]|0)+(g<<4)|0;a=b&-268435456;h=(a>>>24|a)^b;b=f+4|0;if((b|0)==(d|0)){e=h;break}else{f=b;g=h}}return e|0}function lY(a){a=a|0;if((a|0)==0){return}qI(a);return}function lZ(a){a=a|0;return}
function l_(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;k=i;i=i+64|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=k|0;m=k+12|0;n=k+24|0;o=k+28|0;p=k+32|0;q=k+36|0;r=k+40|0;if((c[g+4>>2]&1|0)==0){c[n>>2]=-1;s=c[(c[d>>2]|0)+16>>2]|0;t=e|0;c[p>>2]=c[t>>2];c[q>>2]=c[f>>2];b6[s&127](o,d,p,q,g,h,n);q=c[o>>2]|0;c[t>>2]=q;t=c[n>>2]|0;if((t|0)==0){a[j]=0}else if((t|0)==1){a[j]=1}else{a[j]=1;c[h>>2]=4}c[b>>2]=q;i=k;return}q=g+28|0;g=c[q>>2]|0;t=g+4|0;I=c[t>>2]|0,c[t>>2]=I+1,I;if((c[7545]|0)!=-1){c[m>>2]=30180;c[m+4>>2]=48;c[m+8>>2]=0;kE(30180,m)}m=(c[7546]|0)-1|0;n=c[g+8>>2]|0;do{if((c[g+12>>2]|0)-n>>2>>>0>m>>>0){o=c[n+(m<<2)>>2]|0;if((o|0)==0){break}p=o;if(((I=c[t>>2]|0,c[t>>2]=I+ -1,I)|0)==0){b0[c[(c[g>>2]|0)+8>>2]&1023](g)}o=c[q>>2]|0;d=o+4|0;I=c[d>>2]|0,c[d>>2]=I+1,I;if((c[7453]|0)!=-1){c[l>>2]=29812;c[l+4>>2]=48;c[l+8>>2]=0;kE(29812,l)}s=(c[7454]|0)-1|0;u=c[o+8>>2]|0;do{if((c[o+12>>2]|0)-u>>2>>>0>s>>>0){v=c[u+(s<<2)>>2]|0;if((v|0)==0){break}w=v;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[o>>2]|0)+8>>2]&1023](o)}x=r|0;y=v;b1[c[(c[y>>2]|0)+24>>2]&255](x,w);v=r+12|0;b1[c[(c[y>>2]|0)+28>>2]&255](v,w);a[j]=(l$(e,c[f>>2]|0,x,r+24|0,p,h,1)|0)==(x|0)|0;c[b>>2]=c[e>>2];do{if((a[v]&1)!=0){x=c[r+20>>2]|0;if((x|0)==0){break}qI(x)}}while(0);if((a[r]&1)==0){i=k;return}v=c[r+8>>2]|0;if((v|0)==0){i=k;return}qI(v);i=k;return}}while(0);p=bR(4)|0;c[p>>2]=3308;bl(p|0,24132,322)}}while(0);k=bR(4)|0;c[k>>2]=3308;bl(k|0,24132,322)}function l$(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0;l=i;i=i+100|0;m=(g-f|0)/12|0;n=l|0;do{if(m>>>0>100>>>0){o=qH(m)|0;if((o|0)!=0){p=o;q=o;break}o=bR(4)|0;c[o>>2]=3284;bl(o|0,24120,94);return 0}else{p=n;q=0}}while(0);n=(f|0)==(g|0);if(n){r=m;s=0}else{o=m;m=0;t=p;u=f;while(1){v=d[u]|0;if((v&1|0)==0){w=v>>>1}else{w=c[u+4>>2]|0}if((w|0)==0){a[t]=2;x=m+1|0;y=o-1|0}else{a[t]=1;x=m;y=o}v=u+12|0;if((v|0)==(g|0)){r=y;s=x;break}else{o=y;m=x;t=t+1|0;u=v}}}u=b|0;b=h;t=0;x=s;s=r;r=e;L18:while(1){e=(s|0)!=0;m=t;y=r;while(1){o=c[u>>2]|0;do{if((o|0)==0){z=0}else{if((c[o+12>>2]|0)!=(c[o+16>>2]|0)){z=o;break}if((b5[c[(c[o>>2]|0)+36>>2]&511](o)|0)==-1){c[u>>2]=0;z=0;break}else{z=c[u>>2]|0;break}}}while(0);o=(z|0)==0;if((y|0)==0){A=z;B=0}else{if((c[y+12>>2]|0)==(c[y+16>>2]|0)){w=(b5[c[(c[y>>2]|0)+36>>2]&511](y)|0)==-1;C=w?0:y}else{C=y}A=c[u>>2]|0;B=C}D=(B|0)==0;if(!((o^D)&e)){break L18}o=c[A+12>>2]|0;if((o|0)==(c[A+16>>2]|0)){E=b5[c[(c[A>>2]|0)+36>>2]&511](A)|0}else{E=d[o]|0}o=E&255;if(k){F=o}else{F=b2[c[(c[b>>2]|0)+12>>2]&127](h,o)|0}G=m+1|0;if(n){m=G;y=B}else{break}}L46:do{if(k){y=s;e=x;o=p;w=0;v=f;while(1){do{if((a[o]|0)==1){H=a[v]|0;if((H&1)==0){I=v+1|0}else{I=c[v+8>>2]|0}if(F<<24>>24!=(a[I+m|0]|0)){a[o]=0;J=w;K=e;L=y-1|0;break}M=H&255;if((M&1|0)==0){N=M>>>1}else{N=c[v+4>>2]|0}if((N|0)!=(G|0)){J=1;K=e;L=y;break}a[o]=2;J=1;K=e+1|0;L=y-1|0}else{J=w;K=e;L=y}}while(0);M=v+12|0;if((M|0)==(g|0)){O=L;P=K;Q=J;break L46}y=L;e=K;o=o+1|0;w=J;v=M}}else{v=s;w=x;o=p;e=0;y=f;while(1){do{if((a[o]|0)==1){M=y;if((a[M]&1)==0){R=y+1|0}else{R=c[y+8>>2]|0}if(F<<24>>24!=(b2[c[(c[b>>2]|0)+12>>2]&127](h,a[R+m|0]|0)|0)<<24>>24){a[o]=0;S=e;T=w;U=v-1|0;break}H=d[M]|0;if((H&1|0)==0){V=H>>>1}else{V=c[y+4>>2]|0}if((V|0)!=(G|0)){S=1;T=w;U=v;break}a[o]=2;S=1;T=w+1|0;U=v-1|0}else{S=e;T=w;U=v}}while(0);H=y+12|0;if((H|0)==(g|0)){O=U;P=T;Q=S;break L46}v=U;w=T;o=o+1|0;e=S;y=H}}}while(0);if((Q&1)==0){t=G;x=P;s=O;r=B;continue}m=c[u>>2]|0;y=m+12|0;e=c[y>>2]|0;if((e|0)==(c[m+16>>2]|0)){b5[c[(c[m>>2]|0)+40>>2]&511](m)|0}else{c[y>>2]=e+1}if((O+P|0)>>>0<2>>>0){t=G;x=P;s=O;r=B;continue}else{W=P;X=p;Y=f}while(1){do{if((a[X]|0)==2){e=d[Y]|0;if((e&1|0)==0){Z=e>>>1}else{Z=c[Y+4>>2]|0}if((Z|0)==(G|0)){_=W;break}a[X]=0;_=W-1|0}else{_=W}}while(0);e=Y+12|0;if((e|0)==(g|0)){t=G;x=_;s=O;r=B;continue L18}else{W=_;X=X+1|0;Y=e}}}do{if((A|0)==0){$=0}else{if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){$=A;break}if((b5[c[(c[A>>2]|0)+36>>2]&511](A)|0)==-1){c[u>>2]=0;$=0;break}else{$=c[u>>2]|0;break}}}while(0);u=($|0)==0;do{if(D){aa=91}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){if(u){break}else{aa=93;break}}if((b5[c[(c[B>>2]|0)+36>>2]&511](B)|0)==-1){aa=91;break}if(!u){aa=93}}}while(0);if((aa|0)==91){if(u){aa=93}}if((aa|0)==93){c[j>>2]=c[j>>2]|2}L121:do{if(n){aa=98}else{u=f;B=p;while(1){if((a[B]|0)==2){ab=u;break L121}D=u+12|0;if((D|0)==(g|0)){aa=98;break L121}u=D;B=B+1|0}}}while(0);if((aa|0)==98){c[j>>2]=c[j>>2]|4;ab=g}if((q|0)==0){i=l;return ab|0}qI(q);i=l;return ab|0}function l0(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+228|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2];l=e+28|0;m=e+32|0;n=e+44|0;o=e+56|0;p=e+60|0;q=e+220|0;r=e+224|0;s=c[f>>2]|0;f=c[g>>2]|0;g=e|0;t=m;u=n;v=c[h+4>>2]&74;if((v|0)==64){w=8}else if((v|0)==0){w=0}else if((v|0)==8){w=16}else{w=10}mr(m,c[h+28>>2]|0,g,l);qP(u|0,0,12)|0;h=n;kI(n,10);if((a[u]&1)==0){v=h+1|0;x=v;y=v;z=n+8|0}else{v=n+8|0;x=c[v>>2]|0;y=h+1|0;z=v}c[o>>2]=x;v=p|0;c[q>>2]=v;c[r>>2]=0;A=n|0;B=n+4|0;C=a[l]|0;l=n+8|0;D=x;x=s;s=f;L11:while(1){do{if((x|0)==0){E=0}else{if((c[x+12>>2]|0)!=(c[x+16>>2]|0)){E=x;break}f=(b5[c[(c[x>>2]|0)+36>>2]&511](x)|0)==-1;E=f?0:x}}while(0);f=(E|0)==0;do{if((s|0)==0){F=19}else{if((c[s+12>>2]|0)!=(c[s+16>>2]|0)){if(f){G=0;H=s;break}else{I=D;J=s;K=0;L=E;M=0;break L11}}if((b5[c[(c[s>>2]|0)+36>>2]&511](s)|0)==-1){F=19;break}if(f){G=0;H=s}else{I=D;J=s;K=0;L=E;M=0;break L11}}}while(0);if((F|0)==19){F=0;if(f){I=D;J=0;K=1;L=0;M=1;break}else{G=1;H=0}}N=(c[o>>2]|0)-D|0;O=a[u]|0;P=O&255;if((N|0)==(((P&1|0)==0?P>>>1:c[B>>2]|0)|0)){P=N<<1;do{if(N>>>0<P>>>0){kI(n,N)}else{if((O&1)==0){a[h+1+P|0]=0;a[u]=N<<2;break}else{a[(c[l>>2]|0)+P|0]=0;c[B>>2]=P;break}}}while(0);P=a[u]|0;if((P&1)==0){Q=10;R=P}else{P=c[A>>2]|0;Q=(P&-2)-1|0;R=P&255}P=R&255;O=(P&1|0)==0?P>>>1:c[B>>2]|0;do{if(O>>>0<Q>>>0){kI(n,Q-O|0)}else{if((R&1)==0){a[h+1+Q|0]=0;a[u]=Q<<1;break}else{a[(c[l>>2]|0)+Q|0]=0;c[B>>2]=Q;break}}}while(0);if((a[u]&1)==0){S=y}else{S=c[z>>2]|0}c[o>>2]=S+N;T=S}else{T=D}O=E+12|0;P=c[O>>2]|0;U=E+16|0;if((P|0)==(c[U>>2]|0)){V=b5[c[(c[E>>2]|0)+36>>2]&511](E)|0}else{V=d[P]|0}if((ma(V&255,w,T,o,r,C,m,v,q,g)|0)!=0){I=T;J=H;K=G;L=E;M=f;break}P=c[O>>2]|0;if((P|0)==(c[U>>2]|0)){b5[c[(c[E>>2]|0)+40>>2]&511](E)|0;D=T;x=E;s=H;continue}else{c[O>>2]=P+1;D=T;x=E;s=H;continue}}H=d[t]|0;if((H&1|0)==0){W=H>>>1}else{W=c[m+4>>2]|0}do{if((W|0)!=0){H=c[q>>2]|0;if((H-p|0)>=160){break}s=c[r>>2]|0;c[q>>2]=H+4;c[H>>2]=s}}while(0);c[k>>2]=qe(I,c[o>>2]|0,j,w)|0;oc(m,v,c[q>>2]|0,j);do{if(M){X=0}else{if((c[L+12>>2]|0)!=(c[L+16>>2]|0)){X=L;break}q=(b5[c[(c[L>>2]|0)+36>>2]&511](L)|0)==-1;X=q?0:L}}while(0);L=(X|0)==0;do{if(K){F=68}else{if((c[J+12>>2]|0)==(c[J+16>>2]|0)){if((b5[c[(c[J>>2]|0)+36>>2]&511](J)|0)==-1){F=68;break}}if(!(L^(J|0)==0)){F=70}}}while(0);if((F|0)==68){if(L){F=70}}if((F|0)==70){c[j>>2]=c[j>>2]|2}c[b>>2]=X;do{if((a[u]&1)!=0){X=c[l>>2]|0;if((X|0)==0){break}qI(X)}}while(0);if((a[t]&1)==0){i=e;return}t=c[m+8>>2]|0;if((t|0)==0){i=e;return}qI(t);i=e;return}function l1(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;e=i;i=i+228|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2];l=e+28|0;m=e+32|0;n=e+44|0;o=e+56|0;p=e+60|0;q=e+220|0;r=e+224|0;s=c[f>>2]|0;f=c[g>>2]|0;g=e|0;t=m;u=n;v=c[h+4>>2]&74;if((v|0)==8){w=16}else if((v|0)==0){w=0}else if((v|0)==64){w=8}else{w=10}mr(m,c[h+28>>2]|0,g,l);qP(u|0,0,12)|0;h=n;kI(n,10);if((a[u]&1)==0){v=h+1|0;x=v;y=v;z=n+8|0}else{v=n+8|0;x=c[v>>2]|0;y=h+1|0;z=v}c[o>>2]=x;v=p|0;c[q>>2]=v;c[r>>2]=0;A=n|0;B=n+4|0;C=a[l]|0;l=n+8|0;D=x;x=s;s=f;L11:while(1){do{if((x|0)==0){E=0}else{if((c[x+12>>2]|0)!=(c[x+16>>2]|0)){E=x;break}f=(b5[c[(c[x>>2]|0)+36>>2]&511](x)|0)==-1;E=f?0:x}}while(0);f=(E|0)==0;do{if((s|0)==0){F=19}else{if((c[s+12>>2]|0)!=(c[s+16>>2]|0)){if(f){G=0;H=s;break}else{I=D;J=s;L=0;M=E;N=0;break L11}}if((b5[c[(c[s>>2]|0)+36>>2]&511](s)|0)==-1){F=19;break}if(f){G=0;H=s}else{I=D;J=s;L=0;M=E;N=0;break L11}}}while(0);if((F|0)==19){F=0;if(f){I=D;J=0;L=1;M=0;N=1;break}else{G=1;H=0}}O=(c[o>>2]|0)-D|0;P=a[u]|0;Q=P&255;if((O|0)==(((Q&1|0)==0?Q>>>1:c[B>>2]|0)|0)){Q=O<<1;do{if(O>>>0<Q>>>0){kI(n,O)}else{if((P&1)==0){a[h+1+Q|0]=0;a[u]=O<<2;break}else{a[(c[l>>2]|0)+Q|0]=0;c[B>>2]=Q;break}}}while(0);Q=a[u]|0;if((Q&1)==0){R=10;S=Q}else{Q=c[A>>2]|0;R=(Q&-2)-1|0;S=Q&255}Q=S&255;P=(Q&1|0)==0?Q>>>1:c[B>>2]|0;do{if(P>>>0<R>>>0){kI(n,R-P|0)}else{if((S&1)==0){a[h+1+R|0]=0;a[u]=R<<1;break}else{a[(c[l>>2]|0)+R|0]=0;c[B>>2]=R;break}}}while(0);if((a[u]&1)==0){T=y}else{T=c[z>>2]|0}c[o>>2]=T+O;U=T}else{U=D}P=E+12|0;Q=c[P>>2]|0;V=E+16|0;if((Q|0)==(c[V>>2]|0)){W=b5[c[(c[E>>2]|0)+36>>2]&511](E)|0}else{W=d[Q]|0}if((ma(W&255,w,U,o,r,C,m,v,q,g)|0)!=0){I=U;J=H;L=G;M=E;N=f;break}Q=c[P>>2]|0;if((Q|0)==(c[V>>2]|0)){b5[c[(c[E>>2]|0)+40>>2]&511](E)|0;D=U;x=E;s=H;continue}else{c[P>>2]=Q+1;D=U;x=E;s=H;continue}}H=d[t]|0;if((H&1|0)==0){X=H>>>1}else{X=c[m+4>>2]|0}do{if((X|0)!=0){H=c[q>>2]|0;if((H-p|0)>=160){break}s=c[r>>2]|0;c[q>>2]=H+4;c[H>>2]=s}}while(0);r=qd(I,c[o>>2]|0,j,w)|0;c[k>>2]=r;c[k+4>>2]=K;oc(m,v,c[q>>2]|0,j);do{if(N){Y=0}else{if((c[M+12>>2]|0)!=(c[M+16>>2]|0)){Y=M;break}q=(b5[c[(c[M>>2]|0)+36>>2]&511](M)|0)==-1;Y=q?0:M}}while(0);M=(Y|0)==0;do{if(L){F=68}else{if((c[J+12>>2]|0)==(c[J+16>>2]|0)){if((b5[c[(c[J>>2]|0)+36>>2]&511](J)|0)==-1){F=68;break}}if(!(M^(J|0)==0)){F=70}}}while(0);if((F|0)==68){if(M){F=70}}if((F|0)==70){c[j>>2]=c[j>>2]|2}c[b>>2]=Y;do{if((a[u]&1)!=0){Y=c[l>>2]|0;if((Y|0)==0){break}qI(Y)}}while(0);if((a[t]&1)==0){i=e;return}t=c[m+8>>2]|0;if((t|0)==0){i=e;return}qI(t);i=e;return}function l2(e,f,g,h,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;f=i;i=i+228|0;m=g;g=i;i=i+4|0;c[g>>2]=c[m>>2];m=h;h=i;i=i+4|0;c[h>>2]=c[m>>2];m=f+28|0;n=f+32|0;o=f+44|0;p=f+56|0;q=f+60|0;r=f+220|0;s=f+224|0;t=c[g>>2]|0;g=c[h>>2]|0;h=f|0;u=n;v=o;w=c[j+4>>2]&74;if((w|0)==64){x=8}else if((w|0)==0){x=0}else if((w|0)==8){x=16}else{x=10}mr(n,c[j+28>>2]|0,h,m);qP(v|0,0,12)|0;j=o;kI(o,10);if((a[v]&1)==0){w=j+1|0;y=w;z=w;A=o+8|0}else{w=o+8|0;y=c[w>>2]|0;z=j+1|0;A=w}c[p>>2]=y;w=q|0;c[r>>2]=w;c[s>>2]=0;B=o|0;C=o+4|0;D=a[m]|0;m=o+8|0;E=y;y=t;t=g;L11:while(1){do{if((y|0)==0){F=0}else{if((c[y+12>>2]|0)!=(c[y+16>>2]|0)){F=y;break}g=(b5[c[(c[y>>2]|0)+36>>2]&511](y)|0)==-1;F=g?0:y}}while(0);g=(F|0)==0;do{if((t|0)==0){G=19}else{if((c[t+12>>2]|0)!=(c[t+16>>2]|0)){if(g){H=0;I=t;break}else{J=E;K=t;L=0;M=F;N=0;break L11}}if((b5[c[(c[t>>2]|0)+36>>2]&511](t)|0)==-1){G=19;break}if(g){H=0;I=t}else{J=E;K=t;L=0;M=F;N=0;break L11}}}while(0);if((G|0)==19){G=0;if(g){J=E;K=0;L=1;M=0;N=1;break}else{H=1;I=0}}O=(c[p>>2]|0)-E|0;P=a[v]|0;Q=P&255;if((O|0)==(((Q&1|0)==0?Q>>>1:c[C>>2]|0)|0)){Q=O<<1;do{if(O>>>0<Q>>>0){kI(o,O)}else{if((P&1)==0){a[j+1+Q|0]=0;a[v]=O<<2;break}else{a[(c[m>>2]|0)+Q|0]=0;c[C>>2]=Q;break}}}while(0);Q=a[v]|0;if((Q&1)==0){R=10;S=Q}else{Q=c[B>>2]|0;R=(Q&-2)-1|0;S=Q&255}Q=S&255;P=(Q&1|0)==0?Q>>>1:c[C>>2]|0;do{if(P>>>0<R>>>0){kI(o,R-P|0)}else{if((S&1)==0){a[j+1+R|0]=0;a[v]=R<<1;break}else{a[(c[m>>2]|0)+R|0]=0;c[C>>2]=R;break}}}while(0);if((a[v]&1)==0){T=z}else{T=c[A>>2]|0}c[p>>2]=T+O;U=T}else{U=E}P=F+12|0;Q=c[P>>2]|0;V=F+16|0;if((Q|0)==(c[V>>2]|0)){W=b5[c[(c[F>>2]|0)+36>>2]&511](F)|0}else{W=d[Q]|0}if((ma(W&255,x,U,p,s,D,n,w,r,h)|0)!=0){J=U;K=I;L=H;M=F;N=g;break}Q=c[P>>2]|0;if((Q|0)==(c[V>>2]|0)){b5[c[(c[F>>2]|0)+40>>2]&511](F)|0;E=U;y=F;t=I;continue}else{c[P>>2]=Q+1;E=U;y=F;t=I;continue}}I=d[u]|0;if((I&1|0)==0){X=I>>>1}else{X=c[n+4>>2]|0}do{if((X|0)!=0){I=c[r>>2]|0;if((I-q|0)>=160){break}t=c[s>>2]|0;c[r>>2]=I+4;c[I>>2]=t}}while(0);b[l>>1]=qc(J,c[p>>2]|0,k,x)|0;oc(n,w,c[r>>2]|0,k);do{if(N){Y=0}else{if((c[M+12>>2]|0)!=(c[M+16>>2]|0)){Y=M;break}r=(b5[c[(c[M>>2]|0)+36>>2]&511](M)|0)==-1;Y=r?0:M}}while(0);M=(Y|0)==0;do{if(L){G=68}else{if((c[K+12>>2]|0)==(c[K+16>>2]|0)){if((b5[c[(c[K>>2]|0)+36>>2]&511](K)|0)==-1){G=68;break}}if(!(M^(K|0)==0)){G=70}}}while(0);if((G|0)==68){if(M){G=70}}if((G|0)==70){c[k>>2]=c[k>>2]|2}c[e>>2]=Y;do{if((a[v]&1)!=0){Y=c[m>>2]|0;if((Y|0)==0){break}qI(Y)}}while(0);if((a[u]&1)==0){i=f;return}u=c[n+8>>2]|0;if((u|0)==0){i=f;return}qI(u);i=f;return}function l3(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+228|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2];l=e+28|0;m=e+32|0;n=e+44|0;o=e+56|0;p=e+60|0;q=e+220|0;r=e+224|0;s=c[f>>2]|0;f=c[g>>2]|0;g=e|0;t=m;u=n;v=c[h+4>>2]&74;if((v|0)==8){w=16}else if((v|0)==0){w=0}else if((v|0)==64){w=8}else{w=10}mr(m,c[h+28>>2]|0,g,l);qP(u|0,0,12)|0;h=n;kI(n,10);if((a[u]&1)==0){v=h+1|0;x=v;y=v;z=n+8|0}else{v=n+8|0;x=c[v>>2]|0;y=h+1|0;z=v}c[o>>2]=x;v=p|0;c[q>>2]=v;c[r>>2]=0;A=n|0;B=n+4|0;C=a[l]|0;l=n+8|0;D=x;x=s;s=f;L11:while(1){do{if((x|0)==0){E=0}else{if((c[x+12>>2]|0)!=(c[x+16>>2]|0)){E=x;break}f=(b5[c[(c[x>>2]|0)+36>>2]&511](x)|0)==-1;E=f?0:x}}while(0);f=(E|0)==0;do{if((s|0)==0){F=19}else{if((c[s+12>>2]|0)!=(c[s+16>>2]|0)){if(f){G=0;H=s;break}else{I=D;J=s;K=0;L=E;M=0;break L11}}if((b5[c[(c[s>>2]|0)+36>>2]&511](s)|0)==-1){F=19;break}if(f){G=0;H=s}else{I=D;J=s;K=0;L=E;M=0;break L11}}}while(0);if((F|0)==19){F=0;if(f){I=D;J=0;K=1;L=0;M=1;break}else{G=1;H=0}}N=(c[o>>2]|0)-D|0;O=a[u]|0;P=O&255;if((N|0)==(((P&1|0)==0?P>>>1:c[B>>2]|0)|0)){P=N<<1;do{if(N>>>0<P>>>0){kI(n,N)}else{if((O&1)==0){a[h+1+P|0]=0;a[u]=N<<2;break}else{a[(c[l>>2]|0)+P|0]=0;c[B>>2]=P;break}}}while(0);P=a[u]|0;if((P&1)==0){Q=10;R=P}else{P=c[A>>2]|0;Q=(P&-2)-1|0;R=P&255}P=R&255;O=(P&1|0)==0?P>>>1:c[B>>2]|0;do{if(O>>>0<Q>>>0){kI(n,Q-O|0)}else{if((R&1)==0){a[h+1+Q|0]=0;a[u]=Q<<1;break}else{a[(c[l>>2]|0)+Q|0]=0;c[B>>2]=Q;break}}}while(0);if((a[u]&1)==0){S=y}else{S=c[z>>2]|0}c[o>>2]=S+N;T=S}else{T=D}O=E+12|0;P=c[O>>2]|0;U=E+16|0;if((P|0)==(c[U>>2]|0)){V=b5[c[(c[E>>2]|0)+36>>2]&511](E)|0}else{V=d[P]|0}if((ma(V&255,w,T,o,r,C,m,v,q,g)|0)!=0){I=T;J=H;K=G;L=E;M=f;break}P=c[O>>2]|0;if((P|0)==(c[U>>2]|0)){b5[c[(c[E>>2]|0)+40>>2]&511](E)|0;D=T;x=E;s=H;continue}else{c[O>>2]=P+1;D=T;x=E;s=H;continue}}H=d[t]|0;if((H&1|0)==0){W=H>>>1}else{W=c[m+4>>2]|0}do{if((W|0)!=0){H=c[q>>2]|0;if((H-p|0)>=160){break}s=c[r>>2]|0;c[q>>2]=H+4;c[H>>2]=s}}while(0);c[k>>2]=qb(I,c[o>>2]|0,j,w)|0;oc(m,v,c[q>>2]|0,j);do{if(M){X=0}else{if((c[L+12>>2]|0)!=(c[L+16>>2]|0)){X=L;break}q=(b5[c[(c[L>>2]|0)+36>>2]&511](L)|0)==-1;X=q?0:L}}while(0);L=(X|0)==0;do{if(K){F=68}else{if((c[J+12>>2]|0)==(c[J+16>>2]|0)){if((b5[c[(c[J>>2]|0)+36>>2]&511](J)|0)==-1){F=68;break}}if(!(L^(J|0)==0)){F=70}}}while(0);if((F|0)==68){if(L){F=70}}if((F|0)==70){c[j>>2]=c[j>>2]|2}c[b>>2]=X;do{if((a[u]&1)!=0){X=c[l>>2]|0;if((X|0)==0){break}qI(X)}}while(0);if((a[t]&1)==0){i=e;return}t=c[m+8>>2]|0;if((t|0)==0){i=e;return}qI(t);i=e;return}function l4(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+228|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2];l=e+28|0;m=e+32|0;n=e+44|0;o=e+56|0;p=e+60|0;q=e+220|0;r=e+224|0;s=c[f>>2]|0;f=c[g>>2]|0;g=e|0;t=m;u=n;v=c[h+4>>2]&74;if((v|0)==64){w=8}else if((v|0)==0){w=0}else if((v|0)==8){w=16}else{w=10}mr(m,c[h+28>>2]|0,g,l);qP(u|0,0,12)|0;h=n;kI(n,10);if((a[u]&1)==0){v=h+1|0;x=v;y=v;z=n+8|0}else{v=n+8|0;x=c[v>>2]|0;y=h+1|0;z=v}c[o>>2]=x;v=p|0;c[q>>2]=v;c[r>>2]=0;A=n|0;B=n+4|0;C=a[l]|0;l=n+8|0;D=x;x=s;s=f;L11:while(1){do{if((x|0)==0){E=0}else{if((c[x+12>>2]|0)!=(c[x+16>>2]|0)){E=x;break}f=(b5[c[(c[x>>2]|0)+36>>2]&511](x)|0)==-1;E=f?0:x}}while(0);f=(E|0)==0;do{if((s|0)==0){F=19}else{if((c[s+12>>2]|0)!=(c[s+16>>2]|0)){if(f){G=0;H=s;break}else{I=D;J=s;K=0;L=E;M=0;break L11}}if((b5[c[(c[s>>2]|0)+36>>2]&511](s)|0)==-1){F=19;break}if(f){G=0;H=s}else{I=D;J=s;K=0;L=E;M=0;break L11}}}while(0);if((F|0)==19){F=0;if(f){I=D;J=0;K=1;L=0;M=1;break}else{G=1;H=0}}N=(c[o>>2]|0)-D|0;O=a[u]|0;P=O&255;if((N|0)==(((P&1|0)==0?P>>>1:c[B>>2]|0)|0)){P=N<<1;do{if(N>>>0<P>>>0){kI(n,N)}else{if((O&1)==0){a[h+1+P|0]=0;a[u]=N<<2;break}else{a[(c[l>>2]|0)+P|0]=0;c[B>>2]=P;break}}}while(0);P=a[u]|0;if((P&1)==0){Q=10;R=P}else{P=c[A>>2]|0;Q=(P&-2)-1|0;R=P&255}P=R&255;O=(P&1|0)==0?P>>>1:c[B>>2]|0;do{if(O>>>0<Q>>>0){kI(n,Q-O|0)}else{if((R&1)==0){a[h+1+Q|0]=0;a[u]=Q<<1;break}else{a[(c[l>>2]|0)+Q|0]=0;c[B>>2]=Q;break}}}while(0);if((a[u]&1)==0){S=y}else{S=c[z>>2]|0}c[o>>2]=S+N;T=S}else{T=D}O=E+12|0;P=c[O>>2]|0;U=E+16|0;if((P|0)==(c[U>>2]|0)){V=b5[c[(c[E>>2]|0)+36>>2]&511](E)|0}else{V=d[P]|0}if((ma(V&255,w,T,o,r,C,m,v,q,g)|0)!=0){I=T;J=H;K=G;L=E;M=f;break}P=c[O>>2]|0;if((P|0)==(c[U>>2]|0)){b5[c[(c[E>>2]|0)+40>>2]&511](E)|0;D=T;x=E;s=H;continue}else{c[O>>2]=P+1;D=T;x=E;s=H;continue}}H=d[t]|0;if((H&1|0)==0){W=H>>>1}else{W=c[m+4>>2]|0}do{if((W|0)!=0){H=c[q>>2]|0;if((H-p|0)>=160){break}s=c[r>>2]|0;c[q>>2]=H+4;c[H>>2]=s}}while(0);c[k>>2]=qa(I,c[o>>2]|0,j,w)|0;oc(m,v,c[q>>2]|0,j);do{if(M){X=0}else{if((c[L+12>>2]|0)!=(c[L+16>>2]|0)){X=L;break}q=(b5[c[(c[L>>2]|0)+36>>2]&511](L)|0)==-1;X=q?0:L}}while(0);L=(X|0)==0;do{if(K){F=68}else{if((c[J+12>>2]|0)==(c[J+16>>2]|0)){if((b5[c[(c[J>>2]|0)+36>>2]&511](J)|0)==-1){F=68;break}}if(!(L^(J|0)==0)){F=70}}}while(0);if((F|0)==68){if(L){F=70}}if((F|0)==70){c[j>>2]=c[j>>2]|2}c[b>>2]=X;do{if((a[u]&1)!=0){X=c[l>>2]|0;if((X|0)==0){break}qI(X)}}while(0);if((a[t]&1)==0){i=e;return}t=c[m+8>>2]|0;if((t|0)==0){i=e;return}qI(t);i=e;return}function l5(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;e=i;i=i+228|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2];l=e+28|0;m=e+32|0;n=e+44|0;o=e+56|0;p=e+60|0;q=e+220|0;r=e+224|0;s=c[f>>2]|0;f=c[g>>2]|0;g=e|0;t=m;u=n;v=c[h+4>>2]&74;if((v|0)==8){w=16}else if((v|0)==0){w=0}else if((v|0)==64){w=8}else{w=10}mr(m,c[h+28>>2]|0,g,l);qP(u|0,0,12)|0;h=n;kI(n,10);if((a[u]&1)==0){v=h+1|0;x=v;y=v;z=n+8|0}else{v=n+8|0;x=c[v>>2]|0;y=h+1|0;z=v}c[o>>2]=x;v=p|0;c[q>>2]=v;c[r>>2]=0;A=n|0;B=n+4|0;C=a[l]|0;l=n+8|0;D=x;x=s;s=f;L11:while(1){do{if((x|0)==0){E=0}else{if((c[x+12>>2]|0)!=(c[x+16>>2]|0)){E=x;break}f=(b5[c[(c[x>>2]|0)+36>>2]&511](x)|0)==-1;E=f?0:x}}while(0);f=(E|0)==0;do{if((s|0)==0){F=19}else{if((c[s+12>>2]|0)!=(c[s+16>>2]|0)){if(f){G=0;H=s;break}else{I=D;J=s;L=0;M=E;N=0;break L11}}if((b5[c[(c[s>>2]|0)+36>>2]&511](s)|0)==-1){F=19;break}if(f){G=0;H=s}else{I=D;J=s;L=0;M=E;N=0;break L11}}}while(0);if((F|0)==19){F=0;if(f){I=D;J=0;L=1;M=0;N=1;break}else{G=1;H=0}}O=(c[o>>2]|0)-D|0;P=a[u]|0;Q=P&255;if((O|0)==(((Q&1|0)==0?Q>>>1:c[B>>2]|0)|0)){Q=O<<1;do{if(O>>>0<Q>>>0){kI(n,O)}else{if((P&1)==0){a[h+1+Q|0]=0;a[u]=O<<2;break}else{a[(c[l>>2]|0)+Q|0]=0;c[B>>2]=Q;break}}}while(0);Q=a[u]|0;if((Q&1)==0){R=10;S=Q}else{Q=c[A>>2]|0;R=(Q&-2)-1|0;S=Q&255}Q=S&255;P=(Q&1|0)==0?Q>>>1:c[B>>2]|0;do{if(P>>>0<R>>>0){kI(n,R-P|0)}else{if((S&1)==0){a[h+1+R|0]=0;a[u]=R<<1;break}else{a[(c[l>>2]|0)+R|0]=0;c[B>>2]=R;break}}}while(0);if((a[u]&1)==0){T=y}else{T=c[z>>2]|0}c[o>>2]=T+O;U=T}else{U=D}P=E+12|0;Q=c[P>>2]|0;V=E+16|0;if((Q|0)==(c[V>>2]|0)){W=b5[c[(c[E>>2]|0)+36>>2]&511](E)|0}else{W=d[Q]|0}if((ma(W&255,w,U,o,r,C,m,v,q,g)|0)!=0){I=U;J=H;L=G;M=E;N=f;break}Q=c[P>>2]|0;if((Q|0)==(c[V>>2]|0)){b5[c[(c[E>>2]|0)+40>>2]&511](E)|0;D=U;x=E;s=H;continue}else{c[P>>2]=Q+1;D=U;x=E;s=H;continue}}H=d[t]|0;if((H&1|0)==0){X=H>>>1}else{X=c[m+4>>2]|0}do{if((X|0)!=0){H=c[q>>2]|0;if((H-p|0)>=160){break}s=c[r>>2]|0;c[q>>2]=H+4;c[H>>2]=s}}while(0);r=p9(I,c[o>>2]|0,j,w)|0;c[k>>2]=r;c[k+4>>2]=K;oc(m,v,c[q>>2]|0,j);do{if(N){Y=0}else{if((c[M+12>>2]|0)!=(c[M+16>>2]|0)){Y=M;break}q=(b5[c[(c[M>>2]|0)+36>>2]&511](M)|0)==-1;Y=q?0:M}}while(0);M=(Y|0)==0;do{if(L){F=68}else{if((c[J+12>>2]|0)==(c[J+16>>2]|0)){if((b5[c[(c[J>>2]|0)+36>>2]&511](J)|0)==-1){F=68;break}}if(!(M^(J|0)==0)){F=70}}}while(0);if((F|0)==68){if(M){F=70}}if((F|0)==70){c[j>>2]=c[j>>2]|2}c[b>>2]=Y;do{if((a[u]&1)!=0){Y=c[l>>2]|0;if((Y|0)==0){break}qI(Y)}}while(0);if((a[t]&1)==0){i=e;return}t=c[m+8>>2]|0;if((t|0)==0){i=e;return}qI(t);i=e;return}function l6(b,e,f,h,j,k,l){b=b|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0;e=i;i=i+244|0;m=f;f=i;i=i+4|0;c[f>>2]=c[m>>2];m=h;h=i;i=i+4|0;c[h>>2]=c[m>>2];m=e+32|0;n=e+36|0;o=e+40|0;p=e+52|0;q=e+64|0;r=e+68|0;s=e+228|0;t=e+232|0;u=e+236|0;v=e+240|0;w=c[f>>2]|0;f=c[h>>2]|0;h=e|0;x=o;y=p;ms(o,c[j+28>>2]|0,h,m,n);qP(y|0,0,12)|0;j=p;kI(p,10);if((a[y]&1)==0){z=j+1|0;A=z;B=z;C=p+8|0}else{z=p+8|0;A=c[z>>2]|0;B=j+1|0;C=z}c[q>>2]=A;z=r|0;c[s>>2]=z;c[t>>2]=0;a[u]=1;a[v]=69;D=p|0;E=p+4|0;F=a[m]|0;m=a[n]|0;n=p+8|0;G=A;A=w;w=f;L6:while(1){do{if((A|0)==0){H=0}else{if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){H=A;break}f=(b5[c[(c[A>>2]|0)+36>>2]&511](A)|0)==-1;H=f?0:A}}while(0);f=(H|0)==0;do{if((w|0)==0){I=15}else{if((c[w+12>>2]|0)!=(c[w+16>>2]|0)){if(f){J=0;K=w;break}else{L=G;M=w;N=0;O=H;P=0;break L6}}if((b5[c[(c[w>>2]|0)+36>>2]&511](w)|0)==-1){I=15;break}if(f){J=0;K=w}else{L=G;M=w;N=0;O=H;P=0;break L6}}}while(0);if((I|0)==15){I=0;if(f){L=G;M=0;N=1;O=0;P=1;break}else{J=1;K=0}}Q=(c[q>>2]|0)-G|0;R=a[y]|0;S=R&255;if((Q|0)==(((S&1|0)==0?S>>>1:c[E>>2]|0)|0)){S=Q<<1;do{if(Q>>>0<S>>>0){kI(p,Q)}else{if((R&1)==0){a[j+1+S|0]=0;a[y]=Q<<2;break}else{a[(c[n>>2]|0)+S|0]=0;c[E>>2]=S;break}}}while(0);S=a[y]|0;if((S&1)==0){T=10;U=S}else{S=c[D>>2]|0;T=(S&-2)-1|0;U=S&255}S=U&255;R=(S&1|0)==0?S>>>1:c[E>>2]|0;do{if(R>>>0<T>>>0){kI(p,T-R|0)}else{if((U&1)==0){a[j+1+T|0]=0;a[y]=T<<1;break}else{a[(c[n>>2]|0)+T|0]=0;c[E>>2]=T;break}}}while(0);if((a[y]&1)==0){V=B}else{V=c[C>>2]|0}c[q>>2]=V+Q;W=V}else{W=G}R=H+12|0;S=c[R>>2]|0;X=H+16|0;if((S|0)==(c[X>>2]|0)){Y=b5[c[(c[H>>2]|0)+36>>2]&511](H)|0}else{Y=d[S]|0}if((mt(Y&255,u,v,W,q,F,m,o,z,s,t,h)|0)!=0){L=W;M=K;N=J;O=H;P=f;break}S=c[R>>2]|0;if((S|0)==(c[X>>2]|0)){b5[c[(c[H>>2]|0)+40>>2]&511](H)|0;G=W;A=H;w=K;continue}else{c[R>>2]=S+1;G=W;A=H;w=K;continue}}K=d[x]|0;if((K&1|0)==0){Z=K>>>1}else{Z=c[o+4>>2]|0}do{if((Z|0)!=0){if((a[u]&1)==0){break}K=c[s>>2]|0;if((K-r|0)>=160){break}w=c[t>>2]|0;c[s>>2]=K+4;c[K>>2]=w}}while(0);g[l>>2]=+p8(L,c[q>>2]|0,k);oc(o,z,c[s>>2]|0,k);do{if(P){_=0}else{if((c[O+12>>2]|0)!=(c[O+16>>2]|0)){_=O;break}s=(b5[c[(c[O>>2]|0)+36>>2]&511](O)|0)==-1;_=s?0:O}}while(0);O=(_|0)==0;do{if(N){I=65}else{if((c[M+12>>2]|0)==(c[M+16>>2]|0)){if((b5[c[(c[M>>2]|0)+36>>2]&511](M)|0)==-1){I=65;break}}if(!(O^(M|0)==0)){I=67}}}while(0);if((I|0)==65){if(O){I=67}}if((I|0)==67){c[k>>2]=c[k>>2]|2}c[b>>2]=_;do{if((a[y]&1)!=0){_=c[n>>2]|0;if((_|0)==0){break}qI(_)}}while(0);if((a[x]&1)==0){i=e;return}x=c[o+8>>2]|0;if((x|0)==0){i=e;return}qI(x);i=e;return}function l7(b,e,f,g,j,l,m){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0.0,aa=0;e=i;i=i+244|0;n=f;f=i;i=i+4|0;c[f>>2]=c[n>>2];n=g;g=i;i=i+4|0;c[g>>2]=c[n>>2];n=e+32|0;o=e+36|0;p=e+40|0;q=e+52|0;r=e+64|0;s=e+68|0;t=e+228|0;u=e+232|0;v=e+236|0;w=e+240|0;x=c[f>>2]|0;f=c[g>>2]|0;g=e|0;y=p;z=q;ms(p,c[j+28>>2]|0,g,n,o);qP(z|0,0,12)|0;j=q;kI(q,10);if((a[z]&1)==0){A=j+1|0;B=A;C=A;D=q+8|0}else{A=q+8|0;B=c[A>>2]|0;C=j+1|0;D=A}c[r>>2]=B;A=s|0;c[t>>2]=A;c[u>>2]=0;a[v]=1;a[w]=69;E=q|0;F=q+4|0;G=a[n]|0;n=a[o]|0;o=q+8|0;H=B;B=x;x=f;L6:while(1){do{if((B|0)==0){I=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){I=B;break}f=(b5[c[(c[B>>2]|0)+36>>2]&511](B)|0)==-1;I=f?0:B}}while(0);f=(I|0)==0;do{if((x|0)==0){J=15}else{if((c[x+12>>2]|0)!=(c[x+16>>2]|0)){if(f){K=0;L=x;break}else{M=H;N=x;O=0;P=I;Q=0;break L6}}if((b5[c[(c[x>>2]|0)+36>>2]&511](x)|0)==-1){J=15;break}if(f){K=0;L=x}else{M=H;N=x;O=0;P=I;Q=0;break L6}}}while(0);if((J|0)==15){J=0;if(f){M=H;N=0;O=1;P=0;Q=1;break}else{K=1;L=0}}R=(c[r>>2]|0)-H|0;S=a[z]|0;T=S&255;if((R|0)==(((T&1|0)==0?T>>>1:c[F>>2]|0)|0)){T=R<<1;do{if(R>>>0<T>>>0){kI(q,R)}else{if((S&1)==0){a[j+1+T|0]=0;a[z]=R<<2;break}else{a[(c[o>>2]|0)+T|0]=0;c[F>>2]=T;break}}}while(0);T=a[z]|0;if((T&1)==0){U=10;V=T}else{T=c[E>>2]|0;U=(T&-2)-1|0;V=T&255}T=V&255;S=(T&1|0)==0?T>>>1:c[F>>2]|0;do{if(S>>>0<U>>>0){kI(q,U-S|0)}else{if((V&1)==0){a[j+1+U|0]=0;a[z]=U<<1;break}else{a[(c[o>>2]|0)+U|0]=0;c[F>>2]=U;break}}}while(0);if((a[z]&1)==0){W=C}else{W=c[D>>2]|0}c[r>>2]=W+R;X=W}else{X=H}S=I+12|0;T=c[S>>2]|0;Y=I+16|0;if((T|0)==(c[Y>>2]|0)){Z=b5[c[(c[I>>2]|0)+36>>2]&511](I)|0}else{Z=d[T]|0}if((mt(Z&255,v,w,X,r,G,n,p,A,t,u,g)|0)!=0){M=X;N=L;O=K;P=I;Q=f;break}T=c[S>>2]|0;if((T|0)==(c[Y>>2]|0)){b5[c[(c[I>>2]|0)+40>>2]&511](I)|0;H=X;B=I;x=L;continue}else{c[S>>2]=T+1;H=X;B=I;x=L;continue}}L=d[y]|0;if((L&1|0)==0){_=L>>>1}else{_=c[p+4>>2]|0}do{if((_|0)!=0){if((a[v]&1)==0){break}L=c[t>>2]|0;if((L-s|0)>=160){break}x=c[u>>2]|0;c[t>>2]=L+4;c[L>>2]=x}}while(0);$=+p7(M,c[r>>2]|0,l);h[k>>3]=$,c[m>>2]=c[k>>2],c[m+4>>2]=c[k+4>>2];oc(p,A,c[t>>2]|0,l);do{if(Q){aa=0}else{if((c[P+12>>2]|0)!=(c[P+16>>2]|0)){aa=P;break}t=(b5[c[(c[P>>2]|0)+36>>2]&511](P)|0)==-1;aa=t?0:P}}while(0);P=(aa|0)==0;do{if(O){J=65}else{if((c[N+12>>2]|0)==(c[N+16>>2]|0)){if((b5[c[(c[N>>2]|0)+36>>2]&511](N)|0)==-1){J=65;break}}if(!(P^(N|0)==0)){J=67}}}while(0);if((J|0)==65){if(P){J=67}}if((J|0)==67){c[l>>2]=c[l>>2]|2}c[b>>2]=aa;do{if((a[z]&1)!=0){aa=c[o>>2]|0;if((aa|0)==0){break}qI(aa)}}while(0);if((a[y]&1)==0){i=e;return}y=c[p+8>>2]|0;if((y|0)==0){i=e;return}qI(y);i=e;return}function l8(b,e,f,g,j,l,m){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0.0,aa=0;e=i;i=i+244|0;n=f;f=i;i=i+4|0;c[f>>2]=c[n>>2];n=g;g=i;i=i+4|0;c[g>>2]=c[n>>2];n=e+32|0;o=e+36|0;p=e+40|0;q=e+52|0;r=e+64|0;s=e+68|0;t=e+228|0;u=e+232|0;v=e+236|0;w=e+240|0;x=c[f>>2]|0;f=c[g>>2]|0;g=e|0;y=p;z=q;ms(p,c[j+28>>2]|0,g,n,o);qP(z|0,0,12)|0;j=q;kI(q,10);if((a[z]&1)==0){A=j+1|0;B=A;C=A;D=q+8|0}else{A=q+8|0;B=c[A>>2]|0;C=j+1|0;D=A}c[r>>2]=B;A=s|0;c[t>>2]=A;c[u>>2]=0;a[v]=1;a[w]=69;E=q|0;F=q+4|0;G=a[n]|0;n=a[o]|0;o=q+8|0;H=B;B=x;x=f;L6:while(1){do{if((B|0)==0){I=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){I=B;break}f=(b5[c[(c[B>>2]|0)+36>>2]&511](B)|0)==-1;I=f?0:B}}while(0);f=(I|0)==0;do{if((x|0)==0){J=15}else{if((c[x+12>>2]|0)!=(c[x+16>>2]|0)){if(f){K=0;L=x;break}else{M=H;N=x;O=0;P=I;Q=0;break L6}}if((b5[c[(c[x>>2]|0)+36>>2]&511](x)|0)==-1){J=15;break}if(f){K=0;L=x}else{M=H;N=x;O=0;P=I;Q=0;break L6}}}while(0);if((J|0)==15){J=0;if(f){M=H;N=0;O=1;P=0;Q=1;break}else{K=1;L=0}}R=(c[r>>2]|0)-H|0;S=a[z]|0;T=S&255;if((R|0)==(((T&1|0)==0?T>>>1:c[F>>2]|0)|0)){T=R<<1;do{if(R>>>0<T>>>0){kI(q,R)}else{if((S&1)==0){a[j+1+T|0]=0;a[z]=R<<2;break}else{a[(c[o>>2]|0)+T|0]=0;c[F>>2]=T;break}}}while(0);T=a[z]|0;if((T&1)==0){U=10;V=T}else{T=c[E>>2]|0;U=(T&-2)-1|0;V=T&255}T=V&255;S=(T&1|0)==0?T>>>1:c[F>>2]|0;do{if(S>>>0<U>>>0){kI(q,U-S|0)}else{if((V&1)==0){a[j+1+U|0]=0;a[z]=U<<1;break}else{a[(c[o>>2]|0)+U|0]=0;c[F>>2]=U;break}}}while(0);if((a[z]&1)==0){W=C}else{W=c[D>>2]|0}c[r>>2]=W+R;X=W}else{X=H}S=I+12|0;T=c[S>>2]|0;Y=I+16|0;if((T|0)==(c[Y>>2]|0)){Z=b5[c[(c[I>>2]|0)+36>>2]&511](I)|0}else{Z=d[T]|0}if((mt(Z&255,v,w,X,r,G,n,p,A,t,u,g)|0)!=0){M=X;N=L;O=K;P=I;Q=f;break}T=c[S>>2]|0;if((T|0)==(c[Y>>2]|0)){b5[c[(c[I>>2]|0)+40>>2]&511](I)|0;H=X;B=I;x=L;continue}else{c[S>>2]=T+1;H=X;B=I;x=L;continue}}L=d[y]|0;if((L&1|0)==0){_=L>>>1}else{_=c[p+4>>2]|0}do{if((_|0)!=0){if((a[v]&1)==0){break}L=c[t>>2]|0;if((L-s|0)>=160){break}x=c[u>>2]|0;c[t>>2]=L+4;c[L>>2]=x}}while(0);$=+p6(M,c[r>>2]|0,l);h[k>>3]=$,c[m>>2]=c[k>>2],c[m+4>>2]=c[k+4>>2];oc(p,A,c[t>>2]|0,l);do{if(Q){aa=0}else{if((c[P+12>>2]|0)!=(c[P+16>>2]|0)){aa=P;break}t=(b5[c[(c[P>>2]|0)+36>>2]&511](P)|0)==-1;aa=t?0:P}}while(0);P=(aa|0)==0;do{if(O){J=65}else{if((c[N+12>>2]|0)==(c[N+16>>2]|0)){if((b5[c[(c[N>>2]|0)+36>>2]&511](N)|0)==-1){J=65;break}}if(!(P^(N|0)==0)){J=67}}}while(0);if((J|0)==65){if(P){J=67}}if((J|0)==67){c[l>>2]=c[l>>2]|2}c[b>>2]=aa;do{if((a[z]&1)!=0){aa=c[o>>2]|0;if((aa|0)==0){break}qI(aa)}}while(0);if((a[y]&1)==0){i=e;return}y=c[p+8>>2]|0;if((y|0)==0){i=e;return}qI(y);i=e;return}function l9(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+52|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2];l=e|0;m=e+12|0;n=e+40|0;o=n;p=i;i=i+12|0;q=i;i=i+4|0;r=i;i=i+160|0;s=i;i=i+4|0;t=i;i=i+4|0;qP(o|0,0,12)|0;u=p;v=c[h+28>>2]|0;h=v+4|0;I=c[h>>2]|0,c[h>>2]=I+1,I;if((c[7545]|0)!=-1){c[l>>2]=30180;c[l+4>>2]=48;c[l+8>>2]=0;kE(30180,l)}l=(c[7546]|0)-1|0;w=c[v+8>>2]|0;do{if((c[v+12>>2]|0)-w>>2>>>0>l>>>0){x=c[w+(l<<2)>>2]|0;if((x|0)==0){break}y=m|0;cd[c[(c[x>>2]|0)+32>>2]&15](x,26776,26802,y)|0;if(((I=c[h>>2]|0,c[h>>2]=I+ -1,I)|0)==0){b0[c[(c[v>>2]|0)+8>>2]&1023](v)}qP(u|0,0,12)|0;x=p;kI(p,10);if((a[u]&1)==0){z=x+1|0;A=z;B=z;C=p+8|0}else{z=p+8|0;A=c[z>>2]|0;B=x+1|0;C=z}c[q>>2]=A;z=r|0;c[s>>2]=z;c[t>>2]=0;D=f|0;E=g|0;F=p|0;G=p+4|0;H=p+8|0;J=A;K=c[D>>2]|0;L16:while(1){do{if((K|0)==0){L=0}else{if((c[K+12>>2]|0)!=(c[K+16>>2]|0)){L=K;break}if((b5[c[(c[K>>2]|0)+36>>2]&511](K)|0)!=-1){L=K;break}c[D>>2]=0;L=0}}while(0);M=(L|0)==0;N=c[E>>2]|0;do{if((N|0)==0){O=26}else{if((c[N+12>>2]|0)!=(c[N+16>>2]|0)){if(M){break}else{P=J;break L16}}if((b5[c[(c[N>>2]|0)+36>>2]&511](N)|0)==-1){c[E>>2]=0;O=26;break}else{if(M){break}else{P=J;break L16}}}}while(0);if((O|0)==26){O=0;if(M){P=J;break}}N=(c[q>>2]|0)-J|0;Q=a[u]|0;R=Q&255;if((N|0)==(((R&1|0)==0?R>>>1:c[G>>2]|0)|0)){R=N<<1;do{if(N>>>0<R>>>0){kI(p,N)}else{if((Q&1)==0){a[x+1+R|0]=0;a[u]=N<<2;break}else{a[(c[H>>2]|0)+R|0]=0;c[G>>2]=R;break}}}while(0);R=a[u]|0;if((R&1)==0){S=10;T=R}else{R=c[F>>2]|0;S=(R&-2)-1|0;T=R&255}R=T&255;Q=(R&1|0)==0?R>>>1:c[G>>2]|0;do{if(Q>>>0<S>>>0){kI(p,S-Q|0)}else{if((T&1)==0){a[x+1+S|0]=0;a[u]=S<<1;break}else{a[(c[H>>2]|0)+S|0]=0;c[G>>2]=S;break}}}while(0);if((a[u]&1)==0){U=B}else{U=c[C>>2]|0}c[q>>2]=U+N;V=U}else{V=J}Q=L+12|0;R=c[Q>>2]|0;M=L+16|0;if((R|0)==(c[M>>2]|0)){W=b5[c[(c[L>>2]|0)+36>>2]&511](L)|0}else{W=d[R]|0}if((ma(W&255,16,V,q,t,0,n,z,s,y)|0)!=0){P=V;break}R=c[Q>>2]|0;if((R|0)==(c[M>>2]|0)){b5[c[(c[L>>2]|0)+40>>2]&511](L)|0;J=V;K=L;continue}else{c[Q>>2]=R+1;J=V;K=L;continue}}a[P+3|0]=0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);K=mb(P,c[7204]|0,(J=i,i=i+4|0,c[J>>2]=k,J)|0)|0;i=J;if((K|0)!=1){c[j>>2]=4}K=c[D>>2]|0;do{if((K|0)==0){X=0}else{if((c[K+12>>2]|0)!=(c[K+16>>2]|0)){X=K;break}if((b5[c[(c[K>>2]|0)+36>>2]&511](K)|0)!=-1){X=K;break}c[D>>2]=0;X=0}}while(0);D=(X|0)==0;K=c[E>>2]|0;do{if((K|0)==0){O=77}else{if((c[K+12>>2]|0)!=(c[K+16>>2]|0)){if(D){break}else{O=79;break}}if((b5[c[(c[K>>2]|0)+36>>2]&511](K)|0)==-1){c[E>>2]=0;O=77;break}else{if(D){break}else{O=79;break}}}}while(0);if((O|0)==77){if(D){O=79}}if((O|0)==79){c[j>>2]=c[j>>2]|2}c[b>>2]=X;do{if((a[u]&1)!=0){E=c[H>>2]|0;if((E|0)==0){break}qI(E)}}while(0);if((a[o]&1)==0){i=e;return}H=c[n+8>>2]|0;if((H|0)==0){i=e;return}qI(H);i=e;return}}while(0);e=bR(4)|0;c[e>>2]=3308;bl(e|0,24132,322)}function ma(b,e,f,g,h,i,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0;n=c[g>>2]|0;o=(n|0)==(f|0);do{if(o){p=(a[m+24|0]|0)==b<<24>>24;if(!p){if((a[m+25|0]|0)!=b<<24>>24){break}}c[g>>2]=f+1;a[f]=p?43:45;c[h>>2]=0;q=0;return q|0}}while(0);p=d[j]|0;if((p&1|0)==0){r=p>>>1}else{r=c[j+4>>2]|0}if((r|0)!=0&b<<24>>24==i<<24>>24){i=c[l>>2]|0;if((i-k|0)>=160){q=0;return q|0}k=c[h>>2]|0;c[l>>2]=i+4;c[i>>2]=k;c[h>>2]=0;q=0;return q|0}k=m+26|0;i=m;while(1){if((i|0)==(k|0)){s=k;break}if((a[i]|0)==b<<24>>24){s=i;break}else{i=i+1|0}}i=s-m|0;if((i|0)>23){q=-1;return q|0}do{if((e|0)==16){if((i|0)<22){break}if(o){q=-1;return q|0}if((n-f|0)>=3){q=-1;return q|0}if((a[n-1|0]|0)!=48){q=-1;return q|0}c[h>>2]=0;m=a[26776+i|0]|0;s=c[g>>2]|0;c[g>>2]=s+1;a[s]=m;q=0;return q|0}else if((e|0)==8|(e|0)==10){if((i|0)<(e|0)){break}else{q=-1}return q|0}}while(0);e=a[26776+i|0]|0;c[g>>2]=n+1;a[n]=e;c[h>>2]=(c[h>>2]|0)+1;q=0;return q|0}function mb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;i=i+4|0;f=e|0;c[f>>2]=d;d=bH(b|0)|0;b=bI(a|0,1184,c[f>>2]|0)|0;if((d|0)==0){i=e;return b|0}bH(d|0)|0;i=e;return b|0}function mc(a){a=a|0;if((a|0)==0){return}qI(a);return}function md(a){a=a|0;return}function me(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;k=i;i=i+64|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=k|0;m=k+12|0;n=k+24|0;o=k+28|0;p=k+32|0;q=k+36|0;r=k+40|0;if((c[g+4>>2]&1|0)==0){c[n>>2]=-1;s=c[(c[d>>2]|0)+16>>2]|0;t=e|0;c[p>>2]=c[t>>2];c[q>>2]=c[f>>2];b6[s&127](o,d,p,q,g,h,n);q=c[o>>2]|0;c[t>>2]=q;t=c[n>>2]|0;if((t|0)==1){a[j]=1}else if((t|0)==0){a[j]=0}else{a[j]=1;c[h>>2]=4}c[b>>2]=q;i=k;return}q=g+28|0;g=c[q>>2]|0;t=g+4|0;I=c[t>>2]|0,c[t>>2]=I+1,I;if((c[7543]|0)!=-1){c[m>>2]=30172;c[m+4>>2]=48;c[m+8>>2]=0;kE(30172,m)}m=(c[7544]|0)-1|0;n=c[g+8>>2]|0;do{if((c[g+12>>2]|0)-n>>2>>>0>m>>>0){o=c[n+(m<<2)>>2]|0;if((o|0)==0){break}p=o;if(((I=c[t>>2]|0,c[t>>2]=I+ -1,I)|0)==0){b0[c[(c[g>>2]|0)+8>>2]&1023](g)}o=c[q>>2]|0;d=o+4|0;I=c[d>>2]|0,c[d>>2]=I+1,I;if((c[7451]|0)!=-1){c[l>>2]=29804;c[l+4>>2]=48;c[l+8>>2]=0;kE(29804,l)}s=(c[7452]|0)-1|0;u=c[o+8>>2]|0;do{if((c[o+12>>2]|0)-u>>2>>>0>s>>>0){v=c[u+(s<<2)>>2]|0;if((v|0)==0){break}w=v;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)|0)==0){b0[c[(c[o>>2]|0)+8>>2]&1023](o)}x=r|0;y=v;b1[c[(c[y>>2]|0)+24>>2]&255](x,w);v=r+12|0;b1[c[(c[y>>2]|0)+28>>2]&255](v,w);a[j]=(mf(e,c[f>>2]|0,x,r+24|0,p,h,1)|0)==(x|0)|0;c[b>>2]=c[e>>2];do{if((a[v]&1)!=0){x=c[r+20>>2]|0;if((x|0)==0){break}qI(x)}}while(0);if((a[r]&1)==0){i=k;return}v=c[r+8>>2]|0;if((v|0)==0){i=k;return}qI(v);i=k;return}}while(0);p=bR(4)|0;c[p>>2]=3308;bl(p|0,24132,322)}}while(0);k=bR(4)|0;c[k>>2]=3308;bl(k|0,24132,322)}function mf(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0;l=i;i=i+100|0;m=(g-f|0)/12|0;n=l|0;do{if(m>>>0>100>>>0){o=qH(m)|0;if((o|0)!=0){p=o;q=o;break}o=bR(4)|0;c[o>>2]=3284;bl(o|0,24120,94);return 0}else{p=n;q=0}}while(0);n=(f|0)==(g|0);if(n){r=m;s=0}else{o=m;m=0;t=p;u=f;while(1){v=d[u]|0;if((v&1|0)==0){w=v>>>1}else{w=c[u+4>>2]|0}if((w|0)==0){a[t]=2;x=m+1|0;y=o-1|0}else{a[t]=1;x=m;y=o}v=u+12|0;if((v|0)==(g|0)){r=y;s=x;break}else{o=y;m=x;t=t+1|0;u=v}}}u=b|0;b=h;t=0;x=s;s=r;r=e;L18:while(1){e=(s|0)!=0;m=t;y=r;while(1){o=c[u>>2]|0;do{if((o|0)==0){z=0}else{w=c[o+12>>2]|0;if((w|0)==(c[o+16>>2]|0)){A=b5[c[(c[o>>2]|0)+36>>2]&511](o)|0}else{A=c[w>>2]|0}if((A|0)==-1){c[u>>2]=0;z=0;break}else{z=c[u>>2]|0;break}}}while(0);o=(z|0)==0;if((y|0)==0){B=z;C=0}else{w=c[y+12>>2]|0;if((w|0)==(c[y+16>>2]|0)){D=b5[c[(c[y>>2]|0)+36>>2]&511](y)|0}else{D=c[w>>2]|0}B=c[u>>2]|0;C=(D|0)==-1?0:y}E=(C|0)==0;if(!((o^E)&e)){break L18}o=c[B+12>>2]|0;if((o|0)==(c[B+16>>2]|0)){F=b5[c[(c[B>>2]|0)+36>>2]&511](B)|0}else{F=c[o>>2]|0}if(k){G=F}else{G=b2[c[(c[b>>2]|0)+28>>2]&127](h,F)|0}H=m+1|0;if(n){m=H;y=C}else{break}}L48:do{if(k){y=s;e=x;o=p;w=0;v=f;while(1){do{if((a[o]|0)==1){I=a[v]|0;if((I&1)==0){J=v+4|0}else{J=c[v+8>>2]|0}if((G|0)!=(c[J+(m<<2)>>2]|0)){a[o]=0;K=w;L=e;M=y-1|0;break}N=I&255;if((N&1|0)==0){O=N>>>1}else{O=c[v+4>>2]|0}if((O|0)!=(H|0)){K=1;L=e;M=y;break}a[o]=2;K=1;L=e+1|0;M=y-1|0}else{K=w;L=e;M=y}}while(0);N=v+12|0;if((N|0)==(g|0)){P=M;Q=L;R=K;break L48}y=M;e=L;o=o+1|0;w=K;v=N}}else{v=s;w=x;o=p;e=0;y=f;while(1){do{if((a[o]|0)==1){N=y;if((a[N]&1)==0){S=y+4|0}else{S=c[y+8>>2]|0}if((G|0)!=(b2[c[(c[b>>2]|0)+28>>2]&127](h,c[S+(m<<2)>>2]|0)|0)){a[o]=0;T=e;U=w;V=v-1|0;break}I=d[N]|0;if((I&1|0)==0){W=I>>>1}else{W=c[y+4>>2]|0}if((W|0)!=(H|0)){T=1;U=w;V=v;break}a[o]=2;T=1;U=w+1|0;V=v-1|0}else{T=e;U=w;V=v}}while(0);I=y+12|0;if((I|0)==(g|0)){P=V;Q=U;R=T;break L48}v=V;w=U;o=o+1|0;e=T;y=I}}}while(0);if((R&1)==0){t=H;x=Q;s=P;r=C;continue}m=c[u>>2]|0;y=m+12|0;e=c[y>>2]|0;if((e|0)==(c[m+16>>2]|0)){b5[c[(c[m>>2]|0)+40>>2]&511](m)|0}else{c[y>>2]=e+4}if((P+Q|0)>>>0<2>>>0){t=H;x=Q;s=P;r=C;continue}else{X=Q;Y=p;Z=f}while(1){do{if((a[Y]|0)==2){e=d[Z]|0;if((e&1|0)==0){_=e>>>1}else{_=c[Z+4>>2]|0}if((_|0)==(H|0)){$=X;break}a[Y]=0;$=X-1|0}else{$=X}}while(0);e=Z+12|0;if((e|0)==(g|0)){t=H;x=$;s=P;r=C;continue L18}else{X=$;Y=Y+1|0;Z=e}}}do{if((B|0)==0){aa=1}else{Z=c[B+12>>2]|0;if((Z|0)==(c[B+16>>2]|0)){ab=b5[c[(c[B>>2]|0)+36>>2]&511](B)|0}else{ab=c[Z>>2]|0}if((ab|0)==-1){c[u>>2]=0;aa=1;break}else{aa=(c[u>>2]|0)==0;break}}}while(0);do{if(E){ac=93}else{u=c[C+12>>2]|0;if((u|0)==(c[C+16>>2]|0)){ad=b5[c[(c[C>>2]|0)+36>>2]&511](C)|0}else{ad=c[u>>2]|0}if((ad|0)==-1){ac=93;break}if(!aa){ac=95}}}while(0);if((ac|0)==93){if(aa){ac=95}}if((ac|0)==95){c[j>>2]=c[j>>2]|2}L125:do{if(n){ac=100}else{aa=f;ad=p;while(1){if((a[ad]|0)==2){ae=aa;break L125}C=aa+12|0;if((C|0)==(g|0)){ac=100;break L125}aa=C;ad=ad+1|0}}}while(0);if((ac|0)==100){c[j>>2]=c[j>>2]|4;ae=g}if((q|0)==0){i=l;return ae|0}qI(q);i=l;return ae|0}function mg(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;e=i;i=i+304|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+108|0;o=e+120|0;p=e+132|0;q=e+136|0;r=e+296|0;s=e+300|0;t=c[f>>2]|0;f=c[g>>2]|0;g=n;u=o;v=c[h+4>>2]&74;if((v|0)==64){w=8}else if((v|0)==0){w=0}else if((v|0)==8){w=16}else{w=10}v=l|0;mu(n,c[h+28>>2]|0,v,m);qP(u|0,0,12)|0;h=o;kI(o,10);if((a[u]&1)==0){l=h+1|0;x=l;y=l;z=o+8|0}else{l=o+8|0;x=c[l>>2]|0;y=h+1|0;z=l}c[p>>2]=x;l=q|0;c[r>>2]=l;c[s>>2]=0;A=o|0;B=o+4|0;C=c[m>>2]|0;m=o+8|0;D=x;x=t;t=f;L11:while(1){if((x|0)==0){E=0}else{f=c[x+12>>2]|0;if((f|0)==(c[x+16>>2]|0)){F=b5[c[(c[x>>2]|0)+36>>2]&511](x)|0}else{F=c[f>>2]|0}E=(F|0)==-1?0:x}f=(E|0)==0;do{if((t|0)==0){G=20}else{H=c[t+12>>2]|0;if((H|0)==(c[t+16>>2]|0)){I=b5[c[(c[t>>2]|0)+36>>2]&511](t)|0}else{I=c[H>>2]|0}if((I|0)==-1){G=20;break}if(f){J=0;K=t}else{L=D;M=t;N=0;O=E;P=0;break L11}}}while(0);if((G|0)==20){G=0;if(f){L=D;M=0;N=1;O=0;P=1;break}else{J=1;K=0}}H=(c[p>>2]|0)-D|0;Q=a[u]|0;R=Q&255;if((H|0)==(((R&1|0)==0?R>>>1:c[B>>2]|0)|0)){R=H<<1;do{if(H>>>0<R>>>0){kI(o,H)}else{if((Q&1)==0){a[h+1+R|0]=0;a[u]=H<<2;break}else{a[(c[m>>2]|0)+R|0]=0;c[B>>2]=R;break}}}while(0);R=a[u]|0;if((R&1)==0){S=10;T=R}else{R=c[A>>2]|0;S=(R&-2)-1|0;T=R&255}R=T&255;Q=(R&1|0)==0?R>>>1:c[B>>2]|0;do{if(Q>>>0<S>>>0){kI(o,S-Q|0)}else{if((T&1)==0){a[h+1+S|0]=0;a[u]=S<<1;break}else{a[(c[m>>2]|0)+S|0]=0;c[B>>2]=S;break}}}while(0);if((a[u]&1)==0){U=y}else{U=c[z>>2]|0}c[p>>2]=U+H;V=U}else{V=D}Q=E+12|0;R=c[Q>>2]|0;W=E+16|0;if((R|0)==(c[W>>2]|0)){X=b5[c[(c[E>>2]|0)+36>>2]&511](E)|0}else{X=c[R>>2]|0}if((mq(X,w,V,p,s,C,n,l,r,v)|0)!=0){L=V;M=K;N=J;O=E;P=f;break}R=c[Q>>2]|0;if((R|0)==(c[W>>2]|0)){b5[c[(c[E>>2]|0)+40>>2]&511](E)|0;D=V;x=E;t=K;continue}else{c[Q>>2]=R+4;D=V;x=E;t=K;continue}}K=d[g]|0;if((K&1|0)==0){Y=K>>>1}else{Y=c[n+4>>2]|0}do{if((Y|0)!=0){K=c[r>>2]|0;if((K-q|0)>=160){break}t=c[s>>2]|0;c[r>>2]=K+4;c[K>>2]=t}}while(0);c[k>>2]=qe(L,c[p>>2]|0,j,w)|0;oc(n,l,c[r>>2]|0,j);if(P){Z=0}else{P=c[O+12>>2]|0;if((P|0)==(c[O+16>>2]|0)){_=b5[c[(c[O>>2]|0)+36>>2]&511](O)|0}else{_=c[P>>2]|0}Z=(_|0)==-1?0:O}O=(Z|0)==0;do{if(N){G=71}else{_=c[M+12>>2]|0;if((_|0)==(c[M+16>>2]|0)){$=b5[c[(c[M>>2]|0)+36>>2]&511](M)|0}else{$=c[_>>2]|0}if(($|0)==-1){G=71;break}if(!(O^(M|0)==0)){G=73}}}while(0);if((G|0)==71){if(O){G=73}}if((G|0)==73){c[j>>2]=c[j>>2]|2}c[b>>2]=Z;do{if((a[u]&1)!=0){Z=c[m>>2]|0;if((Z|0)==0){break}qI(Z)}}while(0);if((a[g]&1)==0){i=e;return}g=c[n+8>>2]|0;if((g|0)==0){i=e;return}qI(g);i=e;return}function mh(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0;e=i;i=i+304|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+108|0;o=e+120|0;p=e+132|0;q=e+136|0;r=e+296|0;s=e+300|0;t=c[f>>2]|0;f=c[g>>2]|0;g=n;u=o;v=c[h+4>>2]&74;if((v|0)==64){w=8}else if((v|0)==8){w=16}else if((v|0)==0){w=0}else{w=10}v=l|0;mu(n,c[h+28>>2]|0,v,m);qP(u|0,0,12)|0;h=o;kI(o,10);if((a[u]&1)==0){l=h+1|0;x=l;y=l;z=o+8|0}else{l=o+8|0;x=c[l>>2]|0;y=h+1|0;z=l}c[p>>2]=x;l=q|0;c[r>>2]=l;c[s>>2]=0;A=o|0;B=o+4|0;C=c[m>>2]|0;m=o+8|0;D=x;x=t;t=f;L11:while(1){if((x|0)==0){E=0}else{f=c[x+12>>2]|0;if((f|0)==(c[x+16>>2]|0)){F=b5[c[(c[x>>2]|0)+36>>2]&511](x)|0}else{F=c[f>>2]|0}E=(F|0)==-1?0:x}f=(E|0)==0;do{if((t|0)==0){G=20}else{H=c[t+12>>2]|0;if((H|0)==(c[t+16>>2]|0)){I=b5[c[(c[t>>2]|0)+36>>2]&511](t)|0}else{I=c[H>>2]|0}if((I|0)==-1){G=20;break}if(f){J=0;L=t}else{M=D;N=t;O=0;P=E;Q=0;break L11}}}while(0);if((G|0)==20){G=0;if(f){M=D;N=0;O=1;P=0;Q=1;break}else{J=1;L=0}}H=(c[p>>2]|0)-D|0;R=a[u]|0;S=R&255;if((H|0)==(((S&1|0)==0?S>>>1:c[B>>2]|0)|0)){S=H<<1;do{if(H>>>0<S>>>0){kI(o,H)}else{if((R&1)==0){a[h+1+S|0]=0;a[u]=H<<2;break}else{a[(c[m>>2]|0)+S|0]=0;c[B>>2]=S;break}}}while(0);S=a[u]|0;if((S&1)==0){T=10;U=S}else{S=c[A>>2]|0;T=(S&-2)-1|0;U=S&255}S=U&255;R=(S&1|0)==0?S>>>1:c[B>>2]|0;do{if(R>>>0<T>>>0){kI(o,T-R|0)}else{if((U&1)==0){a[h+1+T|0]=0;a[u]=T<<1;break}else{a[(c[m>>2]|0)+T|0]=0;c[B>>2]=T;break}}}while(0);if((a[u]&1)==0){V=y}else{V=c[z>>2]|0}c[p>>2]=V+H;W=V}else{W=D}R=E+12|0;S=c[R>>2]|0;X=E+16|0;if((S|0)==(c[X>>2]|0)){Y=b5[c[(c[E>>2]|0)+36>>2]&511](E)|0}else{Y=c[S>>2]|0}if((mq(Y,w,W,p,s,C,n,l,r,v)|0)!=0){M=W;N=L;O=J;P=E;Q=f;break}S=c[R>>2]|0;if((S|0)==(c[X>>2]|0)){b5[c[(c[E>>2]|0)+40>>2]&511](E)|0;D=W;x=E;t=L;continue}else{c[R>>2]=S+4;D=W;x=E;t=L;continue}}L=d[g]|0;if((L&1|0)==0){Z=L>>>1}else{Z=c[n+4>>2]|0}do{if((Z|0)!=0){L=c[r>>2]|0;if((L-q|0)>=160){break}t=c[s>>2]|0;c[r>>2]=L+4;c[L>>2]=t}}while(0);s=qd(M,c[p>>2]|0,j,w)|0;c[k>>2]=s;c[k+4>>2]=K;oc(n,l,c[r>>2]|0,j);if(Q){_=0}else{Q=c[P+12>>2]|0;if((Q|0)==(c[P+16>>2]|0)){$=b5[c[(c[P>>2]|0)+36>>2]&511](P)|0}else{$=c[Q>>2]|0}_=($|0)==-1?0:P}P=(_|0)==0;do{if(O){G=71}else{$=c[N+12>>2]|0;if(($|0)==(c[N+16>>2]|0)){aa=b5[c[(c[N>>2]|0)+36>>2]&511](N)|0}else{aa=c[$>>2]|0}if((aa|0)==-1){G=71;break}if(!(P^(N|0)==0)){G=73}}}while(0);if((G|0)==71){if(P){G=73}}if((G|0)==73){c[j>>2]=c[j>>2]|2}c[b>>2]=_;do{if((a[u]&1)!=0){_=c[m>>2]|0;if((_|0)==0){break}qI(_)}}while(0);if((a[g]&1)==0){i=e;return}g=c[n+8>>2]|0;if((g|0)==0){i=e;return}qI(g);i=e;return}function mi(e,f,g,h,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0;f=i;i=i+304|0;m=g;g=i;i=i+4|0;c[g>>2]=c[m>>2];m=h;h=i;i=i+4|0;c[h>>2]=c[m>>2];m=f|0;n=f+104|0;o=f+108|0;p=f+120|0;q=f+132|0;r=f+136|0;s=f+296|0;t=f+300|0;u=c[g>>2]|0;g=c[h>>2]|0;h=o;v=p;w=c[j+4>>2]&74;if((w|0)==64){x=8}else if((w|0)==0){x=0}else if((w|0)==8){x=16}else{x=10}w=m|0;mu(o,c[j+28>>2]|0,w,n);qP(v|0,0,12)|0;j=p;kI(p,10);if((a[v]&1)==0){m=j+1|0;y=m;z=m;A=p+8|0}else{m=p+8|0;y=c[m>>2]|0;z=j+1|0;A=m}c[q>>2]=y;m=r|0;c[s>>2]=m;c[t>>2]=0;B=p|0;C=p+4|0;D=c[n>>2]|0;n=p+8|0;E=y;y=u;u=g;L11:while(1){if((y|0)==0){F=0}else{g=c[y+12>>2]|0;if((g|0)==(c[y+16>>2]|0)){G=b5[c[(c[y>>2]|0)+36>>2]&511](y)|0}else{G=c[g>>2]|0}F=(G|0)==-1?0:y}g=(F|0)==0;do{if((u|0)==0){H=20}else{I=c[u+12>>2]|0;if((I|0)==(c[u+16>>2]|0)){J=b5[c[(c[u>>2]|0)+36>>2]&511](u)|0}else{J=c[I>>2]|0}if((J|0)==-1){H=20;break}if(g){K=0;L=u}else{M=E;N=u;O=0;P=F;Q=0;break L11}}}while(0);if((H|0)==20){H=0;if(g){M=E;N=0;O=1;P=0;Q=1;break}else{K=1;L=0}}I=(c[q>>2]|0)-E|0;R=a[v]|0;S=R&255;if((I|0)==(((S&1|0)==0?S>>>1:c[C>>2]|0)|0)){S=I<<1;do{if(I>>>0<S>>>0){kI(p,I)}else{if((R&1)==0){a[j+1+S|0]=0;a[v]=I<<2;break}else{a[(c[n>>2]|0)+S|0]=0;c[C>>2]=S;break}}}while(0);S=a[v]|0;if((S&1)==0){T=10;U=S}else{S=c[B>>2]|0;T=(S&-2)-1|0;U=S&255}S=U&255;R=(S&1|0)==0?S>>>1:c[C>>2]|0;do{if(R>>>0<T>>>0){kI(p,T-R|0)}else{if((U&1)==0){a[j+1+T|0]=0;a[v]=T<<1;break}else{a[(c[n>>2]|0)+T|0]=0;c[C>>2]=T;break}}}while(0);if((a[v]&1)==0){V=z}else{V=c[A>>2]|0}c[q>>2]=V+I;W=V}else{W=E}R=F+12|0;S=c[R>>2]|0;X=F+16|0;if((S|0)==(c[X>>2]|0)){Y=b5[c[(c[F>>2]|0)+36>>2]&511](F)|0}else{Y=c[S>>2]|0}if((mq(Y,x,W,q,t,D,o,m,s,w)|0)!=0){M=W;N=L;O=K;P=F;Q=g;break}S=c[R>>2]|0;if((S|0)==(c[X>>2]|0)){b5[c[(c[F>>2]|0)+40>>2]&511](F)|0;E=W;y=F;u=L;continue}else{c[R>>2]=S+4;E=W;y=F;u=L;continue}}L=d[h]|0;if((L&1|0)==0){Z=L>>>1}else{Z=c[o+4>>2]|0}do{if((Z|0)!=0){L=c[s>>2]|0;if((L-r|0)>=160){break}u=c[t>>2]|0;c[s>>2]=L+4;c[L>>2]=u}}while(0);b[l>>1]=qc(M,c[q>>2]|0,k,x)|0;oc(o,m,c[s>>2]|0,k);if(Q){_=0}else{Q=c[P+12>>2]|0;if((Q|0)==(c[P+16>>2]|0)){$=b5[c[(c[P>>2]|0)+36>>2]&511](P)|0}else{$=c[Q>>2]|0}_=($|0)==-1?0:P}P=(_|0)==0;do{if(O){H=71}else{$=c[N+12>>2]|0;if(($|0)==(c[N+16>>2]|0)){aa=b5[c[(c[N>>2]|0)+36>>2]&511](N)|0}else{aa=c[$>>2]|0}if((aa|0)==-1){H=71;break}if(!(P^(N|0)==0)){H=73}}}while(0);if((H|0)==71){if(P){H=73}}if((H|0)==73){c[k>>2]=c[k>>2]|2}c[e>>2]=_;do{if((a[v]&1)!=0){_=c[n>>2]|0;if((_|0)==0){break}qI(_)}}while(0);if((a[h]&1)==0){i=f;return}h=c[o+8>>2]|0;if((h|0)==0){i=f;return}qI(h);i=f;return}function mj(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;e=i;i=i+304|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+108|0;o=e+120|0;p=e+132|0;q=e+136|0;r=e+296|0;s=e+300|0;t=c[f>>2]|0;f=c[g>>2]|0;g=n;u=o;v=c[h+4>>2]&74;if((v|0)==64){w=8}else if((v|0)==8){w=16}else if((v|0)==0){w=0}else{w=10}v=l|0;mu(n,c[h+28>>2]|0,v,m);qP(u|0,0,12)|0;h=o;kI(o,10);if((a[u]&1)==0){l=h+1|0;x=l;y=l;z=o+8|0}else{l=o+8|0;x=c[l>>2]|0;y=h+1|0;z=l}c[p>>2]=x;l=q|0;c[r>>2]=l;c[s>>2]=0;A=o|0;B=o+4|0;C=c[m>>2]|0;m=o+8|0;D=x;x=t;t=f;L11:while(1){if((x|0)==0){E=0}else{f=c[x+12>>2]|0;if((f|0)==(c[x+16>>2]|0)){F=b5[c[(c[x>>2]|0)+36>>2]&511](x)|0}else{F=c[f>>2]|0}E=(F|0)==-1?0:x}f=(E|0)==0;do{if((t|0)==0){G=20}else{H=c[t+12>>2]|0;if((H|0)==(c[t+16>>2]|0)){I=b5[c[(c[t>>2]|0)+36>>2]&511](t)|0}else{I=c[H>>2]|0}if((I|0)==-1){G=20;break}if(f){J=0;K=t}else{L=D;M=t;N=0;O=E;P=0;break L11}}}while(0);if((G|0)==20){G=0;if(f){L=D;M=0;N=1;O=0;P=1;break}else{J=1;K=0}}H=(c[p>>2]|0)-D|0;Q=a[u]|0;R=Q&255;if((H|0)==(((R&1|0)==0?R>>>1:c[B>>2]|0)|0)){R=H<<1;do{if(H>>>0<R>>>0){kI(o,H)}else{if((Q&1)==0){a[h+1+R|0]=0;a[u]=H<<2;break}else{a[(c[m>>2]|0)+R|0]=0;c[B>>2]=R;break}}}while(0);R=a[u]|0;if((R&1)==0){S=10;T=R}else{R=c[A>>2]|0;S=(R&-2)-1|0;T=R&255}R=T&255;Q=(R&1|0)==0?R>>>1:c[B>>2]|0;do{if(Q>>>0<S>>>0){kI(o,S-Q|0)}else{if((T&1)==0){a[h+1+S|0]=0;a[u]=S<<1;break}else{a[(c[m>>2]|0)+S|0]=0;c[B>>2]=S;break}}}while(0);if((a[u]&1)==0){U=y}else{U=c[z>>2]|0}c[p>>2]=U+H;V=U}else{V=D}Q=E+12|0;R=c[Q>>2]|0;W=E+16|0;if((R|0)==(c[W>>2]|0)){X=b5[c[(c[E>>2]|0)+36>>2]&511](E)|0}else{X=c[R>>2]|0}if((mq(X,w,V,p,s,C,n,l,r,v)|0)!=0){L=V;M=K;N=J;O=E;P=f;break}R=c[Q>>2]|0;if((R|0)==(c[W>>2]|0)){b5[c[(c[E>>2]|0)+40>>2]&511](E)|0;D=V;x=E;t=K;continue}else{c[Q>>2]=R+4;D=V;x=E;t=K;continue}}K=d[g]|0;if((K&1|0)==0){Y=K>>>1}else{Y=c[n+4>>2]|0}do{if((Y|0)!=0){K=c[r>>2]|0;if((K-q|0)>=160){break}t=c[s>>2]|0;c[r>>2]=K+4;c[K>>2]=t}}while(0);c[k>>2]=qb(L,c[p>>2]|0,j,w)|0;oc(n,l,c[r>>2]|0,j);if(P){Z=0}else{P=c[O+12>>2]|0;if((P|0)==(c[O+16>>2]|0)){_=b5[c[(c[O>>2]|0)+36>>2]&511](O)|0}else{_=c[P>>2]|0}Z=(_|0)==-1?0:O}O=(Z|0)==0;do{if(N){G=71}else{_=c[M+12>>2]|0;if((_|0)==(c[M+16>>2]|0)){$=b5[c[(c[M>>2]|0)+36>>2]&511](M)|0}else{$=c[_>>2]|0}if(($|0)==-1){G=71;break}if(!(O^(M|0)==0)){G=73}}}while(0);if((G|0)==71){if(O){G=73}}if((G|0)==73){c[j>>2]=c[j>>2]|2}c[b>>2]=Z;do{if((a[u]&1)!=0){Z=c[m>>2]|0;if((Z|0)==0){break}qI(Z)}}while(0);if((a[g]&1)==0){i=e;return}g=c[n+8>>2]|0;if((g|0)==0){i=e;return}qI(g);i=e;return}function mk(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;e=i;i=i+304|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+108|0;o=e+120|0;p=e+132|0;q=e+136|0;r=e+296|0;s=e+300|0;t=c[f>>2]|0;f=c[g>>2]|0;g=n;u=o;v=c[h+4>>2]&74;if((v|0)==8){w=16}else if((v|0)==0){w=0}else if((v|0)==64){w=8}else{w=10}v=l|0;mu(n,c[h+28>>2]|0,v,m);qP(u|0,0,12)|0;h=o;kI(o,10);if((a[u]&1)==0){l=h+1|0;x=l;y=l;z=o+8|0}else{l=o+8|0;x=c[l>>2]|0;y=h+1|0;z=l}c[p>>2]=x;l=q|0;c[r>>2]=l;c[s>>2]=0;A=o|0;B=o+4|0;C=c[m>>2]|0;m=o+8|0;D=x;x=t;t=f;L11:while(1){if((x|0)==0){E=0}else{f=c[x+12>>2]|0;if((f|0)==(c[x+16>>2]|0)){F=b5[c[(c[x>>2]|0)+36>>2]&511](x)|0}else{F=c[f>>2]|0}E=(F|0)==-1?0:x}f=(E|0)==0;do{if((t|0)==0){G=20}else{H=c[t+12>>2]|0;if((H|0)==(c[t+16>>2]|0)){I=b5[c[(c[t>>2]|0)+36>>2]&511](t)|0}else{I=c[H>>2]|0}if((I|0)==-1){G=20;break}if(f){J=0;K=t}else{L=D;M=t;N=0;O=E;P=0;break L11}}}while(0);if((G|0)==20){G=0;if(f){L=D;M=0;N=1;O=0;P=1;break}else{J=1;K=0}}H=(c[p>>2]|0)-D|0;Q=a[u]|0;R=Q&255;if((H|0)==(((R&1|0)==0?R>>>1:c[B>>2]|0)|0)){R=H<<1;do{if(H>>>0<R>>>0){kI(o,H)}else{if((Q&1)==0){a[h+1+R|0]=0;a[u]=H<<2;break}else{a[(c[m>>2]|0)+R|0]=0;c[B>>2]=R;break}}}while(0);R=a[u]|0;if((R&1)==0){S=10;T=R}else{R=c[A>>2]|0;S=(R&-2)-1|0;T=R&255}R=T&255;Q=(R&1|0)==0?R>>>1:c[B>>2]|0;do{if(Q>>>0<S>>>0){kI(o,S-Q|0)}else{if((T&1)==0){a[h+1+S|0]=0;a[u]=S<<1;break}else{a[(c[m>>2]|0)+S|0]=0;c[B>>2]=S;break}}}while(0);if((a[u]&1)==0){U=y}else{U=c[z>>2]|0}c[p>>2]=U+H;V=U}else{V=D}Q=E+12|0;R=c[Q>>2]|0;W=E+16|0;if((R|0)==(c[W>>2]|0)){X=b5[c[(c[E>>2]|0)+36>>2]&511](E)|0}else{X=c[R>>2]|0}if((mq(X,w,V,p,s,C,n,l,r,v)|0)!=0){L=V;M=K;N=J;O=E;P=f;break}R=c[Q>>2]|0;if((R|0)==(c[W>>2]|0)){b5[c[(c[E>>2]|0)+40>>2]&511](E)|0;D=V;x=E;t=K;continue}else{c[Q>>2]=R+4;D=V;x=E;t=K;continue}}K=d[g]|0;if((K&1|0)==0){Y=K>>>1}else{Y=c[n+4>>2]|0}do{if((Y|0)!=0){K=c[r>>2]|0;if((K-q|0)>=160){break}t=c[s>>2]|0;c[r>>2]=K+4;c[K>>2]=t}}while(0);c[k>>2]=qa(L,c[p>>2]|0,j,w)|0;oc(n,l,c[r>>2]|0,j);if(P){Z=0}else{P=c[O+12>>2]|0;if((P|0)==(c[O+16>>2]|0)){_=b5[c[(c[O>>2]|0)+36>>2]&511](O)|0}else{_=c[P>>2]|0}Z=(_|0)==-1?0:O}O=(Z|0)==0;do{if(N){G=71}else{_=c[M+12>>2]|0;if((_|0)==(c[M+16>>2]|0)){$=b5[c[(c[M>>2]|0)+36>>2]&511](M)|0}else{$=c[_>>2]|0}if(($|0)==-1){G=71;break}if(!(O^(M|0)==0)){G=73}}}while(0);if((G|0)==71){if(O){G=73}}if((G|0)==73){c[j>>2]=c[j>>2]|2}c[b>>2]=Z;do{if((a[u]&1)!=0){Z=c[m>>2]|0;if((Z|0)==0){break}qI(Z)}}while(0);if((a[g]&1)==0){i=e;return}g=c[n+8>>2]|0;if((g|0)==0){i=e;return}qI(g);i=e;return}function ml(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0;e=i;i=i+304|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+108|0;o=e+120|0;p=e+132|0;q=e+136|0;r=e+296|0;s=e+300|0;t=c[f>>2]|0;f=c[g>>2]|0;g=n;u=o;v=c[h+4>>2]&74;if((v|0)==8){w=16}else if((v|0)==0){w=0}else if((v|0)==64){w=8}else{w=10}v=l|0;mu(n,c[h+28>>2]|0,v,m);qP(u|0,0,12)|0;h=o;kI(o,10);if((a[u]&1)==0){l=h+1|0;x=l;y=l;z=o+8|0}else{l=o+8|0;x=c[l>>2]|0;y=h+1|0;z=l}c[p>>2]=x;l=q|0;c[r>>2]=l;c[s>>2]=0;A=o|0;B=o+4|0;C=c[m>>2]|0;m=o+8|0;D=x;x=t;t=f;L11:while(1){if((x|0)==0){E=0}else{f=c[x+12>>2]|0;if((f|0)==(c[x+16>>2]|0)){F=b5[c[(c[x>>2]|0)+36>>2]&511](x)|0}else{F=c[f>>2]|0}E=(F|0)==-1?0:x}f=(E|0)==0;do{if((t|0)==0){G=20}else{H=c[t+12>>2]|0;if((H|0)==(c[t+16>>2]|0)){I=b5[c[(c[t>>2]|0)+36>>2]&511](t)|0}else{I=c[H>>2]|0}if((I|0)==-1){G=20;break}if(f){J=0;L=t}else{M=D;N=t;O=0;P=E;Q=0;break L11}}}while(0);if((G|0)==20){G=0;if(f){M=D;N=0;O=1;P=0;Q=1;break}else{J=1;L=0}}H=(c[p>>2]|0)-D|0;R=a[u]|0;S=R&255;if((H|0)==(((S&1|0)==0?S>>>1:c[B>>2]|0)|0)){S=H<<1;do{if(H>>>0<S>>>0){kI(o,H)}else{if((R&1)==0){a[h+1+S|0]=0;a[u]=H<<2;break}else{a[(c[m>>2]|0)+S|0]=0;c[B>>2]=S;break}}}while(0);S=a[u]|0;if((S&1)==0){T=10;U=S}else{S=c[A>>2]|0;T=(S&-2)-1|0;U=S&255}S=U&255;R=(S&1|0)==0?S>>>1:c[B>>2]|0;do{if(R>>>0<T>>>0){kI(o,T-R|0)}else{if((U&1)==0){a[h+1+T|0]=0;a[u]=T<<1;break}else{a[(c[m>>2]|0)+T|0]=0;c[B>>2]=T;break}}}while(0);if((a[u]&1)==0){V=y}else{V=c[z>>2]|0}c[p>>2]=V+H;W=V}else{W=D}R=E+12|0;S=c[R>>2]|0;X=E+16|0;if((S|0)==(c[X>>2]|0)){Y=b5[c[(c[E>>2]|0)+36>>2]&511](E)|0}else{Y=c[S>>2]|0}if((mq(Y,w,W,p,s,C,n,l,r,v)|0)!=0){M=W;N=L;O=J;P=E;Q=f;break}S=c[R>>2]|0;if((S|0)==(c[X>>2]|0)){b5[c[(c[E>>2]|0)+40>>2]&511](E)|0;D=W;x=E;t=L;continue}else{c[R>>2]=S+4;D=W;x=E;t=L;continue}}L=d[g]|0;if((L&1|0)==0){Z=L>>>1}else{Z=c[n+4>>2]|0}do{if((Z|0)!=0){L=c[r>>2]|0;if((L-q|0)>=160){break}t=c[s>>2]|0;c[r>>2]=L+4;c[L>>2]=t}}while(0);s=p9(M,c[p>>2]|0,j,w)|0;c[k>>2]=s;c[k+4>>2]=K;oc(n,l,c[r>>2]|0,j);if(Q){_=0}else{Q=c[P+12>>2]|0;if((Q|0)==(c[P+16>>2]|0)){$=b5[c[(c[P>>2]|0)+36>>2]&511](P)|0}else{$=c[Q>>2]|0}_=($|0)==-1?0:P}P=(_|0)==0;do{if(O){G=71}else{$=c[N+12>>2]|0;if(($|0)==(c[N+16>>2]|0)){aa=b5[c[(c[N>>2]|0)+36>>2]&511](N)|0}else{aa=c[$>>2]|0}if((aa|0)==-1){G=71;break}if(!(P^(N|0)==0)){G=73}}}while(0);if((G|0)==71){if(P){G=73}}if((G|0)==73){c[j>>2]=c[j>>2]|2}c[b>>2]=_;do{if((a[u]&1)!=0){_=c[m>>2]|0;if((_|0)==0){break}qI(_)}}while(0);if((a[g]&1)==0){i=e;return}g=c[n+8>>2]|0;if((g|0)==0){i=e;return}qI(g);i=e;return}function mm(b,e,f,h,j,k,l){b=b|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0;e=i;i=i+340|0;m=f;f=i;i=i+4|0;c[f>>2]=c[m>>2];m=h;h=i;i=i+4|0;c[h>>2]=c[m>>2];m=e+128|0;n=e+132|0;o=e+136|0;p=e+148|0;q=e+160|0;r=e+164|0;s=e+324|0;t=e+328|0;u=e+332|0;v=e+336|0;w=c[f>>2]|0;f=c[h>>2]|0;h=o;x=p;y=e|0;mv(o,c[j+28>>2]|0,y,m,n);qP(x|0,0,12)|0;j=p;kI(p,10);if((a[x]&1)==0){z=j+1|0;A=z;B=z;C=p+8|0}else{z=p+8|0;A=c[z>>2]|0;B=j+1|0;C=z}c[q>>2]=A;z=r|0;c[s>>2]=z;c[t>>2]=0;a[u]=1;a[v]=69;D=p|0;E=p+4|0;F=c[m>>2]|0;m=c[n>>2]|0;n=p+8|0;G=A;A=w;w=f;L6:while(1){if((A|0)==0){H=0}else{f=c[A+12>>2]|0;if((f|0)==(c[A+16>>2]|0)){I=b5[c[(c[A>>2]|0)+36>>2]&511](A)|0}else{I=c[f>>2]|0}H=(I|0)==-1?0:A}f=(H|0)==0;do{if((w|0)==0){J=16}else{K=c[w+12>>2]|0;if((K|0)==(c[w+16>>2]|0)){L=b5[c[(c[w>>2]|0)+36>>2]&511](w)|0}else{L=c[K>>2]|0}if((L|0)==-1){J=16;break}if(f){M=0;N=w}else{O=G;P=w;Q=0;R=H;S=0;break L6}}}while(0);if((J|0)==16){J=0;if(f){O=G;P=0;Q=1;R=0;S=1;break}else{M=1;N=0}}K=(c[q>>2]|0)-G|0;T=a[x]|0;U=T&255;if((K|0)==(((U&1|0)==0?U>>>1:c[E>>2]|0)|0)){U=K<<1;do{if(K>>>0<U>>>0){kI(p,K)}else{if((T&1)==0){a[j+1+U|0]=0;a[x]=K<<2;break}else{a[(c[n>>2]|0)+U|0]=0;c[E>>2]=U;break}}}while(0);U=a[x]|0;if((U&1)==0){V=10;W=U}else{U=c[D>>2]|0;V=(U&-2)-1|0;W=U&255}U=W&255;T=(U&1|0)==0?U>>>1:c[E>>2]|0;do{if(T>>>0<V>>>0){kI(p,V-T|0)}else{if((W&1)==0){a[j+1+V|0]=0;a[x]=V<<1;break}else{a[(c[n>>2]|0)+V|0]=0;c[E>>2]=V;break}}}while(0);if((a[x]&1)==0){X=B}else{X=c[C>>2]|0}c[q>>2]=X+K;Y=X}else{Y=G}T=H+12|0;U=c[T>>2]|0;Z=H+16|0;if((U|0)==(c[Z>>2]|0)){_=b5[c[(c[H>>2]|0)+36>>2]&511](H)|0}else{_=c[U>>2]|0}if((mw(_,u,v,Y,q,F,m,o,z,s,t,y)|0)!=0){O=Y;P=N;Q=M;R=H;S=f;break}U=c[T>>2]|0;if((U|0)==(c[Z>>2]|0)){b5[c[(c[H>>2]|0)+40>>2]&511](H)|0;G=Y;A=H;w=N;continue}else{c[T>>2]=U+4;G=Y;A=H;w=N;continue}}N=d[h]|0;if((N&1|0)==0){$=N>>>1}else{$=c[o+4>>2]|0}do{if(($|0)!=0){if((a[u]&1)==0){break}N=c[s>>2]|0;if((N-r|0)>=160){break}w=c[t>>2]|0;c[s>>2]=N+4;c[N>>2]=w}}while(0);g[l>>2]=+p8(O,c[q>>2]|0,k);oc(o,z,c[s>>2]|0,k);if(S){aa=0}else{S=c[R+12>>2]|0;if((S|0)==(c[R+16>>2]|0)){ab=b5[c[(c[R>>2]|0)+36>>2]&511](R)|0}else{ab=c[S>>2]|0}aa=(ab|0)==-1?0:R}R=(aa|0)==0;do{if(Q){J=68}else{ab=c[P+12>>2]|0;if((ab|0)==(c[P+16>>2]|0)){ac=b5[c[(c[P>>2]|0)+36>>2]&511](P)|0}else{ac=c[ab>>2]|0}if((ac|0)==-1){J=68;break}if(!(R^(P|0)==0)){J=70}}}while(0);if((J|0)==68){if(R){J=70}}if((J|0)==70){c[k>>2]=c[k>>2]|2}c[b>>2]=aa;do{if((a[x]&1)!=0){aa=c[n>>2]|0;if((aa|0)==0){break}qI(aa)}}while(0);if((a[h]&1)==0){i=e;return}h=c[o+8>>2]|0;if((h|0)==0){i=e;return}qI(h);i=e;return}function mn(b,e,f,g,j,l,m){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0.0,ac=0,ad=0,ae=0;e=i;i=i+340|0;n=f;f=i;i=i+4|0;c[f>>2]=c[n>>2];n=g;g=i;i=i+4|0;c[g>>2]=c[n>>2];n=e+128|0;o=e+132|0;p=e+136|0;q=e+148|0;r=e+160|0;s=e+164|0;t=e+324|0;u=e+328|0;v=e+332|0;w=e+336|0;x=c[f>>2]|0;f=c[g>>2]|0;g=p;y=q;z=e|0;mv(p,c[j+28>>2]|0,z,n,o);qP(y|0,0,12)|0;j=q;kI(q,10);if((a[y]&1)==0){A=j+1|0;B=A;C=A;D=q+8|0}else{A=q+8|0;B=c[A>>2]|0;C=j+1|0;D=A}c[r>>2]=B;A=s|0;c[t>>2]=A;c[u>>2]=0;a[v]=1;a[w]=69;E=q|0;F=q+4|0;G=c[n>>2]|0;n=c[o>>2]|0;o=q+8|0;H=B;B=x;x=f;L6:while(1){if((B|0)==0){I=0}else{f=c[B+12>>2]|0;if((f|0)==(c[B+16>>2]|0)){J=b5[c[(c[B>>2]|0)+36>>2]&511](B)|0}else{J=c[f>>2]|0}I=(J|0)==-1?0:B}f=(I|0)==0;do{if((x|0)==0){K=16}else{L=c[x+12>>2]|0;if((L|0)==(c[x+16>>2]|0)){M=b5[c[(c[x>>2]|0)+36>>2]&511](x)|0}else{M=c[L>>2]|0}if((M|0)==-1){K=16;break}if(f){N=0;O=x}else{P=H;Q=x;R=0;S=I;T=0;break L6}}}while(0);if((K|0)==16){K=0;if(f){P=H;Q=0;R=1;S=0;T=1;break}else{N=1;O=0}}L=(c[r>>2]|0)-H|0;U=a[y]|0;V=U&255;if((L|0)==(((V&1|0)==0?V>>>1:c[F>>2]|0)|0)){V=L<<1;do{if(L>>>0<V>>>0){kI(q,L)}else{if((U&1)==0){a[j+1+V|0]=0;a[y]=L<<2;break}else{a[(c[o>>2]|0)+V|0]=0;c[F>>2]=V;break}}}while(0);V=a[y]|0;if((V&1)==0){W=10;X=V}else{V=c[E>>2]|0;W=(V&-2)-1|0;X=V&255}V=X&255;U=(V&1|0)==0?V>>>1:c[F>>2]|0;do{if(U>>>0<W>>>0){kI(q,W-U|0)}else{if((X&1)==0){a[j+1+W|0]=0;a[y]=W<<1;break}else{a[(c[o>>2]|0)+W|0]=0;c[F>>2]=W;break}}}while(0);if((a[y]&1)==0){Y=C}else{Y=c[D>>2]|0}c[r>>2]=Y+L;Z=Y}else{Z=H}U=I+12|0;V=c[U>>2]|0;_=I+16|0;if((V|0)==(c[_>>2]|0)){$=b5[c[(c[I>>2]|0)+36>>2]&511](I)|0}else{$=c[V>>2]|0}if((mw($,v,w,Z,r,G,n,p,A,t,u,z)|0)!=0){P=Z;Q=O;R=N;S=I;T=f;break}V=c[U>>2]|0;if((V|0)==(c[_>>2]|0)){b5[c[(c[I>>2]|0)+40>>2]&511](I)|0;H=Z;B=I;x=O;continue}else{c[U>>2]=V+4;H=Z;B=I;x=O;continue}}O=d[g]|0;if((O&1|0)==0){aa=O>>>1}else{aa=c[p+4>>2]|0}do{if((aa|0)!=0){if((a[v]&1)==0){break}O=c[t>>2]|0;if((O-s|0)>=160){break}x=c[u>>2]|0;c[t>>2]=O+4;c[O>>2]=x}}while(0);ab=+p7(P,c[r>>2]|0,l);h[k>>3]=ab,c[m>>2]=c[k>>2],c[m+4>>2]=c[k+4>>2];oc(p,A,c[t>>2]|0,l);if(T){ac=0}else{T=c[S+12>>2]|0;if((T|0)==(c[S+16>>2]|0)){ad=b5[c[(c[S>>2]|0)+36>>2]&511](S)|0}else{ad=c[T>>2]|0}ac=(ad|0)==-1?0:S}S=(ac|0)==0;do{if(R){K=68}else{ad=c[Q+12>>2]|0;if((ad|0)==(c[Q+16>>2]|0)){ae=b5[c[(c[Q>>2]|0)+36>>2]&511](Q)|0}else{ae=c[ad>>2]|0}if((ae|0)==-1){K=68;break}if(!(S^(Q|0)==0)){K=70}}}while(0);if((K|0)==68){if(S){K=70}}if((K|0)==70){c[l>>2]=c[l>>2]|2}c[b>>2]=ac;do{if((a[y]&1)!=0){ac=c[o>>2]|0;if((ac|0)==0){break}qI(ac)}}while(0);if((a[g]&1)==0){i=e;return}g=c[p+8>>2]|0;if((g|0)==0){i=e;return}qI(g);i=e;return}function mo(b,e,f,g,j,l,m){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0.0,ac=0,ad=0,ae=0;e=i;i=i+340|0;n=f;f=i;i=i+4|0;c[f>>2]=c[n>>2];n=g;g=i;i=i+4|0;c[g>>2]=c[n>>2];n=e+128|0;o=e+132|0;p=e+136|0;q=e+148|0;r=e+160|0;s=e+164|0;t=e+324|0;u=e+328|0;v=e+332|0;w=e+336|0;x=c[f>>2]|0;f=c[g>>2]|0;g=p;y=q;z=e|0;mv(p,c[j+28>>2]|0,z,n,o);qP(y|0,0,12)|0;j=q;kI(q,10);if((a[y]&1)==0){A=j+1|0;B=A;C=A;D=q+8|0}else{A=q+8|0;B=c[A>>2]|0;C=j+1|0;D=A}c[r>>2]=B;A=s|0;c[t>>2]=A;c[u>>2]=0;a[v]=1;a[w]=69;E=q|0;F=q+4|0;G=c[n>>2]|0;n=c[o>>2]|0;o=q+8|0;H=B;B=x;x=f;L6:while(1){if((B|0)==0){I=0}else{f=c[B+12>>2]|0;if((f|0)==(c[B+16>>2]|0)){J=b5[c[(c[B>>2]|0)+36>>2]&511](B)|0}else{J=c[f>>2]|0}I=(J|0)==-1?0:B}f=(I|0)==0;do{if((x|0)==0){K=16}else{L=c[x+12>>2]|0;if((L|0)==(c[x+16>>2]|0)){M=b5[c[(c[x>>2]|0)+36>>2]&511](x)|0}else{M=c[L>>2]|0}if((M|0)==-1){K=16;break}if(f){N=0;O=x}else{P=H;Q=x;R=0;S=I;T=0;break L6}}}while(0);if((K|0)==16){K=0;if(f){P=H;Q=0;R=1;S=0;T=1;break}else{N=1;O=0}}L=(c[r>>2]|0)-H|0;U=a[y]|0;V=U&255;if((L|0)==(((V&1|0)==0?V>>>1:c[F>>2]|0)|0)){V=L<<1;do{if(L>>>0<V>>>0){kI(q,L)}else{if((U&1)==0){a[j+1+V|0]=0;a[y]=L<<2;break}else{a[(c[o>>2]|0)+V|0]=0;c[F>>2]=V;break}}}while(0);V=a[y]|0;if((V&1)==0){W=10;X=V}else{V=c[E>>2]|0;W=(V&-2)-1|0;X=V&255}V=X&255;U=(V&1|0)==0?V>>>1:c[F>>2]|0;do{if(U>>>0<W>>>0){kI(q,W-U|0)}else{if((X&1)==0){a[j+1+W|0]=0;a[y]=W<<1;break}else{a[(c[o>>2]|0)+W|0]=0;c[F>>2]=W;break}}}while(0);if((a[y]&1)==0){Y=C}else{Y=c[D>>2]|0}c[r>>2]=Y+L;Z=Y}else{Z=H}U=I+12|0;V=c[U>>2]|0;_=I+16|0;if((V|0)==(c[_>>2]|0)){$=b5[c[(c[I>>2]|0)+36>>2]&511](I)|0}else{$=c[V>>2]|0}if((mw($,v,w,Z,r,G,n,p,A,t,u,z)|0)!=0){P=Z;Q=O;R=N;S=I;T=f;break}V=c[U>>2]|0;if((V|0)==(c[_>>2]|0)){b5[c[(c[I>>2]|0)+40>>2]&511](I)|0;H=Z;B=I;x=O;continue}else{c[U>>2]=V+4;H=Z;B=I;x=O;continue}}O=d[g]|0;if((O&1|0)==0){aa=O>>>1}else{aa=c[p+4>>2]|0}do{if((aa|0)!=0){if((a[v]&1)==0){break}O=c[t>>2]|0;if((O-s|0)>=160){break}x=c[u>>2]|0;c[t>>2]=O+4;c[O>>2]=x}}while(0);ab=+p6(P,c[r>>2]|0,l);h[k>>3]=ab,c[m>>2]=c[k>>2],c[m+4>>2]=c[k+4>>2];oc(p,A,c[t>>2]|0,l);if(T){ac=0}else{T=c[S+12>>2]|0;if((T|0)==(c[S+16>>2]|0)){ad=b5[c[(c[S>>2]|0)+36>>2]&511](S)|0}else{ad=c[T>>2]|0}ac=(ad|0)==-1?0:S}S=(ac|0)==0;do{if(R){K=68}else{ad=c[Q+12>>2]|0;if((ad|0)==(c[Q+16>>2]|0)){ae=b5[c[(c[Q>>2]|0)+36>>2]&511](Q)|0}else{ae=c[ad>>2]|0}if((ae|0)==-1){K=68;break}if(!(S^(Q|0)==0)){K=70}}}while(0);if((K|0)==68){if(S){K=70}}if((K|0)==70){c[l>>2]=c[l>>2]|2}c[b>>2]=ac;do{if((a[y]&1)!=0){ac=c[o>>2]|0;if((ac|0)==0){break}qI(ac)}}while(0);if((a[g]&1)==0){i=e;return}g=c[p+8>>2]|0;if((g|0)==0){i=e;return}qI(g);i=e;return}function mp(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0;d=i;i=i+128|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2];k=f;f=i;i=i+4|0;c[f>>2]=c[k>>2];k=d|0;l=d+12|0;m=d+116|0;n=m;o=i;i=i+12|0;p=i;i=i+4|0;q=i;i=i+160|0;r=i;i=i+4|0;s=i;i=i+4|0;qP(n|0,0,12)|0;t=o;u=c[g+28>>2]|0;g=u+4|0;I=c[g>>2]|0,c[g>>2]=I+1,I;if((c[7543]|0)!=-1){c[k>>2]=30172;c[k+4>>2]=48;c[k+8>>2]=0;kE(30172,k)}k=(c[7544]|0)-1|0;v=c[u+8>>2]|0;do{if((c[u+12>>2]|0)-v>>2>>>0>k>>>0){w=c[v+(k<<2)>>2]|0;if((w|0)==0){break}x=l|0;cd[c[(c[w>>2]|0)+48>>2]&15](w,26776,26802,x)|0;if(((I=c[g>>2]|0,c[g>>2]=I+ -1,I)|0)==0){b0[c[(c[u>>2]|0)+8>>2]&1023](u)}qP(t|0,0,12)|0;w=o;kI(o,10);if((a[t]&1)==0){y=w+1|0;z=y;A=y;B=o+8|0}else{y=o+8|0;z=c[y>>2]|0;A=w+1|0;B=y}c[p>>2]=z;y=q|0;c[r>>2]=y;c[s>>2]=0;C=e|0;D=f|0;E=o|0;F=o+4|0;G=o+8|0;H=z;J=c[C>>2]|0;L16:while(1){do{if((J|0)==0){K=0}else{L=c[J+12>>2]|0;if((L|0)==(c[J+16>>2]|0)){M=b5[c[(c[J>>2]|0)+36>>2]&511](J)|0}else{M=c[L>>2]|0}if((M|0)!=-1){K=J;break}c[C>>2]=0;K=0}}while(0);L=(K|0)==0;N=c[D>>2]|0;do{if((N|0)==0){O=27}else{P=c[N+12>>2]|0;if((P|0)==(c[N+16>>2]|0)){Q=b5[c[(c[N>>2]|0)+36>>2]&511](N)|0}else{Q=c[P>>2]|0}if((Q|0)==-1){c[D>>2]=0;O=27;break}else{if(L){break}else{R=H;break L16}}}}while(0);if((O|0)==27){O=0;if(L){R=H;break}}N=(c[p>>2]|0)-H|0;P=a[t]|0;S=P&255;if((N|0)==(((S&1|0)==0?S>>>1:c[F>>2]|0)|0)){S=N<<1;do{if(N>>>0<S>>>0){kI(o,N)}else{if((P&1)==0){a[w+1+S|0]=0;a[t]=N<<2;break}else{a[(c[G>>2]|0)+S|0]=0;c[F>>2]=S;break}}}while(0);S=a[t]|0;if((S&1)==0){T=10;U=S}else{S=c[E>>2]|0;T=(S&-2)-1|0;U=S&255}S=U&255;P=(S&1|0)==0?S>>>1:c[F>>2]|0;do{if(P>>>0<T>>>0){kI(o,T-P|0)}else{if((U&1)==0){a[w+1+T|0]=0;a[t]=T<<1;break}else{a[(c[G>>2]|0)+T|0]=0;c[F>>2]=T;break}}}while(0);if((a[t]&1)==0){V=A}else{V=c[B>>2]|0}c[p>>2]=V+N;W=V}else{W=H}P=K+12|0;S=c[P>>2]|0;L=K+16|0;if((S|0)==(c[L>>2]|0)){X=b5[c[(c[K>>2]|0)+36>>2]&511](K)|0}else{X=c[S>>2]|0}if((mq(X,16,W,p,s,0,m,y,r,x)|0)!=0){R=W;break}S=c[P>>2]|0;if((S|0)==(c[L>>2]|0)){b5[c[(c[K>>2]|0)+40>>2]&511](K)|0;H=W;J=K;continue}else{c[P>>2]=S+4;H=W;J=K;continue}}a[R+3|0]=0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);J=mb(R,c[7204]|0,(H=i,i=i+4|0,c[H>>2]=j,H)|0)|0;i=H;if((J|0)!=1){c[h>>2]=4}J=c[C>>2]|0;do{if((J|0)==0){Y=0}else{H=c[J+12>>2]|0;if((H|0)==(c[J+16>>2]|0)){Z=b5[c[(c[J>>2]|0)+36>>2]&511](J)|0}else{Z=c[H>>2]|0}if((Z|0)!=-1){Y=J;break}c[C>>2]=0;Y=0}}while(0);C=(Y|0)==0;J=c[D>>2]|0;do{if((J|0)==0){O=79}else{H=c[J+12>>2]|0;if((H|0)==(c[J+16>>2]|0)){_=b5[c[(c[J>>2]|0)+36>>2]&511](J)|0}else{_=c[H>>2]|0}if((_|0)==-1){c[D>>2]=0;O=79;break}else{if(C){break}else{O=81;break}}}}while(0);if((O|0)==79){if(C){O=81}}if((O|0)==81){c[h>>2]=c[h>>2]|2}c[b>>2]=Y;do{if((a[t]&1)!=0){D=c[G>>2]|0;if((D|0)==0){break}qI(D)}}while(0);if((a[n]&1)==0){i=d;return}G=c[m+8>>2]|0;if((G|0)==0){i=d;return}qI(G);i=d;return}}while(0);d=bR(4)|0;c[d>>2]=3308;bl(d|0,24132,322)}function mq(b,e,f,g,h,i,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0;n=c[g>>2]|0;o=(n|0)==(f|0);do{if(o){p=(c[m+96>>2]|0)==(b|0);if(!p){if((c[m+100>>2]|0)!=(b|0)){break}}c[g>>2]=f+1;a[f]=p?43:45;c[h>>2]=0;q=0;return q|0}}while(0);p=d[j]|0;if((p&1|0)==0){r=p>>>1}else{r=c[j+4>>2]|0}if((r|0)!=0&(b|0)==(i|0)){i=c[l>>2]|0;if((i-k|0)>=160){q=0;return q|0}k=c[h>>2]|0;c[l>>2]=i+4;c[i>>2]=k;c[h>>2]=0;q=0;return q|0}k=m+104|0;i=m;while(1){if((i|0)==(k|0)){s=k;break}if((c[i>>2]|0)==(b|0)){s=i;break}else{i=i+4|0}}i=s-m|0;m=i>>2;if((i|0)>92){q=-1;return q|0}do{if((e|0)==8|(e|0)==10){if((m|0)<(e|0)){break}else{q=-1}return q|0}else if((e|0)==16){if((i|0)<88){break}if(o){q=-1;return q|0}if((n-f|0)>=3){q=-1;return q|0}if((a[n-1|0]|0)!=48){q=-1;return q|0}c[h>>2]=0;s=a[26776+m|0]|0;b=c[g>>2]|0;c[g>>2]=b+1;a[b]=s;q=0;return q|0}}while(0);f=a[26776+m|0]|0;c[g>>2]=n+1;a[n]=f;c[h>>2]=(c[h>>2]|0)+1;q=0;return q|0}function mr(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=i;i=i+24|0;h=g|0;j=g+12|0;k=d+4|0;I=c[k>>2]|0,c[k>>2]=I+1,I;if((c[7545]|0)!=-1){c[j>>2]=30180;c[j+4>>2]=48;c[j+8>>2]=0;kE(30180,j)}j=(c[7546]|0)-1|0;l=d+12|0;m=d+8|0;n=c[m>>2]|0;do{if((c[l>>2]|0)-n>>2>>>0>j>>>0){o=c[n+(j<<2)>>2]|0;if((o|0)==0){break}cd[c[(c[o>>2]|0)+32>>2]&15](o,26776,26802,e)|0;if((c[7453]|0)!=-1){c[h>>2]=29812;c[h+4>>2]=48;c[h+8>>2]=0;kE(29812,h)}o=(c[7454]|0)-1|0;p=c[m>>2]|0;do{if((c[l>>2]|0)-p>>2>>>0>o>>>0){q=c[p+(o<<2)>>2]|0;if((q|0)==0){break}r=q;a[f]=b5[c[(c[q>>2]|0)+16>>2]&511](r)|0;b1[c[(c[q>>2]|0)+20>>2]&255](b,r);if(((I=c[k>>2]|0,c[k>>2]=I+ -1,I)|0)!=0){i=g;return}b0[c[(c[d>>2]|0)+8>>2]&1023](d);i=g;return}}while(0);o=bR(4)|0;c[o>>2]=3308;bl(o|0,24132,322)}}while(0);g=bR(4)|0;c[g>>2]=3308;bl(g|0,24132,322)}function ms(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;h=i;i=i+24|0;j=h|0;k=h+12|0;l=d+4|0;I=c[l>>2]|0,c[l>>2]=I+1,I;if((c[7545]|0)!=-1){c[k>>2]=30180;c[k+4>>2]=48;c[k+8>>2]=0;kE(30180,k)}k=(c[7546]|0)-1|0;m=d+12|0;n=d+8|0;o=c[n>>2]|0;do{if((c[m>>2]|0)-o>>2>>>0>k>>>0){p=c[o+(k<<2)>>2]|0;if((p|0)==0){break}cd[c[(c[p>>2]|0)+32>>2]&15](p,26776,26808,e)|0;if((c[7453]|0)!=-1){c[j>>2]=29812;c[j+4>>2]=48;c[j+8>>2]=0;kE(29812,j)}p=(c[7454]|0)-1|0;q=c[n>>2]|0;do{if((c[m>>2]|0)-q>>2>>>0>p>>>0){r=c[q+(p<<2)>>2]|0;if((r|0)==0){break}s=r;t=r;a[f]=b5[c[(c[t>>2]|0)+12>>2]&511](s)|0;a[g]=b5[c[(c[t>>2]|0)+16>>2]&511](s)|0;b1[c[(c[r>>2]|0)+20>>2]&255](b,s);if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){i=h;return}b0[c[(c[d>>2]|0)+8>>2]&1023](d);i=h;return}}while(0);p=bR(4)|0;c[p>>2]=3308;bl(p|0,24132,322)}}while(0);h=bR(4)|0;c[h>>2]=3308;bl(h|0,24132,322)}function mt(b,e,f,g,h,i,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0;if(b<<24>>24==i<<24>>24){if((a[e]&1)==0){p=-1;return p|0}a[e]=0;i=c[h>>2]|0;c[h>>2]=i+1;a[i]=46;i=d[k]|0;if((i&1|0)==0){q=i>>>1}else{q=c[k+4>>2]|0}if((q|0)==0){p=0;return p|0}q=c[m>>2]|0;if((q-l|0)>=160){p=0;return p|0}i=c[n>>2]|0;c[m>>2]=q+4;c[q>>2]=i;p=0;return p|0}do{if(b<<24>>24==j<<24>>24){i=d[k]|0;if((i&1|0)==0){r=i>>>1}else{r=c[k+4>>2]|0}if((r|0)==0){break}if((a[e]&1)==0){p=-1;return p|0}i=c[m>>2]|0;if((i-l|0)>=160){p=0;return p|0}q=c[n>>2]|0;c[m>>2]=i+4;c[i>>2]=q;c[n>>2]=0;p=0;return p|0}}while(0);r=o+32|0;j=o;while(1){if((j|0)==(r|0)){s=r;break}if((a[j]|0)==b<<24>>24){s=j;break}else{j=j+1|0}}j=s-o|0;if((j|0)>31){p=-1;return p|0}o=a[26776+j|0]|0;if((j|0)==22|(j|0)==23){a[f]=80;s=c[h>>2]|0;c[h>>2]=s+1;a[s]=o;p=0;return p|0}else if((j|0)==25|(j|0)==24){s=c[h>>2]|0;do{if((s|0)!=(g|0)){if((a[s-1|0]&95|0)==(a[f]&127|0)){break}else{p=-1}return p|0}}while(0);c[h>>2]=s+1;a[s]=o;p=0;return p|0}else{s=a[f]|0;do{if((o&95|0)==(s<<24>>24|0)){a[f]=s|-128;if((a[e]&1)==0){break}a[e]=0;g=d[k]|0;if((g&1|0)==0){t=g>>>1}else{t=c[k+4>>2]|0}if((t|0)==0){break}g=c[m>>2]|0;if((g-l|0)>=160){break}b=c[n>>2]|0;c[m>>2]=g+4;c[g>>2]=b}}while(0);m=c[h>>2]|0;c[h>>2]=m+1;a[m]=o;if((j|0)>21){p=0;return p|0}c[n>>2]=(c[n>>2]|0)+1;p=0;return p|0}return 0}function mu(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;i=i+24|0;g=f|0;h=f+12|0;j=b+4|0;I=c[j>>2]|0,c[j>>2]=I+1,I;if((c[7543]|0)!=-1){c[h>>2]=30172;c[h+4>>2]=48;c[h+8>>2]=0;kE(30172,h)}h=(c[7544]|0)-1|0;k=b+12|0;l=b+8|0;m=c[l>>2]|0;do{if((c[k>>2]|0)-m>>2>>>0>h>>>0){n=c[m+(h<<2)>>2]|0;if((n|0)==0){break}cd[c[(c[n>>2]|0)+48>>2]&15](n,26776,26802,d)|0;if((c[7451]|0)!=-1){c[g>>2]=29804;c[g+4>>2]=48;c[g+8>>2]=0;kE(29804,g)}n=(c[7452]|0)-1|0;o=c[l>>2]|0;do{if((c[k>>2]|0)-o>>2>>>0>n>>>0){p=c[o+(n<<2)>>2]|0;if((p|0)==0){break}q=p;c[e>>2]=b5[c[(c[p>>2]|0)+16>>2]&511](q)|0;b1[c[(c[p>>2]|0)+20>>2]&255](a,q);if(((I=c[j>>2]|0,c[j>>2]=I+ -1,I)|0)!=0){i=f;return}b0[c[(c[b>>2]|0)+8>>2]&1023](b);i=f;return}}while(0);n=bR(4)|0;c[n>>2]=3308;bl(n|0,24132,322)}}while(0);f=bR(4)|0;c[f>>2]=3308;bl(f|0,24132,322)}function mv(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=i;i=i+24|0;h=g|0;j=g+12|0;k=b+4|0;I=c[k>>2]|0,c[k>>2]=I+1,I;if((c[7543]|0)!=-1){c[j>>2]=30172;c[j+4>>2]=48;c[j+8>>2]=0;kE(30172,j)}j=(c[7544]|0)-1|0;l=b+12|0;m=b+8|0;n=c[m>>2]|0;do{if((c[l>>2]|0)-n>>2>>>0>j>>>0){o=c[n+(j<<2)>>2]|0;if((o|0)==0){break}cd[c[(c[o>>2]|0)+48>>2]&15](o,26776,26808,d)|0;if((c[7451]|0)!=-1){c[h>>2]=29804;c[h+4>>2]=48;c[h+8>>2]=0;kE(29804,h)}o=(c[7452]|0)-1|0;p=c[m>>2]|0;do{if((c[l>>2]|0)-p>>2>>>0>o>>>0){q=c[p+(o<<2)>>2]|0;if((q|0)==0){break}r=q;s=q;c[e>>2]=b5[c[(c[s>>2]|0)+12>>2]&511](r)|0;c[f>>2]=b5[c[(c[s>>2]|0)+16>>2]&511](r)|0;b1[c[(c[q>>2]|0)+20>>2]&255](a,r);if(((I=c[k>>2]|0,c[k>>2]=I+ -1,I)|0)!=0){i=g;return}b0[c[(c[b>>2]|0)+8>>2]&1023](b);i=g;return}}while(0);o=bR(4)|0;c[o>>2]=3308;bl(o|0,24132,322)}}while(0);g=bR(4)|0;c[g>>2]=3308;bl(g|0,24132,322)}function mw(b,e,f,g,h,i,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0;if((b|0)==(i|0)){if((a[e]&1)==0){p=-1;return p|0}a[e]=0;i=c[h>>2]|0;c[h>>2]=i+1;a[i]=46;i=d[k]|0;if((i&1|0)==0){q=i>>>1}else{q=c[k+4>>2]|0}if((q|0)==0){p=0;return p|0}q=c[m>>2]|0;if((q-l|0)>=160){p=0;return p|0}i=c[n>>2]|0;c[m>>2]=q+4;c[q>>2]=i;p=0;return p|0}do{if((b|0)==(j|0)){i=d[k]|0;if((i&1|0)==0){r=i>>>1}else{r=c[k+4>>2]|0}if((r|0)==0){break}if((a[e]&1)==0){p=-1;return p|0}i=c[m>>2]|0;if((i-l|0)>=160){p=0;return p|0}q=c[n>>2]|0;c[m>>2]=i+4;c[i>>2]=q;c[n>>2]=0;p=0;return p|0}}while(0);r=o+128|0;j=o;while(1){if((j|0)==(r|0)){s=r;break}if((c[j>>2]|0)==(b|0)){s=j;break}else{j=j+4|0}}j=s-o|0;o=j>>2;if((j|0)>124){p=-1;return p|0}s=a[26776+o|0]|0;do{if((o|0)==22|(o|0)==23){a[f]=80}else if((o|0)==25|(o|0)==24){b=c[h>>2]|0;do{if((b|0)!=(g|0)){if((a[b-1|0]&95|0)==(a[f]&127|0)){break}else{p=-1}return p|0}}while(0);c[h>>2]=b+1;a[b]=s;p=0;return p|0}else{r=a[f]|0;if((s&95|0)!=(r<<24>>24|0)){break}a[f]=r|-128;if((a[e]&1)==0){break}a[e]=0;r=d[k]|0;if((r&1|0)==0){t=r>>>1}else{t=c[k+4>>2]|0}if((t|0)==0){break}r=c[m>>2]|0;if((r-l|0)>=160){break}q=c[n>>2]|0;c[m>>2]=r+4;c[r>>2]=q}}while(0);m=c[h>>2]|0;c[h>>2]=m+1;a[m]=s;if((j|0)>84){p=0;return p|0}c[n>>2]=(c[n>>2]|0)+1;p=0;return p|0}function mx(a){a=a|0;if((a|0)==0){return}qI(a);return}function my(a){a=a|0;return}function mz(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;j=i;i=i+28|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2];k=j|0;l=j+12|0;m=j+16|0;if((c[f+4>>2]&1|0)==0){n=c[(c[d>>2]|0)+24>>2]|0;c[l>>2]=c[e>>2];cc[n&63](b,d,l,f,g,h&1);i=j;return}g=c[f+28>>2]|0;f=g+4|0;I=c[f>>2]|0,c[f>>2]=I+1,I;if((c[7453]|0)!=-1){c[k>>2]=29812;c[k+4>>2]=48;c[k+8>>2]=0;kE(29812,k)}k=(c[7454]|0)-1|0;l=c[g+8>>2]|0;do{if((c[g+12>>2]|0)-l>>2>>>0>k>>>0){d=c[l+(k<<2)>>2]|0;if((d|0)==0){break}n=d;if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)==0){b0[c[(c[g>>2]|0)+8>>2]&1023](g)}o=c[d>>2]|0;if(h){b1[c[o+24>>2]&255](m,n)}else{b1[c[o+28>>2]&255](m,n)}n=m;o=m;d=a[o]|0;if((d&1)==0){p=n+1|0;q=p;r=p;s=m+8|0}else{p=m+8|0;q=c[p>>2]|0;r=n+1|0;s=p}p=e|0;n=m+4|0;t=q;u=d;while(1){v=(u&1)==0;if(v){w=r}else{w=c[s>>2]|0}d=u&255;if((t|0)==(w+((d&1|0)==0?d>>>1:c[n>>2]|0)|0)){break}d=a[t]|0;x=c[p>>2]|0;do{if((x|0)!=0){y=x+24|0;z=c[y>>2]|0;if((z|0)!=(c[x+28>>2]|0)){c[y>>2]=z+1;a[z]=d;break}if((b2[c[(c[x>>2]|0)+52>>2]&127](x,d&255)|0)!=-1){break}c[p>>2]=0}}while(0);t=t+1|0;u=a[o]|0}c[b>>2]=c[p>>2];if(v){i=j;return}o=c[m+8>>2]|0;if((o|0)==0){i=j;return}qI(o);i=j;return}}while(0);j=bR(4)|0;c[j>>2]=3308;bl(j|0,24132,322)}function mA(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=i;i=i+56|0;j=e;e=i;i=i+4|0;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+20|0;m=d+44|0;n=d+48|0;o=d+52|0;p=j|0;a[p]=a[3260]|0;a[p+1|0]=a[3261]|0;a[p+2|0]=a[3262]|0;a[p+3|0]=a[3263]|0;a[p+4|0]=a[3264]|0;a[p+5|0]=a[3265]|0;q=j+1|0;r=f+4|0;s=c[r>>2]|0;if((s&2048|0)==0){t=q}else{a[q]=43;t=j+2|0}if((s&512|0)==0){u=t}else{a[t]=35;u=t+1|0}a[u]=108;t=u+1|0;u=s&74;do{if((u|0)==64){a[t]=111}else if((u|0)==8){if((s&16384|0)==0){a[t]=120;break}else{a[t]=88;break}}else{a[t]=100}}while(0);t=k|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);s=mB(t,12,c[7204]|0,p,(p=i,i=i+4|0,c[p>>2]=h,p)|0)|0;i=p;p=k+s|0;h=c[r>>2]&176;do{if((h|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){v=k+1|0;break}if(!((s|0)>1&r<<24>>24==48)){w=22;break}r=a[k+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){w=22;break}v=k+2|0}else if((h|0)==32){v=p}else{w=22}}while(0);if((w|0)==22){v=t}w=l|0;l=o|0;h=c[f+28>>2]|0;c[l>>2]=h;k=h+4|0;I=c[k>>2]|0,c[k>>2]=I+1,I;mC(t,v,p,w,m,n,o);o=c[l>>2]|0;l=o+4|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){x=e|0;y=c[x>>2]|0;z=c[m>>2]|0;A=c[n>>2]|0;mD(b,y,w,z,A,f,g);i=d;return}b0[c[(c[o>>2]|0)+8>>2]&1023](o|0);x=e|0;y=c[x>>2]|0;z=c[m>>2]|0;A=c[n>>2]|0;mD(b,y,w,z,A,f,g);i=d;return}function mB(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;i=i+4|0;h=g|0;c[h>>2]=f;f=bH(d|0)|0;d=aZ(a|0,b|0,e|0,c[h>>2]|0)|0;if((f|0)==0){i=g;return d|0}bH(f|0)|0;i=g;return d|0}function mC(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;l=i;i=i+36|0;m=l|0;n=l+12|0;o=l+24|0;p=k|0;k=c[p>>2]|0;if((c[7545]|0)!=-1){c[n>>2]=30180;c[n+4>>2]=48;c[n+8>>2]=0;kE(30180,n)}n=(c[7546]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=bR(4)|0;s=r;c[s>>2]=3308;bl(r|0,24132,322)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bR(4)|0;s=r;c[s>>2]=3308;bl(r|0,24132,322)}r=k;s=c[p>>2]|0;if((c[7453]|0)!=-1){c[m>>2]=29812;c[m+4>>2]=48;c[m+8>>2]=0;kE(29812,m)}m=(c[7454]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=bR(4)|0;u=t;c[u>>2]=3308;bl(t|0,24132,322)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bR(4)|0;u=t;c[u>>2]=3308;bl(t|0,24132,322)}t=s;b1[c[(c[s>>2]|0)+20>>2]&255](o,t);u=o;m=o;p=d[m]|0;if((p&1|0)==0){v=p>>>1}else{v=c[o+4>>2]|0}do{if((v|0)==0){cd[c[(c[k>>2]|0)+32>>2]&15](r,b,f,g)|0;c[j>>2]=g+(f-b)}else{c[j>>2]=g;p=a[b]|0;if((p<<24>>24|0)==45|(p<<24>>24|0)==43){n=b2[c[(c[k>>2]|0)+28>>2]&127](r,p)|0;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=n;w=b+1|0}else{w=b}do{if((f-w|0)>1){if((a[w]|0)!=48){x=w;break}n=w+1|0;p=a[n]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){x=w;break}p=k;q=b2[c[(c[p>>2]|0)+28>>2]&127](r,48)|0;y=c[j>>2]|0;c[j>>2]=y+1;a[y]=q;q=b2[c[(c[p>>2]|0)+28>>2]&127](r,a[n]|0)|0;n=c[j>>2]|0;c[j>>2]=n+1;a[n]=q;x=w+2|0}else{x=w}}while(0);do{if((x|0)!=(f|0)){q=f-1|0;if(x>>>0<q>>>0){z=x;A=q}else{break}do{q=a[z]|0;a[z]=a[A]|0;a[A]=q;z=z+1|0;A=A-1|0;}while(z>>>0<A>>>0)}}while(0);q=b5[c[(c[s>>2]|0)+16>>2]&511](t)|0;if(x>>>0<f>>>0){n=u+1|0;p=k;y=o+4|0;B=o+8|0;C=0;D=0;E=x;while(1){F=a[((a[m]&1)==0?n:c[B>>2]|0)+D|0]|0;if(F<<24>>24!=0&(C|0)==(F<<24>>24|0)){F=c[j>>2]|0;c[j>>2]=F+1;a[F]=q;F=d[m]|0;G=(D>>>0<(((F&1|0)==0?F>>>1:c[y>>2]|0)-1|0)>>>0)+D|0;H=0}else{G=D;H=C}F=b2[c[(c[p>>2]|0)+28>>2]&127](r,a[E]|0)|0;I=c[j>>2]|0;c[j>>2]=I+1;a[I]=F;F=E+1|0;if(F>>>0<f>>>0){C=H+1|0;D=G;E=F}else{break}}}E=g+(x-b)|0;D=c[j>>2]|0;if((E|0)==(D|0)){break}C=D-1|0;if(E>>>0<C>>>0){J=E;K=C}else{break}do{C=a[J]|0;a[J]=a[K]|0;a[K]=C;J=J+1|0;K=K-1|0;}while(J>>>0<K>>>0)}}while(0);if((e|0)==(f|0)){L=c[j>>2]|0}else{L=g+(e-b)|0}c[h>>2]=L;if((a[m]&1)==0){i=l;return}m=c[o+8>>2]|0;if((m|0)==0){i=l;return}qI(m);i=l;return}function mD(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;k=i;i=i+12|0;l=k|0;if((d|0)==0){c[b>>2]=0;i=k;return}m=g;g=e;n=m-g|0;o=h+12|0;h=c[o>>2]|0;p=(h|0)>(n|0)?h-n|0:0;n=f;h=n-g|0;do{if((h|0)>0){if((b3[c[(c[d>>2]|0)+48>>2]&63](d,e,h)|0)==(h|0)){break}c[b>>2]=0;i=k;return}}while(0);do{if((p|0)>0){do{if(p>>>0<11>>>0){h=p<<1&255;e=l;a[e]=h;q=l+1|0;r=h;s=e}else{e=p+16&-16;h=(e|0)==0?1:e;while(1){t=qH(h)|0;if((t|0)!=0){u=20;break}g=(I=c[7664]|0,c[7664]=I+0,I);if((g|0)==0){break}b8[g&1]()}if((u|0)==20){c[l+8>>2]=t;h=e|1;c[l>>2]=h;c[l+4>>2]=p;q=t;r=h&255;s=l;break}h=bR(4)|0;c[h>>2]=3284;bl(h|0,24120,94)}}while(0);qP(q|0,j|0,p|0)|0;a[q+p|0]=0;if((r&1)==0){v=l+1|0}else{v=c[l+8>>2]|0}if((b3[c[(c[d>>2]|0)+48>>2]&63](d,v,p)|0)==(p|0)){if((a[s]&1)==0){break}h=c[l+8>>2]|0;if((h|0)==0){break}qI(h);break}c[b>>2]=0;if((a[s]&1)==0){i=k;return}h=c[l+8>>2]|0;if((h|0)==0){i=k;return}qI(h);i=k;return}}while(0);l=m-n|0;do{if((l|0)>0){if((b3[c[(c[d>>2]|0)+48>>2]&63](d,f,l)|0)==(l|0)){break}c[b>>2]=0;i=k;return}}while(0);c[o>>2]=0;c[b>>2]=d;i=k;return}function mE(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=i;i=i+88|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+76|0;o=d+80|0;p=d+84|0;c[k>>2]=37;c[k+4>>2]=0;q=k;k=q+1|0;r=f+4|0;s=c[r>>2]|0;if((s&2048|0)==0){t=k}else{a[k]=43;t=q+2|0}if((s&512|0)==0){u=t}else{a[t]=35;u=t+1|0}t=u+2|0;a[u]=108;a[u+1|0]=108;u=s&74;do{if((u|0)==8){if((s&16384|0)==0){a[t]=120;break}else{a[t]=88;break}}else if((u|0)==64){a[t]=111}else{a[t]=100}}while(0);t=l|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);u=mB(t,22,c[7204]|0,q,(q=i,i=i+8|0,c[q>>2]=h,c[q+4>>2]=j,q)|0)|0;i=q;q=l+u|0;j=c[r>>2]&176;do{if((j|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){v=l+1|0;break}if(!((u|0)>1&r<<24>>24==48)){w=22;break}r=a[l+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){w=22;break}v=l+2|0}else if((j|0)==32){v=q}else{w=22}}while(0);if((w|0)==22){v=t}w=m|0;m=p|0;j=c[f+28>>2]|0;c[m>>2]=j;l=j+4|0;I=c[l>>2]|0,c[l>>2]=I+1,I;mC(t,v,q,w,n,o,p);p=c[m>>2]|0;m=p+4|0;if(((I=c[m>>2]|0,c[m>>2]=I+ -1,I)|0)!=0){x=e|0;y=c[x>>2]|0;z=c[n>>2]|0;A=c[o>>2]|0;mD(b,y,w,z,A,f,g);i=d;return}b0[c[(c[p>>2]|0)+8>>2]&1023](p|0);x=e|0;y=c[x>>2]|0;z=c[n>>2]|0;A=c[o>>2]|0;mD(b,y,w,z,A,f,g);i=d;return}function mF(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=i;i=i+56|0;j=e;e=i;i=i+4|0;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+20|0;m=d+44|0;n=d+48|0;o=d+52|0;p=j|0;a[p]=a[3260]|0;a[p+1|0]=a[3261]|0;a[p+2|0]=a[3262]|0;a[p+3|0]=a[3263]|0;a[p+4|0]=a[3264]|0;a[p+5|0]=a[3265]|0;q=j+1|0;r=f+4|0;s=c[r>>2]|0;if((s&2048|0)==0){t=q}else{a[q]=43;t=j+2|0}if((s&512|0)==0){u=t}else{a[t]=35;u=t+1|0}a[u]=108;t=u+1|0;u=s&74;do{if((u|0)==8){if((s&16384|0)==0){a[t]=120;break}else{a[t]=88;break}}else if((u|0)==64){a[t]=111}else{a[t]=117}}while(0);t=k|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);u=mB(t,12,c[7204]|0,p,(p=i,i=i+4|0,c[p>>2]=h,p)|0)|0;i=p;p=k+u|0;h=c[r>>2]&176;do{if((h|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){v=k+1|0;break}if(!((u|0)>1&r<<24>>24==48)){w=22;break}r=a[k+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){w=22;break}v=k+2|0}else if((h|0)==32){v=p}else{w=22}}while(0);if((w|0)==22){v=t}w=l|0;l=o|0;h=c[f+28>>2]|0;c[l>>2]=h;k=h+4|0;I=c[k>>2]|0,c[k>>2]=I+1,I;mC(t,v,p,w,m,n,o);o=c[l>>2]|0;l=o+4|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){x=e|0;y=c[x>>2]|0;z=c[m>>2]|0;A=c[n>>2]|0;mD(b,y,w,z,A,f,g);i=d;return}b0[c[(c[o>>2]|0)+8>>2]&1023](o|0);x=e|0;y=c[x>>2]|0;z=c[m>>2]|0;A=c[n>>2]|0;mD(b,y,w,z,A,f,g);i=d;return}function mG(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=i;i=i+88|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+76|0;o=d+80|0;p=d+84|0;c[k>>2]=37;c[k+4>>2]=0;q=k;k=q+1|0;r=f+4|0;s=c[r>>2]|0;if((s&2048|0)==0){t=k}else{a[k]=43;t=q+2|0}if((s&512|0)==0){u=t}else{a[t]=35;u=t+1|0}t=u+2|0;a[u]=108;a[u+1|0]=108;u=s&74;do{if((u|0)==8){if((s&16384|0)==0){a[t]=120;break}else{a[t]=88;break}}else if((u|0)==64){a[t]=111}else{a[t]=117}}while(0);t=l|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);u=mB(t,23,c[7204]|0,q,(q=i,i=i+8|0,c[q>>2]=h,c[q+4>>2]=j,q)|0)|0;i=q;q=l+u|0;j=c[r>>2]&176;do{if((j|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){v=l+1|0;break}if(!((u|0)>1&r<<24>>24==48)){w=22;break}r=a[l+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){w=22;break}v=l+2|0}else if((j|0)==32){v=q}else{w=22}}while(0);if((w|0)==22){v=t}w=m|0;m=p|0;j=c[f+28>>2]|0;c[m>>2]=j;l=j+4|0;I=c[l>>2]|0,c[l>>2]=I+1,I;mC(t,v,q,w,n,o,p);p=c[m>>2]|0;m=p+4|0;if(((I=c[m>>2]|0,c[m>>2]=I+ -1,I)|0)!=0){x=e|0;y=c[x>>2]|0;z=c[n>>2]|0;A=c[o>>2]|0;mD(b,y,w,z,A,f,g);i=d;return}b0[c[(c[p>>2]|0)+8>>2]&1023](p|0);x=e|0;y=c[x>>2]|0;z=c[n>>2]|0;A=c[o>>2]|0;mD(b,y,w,z,A,f,g);i=d;return}function mH(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0;d=i;i=i+120|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2];l=d|0;m=d+8|0;n=d+40|0;o=d+44|0;p=d+104|0;q=d+108|0;r=d+112|0;s=d+116|0;c[l>>2]=37;c[l+4>>2]=0;t=l;l=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=l}else{a[l]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;l=v>>>14;do{if((w|0)==260){if((l&1|0)==0){a[x]=97;y=0;break}else{a[x]=65;y=0;break}}else{a[x]=46;v=x+2|0;a[x+1|0]=42;if((w|0)==4){if((l&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else if((w|0)==256){if((l&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else{if((l&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);l=m|0;c[n>>2]=l;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);m=c[7204]|0;if(y){w=mB(l,30,m,t,(z=i,i=i+12|0,c[z>>2]=c[f+8>>2],h[k>>3]=j,c[z+4>>2]=c[k>>2],c[z+8>>2]=c[k+4>>2],z)|0)|0;i=z;A=w}else{w=mB(l,30,m,t,(z=i,i=i+8|0,h[k>>3]=j,c[z>>2]=c[k>>2],c[z+4>>2]=c[k+4>>2],z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[30724]|0)==0;if(y){do{if(w){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);m=mI(n,c[7204]|0,t,(z=i,i=i+12|0,c[z>>2]=c[f+8>>2],h[k>>3]=j,c[z+4>>2]=c[k>>2],c[z+8>>2]=c[k+4>>2],z)|0)|0;i=z;B=m}else{do{if(w){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);w=mI(n,c[7204]|0,t,(z=i,i=i+12|0,c[z>>2]=c[f+8>>2],h[k>>3]=j,c[z+4>>2]=c[k>>2],c[z+8>>2]=c[k+4>>2],z)|0)|0;i=z;B=w}w=c[n>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}w=bR(4)|0;c[w>>2]=3284;bl(w|0,24120,94)}else{C=A;D=0;E=c[n>>2]|0}}while(0);n=E+C|0;A=c[u>>2]&176;do{if((A|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=53;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=53;break}F=E+2|0}else if((A|0)==32){F=n}else{G=53}}while(0);if((G|0)==53){F=E}do{if((E|0)==(l|0)){H=o|0;J=0;K=l}else{G=qH(C<<1)|0;if((G|0)!=0){H=G;J=G;K=E;break}G=bR(4)|0;c[G>>2]=3284;bl(G|0,24120,94)}}while(0);E=r|0;C=c[f+28>>2]|0;c[E>>2]=C;l=C+4|0;I=c[l>>2]|0,c[l>>2]=I+1,I;mJ(K,F,n,H,p,q,r);r=c[E>>2]|0;E=r+4|0;if(((I=c[E>>2]|0,c[E>>2]=I+ -1,I)|0)==0){b0[c[(c[r>>2]|0)+8>>2]&1023](r|0)}r=e|0;mD(s,c[r>>2]|0,H,c[p>>2]|0,c[q>>2]|0,f,g);g=c[s>>2]|0;c[r>>2]=g;c[b>>2]=g;if((J|0)!=0){qI(J)}if((D|0)==0){i=d;return}qI(D);i=d;return}function mI(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+4|0;g=f|0;c[g>>2]=e;e=bH(b|0)|0;b=ba(a|0,d|0,c[g>>2]|0)|0;if((e|0)==0){i=f;return b|0}bH(e|0)|0;i=f;return b|0}function mJ(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;l=i;i=i+36|0;m=l|0;n=l+12|0;o=l+24|0;p=k|0;k=c[p>>2]|0;if((c[7545]|0)!=-1){c[n>>2]=30180;c[n+4>>2]=48;c[n+8>>2]=0;kE(30180,n)}n=(c[7546]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=bR(4)|0;s=r;c[s>>2]=3308;bl(r|0,24132,322)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bR(4)|0;s=r;c[s>>2]=3308;bl(r|0,24132,322)}r=k;s=c[p>>2]|0;if((c[7453]|0)!=-1){c[m>>2]=29812;c[m+4>>2]=48;c[m+8>>2]=0;kE(29812,m)}m=(c[7454]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=bR(4)|0;u=t;c[u>>2]=3308;bl(t|0,24132,322)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bR(4)|0;u=t;c[u>>2]=3308;bl(t|0,24132,322)}t=s;b1[c[(c[s>>2]|0)+20>>2]&255](o,t);c[j>>2]=g;u=a[b]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){m=b2[c[(c[k>>2]|0)+28>>2]&127](r,u)|0;u=c[j>>2]|0;c[j>>2]=u+1;a[u]=m;v=b+1|0}else{v=b}m=f;L23:do{if((m-v|0)>1){if((a[v]|0)!=48){w=v;x=37;break}u=v+1|0;p=a[u]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){w=v;x=37;break}p=k;n=b2[c[(c[p>>2]|0)+28>>2]&127](r,48)|0;q=c[j>>2]|0;c[j>>2]=q+1;a[q]=n;n=v+2|0;q=b2[c[(c[p>>2]|0)+28>>2]&127](r,a[u]|0)|0;u=c[j>>2]|0;c[j>>2]=u+1;a[u]=q;q=n;while(1){if(q>>>0>=f>>>0){y=q;z=n;break L23}u=a[q]|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);if((a3(u<<24>>24|0,c[7204]|0)|0)==0){y=q;z=n;break}else{q=q+1|0}}}else{w=v;x=37}}while(0);L38:do{if((x|0)==37){while(1){x=0;if(w>>>0>=f>>>0){y=w;z=v;break L38}q=a[w]|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);if((bM(q<<24>>24|0,c[7204]|0)|0)==0){y=w;z=v;break}else{w=w+1|0;x=37}}}}while(0);x=o;w=o;v=d[w]|0;if((v&1|0)==0){A=v>>>1}else{A=c[o+4>>2]|0}do{if((A|0)==0){cd[c[(c[k>>2]|0)+32>>2]&15](r,z,y,c[j>>2]|0)|0;c[j>>2]=(c[j>>2]|0)+(y-z)}else{do{if((z|0)!=(y|0)){v=y-1|0;if(z>>>0<v>>>0){B=z;C=v}else{break}do{v=a[B]|0;a[B]=a[C]|0;a[C]=v;B=B+1|0;C=C-1|0;}while(B>>>0<C>>>0)}}while(0);q=b5[c[(c[s>>2]|0)+16>>2]&511](t)|0;if(z>>>0<y>>>0){v=x+1|0;u=o+4|0;n=o+8|0;p=k;D=0;E=0;F=z;while(1){G=a[((a[w]&1)==0?v:c[n>>2]|0)+E|0]|0;if(G<<24>>24>0&(D|0)==(G<<24>>24|0)){G=c[j>>2]|0;c[j>>2]=G+1;a[G]=q;G=d[w]|0;H=(E>>>0<(((G&1|0)==0?G>>>1:c[u>>2]|0)-1|0)>>>0)+E|0;I=0}else{H=E;I=D}G=b2[c[(c[p>>2]|0)+28>>2]&127](r,a[F]|0)|0;J=c[j>>2]|0;c[j>>2]=J+1;a[J]=G;G=F+1|0;if(G>>>0<y>>>0){D=I+1|0;E=H;F=G}else{break}}}F=g+(z-b)|0;E=c[j>>2]|0;if((F|0)==(E|0)){break}D=E-1|0;if(F>>>0<D>>>0){K=F;L=D}else{break}do{D=a[K]|0;a[K]=a[L]|0;a[L]=D;K=K+1|0;L=L-1|0;}while(K>>>0<L>>>0)}}while(0);L76:do{if(y>>>0<f>>>0){L=k;K=y;while(1){z=a[K]|0;if(z<<24>>24==46){break}H=b2[c[(c[L>>2]|0)+28>>2]&127](r,z)|0;z=c[j>>2]|0;c[j>>2]=z+1;a[z]=H;H=K+1|0;if(H>>>0<f>>>0){K=H}else{M=H;break L76}}L=b5[c[(c[s>>2]|0)+12>>2]&511](t)|0;H=c[j>>2]|0;c[j>>2]=H+1;a[H]=L;M=K+1|0}else{M=y}}while(0);cd[c[(c[k>>2]|0)+32>>2]&15](r,M,f,c[j>>2]|0)|0;r=(c[j>>2]|0)+(m-M)|0;c[j>>2]=r;if((e|0)==(f|0)){N=r}else{N=g+(e-b)|0}c[h>>2]=N;if((a[w]&1)==0){i=l;return}w=c[o+8>>2]|0;if((w|0)==0){i=l;return}qI(w);i=l;return}function mK(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0;d=i;i=i+120|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2];l=d|0;m=d+8|0;n=d+40|0;o=d+44|0;p=d+104|0;q=d+108|0;r=d+112|0;s=d+116|0;c[l>>2]=37;c[l+4>>2]=0;t=l;l=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=l}else{a[l]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;l=v>>>14;do{if((w|0)==260){a[x]=76;v=x+1|0;if((l&1|0)==0){a[v]=97;y=0;break}else{a[v]=65;y=0;break}}else{a[x]=46;a[x+1|0]=42;a[x+2|0]=76;v=x+3|0;if((w|0)==256){if((l&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else if((w|0)==4){if((l&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else{if((l&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);l=m|0;c[n>>2]=l;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);m=c[7204]|0;if(y){w=mB(l,30,m,t,(z=i,i=i+12|0,c[z>>2]=c[f+8>>2],h[k>>3]=j,c[z+4>>2]=c[k>>2],c[z+8>>2]=c[k+4>>2],z)|0)|0;i=z;A=w}else{w=mB(l,30,m,t,(z=i,i=i+8|0,h[k>>3]=j,c[z>>2]=c[k>>2],c[z+4>>2]=c[k+4>>2],z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[30724]|0)==0;if(y){do{if(w){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);m=mI(n,c[7204]|0,t,(z=i,i=i+12|0,c[z>>2]=c[f+8>>2],h[k>>3]=j,c[z+4>>2]=c[k>>2],c[z+8>>2]=c[k+4>>2],z)|0)|0;i=z;B=m}else{do{if(w){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);w=mI(n,c[7204]|0,t,(z=i,i=i+8|0,h[k>>3]=j,c[z>>2]=c[k>>2],c[z+4>>2]=c[k+4>>2],z)|0)|0;i=z;B=w}w=c[n>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}w=bR(4)|0;c[w>>2]=3284;bl(w|0,24120,94)}else{C=A;D=0;E=c[n>>2]|0}}while(0);n=E+C|0;A=c[u>>2]&176;do{if((A|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=53;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=53;break}F=E+2|0}else if((A|0)==32){F=n}else{G=53}}while(0);if((G|0)==53){F=E}do{if((E|0)==(l|0)){H=o|0;J=0;K=l}else{G=qH(C<<1)|0;if((G|0)!=0){H=G;J=G;K=E;break}G=bR(4)|0;c[G>>2]=3284;bl(G|0,24120,94)}}while(0);E=r|0;C=c[f+28>>2]|0;c[E>>2]=C;l=C+4|0;I=c[l>>2]|0,c[l>>2]=I+1,I;mJ(K,F,n,H,p,q,r);r=c[E>>2]|0;E=r+4|0;if(((I=c[E>>2]|0,c[E>>2]=I+ -1,I)|0)==0){b0[c[(c[r>>2]|0)+8>>2]&1023](r|0)}r=e|0;mD(s,c[r>>2]|0,H,c[p>>2]|0,c[q>>2]|0,f,g);g=c[s>>2]|0;c[r>>2]=g;c[b>>2]=g;if((J|0)!=0){qI(J)}if((D|0)==0){i=d;return}qI(D);i=d;return}function mL(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;d=i;i=i+80|0;j=e;e=i;i=i+4|0;c[e>>2]=c[j>>2];j=d|0;k=d+20|0;l=d+40|0;m=d+12|0;a[m]=a[3268]|0;a[m+1|0]=a[3269]|0;a[m+2|0]=a[3270]|0;a[m+3|0]=a[3271]|0;a[m+4|0]=a[3272]|0;a[m+5|0]=a[3273]|0;n=k|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);o=mB(n,20,c[7204]|0,m,(m=i,i=i+4|0,c[m>>2]=h,m)|0)|0;i=m;m=k+o|0;h=c[f+4>>2]&176;do{if((h|0)==32){p=m}else if((h|0)==16){q=a[n]|0;if((q<<24>>24|0)==45|(q<<24>>24|0)==43){p=k+1|0;break}if(!((o|0)>1&q<<24>>24==48)){r=12;break}q=a[k+1|0]|0;if(!((q<<24>>24|0)==120|(q<<24>>24|0)==88)){r=12;break}p=k+2|0}else{r=12}}while(0);if((r|0)==12){p=n}r=c[f+28>>2]|0;h=r+4|0;I=c[h>>2]|0,c[h>>2]=I+1,I;if((c[7545]|0)!=-1){c[j>>2]=30180;c[j+4>>2]=48;c[j+8>>2]=0;kE(30180,j)}j=(c[7546]|0)-1|0;q=c[r+8>>2]|0;do{if((c[r+12>>2]|0)-q>>2>>>0>j>>>0){s=c[q+(j<<2)>>2]|0;if((s|0)==0){break}if(((I=c[h>>2]|0,c[h>>2]=I+ -1,I)|0)==0){b0[c[(c[r>>2]|0)+8>>2]&1023](r)}t=l|0;cd[c[(c[s>>2]|0)+32>>2]&15](s,n,m,t)|0;s=l+o|0;if((p|0)==(m|0)){u=s;v=e|0;w=c[v>>2]|0;mD(b,w,t,u,s,f,g);i=d;return}u=l+(p-k)|0;v=e|0;w=c[v>>2]|0;mD(b,w,t,u,s,f,g);i=d;return}}while(0);d=bR(4)|0;c[d>>2]=3308;bl(d|0,24132,322)}function mM(a){a=a|0;if((a|0)==0){return}qI(a);return}function mN(a){a=a|0;return}function mO(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;j=i;i=i+28|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2];k=j|0;l=j+12|0;m=j+16|0;if((c[f+4>>2]&1|0)==0){n=c[(c[d>>2]|0)+24>>2]|0;c[l>>2]=c[e>>2];cc[n&63](b,d,l,f,g,h&1);i=j;return}g=c[f+28>>2]|0;f=g+4|0;I=c[f>>2]|0,c[f>>2]=I+1,I;if((c[7451]|0)!=-1){c[k>>2]=29804;c[k+4>>2]=48;c[k+8>>2]=0;kE(29804,k)}k=(c[7452]|0)-1|0;l=c[g+8>>2]|0;do{if((c[g+12>>2]|0)-l>>2>>>0>k>>>0){d=c[l+(k<<2)>>2]|0;if((d|0)==0){break}n=d;if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)==0){b0[c[(c[g>>2]|0)+8>>2]&1023](g)}o=c[d>>2]|0;if(h){b1[c[o+24>>2]&255](m,n)}else{b1[c[o+28>>2]&255](m,n)}n=m;o=a[n]|0;if((o&1)==0){d=m+4|0;p=d;q=d;r=m+8|0}else{d=m+8|0;p=c[d>>2]|0;q=m+4|0;r=d}d=e|0;s=p;t=o;while(1){u=(t&1)==0;if(u){v=q}else{v=c[r>>2]|0}o=t&255;if((o&1|0)==0){w=o>>>1}else{w=c[q>>2]|0}if((s|0)==(v+(w<<2)|0)){break}o=c[s>>2]|0;x=c[d>>2]|0;do{if((x|0)!=0){y=x+24|0;z=c[y>>2]|0;if((z|0)==(c[x+28>>2]|0)){A=b2[c[(c[x>>2]|0)+52>>2]&127](x,o)|0}else{c[y>>2]=z+4;c[z>>2]=o;A=o}if((A|0)!=-1){break}c[d>>2]=0}}while(0);s=s+4|0;t=a[n]|0}c[b>>2]=c[d>>2];if(u){i=j;return}n=c[m+8>>2]|0;if((n|0)==0){i=j;return}qI(n);i=j;return}}while(0);j=bR(4)|0;c[j>>2]=3308;bl(j|0,24132,322)}function mP(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=i;i=i+116|0;j=e;e=i;i=i+4|0;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+20|0;m=d+104|0;n=d+108|0;o=d+112|0;p=j|0;a[p]=a[3260]|0;a[p+1|0]=a[3261]|0;a[p+2|0]=a[3262]|0;a[p+3|0]=a[3263]|0;a[p+4|0]=a[3264]|0;a[p+5|0]=a[3265]|0;q=j+1|0;r=f+4|0;s=c[r>>2]|0;if((s&2048|0)==0){t=q}else{a[q]=43;t=j+2|0}if((s&512|0)==0){u=t}else{a[t]=35;u=t+1|0}a[u]=108;t=u+1|0;u=s&74;do{if((u|0)==64){a[t]=111}else if((u|0)==8){if((s&16384|0)==0){a[t]=120;break}else{a[t]=88;break}}else{a[t]=100}}while(0);t=k|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);s=mB(t,12,c[7204]|0,p,(p=i,i=i+4|0,c[p>>2]=h,p)|0)|0;i=p;p=k+s|0;h=c[r>>2]&176;do{if((h|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){v=k+1|0;break}if(!((s|0)>1&r<<24>>24==48)){w=22;break}r=a[k+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){w=22;break}v=k+2|0}else if((h|0)==32){v=p}else{w=22}}while(0);if((w|0)==22){v=t}w=l|0;l=o|0;h=c[f+28>>2]|0;c[l>>2]=h;k=h+4|0;I=c[k>>2]|0,c[k>>2]=I+1,I;mQ(t,v,p,w,m,n,o);o=c[l>>2]|0;l=o+4|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){x=e|0;y=c[x>>2]|0;z=c[m>>2]|0;A=c[n>>2]|0;mR(b,y,w,z,A,f,g);i=d;return}b0[c[(c[o>>2]|0)+8>>2]&1023](o|0);x=e|0;y=c[x>>2]|0;z=c[m>>2]|0;A=c[n>>2]|0;mR(b,y,w,z,A,f,g);i=d;return}function mQ(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;l=i;i=i+36|0;m=l|0;n=l+12|0;o=l+24|0;p=k|0;k=c[p>>2]|0;if((c[7543]|0)!=-1){c[n>>2]=30172;c[n+4>>2]=48;c[n+8>>2]=0;kE(30172,n)}n=(c[7544]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=bR(4)|0;s=r;c[s>>2]=3308;bl(r|0,24132,322)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bR(4)|0;s=r;c[s>>2]=3308;bl(r|0,24132,322)}r=k;s=c[p>>2]|0;if((c[7451]|0)!=-1){c[m>>2]=29804;c[m+4>>2]=48;c[m+8>>2]=0;kE(29804,m)}m=(c[7452]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=bR(4)|0;u=t;c[u>>2]=3308;bl(t|0,24132,322)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bR(4)|0;u=t;c[u>>2]=3308;bl(t|0,24132,322)}t=s;b1[c[(c[s>>2]|0)+20>>2]&255](o,t);u=o;m=o;p=d[m]|0;if((p&1|0)==0){v=p>>>1}else{v=c[o+4>>2]|0}do{if((v|0)==0){cd[c[(c[k>>2]|0)+48>>2]&15](r,b,f,g)|0;c[j>>2]=g+(f-b<<2)}else{c[j>>2]=g;p=a[b]|0;if((p<<24>>24|0)==45|(p<<24>>24|0)==43){n=b2[c[(c[k>>2]|0)+44>>2]&127](r,p)|0;p=c[j>>2]|0;c[j>>2]=p+4;c[p>>2]=n;w=b+1|0}else{w=b}do{if((f-w|0)>1){if((a[w]|0)!=48){x=w;break}n=w+1|0;p=a[n]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){x=w;break}p=k;q=b2[c[(c[p>>2]|0)+44>>2]&127](r,48)|0;y=c[j>>2]|0;c[j>>2]=y+4;c[y>>2]=q;q=b2[c[(c[p>>2]|0)+44>>2]&127](r,a[n]|0)|0;n=c[j>>2]|0;c[j>>2]=n+4;c[n>>2]=q;x=w+2|0}else{x=w}}while(0);do{if((x|0)!=(f|0)){q=f-1|0;if(x>>>0<q>>>0){z=x;A=q}else{break}do{q=a[z]|0;a[z]=a[A]|0;a[A]=q;z=z+1|0;A=A-1|0;}while(z>>>0<A>>>0)}}while(0);q=b5[c[(c[s>>2]|0)+16>>2]&511](t)|0;if(x>>>0<f>>>0){n=u+1|0;p=k;y=o+4|0;B=o+8|0;C=0;D=0;E=x;while(1){F=a[((a[m]&1)==0?n:c[B>>2]|0)+D|0]|0;if(F<<24>>24!=0&(C|0)==(F<<24>>24|0)){F=c[j>>2]|0;c[j>>2]=F+4;c[F>>2]=q;F=d[m]|0;G=(D>>>0<(((F&1|0)==0?F>>>1:c[y>>2]|0)-1|0)>>>0)+D|0;H=0}else{G=D;H=C}F=b2[c[(c[p>>2]|0)+44>>2]&127](r,a[E]|0)|0;I=c[j>>2]|0;c[j>>2]=I+4;c[I>>2]=F;F=E+1|0;if(F>>>0<f>>>0){C=H+1|0;D=G;E=F}else{break}}}E=g+(x-b<<2)|0;D=c[j>>2]|0;if((E|0)==(D|0)){break}C=D-4|0;if(E>>>0<C>>>0){J=E;K=C}else{break}do{C=c[J>>2]|0;c[J>>2]=c[K>>2];c[K>>2]=C;J=J+4|0;K=K-4|0;}while(J>>>0<K>>>0)}}while(0);if((e|0)==(f|0)){L=c[j>>2]|0}else{L=g+(e-b<<2)|0}c[h>>2]=L;if((a[m]&1)==0){i=l;return}m=c[o+8>>2]|0;if((m|0)==0){i=l;return}qI(m);i=l;return}function mR(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;k=i;i=i+12|0;l=k|0;if((d|0)==0){c[b>>2]=0;i=k;return}m=g;g=e;n=m-g>>2;o=h+12|0;h=c[o>>2]|0;p=(h|0)>(n|0)?h-n|0:0;n=f;h=n-g|0;g=h>>2;do{if((h|0)>0){if((b3[c[(c[d>>2]|0)+48>>2]&63](d,e,g)|0)==(g|0)){break}c[b>>2]=0;i=k;return}}while(0);do{if((p|0)>0){if(p>>>0>1073741807>>>0){kF()}do{if(p>>>0<2>>>0){a[l]=p<<1;q=1;r=l+4|0}else{g=p+4&-4;e=g<<2;h=(e|0)==0?1:e;while(1){s=qH(h)|0;if((s|0)!=0){t=22;break}e=(I=c[7664]|0,c[7664]=I+0,I);if((e|0)==0){break}b8[e&1]()}if((t|0)==22){h=s;c[l+8>>2]=h;c[l>>2]=g|1;c[l+4>>2]=p;q=p;r=h;break}h=bR(4)|0;c[h>>2]=3284;bl(h|0,24120,94)}}while(0);h=q;e=r;while(1){u=h-1|0;c[e>>2]=j;if((u|0)==0){break}else{h=u;e=e+4|0}}c[r+(p<<2)>>2]=0;e=l;if((a[e]&1)==0){v=l+4|0}else{v=c[l+8>>2]|0}if((b3[c[(c[d>>2]|0)+48>>2]&63](d,v,p)|0)==(p|0)){if((a[e]&1)==0){break}h=c[l+8>>2]|0;if((h|0)==0){break}qI(h);break}c[b>>2]=0;if((a[e]&1)==0){i=k;return}e=c[l+8>>2]|0;if((e|0)==0){i=k;return}qI(e);i=k;return}}while(0);l=m-n|0;n=l>>2;do{if((l|0)>0){if((b3[c[(c[d>>2]|0)+48>>2]&63](d,f,n)|0)==(n|0)){break}c[b>>2]=0;i=k;return}}while(0);c[o>>2]=0;c[b>>2]=d;i=k;return}function mS(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=i;i=i+208|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+196|0;o=d+200|0;p=d+204|0;c[k>>2]=37;c[k+4>>2]=0;q=k;k=q+1|0;r=f+4|0;s=c[r>>2]|0;if((s&2048|0)==0){t=k}else{a[k]=43;t=q+2|0}if((s&512|0)==0){u=t}else{a[t]=35;u=t+1|0}t=u+2|0;a[u]=108;a[u+1|0]=108;u=s&74;do{if((u|0)==8){if((s&16384|0)==0){a[t]=120;break}else{a[t]=88;break}}else if((u|0)==64){a[t]=111}else{a[t]=100}}while(0);t=l|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);u=mB(t,22,c[7204]|0,q,(q=i,i=i+8|0,c[q>>2]=h,c[q+4>>2]=j,q)|0)|0;i=q;q=l+u|0;j=c[r>>2]&176;do{if((j|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){v=l+1|0;break}if(!((u|0)>1&r<<24>>24==48)){w=22;break}r=a[l+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){w=22;break}v=l+2|0}else if((j|0)==32){v=q}else{w=22}}while(0);if((w|0)==22){v=t}w=m|0;m=p|0;j=c[f+28>>2]|0;c[m>>2]=j;l=j+4|0;I=c[l>>2]|0,c[l>>2]=I+1,I;mQ(t,v,q,w,n,o,p);p=c[m>>2]|0;m=p+4|0;if(((I=c[m>>2]|0,c[m>>2]=I+ -1,I)|0)!=0){x=e|0;y=c[x>>2]|0;z=c[n>>2]|0;A=c[o>>2]|0;mR(b,y,w,z,A,f,g);i=d;return}b0[c[(c[p>>2]|0)+8>>2]&1023](p|0);x=e|0;y=c[x>>2]|0;z=c[n>>2]|0;A=c[o>>2]|0;mR(b,y,w,z,A,f,g);i=d;return}function mT(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=i;i=i+116|0;j=e;e=i;i=i+4|0;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+20|0;m=d+104|0;n=d+108|0;o=d+112|0;p=j|0;a[p]=a[3260]|0;a[p+1|0]=a[3261]|0;a[p+2|0]=a[3262]|0;a[p+3|0]=a[3263]|0;a[p+4|0]=a[3264]|0;a[p+5|0]=a[3265]|0;q=j+1|0;r=f+4|0;s=c[r>>2]|0;if((s&2048|0)==0){t=q}else{a[q]=43;t=j+2|0}if((s&512|0)==0){u=t}else{a[t]=35;u=t+1|0}a[u]=108;t=u+1|0;u=s&74;do{if((u|0)==64){a[t]=111}else if((u|0)==8){if((s&16384|0)==0){a[t]=120;break}else{a[t]=88;break}}else{a[t]=117}}while(0);t=k|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);s=mB(t,12,c[7204]|0,p,(p=i,i=i+4|0,c[p>>2]=h,p)|0)|0;i=p;p=k+s|0;h=c[r>>2]&176;do{if((h|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){v=k+1|0;break}if(!((s|0)>1&r<<24>>24==48)){w=22;break}r=a[k+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){w=22;break}v=k+2|0}else if((h|0)==32){v=p}else{w=22}}while(0);if((w|0)==22){v=t}w=l|0;l=o|0;h=c[f+28>>2]|0;c[l>>2]=h;k=h+4|0;I=c[k>>2]|0,c[k>>2]=I+1,I;mQ(t,v,p,w,m,n,o);o=c[l>>2]|0;l=o+4|0;if(((I=c[l>>2]|0,c[l>>2]=I+ -1,I)|0)!=0){x=e|0;y=c[x>>2]|0;z=c[m>>2]|0;A=c[n>>2]|0;mR(b,y,w,z,A,f,g);i=d;return}b0[c[(c[o>>2]|0)+8>>2]&1023](o|0);x=e|0;y=c[x>>2]|0;z=c[m>>2]|0;A=c[n>>2]|0;mR(b,y,w,z,A,f,g);i=d;return}function mU(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=i;i=i+216|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+204|0;o=d+208|0;p=d+212|0;c[k>>2]=37;c[k+4>>2]=0;q=k;k=q+1|0;r=f+4|0;s=c[r>>2]|0;if((s&2048|0)==0){t=k}else{a[k]=43;t=q+2|0}if((s&512|0)==0){u=t}else{a[t]=35;u=t+1|0}t=u+2|0;a[u]=108;a[u+1|0]=108;u=s&74;do{if((u|0)==64){a[t]=111}else if((u|0)==8){if((s&16384|0)==0){a[t]=120;break}else{a[t]=88;break}}else{a[t]=117}}while(0);t=l|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);s=mB(t,23,c[7204]|0,q,(q=i,i=i+8|0,c[q>>2]=h,c[q+4>>2]=j,q)|0)|0;i=q;q=l+s|0;j=c[r>>2]&176;do{if((j|0)==32){v=q}else if((j|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){v=l+1|0;break}if(!((s|0)>1&r<<24>>24==48)){w=22;break}r=a[l+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){w=22;break}v=l+2|0}else{w=22}}while(0);if((w|0)==22){v=t}w=m|0;m=p|0;l=c[f+28>>2]|0;c[m>>2]=l;s=l+4|0;I=c[s>>2]|0,c[s>>2]=I+1,I;mQ(t,v,q,w,n,o,p);p=c[m>>2]|0;m=p+4|0;if(((I=c[m>>2]|0,c[m>>2]=I+ -1,I)|0)!=0){x=e|0;y=c[x>>2]|0;z=c[n>>2]|0;A=c[o>>2]|0;mR(b,y,w,z,A,f,g);i=d;return}b0[c[(c[p>>2]|0)+8>>2]&1023](p|0);x=e|0;y=c[x>>2]|0;z=c[n>>2]|0;A=c[o>>2]|0;mR(b,y,w,z,A,f,g);i=d;return}function mV(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0;d=i;i=i+288|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2];l=d|0;m=d+8|0;n=d+40|0;o=d+44|0;p=d+272|0;q=d+276|0;r=d+280|0;s=d+284|0;c[l>>2]=37;c[l+4>>2]=0;t=l;l=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=l}else{a[l]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;l=v>>>14;do{if((w|0)==260){if((l&1|0)==0){a[x]=97;y=0;break}else{a[x]=65;y=0;break}}else{a[x]=46;v=x+2|0;a[x+1|0]=42;if((w|0)==4){if((l&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else if((w|0)==256){if((l&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else{if((l&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);l=m|0;c[n>>2]=l;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);m=c[7204]|0;if(y){w=mB(l,30,m,t,(z=i,i=i+12|0,c[z>>2]=c[f+8>>2],h[k>>3]=j,c[z+4>>2]=c[k>>2],c[z+8>>2]=c[k+4>>2],z)|0)|0;i=z;A=w}else{w=mB(l,30,m,t,(z=i,i=i+8|0,h[k>>3]=j,c[z>>2]=c[k>>2],c[z+4>>2]=c[k+4>>2],z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[30724]|0)==0;if(y){do{if(w){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);m=mI(n,c[7204]|0,t,(z=i,i=i+12|0,c[z>>2]=c[f+8>>2],h[k>>3]=j,c[z+4>>2]=c[k>>2],c[z+8>>2]=c[k+4>>2],z)|0)|0;i=z;B=m}else{do{if(w){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);w=mI(n,c[7204]|0,t,(z=i,i=i+12|0,c[z>>2]=c[f+8>>2],h[k>>3]=j,c[z+4>>2]=c[k>>2],c[z+8>>2]=c[k+4>>2],z)|0)|0;i=z;B=w}w=c[n>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}w=bR(4)|0;c[w>>2]=3284;bl(w|0,24120,94)}else{C=A;D=0;E=c[n>>2]|0}}while(0);n=E+C|0;A=c[u>>2]&176;do{if((A|0)==32){F=n}else if((A|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=53;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=53;break}F=E+2|0}else{G=53}}while(0);if((G|0)==53){F=E}do{if((E|0)==(l|0)){H=o|0;J=0;K=l}else{G=qH(C<<3)|0;A=G;if((G|0)!=0){H=A;J=A;K=E;break}A=bR(4)|0;c[A>>2]=3284;bl(A|0,24120,94)}}while(0);E=r|0;C=c[f+28>>2]|0;c[E>>2]=C;l=C+4|0;I=c[l>>2]|0,c[l>>2]=I+1,I;mW(K,F,n,H,p,q,r);r=c[E>>2]|0;E=r+4|0;if(((I=c[E>>2]|0,c[E>>2]=I+ -1,I)|0)==0){b0[c[(c[r>>2]|0)+8>>2]&1023](r|0)}r=e|0;mR(s,c[r>>2]|0,H,c[p>>2]|0,c[q>>2]|0,f,g);g=c[s>>2]|0;c[r>>2]=g;c[b>>2]=g;if((J|0)!=0){qI(J)}if((D|0)==0){i=d;return}qI(D);i=d;return}function mW(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;l=i;i=i+36|0;m=l|0;n=l+12|0;o=l+24|0;p=k|0;k=c[p>>2]|0;if((c[7543]|0)!=-1){c[n>>2]=30172;c[n+4>>2]=48;c[n+8>>2]=0;kE(30172,n)}n=(c[7544]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=bR(4)|0;s=r;c[s>>2]=3308;bl(r|0,24132,322)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bR(4)|0;s=r;c[s>>2]=3308;bl(r|0,24132,322)}r=k;s=c[p>>2]|0;if((c[7451]|0)!=-1){c[m>>2]=29804;c[m+4>>2]=48;c[m+8>>2]=0;kE(29804,m)}m=(c[7452]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=bR(4)|0;u=t;c[u>>2]=3308;bl(t|0,24132,322)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bR(4)|0;u=t;c[u>>2]=3308;bl(t|0,24132,322)}t=s;b1[c[(c[s>>2]|0)+20>>2]&255](o,t);c[j>>2]=g;u=a[b]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){m=b2[c[(c[k>>2]|0)+44>>2]&127](r,u)|0;u=c[j>>2]|0;c[j>>2]=u+4;c[u>>2]=m;v=b+1|0}else{v=b}m=f;L23:do{if((m-v|0)>1){if((a[v]|0)!=48){w=v;x=37;break}u=v+1|0;p=a[u]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){w=v;x=37;break}p=k;n=b2[c[(c[p>>2]|0)+44>>2]&127](r,48)|0;q=c[j>>2]|0;c[j>>2]=q+4;c[q>>2]=n;n=v+2|0;q=b2[c[(c[p>>2]|0)+44>>2]&127](r,a[u]|0)|0;u=c[j>>2]|0;c[j>>2]=u+4;c[u>>2]=q;q=n;while(1){if(q>>>0>=f>>>0){y=q;z=n;break L23}u=a[q]|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);if((a3(u<<24>>24|0,c[7204]|0)|0)==0){y=q;z=n;break}else{q=q+1|0}}}else{w=v;x=37}}while(0);L38:do{if((x|0)==37){while(1){x=0;if(w>>>0>=f>>>0){y=w;z=v;break L38}q=a[w]|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);if((bM(q<<24>>24|0,c[7204]|0)|0)==0){y=w;z=v;break}else{w=w+1|0;x=37}}}}while(0);x=o;w=o;v=d[w]|0;if((v&1|0)==0){A=v>>>1}else{A=c[o+4>>2]|0}do{if((A|0)==0){cd[c[(c[k>>2]|0)+48>>2]&15](r,z,y,c[j>>2]|0)|0;c[j>>2]=(c[j>>2]|0)+(y-z<<2)}else{do{if((z|0)!=(y|0)){v=y-1|0;if(z>>>0<v>>>0){B=z;C=v}else{break}do{v=a[B]|0;a[B]=a[C]|0;a[C]=v;B=B+1|0;C=C-1|0;}while(B>>>0<C>>>0)}}while(0);q=b5[c[(c[s>>2]|0)+16>>2]&511](t)|0;if(z>>>0<y>>>0){v=x+1|0;u=o+4|0;n=o+8|0;p=k;D=0;E=0;F=z;while(1){G=a[((a[w]&1)==0?v:c[n>>2]|0)+E|0]|0;if(G<<24>>24>0&(D|0)==(G<<24>>24|0)){G=c[j>>2]|0;c[j>>2]=G+4;c[G>>2]=q;G=d[w]|0;H=(E>>>0<(((G&1|0)==0?G>>>1:c[u>>2]|0)-1|0)>>>0)+E|0;I=0}else{H=E;I=D}G=b2[c[(c[p>>2]|0)+44>>2]&127](r,a[F]|0)|0;J=c[j>>2]|0;c[j>>2]=J+4;c[J>>2]=G;G=F+1|0;if(G>>>0<y>>>0){D=I+1|0;E=H;F=G}else{break}}}F=g+(z-b<<2)|0;E=c[j>>2]|0;if((F|0)==(E|0)){break}D=E-4|0;if(F>>>0<D>>>0){K=F;L=D}else{break}do{D=c[K>>2]|0;c[K>>2]=c[L>>2];c[L>>2]=D;K=K+4|0;L=L-4|0;}while(K>>>0<L>>>0)}}while(0);L76:do{if(y>>>0<f>>>0){L=k;K=y;while(1){z=a[K]|0;if(z<<24>>24==46){break}H=b2[c[(c[L>>2]|0)+44>>2]&127](r,z)|0;z=c[j>>2]|0;c[j>>2]=z+4;c[z>>2]=H;H=K+1|0;if(H>>>0<f>>>0){K=H}else{M=H;break L76}}L=b5[c[(c[s>>2]|0)+12>>2]&511](t)|0;H=c[j>>2]|0;c[j>>2]=H+4;c[H>>2]=L;M=K+1|0}else{M=y}}while(0);cd[c[(c[k>>2]|0)+48>>2]&15](r,M,f,c[j>>2]|0)|0;r=(c[j>>2]|0)+(m-M<<2)|0;c[j>>2]=r;if((e|0)==(f|0)){N=r}else{N=g+(e-b<<2)|0}c[h>>2]=N;if((a[w]&1)==0){i=l;return}w=c[o+8>>2]|0;if((w|0)==0){i=l;return}qI(w);i=l;return}function mX(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0;d=i;i=i+288|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2];l=d|0;m=d+8|0;n=d+40|0;o=d+44|0;p=d+272|0;q=d+276|0;r=d+280|0;s=d+284|0;c[l>>2]=37;c[l+4>>2]=0;t=l;l=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=l}else{a[l]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;l=v>>>14;do{if((w|0)==260){a[x]=76;v=x+1|0;if((l&1|0)==0){a[v]=97;y=0;break}else{a[v]=65;y=0;break}}else{a[x]=46;a[x+1|0]=42;a[x+2|0]=76;v=x+3|0;if((w|0)==256){if((l&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else if((w|0)==4){if((l&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else{if((l&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);l=m|0;c[n>>2]=l;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);m=c[7204]|0;if(y){w=mB(l,30,m,t,(z=i,i=i+12|0,c[z>>2]=c[f+8>>2],h[k>>3]=j,c[z+4>>2]=c[k>>2],c[z+8>>2]=c[k+4>>2],z)|0)|0;i=z;A=w}else{w=mB(l,30,m,t,(z=i,i=i+8|0,h[k>>3]=j,c[z>>2]=c[k>>2],c[z+4>>2]=c[k+4>>2],z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[30724]|0)==0;if(y){do{if(w){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);m=mI(n,c[7204]|0,t,(z=i,i=i+12|0,c[z>>2]=c[f+8>>2],h[k>>3]=j,c[z+4>>2]=c[k>>2],c[z+8>>2]=c[k+4>>2],z)|0)|0;i=z;B=m}else{do{if(w){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);w=mI(n,c[7204]|0,t,(z=i,i=i+8|0,h[k>>3]=j,c[z>>2]=c[k>>2],c[z+4>>2]=c[k+4>>2],z)|0)|0;i=z;B=w}w=c[n>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}w=bR(4)|0;c[w>>2]=3284;bl(w|0,24120,94)}else{C=A;D=0;E=c[n>>2]|0}}while(0);n=E+C|0;A=c[u>>2]&176;do{if((A|0)==32){F=n}else if((A|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=53;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=53;break}F=E+2|0}else{G=53}}while(0);if((G|0)==53){F=E}do{if((E|0)==(l|0)){H=o|0;J=0;K=l}else{G=qH(C<<3)|0;A=G;if((G|0)!=0){H=A;J=A;K=E;break}A=bR(4)|0;c[A>>2]=3284;bl(A|0,24120,94)}}while(0);E=r|0;C=c[f+28>>2]|0;c[E>>2]=C;l=C+4|0;I=c[l>>2]|0,c[l>>2]=I+1,I;mW(K,F,n,H,p,q,r);r=c[E>>2]|0;E=r+4|0;if(((I=c[E>>2]|0,c[E>>2]=I+ -1,I)|0)==0){b0[c[(c[r>>2]|0)+8>>2]&1023](r|0)}r=e|0;mR(s,c[r>>2]|0,H,c[p>>2]|0,c[q>>2]|0,f,g);g=c[s>>2]|0;c[r>>2]=g;c[b>>2]=g;if((J|0)!=0){qI(J)}if((D|0)==0){i=d;return}qI(D);i=d;return}function mY(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;d=i;i=i+188|0;j=e;e=i;i=i+4|0;c[e>>2]=c[j>>2];j=d|0;k=d+20|0;l=d+40|0;m=d+12|0;a[m]=a[3268]|0;a[m+1|0]=a[3269]|0;a[m+2|0]=a[3270]|0;a[m+3|0]=a[3271]|0;a[m+4|0]=a[3272]|0;a[m+5|0]=a[3273]|0;n=k|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);o=mB(n,20,c[7204]|0,m,(m=i,i=i+4|0,c[m>>2]=h,m)|0)|0;i=m;m=k+o|0;h=c[f+4>>2]&176;do{if((h|0)==32){p=m}else if((h|0)==16){q=a[n]|0;if((q<<24>>24|0)==45|(q<<24>>24|0)==43){p=k+1|0;break}if(!((o|0)>1&q<<24>>24==48)){r=12;break}q=a[k+1|0]|0;if(!((q<<24>>24|0)==120|(q<<24>>24|0)==88)){r=12;break}p=k+2|0}else{r=12}}while(0);if((r|0)==12){p=n}r=c[f+28>>2]|0;h=r+4|0;I=c[h>>2]|0,c[h>>2]=I+1,I;if((c[7543]|0)!=-1){c[j>>2]=30172;c[j+4>>2]=48;c[j+8>>2]=0;kE(30172,j)}j=(c[7544]|0)-1|0;q=c[r+8>>2]|0;do{if((c[r+12>>2]|0)-q>>2>>>0>j>>>0){s=c[q+(j<<2)>>2]|0;if((s|0)==0){break}if(((I=c[h>>2]|0,c[h>>2]=I+ -1,I)|0)==0){b0[c[(c[r>>2]|0)+8>>2]&1023](r)}t=l|0;cd[c[(c[s>>2]|0)+48>>2]&15](s,n,m,t)|0;s=l+(o<<2)|0;if((p|0)==(m|0)){u=s;v=e|0;w=c[v>>2]|0;mR(b,w,t,u,s,f,g);i=d;return}u=l+(p-k<<2)|0;v=e|0;w=c[v>>2]|0;mR(b,w,t,u,s,f,g);i=d;return}}while(0);d=bR(4)|0;c[d>>2]=3308;bl(d|0,24132,322)}function mZ(e,f,g,h,j,k,l,m,n){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0;o=i;i=i+24|0;p=o|0;q=o+12|0;r=o+16|0;s=o+20|0;t=c[j+28>>2]|0;u=t+4|0;I=c[u>>2]|0,c[u>>2]=I+1,I;if((c[7545]|0)!=-1){c[p>>2]=30180;c[p+4>>2]=48;c[p+8>>2]=0;kE(30180,p)}p=(c[7546]|0)-1|0;v=c[t+8>>2]|0;do{if((c[t+12>>2]|0)-v>>2>>>0>p>>>0){w=c[v+(p<<2)>>2]|0;if((w|0)==0){break}x=w;if(((I=c[u>>2]|0,c[u>>2]=I+ -1,I)|0)==0){b0[c[(c[t>>2]|0)+8>>2]&1023](t)}c[k>>2]=0;L10:do{if((m|0)==(n|0)){y=g;z=g;A=h}else{B=w;C=w;D=w+8|0;E=f;F=r|0;G=s|0;H=q|0;J=m;K=g;L=h;L12:while(1){do{if((K|0)==0){M=0}else{if((c[K+12>>2]|0)!=(c[K+16>>2]|0)){M=K;break}N=(b5[c[(c[K>>2]|0)+36>>2]&511](K)|0)==-1;M=N?0:K}}while(0);N=(M|0)==0;do{if((L|0)==0){O=18}else{if((c[L+12>>2]|0)==(c[L+16>>2]|0)){if((b5[c[(c[L>>2]|0)+36>>2]&511](L)|0)==-1){O=18;break}}if(N){P=L}else{Q=M;R=L;O=19;break L12}}}while(0);if((O|0)==18){O=0;if(N){Q=0;R=0;O=19;break}else{P=0}}L26:do{if((b3[c[(c[B>>2]|0)+36>>2]&63](x,a[J]|0,0)|0)<<24>>24==37){S=J+1|0;if((S|0)==(n|0)){O=25;break L12}T=b3[c[(c[B>>2]|0)+36>>2]&63](x,a[S]|0,0)|0;if((T<<24>>24|0)==69|(T<<24>>24|0)==48){U=J+2|0;if((U|0)==(n|0)){O=28;break L12}V=T;W=b3[c[(c[B>>2]|0)+36>>2]&63](x,a[U]|0,0)|0;X=U}else{V=0;W=T;X=S}S=c[(c[E>>2]|0)+36>>2]|0;c[F>>2]=M;c[G>>2]=P;ca[S&7](q,f,r,s,j,k,l,W,V);Y=X+1|0;Z=c[H>>2]|0;_=P}else{S=a[J]|0;do{if(S<<24>>24>=0){T=c[D>>2]|0;if((b[T+(S<<24>>24<<1)>>1]&8192)==0){break}else{$=J}while(1){U=$+1|0;if((U|0)==(n|0)){aa=n;break}ab=a[U]|0;if(ab<<24>>24<0){aa=U;break}if((b[T+(ab<<24>>24<<1)>>1]&8192)==0){aa=U;break}else{$=U}}T=M;U=P;ab=M;ac=P;while(1){do{if((T|0)==0){ad=0;ae=ab}else{if((c[T+12>>2]|0)!=(c[T+16>>2]|0)){ad=T;ae=ab;break}af=(b5[c[(c[T>>2]|0)+36>>2]&511](T)|0)==-1;ad=af?0:T;ae=af?0:ab}}while(0);af=(ad|0)==0;do{if((U|0)==0){ag=ac;O=46}else{if((c[U+12>>2]|0)!=(c[U+16>>2]|0)){if(af){ah=U;ai=ac;break}else{Y=aa;Z=ae;_=ac;break L26}}if((b5[c[(c[U>>2]|0)+36>>2]&511](U)|0)==-1){ag=0;O=46;break}if(af){ah=U;ai=ac}else{Y=aa;Z=ae;_=ac;break L26}}}while(0);if((O|0)==46){O=0;if(af){Y=aa;Z=ae;_=ag;break L26}else{ah=0;ai=ag}}aj=ad+12|0;ak=c[aj>>2]|0;al=ad+16|0;if((ak|0)==(c[al>>2]|0)){am=b5[c[(c[ad>>2]|0)+36>>2]&511](ad)|0}else{am=d[ak]|0}ak=am<<24>>24;if(ak>>>0>=128>>>0){Y=aa;Z=ae;_=ai;break L26}if((b[(c[D>>2]|0)+(ak<<1)>>1]&8192)==0){Y=aa;Z=ae;_=ai;break L26}ak=c[aj>>2]|0;if((ak|0)==(c[al>>2]|0)){b5[c[(c[ad>>2]|0)+40>>2]&511](ad)|0;T=ad;U=ah;ab=ae;ac=ai;continue}else{c[aj>>2]=ak+1;T=ad;U=ah;ab=ae;ac=ai;continue}}}}while(0);S=M+12|0;ac=c[S>>2]|0;ab=M+16|0;if((ac|0)==(c[ab>>2]|0)){an=b5[c[(c[M>>2]|0)+36>>2]&511](M)|0}else{an=d[ac]|0}ac=b2[c[(c[C>>2]|0)+12>>2]&127](x,an&255)|0;if(ac<<24>>24!=(b2[c[(c[C>>2]|0)+12>>2]&127](x,a[J]|0)|0)<<24>>24){O=64;break L12}ac=c[S>>2]|0;if((ac|0)==(c[ab>>2]|0)){b5[c[(c[M>>2]|0)+40>>2]&511](M)|0}else{c[S>>2]=ac+1}Y=J+1|0;Z=M;_=P}}while(0);if((Y|0)==(n|0)){y=Z;z=Z;A=_;break L10}if((c[k>>2]|0)==0){J=Y;K=Z;L=_}else{y=Z;z=Z;A=_;break L10}}if((O|0)==64){c[k>>2]=4;y=M;z=M;A=P;break}else if((O|0)==25){c[k>>2]=4;y=M;z=M;A=P;break}else if((O|0)==19){c[k>>2]=4;y=Q;z=M;A=R;break}else if((O|0)==28){c[k>>2]=4;y=M;z=M;A=P;break}}}while(0);do{if((y|0)==0){ao=z}else{if((c[y+12>>2]|0)!=(c[y+16>>2]|0)){ao=z;break}x=(b5[c[(c[y>>2]|0)+36>>2]&511](y)|0)==-1;ao=x?0:z}}while(0);x=(ao|0)==0;do{if((A|0)==0){O=72}else{if((c[A+12>>2]|0)==(c[A+16>>2]|0)){if((b5[c[(c[A>>2]|0)+36>>2]&511](A)|0)==-1){O=72;break}}if(!x){break}ap=e|0;c[ap>>2]=ao;i=o;return}}while(0);do{if((O|0)==72){if(x){break}ap=e|0;c[ap>>2]=ao;i=o;return}}while(0);c[k>>2]=c[k>>2]|2;ap=e|0;c[ap>>2]=ao;i=o;return}}while(0);o=bR(4)|0;c[o>>2]=3308;bl(o|0,24132,322)}function m_(a){a=a|0;if((a|0)==0){return}qI(a);return}function m$(a){a=a|0;return}function m0(a){a=a|0;return 2}function m1(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;j=i;k=d;d=i;i=i+4|0;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2];mZ(a,b,c[d>>2]|0,c[e>>2]|0,f,g,h,3252,3260);i=j;return}function m2(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0;k=i;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=d+8|0;m=b5[c[(c[l>>2]|0)+20>>2]&511](l)|0;l=a[m]|0;if((l&1)==0){n=m+1|0}else{n=c[m+8>>2]|0}o=l&255;if((o&1|0)==0){p=o>>>1}else{p=c[m+4>>2]|0}mZ(b,d,c[e>>2]|0,c[f>>2]|0,g,h,j,n,n+p|0);i=k;return}function m3(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;j=i;i=i+12|0;k=d;d=i;i=i+4|0;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2];k=j|0;l=c[f+28>>2]|0;f=l+4|0;I=c[f>>2]|0,c[f>>2]=I+1,I;if((c[7545]|0)!=-1){c[k>>2]=30180;c[k+4>>2]=48;c[k+8>>2]=0;kE(30180,k)}k=(c[7546]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)==0){b0[c[(c[l>>2]|0)+8>>2]&1023](l)}o=c[e>>2]|0;p=b+8|0;q=b5[c[c[p>>2]>>2]&511](p)|0;p=(l$(d,o,q,q+168|0,n,g,0)|0)-q|0;if((p|0)>=168){r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=j;return}c[h+24>>2]=((p|0)/12|0|0)%7|0;r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=j;return}}while(0);j=bR(4)|0;c[j>>2]=3308;bl(j|0,24132,322)}function m4(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;j=i;i=i+12|0;k=d;d=i;i=i+4|0;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2];k=j|0;l=c[f+28>>2]|0;f=l+4|0;I=c[f>>2]|0,c[f>>2]=I+1,I;if((c[7545]|0)!=-1){c[k>>2]=30180;c[k+4>>2]=48;c[k+8>>2]=0;kE(30180,k)}k=(c[7546]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)==0){b0[c[(c[l>>2]|0)+8>>2]&1023](l)}o=c[e>>2]|0;p=b+8|0;q=b5[c[(c[p>>2]|0)+4>>2]&511](p)|0;p=(l$(d,o,q,q+288|0,n,g,0)|0)-q|0;if((p|0)>=288){r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=j;return}c[h+16>>2]=((p|0)/12|0|0)%12|0;r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=j;return}}while(0);j=bR(4)|0;c[j>>2]=3308;bl(j|0,24132,322)}function m5(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;b=i;i=i+12|0;j=d;d=i;i=i+4|0;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;c[e>>2]=c[j>>2];j=b|0;k=c[f+28>>2]|0;f=k+4|0;I=c[f>>2]|0,c[f>>2]=I+1,I;if((c[7545]|0)!=-1){c[j>>2]=30180;c[j+4>>2]=48;c[j+8>>2]=0;kE(30180,j)}j=(c[7546]|0)-1|0;l=c[k+8>>2]|0;do{if((c[k+12>>2]|0)-l>>2>>>0>j>>>0){m=c[l+(j<<2)>>2]|0;if((m|0)==0){break}if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)==0){b0[c[(c[k>>2]|0)+8>>2]&1023](k)}n=m7(d,c[e>>2]|0,g,m,4)|0;if((c[g>>2]&4|0)!=0){o=d|0;p=c[o>>2]|0;q=a|0;c[q>>2]=p;i=b;return}if((n|0)<69){r=n+2e3|0}else{r=(n-69|0)>>>0<31>>>0?n+1900|0:n}c[h+20>>2]=r-1900;o=d|0;p=c[o>>2]|0;q=a|0;c[q>>2]=p;i=b;return}}while(0);b=bR(4)|0;c[b>>2]=3308;bl(b|0,24132,322)}function m6(e,f,g,h,j,k,l,m,n){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0;n=i;i=i+48|0;o=g;g=i;i=i+4|0;c[g>>2]=c[o>>2];o=h;h=i;i=i+4|0;c[h>>2]=c[o>>2];o=n|0;p=n+12|0;q=n+16|0;r=n+20|0;s=n+24|0;t=n+28|0;u=n+32|0;v=n+36|0;w=n+40|0;x=n+44|0;c[k>>2]=0;y=c[j+28>>2]|0;z=y+4|0;I=c[z>>2]|0,c[z>>2]=I+1,I;if((c[7545]|0)!=-1){c[o>>2]=30180;c[o+4>>2]=48;c[o+8>>2]=0;kE(30180,o)}o=(c[7546]|0)-1|0;A=c[y+8>>2]|0;do{if((c[y+12>>2]|0)-A>>2>>>0>o>>>0){B=c[A+(o<<2)>>2]|0;if((B|0)==0){break}C=B;if(((I=c[z>>2]|0,c[z>>2]=I+ -1,I)|0)==0){b0[c[(c[y>>2]|0)+8>>2]&1023](y)}L10:do{switch(m<<24>>24|0){case 112:{D=l+8|0;E=c[h>>2]|0;F=f+8|0;G=b5[c[(c[F>>2]|0)+8>>2]&511](F)|0;F=d[G]|0;if((F&1|0)==0){H=F>>>1}else{H=c[G+4>>2]|0}F=d[G+12|0]|0;if((F&1|0)==0){J=F>>>1}else{J=c[G+16>>2]|0}if((H|0)==(-J|0)){c[k>>2]=c[k>>2]|4;break L10}F=l$(g,E,G,G+24|0,C,k,0)|0;E=F-G|0;do{if((F|0)==(G|0)){if((c[D>>2]|0)!=12){break}c[D>>2]=0;break L10}}while(0);if((E|0)!=12){break L10}G=c[D>>2]|0;if((G|0)>=12){break L10}c[D>>2]=G+12;break};case 114:{G=g|0;mZ(s,f,c[G>>2]|0,c[h>>2]|0,j,k,l,3224,3235);c[G>>2]=c[s>>2];break};case 82:{G=g|0;mZ(t,f,c[G>>2]|0,c[h>>2]|0,j,k,l,3216,3221);c[G>>2]=c[t>>2];break};case 83:{G=m7(g,c[h>>2]|0,k,C,2)|0;F=c[k>>2]|0;if((F&4|0)==0&(G|0)<61){c[l>>2]=G;break L10}else{c[k>>2]=F|4;break L10}break};case 84:{F=g|0;mZ(u,f,c[F>>2]|0,c[h>>2]|0,j,k,l,3208,3216);c[F>>2]=c[u>>2];break};case 70:{F=g|0;mZ(r,f,c[F>>2]|0,c[h>>2]|0,j,k,l,3236,3244);c[F>>2]=c[r>>2];break};case 109:{F=(m7(g,c[h>>2]|0,k,C,2)|0)-1|0;G=c[k>>2]|0;if((G&4|0)==0&(F|0)<12){c[l+16>>2]=F;break L10}else{c[k>>2]=G|4;break L10}break};case 77:{G=m7(g,c[h>>2]|0,k,C,2)|0;F=c[k>>2]|0;if((F&4|0)==0&(G|0)<60){c[l+4>>2]=G;break L10}else{c[k>>2]=F|4;break L10}break};case 110:case 116:{F=B+8|0;G=g|0;K=c[h>>2]|0;L46:while(1){L=c[G>>2]|0;do{if((L|0)==0){M=0}else{if((c[L+12>>2]|0)!=(c[L+16>>2]|0)){M=L;break}if((b5[c[(c[L>>2]|0)+36>>2]&511](L)|0)==-1){c[G>>2]=0;M=0;break}else{M=c[G>>2]|0;break}}}while(0);L=(M|0)==0;do{if((K|0)==0){N=56}else{if((c[K+12>>2]|0)==(c[K+16>>2]|0)){if((b5[c[(c[K>>2]|0)+36>>2]&511](K)|0)==-1){N=56;break}}if(L){O=0;P=K}else{Q=K;R=0;break L46}}}while(0);if((N|0)==56){N=0;if(L){Q=0;R=1;break}else{O=1;P=0}}S=c[G>>2]|0;T=c[S+12>>2]|0;if((T|0)==(c[S+16>>2]|0)){U=b5[c[(c[S>>2]|0)+36>>2]&511](S)|0}else{U=d[T]|0}T=U<<24>>24;if(T>>>0>=128>>>0){Q=P;R=O;break}if((b[(c[F>>2]|0)+(T<<1)>>1]&8192)==0){Q=P;R=O;break}T=c[G>>2]|0;S=T+12|0;V=c[S>>2]|0;if((V|0)==(c[T+16>>2]|0)){b5[c[(c[T>>2]|0)+40>>2]&511](T)|0;K=P;continue}else{c[S>>2]=V+1;K=P;continue}}K=c[G>>2]|0;do{if((K|0)==0){W=0}else{if((c[K+12>>2]|0)!=(c[K+16>>2]|0)){W=K;break}if((b5[c[(c[K>>2]|0)+36>>2]&511](K)|0)==-1){c[G>>2]=0;W=0;break}else{W=c[G>>2]|0;break}}}while(0);G=(W|0)==0;do{if(R){N=74}else{if((c[Q+12>>2]|0)!=(c[Q+16>>2]|0)){if(G^(Q|0)==0){break L10}else{break}}if((b5[c[(c[Q>>2]|0)+36>>2]&511](Q)|0)==-1){N=74;break}if(G){break L10}}}while(0);if((N|0)==74){if(!G){break L10}}c[k>>2]=c[k>>2]|2;break};case 106:{K=m7(g,c[h>>2]|0,k,C,3)|0;F=c[k>>2]|0;if((F&4|0)==0&(K|0)<366){c[l+28>>2]=K;break L10}else{c[k>>2]=F|4;break L10}break};case 73:{F=l+8|0;K=m7(g,c[h>>2]|0,k,C,2)|0;D=c[k>>2]|0;do{if((D&4|0)==0){if((K-1|0)>>>0>=12>>>0){break}c[F>>2]=K;break L10}}while(0);c[k>>2]=D|4;break};case 98:case 66:case 104:{K=c[h>>2]|0;F=f+8|0;G=b5[c[(c[F>>2]|0)+4>>2]&511](F)|0;F=(l$(g,K,G,G+288|0,C,k,0)|0)-G|0;if((F|0)>=288){break L10}c[l+16>>2]=((F|0)/12|0|0)%12|0;break};case 97:case 65:{F=c[h>>2]|0;G=f+8|0;K=b5[c[c[G>>2]>>2]&511](G)|0;G=(l$(g,F,K,K+168|0,C,k,0)|0)-K|0;if((G|0)>=168){break L10}c[l+24>>2]=((G|0)/12|0|0)%7|0;break};case 119:{G=m7(g,c[h>>2]|0,k,C,1)|0;K=c[k>>2]|0;if((K&4|0)==0&(G|0)<7){c[l+24>>2]=G;break L10}else{c[k>>2]=K|4;break L10}break};case 72:{K=m7(g,c[h>>2]|0,k,C,2)|0;G=c[k>>2]|0;if((G&4|0)==0&(K|0)<24){c[l+8>>2]=K;break L10}else{c[k>>2]=G|4;break L10}break};case 99:{G=f+8|0;K=b5[c[(c[G>>2]|0)+12>>2]&511](G)|0;G=g|0;F=a[K]|0;if((F&1)==0){X=K+1|0}else{X=c[K+8>>2]|0}E=F&255;if((E&1|0)==0){Y=E>>>1}else{Y=c[K+4>>2]|0}mZ(p,f,c[G>>2]|0,c[h>>2]|0,j,k,l,X,X+Y|0);c[G>>2]=c[p>>2];break};case 100:case 101:{G=l+12|0;K=m7(g,c[h>>2]|0,k,C,2)|0;E=c[k>>2]|0;do{if((E&4|0)==0){if((K-1|0)>>>0>=31>>>0){break}c[G>>2]=K;break L10}}while(0);c[k>>2]=E|4;break};case 68:{K=g|0;mZ(q,f,c[K>>2]|0,c[h>>2]|0,j,k,l,3244,3252);c[K>>2]=c[q>>2];break};case 120:{K=c[(c[f>>2]|0)+20>>2]|0;c[v>>2]=c[g>>2];c[w>>2]=c[h>>2];b6[K&127](e,f,v,w,j,k,l);i=n;return};case 88:{K=f+8|0;G=b5[c[(c[K>>2]|0)+24>>2]&511](K)|0;K=g|0;D=a[G]|0;if((D&1)==0){Z=G+1|0}else{Z=c[G+8>>2]|0}F=D&255;if((F&1|0)==0){_=F>>>1}else{_=c[G+4>>2]|0}mZ(x,f,c[K>>2]|0,c[h>>2]|0,j,k,l,Z,Z+_|0);c[K>>2]=c[x>>2];break};case 121:{K=m7(g,c[h>>2]|0,k,C,4)|0;if((c[k>>2]&4|0)!=0){break L10}if((K|0)<69){$=K+2e3|0}else{$=(K-69|0)>>>0<31>>>0?K+1900|0:K}c[l+20>>2]=$-1900;break};case 89:{K=m7(g,c[h>>2]|0,k,C,4)|0;if((c[k>>2]&4|0)!=0){break L10}c[l+20>>2]=K-1900;break};case 37:{K=c[h>>2]|0;G=g|0;F=c[G>>2]|0;do{if((F|0)==0){aa=0}else{if((c[F+12>>2]|0)!=(c[F+16>>2]|0)){aa=F;break}if((b5[c[(c[F>>2]|0)+36>>2]&511](F)|0)==-1){c[G>>2]=0;aa=0;break}else{aa=c[G>>2]|0;break}}}while(0);F=(aa|0)==0;do{if((K|0)==0){N=124}else{if((c[K+12>>2]|0)==(c[K+16>>2]|0)){if((b5[c[(c[K>>2]|0)+36>>2]&511](K)|0)==-1){N=124;break}}if(F){ab=K;ac=0}else{N=125}}}while(0);if((N|0)==124){if(F){N=125}else{ab=0;ac=1}}if((N|0)==125){c[k>>2]=c[k>>2]|6;break L10}K=c[G>>2]|0;E=c[K+12>>2]|0;if((E|0)==(c[K+16>>2]|0)){ad=b5[c[(c[K>>2]|0)+36>>2]&511](K)|0}else{ad=d[E]|0}if((b3[c[(c[B>>2]|0)+36>>2]&63](C,ad&255,0)|0)<<24>>24!=37){c[k>>2]=c[k>>2]|4;break L10}E=c[G>>2]|0;K=E+12|0;D=c[K>>2]|0;if((D|0)==(c[E+16>>2]|0)){b5[c[(c[E>>2]|0)+40>>2]&511](E)|0}else{c[K>>2]=D+1}D=c[G>>2]|0;do{if((D|0)==0){ae=0}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){ae=D;break}if((b5[c[(c[D>>2]|0)+36>>2]&511](D)|0)==-1){c[G>>2]=0;ae=0;break}else{ae=c[G>>2]|0;break}}}while(0);G=(ae|0)==0;do{if(ac){N=143}else{if((c[ab+12>>2]|0)!=(c[ab+16>>2]|0)){if(G^(ab|0)==0){break L10}else{break}}if((b5[c[(c[ab>>2]|0)+36>>2]&511](ab)|0)==-1){N=143;break}if(G){break L10}}}while(0);if((N|0)==143){if(!G){break L10}}c[k>>2]=c[k>>2]|2;break};default:{c[k>>2]=c[k>>2]|4}}}while(0);c[e>>2]=c[g>>2];i=n;return}}while(0);n=bR(4)|0;c[n>>2]=3308;bl(n|0,24132,322)}function m7(a,e,f,g,h){a=a|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;i=a|0;a=c[i>>2]|0;do{if((a|0)==0){j=0}else{if((c[a+12>>2]|0)!=(c[a+16>>2]|0)){j=a;break}if((b5[c[(c[a>>2]|0)+36>>2]&511](a)|0)==-1){c[i>>2]=0;j=0;break}else{j=c[i>>2]|0;break}}}while(0);a=(j|0)==0;do{if((e|0)==0){k=10}else{if((c[e+12>>2]|0)==(c[e+16>>2]|0)){if((b5[c[(c[e>>2]|0)+36>>2]&511](e)|0)==-1){k=10;break}}if(a){l=e}else{k=11}}}while(0);if((k|0)==10){if(a){k=11}else{l=0}}if((k|0)==11){c[f>>2]=c[f>>2]|6;m=0;return m|0}a=c[i>>2]|0;e=c[a+12>>2]|0;if((e|0)==(c[a+16>>2]|0)){n=b5[c[(c[a>>2]|0)+36>>2]&511](a)|0}else{n=d[e]|0}e=n&255;a=n<<24>>24;do{if(a>>>0<128>>>0){n=g+8|0;if((b[(c[n>>2]|0)+(a<<1)>>1]&2048)==0){break}j=g;o=(b3[c[(c[j>>2]|0)+36>>2]&63](g,e,0)|0)<<24>>24;p=c[i>>2]|0;q=p+12|0;r=c[q>>2]|0;if((r|0)==(c[p+16>>2]|0)){b5[c[(c[p>>2]|0)+40>>2]&511](p)|0;s=o;t=h;u=l}else{c[q>>2]=r+1;s=o;t=h;u=l}while(1){v=s-48|0;o=t-1|0;r=c[i>>2]|0;do{if((r|0)==0){w=0}else{if((c[r+12>>2]|0)!=(c[r+16>>2]|0)){w=r;break}if((b5[c[(c[r>>2]|0)+36>>2]&511](r)|0)==-1){c[i>>2]=0;w=0;break}else{w=c[i>>2]|0;break}}}while(0);r=(w|0)==0;if((u|0)==0){x=w;y=0}else{if((c[u+12>>2]|0)==(c[u+16>>2]|0)){q=(b5[c[(c[u>>2]|0)+36>>2]&511](u)|0)==-1;z=q?0:u}else{z=u}x=c[i>>2]|0;y=z}A=(y|0)==0;if(!((r^A)&(o|0)>0)){k=39;break}r=c[x+12>>2]|0;if((r|0)==(c[x+16>>2]|0)){B=b5[c[(c[x>>2]|0)+36>>2]&511](x)|0}else{B=d[r]|0}r=B<<24>>24;if(r>>>0>=128>>>0){m=v;k=53;break}if((b[(c[n>>2]|0)+(r<<1)>>1]&2048)==0){m=v;k=54;break}r=((b3[c[(c[j>>2]|0)+36>>2]&63](g,B&255,0)|0)<<24>>24)+(v*10|0)|0;q=c[i>>2]|0;p=q+12|0;C=c[p>>2]|0;if((C|0)==(c[q+16>>2]|0)){b5[c[(c[q>>2]|0)+40>>2]&511](q)|0;s=r;t=o;u=y;continue}else{c[p>>2]=C+1;s=r;t=o;u=y;continue}}if((k|0)==54){return m|0}else if((k|0)==53){return m|0}else if((k|0)==39){do{if((x|0)==0){D=0}else{if((c[x+12>>2]|0)!=(c[x+16>>2]|0)){D=x;break}if((b5[c[(c[x>>2]|0)+36>>2]&511](x)|0)==-1){c[i>>2]=0;D=0;break}else{D=c[i>>2]|0;break}}}while(0);j=(D|0)==0;do{if(A){k=48}else{if((c[y+12>>2]|0)==(c[y+16>>2]|0)){if((b5[c[(c[y>>2]|0)+36>>2]&511](y)|0)==-1){k=48;break}}if(j){m=v}else{break}return m|0}}while(0);do{if((k|0)==48){if(j){break}else{m=v}return m|0}}while(0);c[f>>2]=c[f>>2]|2;m=v;return m|0}}}while(0);c[f>>2]=c[f>>2]|4;m=0;return m|0}function m8(a,b,d,e,f,g,h,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0;l=i;i=i+24|0;m=l|0;n=l+12|0;o=l+16|0;p=l+20|0;q=c[f+28>>2]|0;r=q+4|0;I=c[r>>2]|0,c[r>>2]=I+1,I;if((c[7543]|0)!=-1){c[m>>2]=30172;c[m+4>>2]=48;c[m+8>>2]=0;kE(30172,m)}m=(c[7544]|0)-1|0;s=c[q+8>>2]|0;do{if((c[q+12>>2]|0)-s>>2>>>0>m>>>0){t=c[s+(m<<2)>>2]|0;if((t|0)==0){break}u=t;if(((I=c[r>>2]|0,c[r>>2]=I+ -1,I)|0)==0){b0[c[(c[q>>2]|0)+8>>2]&1023](q)}c[g>>2]=0;L10:do{if((j|0)==(k|0)){v=d;w=d;x=e}else{y=t;z=t;A=t;B=b;C=o|0;D=p|0;E=n|0;F=j;G=d;H=e;L12:while(1){if((G|0)==0){J=0}else{K=c[G+12>>2]|0;if((K|0)==(c[G+16>>2]|0)){L=b5[c[(c[G>>2]|0)+36>>2]&511](G)|0}else{L=c[K>>2]|0}J=(L|0)==-1?0:G}K=(J|0)==0;do{if((H|0)==0){M=21}else{N=c[H+12>>2]|0;if((N|0)==(c[H+16>>2]|0)){O=b5[c[(c[H>>2]|0)+36>>2]&511](H)|0}else{O=c[N>>2]|0}if((O|0)==-1){M=21;break}if(K){P=H}else{Q=J;R=H;M=23;break L12}}}while(0);if((M|0)==21){M=0;if(K){Q=0;R=0;M=23;break}else{P=0}}L31:do{if((b3[c[(c[y>>2]|0)+52>>2]&63](u,c[F>>2]|0,0)|0)<<24>>24==37){N=F+4|0;if((N|0)==(k|0)){M=29;break L12}S=b3[c[(c[y>>2]|0)+52>>2]&63](u,c[N>>2]|0,0)|0;if((S<<24>>24|0)==69|(S<<24>>24|0)==48){T=F+8|0;if((T|0)==(k|0)){M=32;break L12}U=S;V=b3[c[(c[y>>2]|0)+52>>2]&63](u,c[T>>2]|0,0)|0;W=T}else{U=0;V=S;W=N}N=c[(c[B>>2]|0)+36>>2]|0;c[C>>2]=J;c[D>>2]=P;ca[N&7](n,b,o,p,f,g,h,V,U);X=W+4|0;Y=c[E>>2]|0;Z=P}else{if(b3[c[(c[z>>2]|0)+12>>2]&63](u,8192,c[F>>2]|0)|0){_=F}else{N=J+12|0;S=c[N>>2]|0;T=J+16|0;if((S|0)==(c[T>>2]|0)){$=b5[c[(c[J>>2]|0)+36>>2]&511](J)|0}else{$=c[S>>2]|0}S=b2[c[(c[A>>2]|0)+28>>2]&127](u,$)|0;if((S|0)!=(b2[c[(c[A>>2]|0)+28>>2]&127](u,c[F>>2]|0)|0)){M=68;break L12}S=c[N>>2]|0;if((S|0)==(c[T>>2]|0)){b5[c[(c[J>>2]|0)+40>>2]&511](J)|0}else{c[N>>2]=S+4}X=F+4|0;Y=J;Z=P;break}while(1){S=_+4|0;if((S|0)==(k|0)){aa=k;break}if(b3[c[(c[z>>2]|0)+12>>2]&63](u,8192,c[S>>2]|0)|0){_=S}else{aa=S;break}}S=J;N=P;T=J;ab=P;while(1){if((S|0)==0){ac=0;ad=T}else{ae=c[S+12>>2]|0;if((ae|0)==(c[S+16>>2]|0)){af=b5[c[(c[S>>2]|0)+36>>2]&511](S)|0}else{af=c[ae>>2]|0}ae=(af|0)==-1;ac=ae?0:S;ad=ae?0:T}ae=(ac|0)==0;do{if((N|0)==0){ag=ab;M=51}else{ah=c[N+12>>2]|0;if((ah|0)==(c[N+16>>2]|0)){ai=b5[c[(c[N>>2]|0)+36>>2]&511](N)|0}else{ai=c[ah>>2]|0}if((ai|0)==-1){ag=0;M=51;break}if(ae){aj=N;ak=ab}else{X=aa;Y=ad;Z=ab;break L31}}}while(0);if((M|0)==51){M=0;if(ae){X=aa;Y=ad;Z=ag;break L31}else{aj=0;ak=ag}}ah=ac+12|0;al=c[ah>>2]|0;am=ac+16|0;if((al|0)==(c[am>>2]|0)){an=b5[c[(c[ac>>2]|0)+36>>2]&511](ac)|0}else{an=c[al>>2]|0}if(!(b3[c[(c[z>>2]|0)+12>>2]&63](u,8192,an)|0)){X=aa;Y=ad;Z=ak;break L31}al=c[ah>>2]|0;if((al|0)==(c[am>>2]|0)){b5[c[(c[ac>>2]|0)+40>>2]&511](ac)|0;S=ac;N=aj;T=ad;ab=ak;continue}else{c[ah>>2]=al+4;S=ac;N=aj;T=ad;ab=ak;continue}}}}while(0);if((X|0)==(k|0)){v=Y;w=Y;x=Z;break L10}if((c[g>>2]|0)==0){F=X;G=Y;H=Z}else{v=Y;w=Y;x=Z;break L10}}if((M|0)==29){c[g>>2]=4;v=J;w=J;x=P;break}else if((M|0)==23){c[g>>2]=4;v=Q;w=J;x=R;break}else if((M|0)==32){c[g>>2]=4;v=J;w=J;x=P;break}else if((M|0)==68){c[g>>2]=4;v=J;w=J;x=P;break}}}while(0);if((v|0)==0){ao=w}else{u=c[v+12>>2]|0;if((u|0)==(c[v+16>>2]|0)){ap=b5[c[(c[v>>2]|0)+36>>2]&511](v)|0}else{ap=c[u>>2]|0}ao=(ap|0)==-1?0:w}u=(ao|0)==0;do{if((x|0)==0){M=79}else{t=c[x+12>>2]|0;if((t|0)==(c[x+16>>2]|0)){aq=b5[c[(c[x>>2]|0)+36>>2]&511](x)|0}else{aq=c[t>>2]|0}if((aq|0)==-1){M=79;break}if(!u){break}ar=a|0;c[ar>>2]=ao;i=l;return}}while(0);do{if((M|0)==79){if(u){break}ar=a|0;c[ar>>2]=ao;i=l;return}}while(0);c[g>>2]=c[g>>2]|2;ar=a|0;c[ar>>2]=ao;i=l;return}}while(0);l=bR(4)|0;c[l>>2]=3308;bl(l|0,24132,322)}function m9(a){a=a|0;if((a|0)==0){return}qI(a);return}function na(a){a=a|0;return}function nb(a){a=a|0;return 2}function nc(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;j=i;k=d;d=i;i=i+4|0;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2];m8(a,b,c[d>>2]|0,c[e>>2]|0,f,g,h,3176,3208);i=j;return}function nd(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0;k=i;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=d+8|0;m=b5[c[(c[l>>2]|0)+20>>2]&511](l)|0;l=a[m]|0;if((l&1)==0){n=m+4|0}else{n=c[m+8>>2]|0}o=l&255;if((o&1|0)==0){p=o>>>1}else{p=c[m+4>>2]|0}m8(b,d,c[e>>2]|0,c[f>>2]|0,g,h,j,n,n+(p<<2)|0);i=k;return}function ne(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;j=i;i=i+12|0;k=d;d=i;i=i+4|0;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2];k=j|0;l=c[f+28>>2]|0;f=l+4|0;I=c[f>>2]|0,c[f>>2]=I+1,I;if((c[7543]|0)!=-1){c[k>>2]=30172;c[k+4>>2]=48;c[k+8>>2]=0;kE(30172,k)}k=(c[7544]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)==0){b0[c[(c[l>>2]|0)+8>>2]&1023](l)}o=c[e>>2]|0;p=b+8|0;q=b5[c[c[p>>2]>>2]&511](p)|0;p=(mf(d,o,q,q+168|0,n,g,0)|0)-q|0;if((p|0)>=168){r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=j;return}c[h+24>>2]=((p|0)/12|0|0)%7|0;r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=j;return}}while(0);j=bR(4)|0;c[j>>2]=3308;bl(j|0,24132,322)}function nf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;j=i;i=i+12|0;k=d;d=i;i=i+4|0;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2];k=j|0;l=c[f+28>>2]|0;f=l+4|0;I=c[f>>2]|0,c[f>>2]=I+1,I;if((c[7543]|0)!=-1){c[k>>2]=30172;c[k+4>>2]=48;c[k+8>>2]=0;kE(30172,k)}k=(c[7544]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)==0){b0[c[(c[l>>2]|0)+8>>2]&1023](l)}o=c[e>>2]|0;p=b+8|0;q=b5[c[(c[p>>2]|0)+4>>2]&511](p)|0;p=(mf(d,o,q,q+288|0,n,g,0)|0)-q|0;if((p|0)>=288){r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=j;return}c[h+16>>2]=((p|0)/12|0|0)%12|0;r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=j;return}}while(0);j=bR(4)|0;c[j>>2]=3308;bl(j|0,24132,322)}function ng(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;b=i;i=i+12|0;j=d;d=i;i=i+4|0;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;c[e>>2]=c[j>>2];j=b|0;k=c[f+28>>2]|0;f=k+4|0;I=c[f>>2]|0,c[f>>2]=I+1,I;if((c[7543]|0)!=-1){c[j>>2]=30172;c[j+4>>2]=48;c[j+8>>2]=0;kE(30172,j)}j=(c[7544]|0)-1|0;l=c[k+8>>2]|0;do{if((c[k+12>>2]|0)-l>>2>>>0>j>>>0){m=c[l+(j<<2)>>2]|0;if((m|0)==0){break}if(((I=c[f>>2]|0,c[f>>2]=I+ -1,I)|0)==0){b0[c[(c[k>>2]|0)+8>>2]&1023](k)}n=ni(d,c[e>>2]|0,g,m,4)|0;if((c[g>>2]&4|0)!=0){o=d|0;p=c[o>>2]|0;q=a|0;c[q>>2]=p;i=b;return}if((n|0)<69){r=n+2e3|0}else{r=(n-69|0)>>>0<31>>>0?n+1900|0:n}c[h+20>>2]=r-1900;o=d|0;p=c[o>>2]|0;q=a|0;c[q>>2]=p;i=b;return}}while(0);b=bR(4)|0;c[b>>2]=3308;bl(b|0,24132,322)}function nh(b,e,f,g,h,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0;m=i;i=i+48|0;n=f;f=i;i=i+4|0;c[f>>2]=c[n>>2];n=g;g=i;i=i+4|0;c[g>>2]=c[n>>2];n=m|0;o=m+12|0;p=m+16|0;q=m+20|0;r=m+24|0;s=m+28|0;t=m+32|0;u=m+36|0;v=m+40|0;w=m+44|0;c[j>>2]=0;x=c[h+28>>2]|0;y=x+4|0;I=c[y>>2]|0,c[y>>2]=I+1,I;if((c[7543]|0)!=-1){c[n>>2]=30172;c[n+4>>2]=48;c[n+8>>2]=0;kE(30172,n)}n=(c[7544]|0)-1|0;z=c[x+8>>2]|0;do{if((c[x+12>>2]|0)-z>>2>>>0>n>>>0){A=c[z+(n<<2)>>2]|0;if((A|0)==0){break}B=A;if(((I=c[y>>2]|0,c[y>>2]=I+ -1,I)|0)==0){b0[c[(c[x>>2]|0)+8>>2]&1023](x)}L10:do{switch(l<<24>>24|0){case 112:{C=k+8|0;D=c[g>>2]|0;E=e+8|0;F=b5[c[(c[E>>2]|0)+8>>2]&511](E)|0;E=d[F]|0;if((E&1|0)==0){G=E>>>1}else{G=c[F+4>>2]|0}E=d[F+12|0]|0;if((E&1|0)==0){H=E>>>1}else{H=c[F+16>>2]|0}if((G|0)==(-H|0)){c[j>>2]=c[j>>2]|4;break L10}E=mf(f,D,F,F+24|0,B,j,0)|0;D=E-F|0;do{if((E|0)==(F|0)){if((c[C>>2]|0)!=12){break}c[C>>2]=0;break L10}}while(0);if((D|0)!=12){break L10}F=c[C>>2]|0;if((F|0)>=12){break L10}c[C>>2]=F+12;break};case 114:{F=f|0;m8(r,e,c[F>>2]|0,c[g>>2]|0,h,j,k,3100,3144);c[F>>2]=c[r>>2];break};case 82:{F=f|0;m8(s,e,c[F>>2]|0,c[g>>2]|0,h,j,k,3080,3100);c[F>>2]=c[s>>2];break};case 73:{F=k+8|0;E=ni(f,c[g>>2]|0,j,B,2)|0;J=c[j>>2]|0;do{if((J&4|0)==0){if((E-1|0)>>>0>=12>>>0){break}c[F>>2]=E;break L10}}while(0);c[j>>2]=J|4;break};case 77:{E=ni(f,c[g>>2]|0,j,B,2)|0;F=c[j>>2]|0;if((F&4|0)==0&(E|0)<60){c[k+4>>2]=E;break L10}else{c[j>>2]=F|4;break L10}break};case 83:{F=ni(f,c[g>>2]|0,j,B,2)|0;E=c[j>>2]|0;if((E&4|0)==0&(F|0)<61){c[k>>2]=F;break L10}else{c[j>>2]=E|4;break L10}break};case 84:{E=f|0;m8(t,e,c[E>>2]|0,c[g>>2]|0,h,j,k,3048,3080);c[E>>2]=c[t>>2];break};case 119:{E=ni(f,c[g>>2]|0,j,B,1)|0;F=c[j>>2]|0;if((F&4|0)==0&(E|0)<7){c[k+24>>2]=E;break L10}else{c[j>>2]=F|4;break L10}break};case 109:{F=(ni(f,c[g>>2]|0,j,B,2)|0)-1|0;E=c[j>>2]|0;if((E&4|0)==0&(F|0)<12){c[k+16>>2]=F;break L10}else{c[j>>2]=E|4;break L10}break};case 97:case 65:{E=c[g>>2]|0;F=e+8|0;C=b5[c[c[F>>2]>>2]&511](F)|0;F=(mf(f,E,C,C+168|0,B,j,0)|0)-C|0;if((F|0)>=168){break L10}c[k+24>>2]=((F|0)/12|0|0)%7|0;break};case 99:{F=e+8|0;C=b5[c[(c[F>>2]|0)+12>>2]&511](F)|0;F=f|0;E=a[C]|0;if((E&1)==0){K=C+4|0}else{K=c[C+8>>2]|0}D=E&255;if((D&1|0)==0){L=D>>>1}else{L=c[C+4>>2]|0}m8(o,e,c[F>>2]|0,c[g>>2]|0,h,j,k,K,K+(L<<2)|0);c[F>>2]=c[o>>2];break};case 98:case 66:case 104:{F=c[g>>2]|0;C=e+8|0;D=b5[c[(c[C>>2]|0)+4>>2]&511](C)|0;C=(mf(f,F,D,D+288|0,B,j,0)|0)-D|0;if((C|0)>=288){break L10}c[k+16>>2]=((C|0)/12|0|0)%12|0;break};case 110:case 116:{C=f|0;D=A;F=c[g>>2]|0;L67:while(1){E=c[C>>2]|0;do{if((E|0)==0){M=1}else{N=c[E+12>>2]|0;if((N|0)==(c[E+16>>2]|0)){O=b5[c[(c[E>>2]|0)+36>>2]&511](E)|0}else{O=c[N>>2]|0}if((O|0)==-1){c[C>>2]=0;M=1;break}else{M=(c[C>>2]|0)==0;break}}}while(0);do{if((F|0)==0){P=59}else{E=c[F+12>>2]|0;if((E|0)==(c[F+16>>2]|0)){Q=b5[c[(c[F>>2]|0)+36>>2]&511](F)|0}else{Q=c[E>>2]|0}if((Q|0)==-1){P=59;break}if(M){R=0;S=F}else{T=F;U=0;break L67}}}while(0);if((P|0)==59){P=0;if(M){T=0;U=1;break}else{R=1;S=0}}E=c[C>>2]|0;N=c[E+12>>2]|0;if((N|0)==(c[E+16>>2]|0)){V=b5[c[(c[E>>2]|0)+36>>2]&511](E)|0}else{V=c[N>>2]|0}if(!(b3[c[(c[D>>2]|0)+12>>2]&63](B,8192,V)|0)){T=S;U=R;break}N=c[C>>2]|0;E=N+12|0;W=c[E>>2]|0;if((W|0)==(c[N+16>>2]|0)){b5[c[(c[N>>2]|0)+40>>2]&511](N)|0;F=S;continue}else{c[E>>2]=W+4;F=S;continue}}F=c[C>>2]|0;do{if((F|0)==0){X=1}else{D=c[F+12>>2]|0;if((D|0)==(c[F+16>>2]|0)){Y=b5[c[(c[F>>2]|0)+36>>2]&511](F)|0}else{Y=c[D>>2]|0}if((Y|0)==-1){c[C>>2]=0;X=1;break}else{X=(c[C>>2]|0)==0;break}}}while(0);do{if(U){P=80}else{C=c[T+12>>2]|0;if((C|0)==(c[T+16>>2]|0)){Z=b5[c[(c[T>>2]|0)+36>>2]&511](T)|0}else{Z=c[C>>2]|0}if((Z|0)==-1){P=80;break}if(X^(T|0)==0){break L10}}}while(0);if((P|0)==80){if(!X){break L10}}c[j>>2]=c[j>>2]|2;break};case 70:{C=f|0;m8(q,e,c[C>>2]|0,c[g>>2]|0,h,j,k,3016,3048);c[C>>2]=c[q>>2];break};case 106:{C=ni(f,c[g>>2]|0,j,B,3)|0;F=c[j>>2]|0;if((F&4|0)==0&(C|0)<366){c[k+28>>2]=C;break L10}else{c[j>>2]=F|4;break L10}break};case 68:{F=f|0;m8(p,e,c[F>>2]|0,c[g>>2]|0,h,j,k,3144,3176);c[F>>2]=c[p>>2];break};case 120:{F=c[(c[e>>2]|0)+20>>2]|0;c[u>>2]=c[f>>2];c[v>>2]=c[g>>2];b6[F&127](b,e,u,v,h,j,k);i=m;return};case 88:{F=e+8|0;C=b5[c[(c[F>>2]|0)+24>>2]&511](F)|0;F=f|0;D=a[C]|0;if((D&1)==0){_=C+4|0}else{_=c[C+8>>2]|0}J=D&255;if((J&1|0)==0){$=J>>>1}else{$=c[C+4>>2]|0}m8(w,e,c[F>>2]|0,c[g>>2]|0,h,j,k,_,_+($<<2)|0);c[F>>2]=c[w>>2];break};case 72:{F=ni(f,c[g>>2]|0,j,B,2)|0;C=c[j>>2]|0;if((C&4|0)==0&(F|0)<24){c[k+8>>2]=F;break L10}else{c[j>>2]=C|4;break L10}break};case 100:case 101:{C=k+12|0;F=ni(f,c[g>>2]|0,j,B,2)|0;J=c[j>>2]|0;do{if((J&4|0)==0){if((F-1|0)>>>0>=31>>>0){break}c[C>>2]=F;break L10}}while(0);c[j>>2]=J|4;break};case 121:{F=ni(f,c[g>>2]|0,j,B,4)|0;if((c[j>>2]&4|0)!=0){break L10}if((F|0)<69){aa=F+2e3|0}else{aa=(F-69|0)>>>0<31>>>0?F+1900|0:F}c[k+20>>2]=aa-1900;break};case 89:{F=ni(f,c[g>>2]|0,j,B,4)|0;if((c[j>>2]&4|0)!=0){break L10}c[k+20>>2]=F-1900;break};case 37:{F=c[g>>2]|0;C=f|0;D=c[C>>2]|0;do{if((D|0)==0){ab=1}else{W=c[D+12>>2]|0;if((W|0)==(c[D+16>>2]|0)){ac=b5[c[(c[D>>2]|0)+36>>2]&511](D)|0}else{ac=c[W>>2]|0}if((ac|0)==-1){c[C>>2]=0;ab=1;break}else{ab=(c[C>>2]|0)==0;break}}}while(0);do{if((F|0)==0){P=133}else{D=c[F+12>>2]|0;if((D|0)==(c[F+16>>2]|0)){ad=b5[c[(c[F>>2]|0)+36>>2]&511](F)|0}else{ad=c[D>>2]|0}if((ad|0)==-1){P=133;break}if(ab){ae=F;af=0}else{P=135}}}while(0);if((P|0)==133){if(ab){P=135}else{ae=0;af=1}}if((P|0)==135){c[j>>2]=c[j>>2]|6;break L10}F=c[C>>2]|0;D=c[F+12>>2]|0;if((D|0)==(c[F+16>>2]|0)){ag=b5[c[(c[F>>2]|0)+36>>2]&511](F)|0}else{ag=c[D>>2]|0}if((b3[c[(c[A>>2]|0)+52>>2]&63](B,ag,0)|0)<<24>>24!=37){c[j>>2]=c[j>>2]|4;break L10}D=c[C>>2]|0;F=D+12|0;J=c[F>>2]|0;if((J|0)==(c[D+16>>2]|0)){b5[c[(c[D>>2]|0)+40>>2]&511](D)|0}else{c[F>>2]=J+4}J=c[C>>2]|0;do{if((J|0)==0){ah=1}else{F=c[J+12>>2]|0;if((F|0)==(c[J+16>>2]|0)){ai=b5[c[(c[J>>2]|0)+36>>2]&511](J)|0}else{ai=c[F>>2]|0}if((ai|0)==-1){c[C>>2]=0;ah=1;break}else{ah=(c[C>>2]|0)==0;break}}}while(0);do{if(af){P=156}else{C=c[ae+12>>2]|0;if((C|0)==(c[ae+16>>2]|0)){aj=b5[c[(c[ae>>2]|0)+36>>2]&511](ae)|0}else{aj=c[C>>2]|0}if((aj|0)==-1){P=156;break}if(ah^(ae|0)==0){break L10}}}while(0);if((P|0)==156){if(!ah){break L10}}c[j>>2]=c[j>>2]|2;break};default:{c[j>>2]=c[j>>2]|4}}}while(0);c[b>>2]=c[f>>2];i=m;return}}while(0);m=bR(4)|0;c[m>>2]=3308;bl(m|0,24132,322)}function ni(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;g=a|0;a=c[g>>2]|0;do{if((a|0)==0){h=1}else{i=c[a+12>>2]|0;if((i|0)==(c[a+16>>2]|0)){j=b5[c[(c[a>>2]|0)+36>>2]&511](a)|0}else{j=c[i>>2]|0}if((j|0)==-1){c[g>>2]=0;h=1;break}else{h=(c[g>>2]|0)==0;break}}}while(0);do{if((b|0)==0){k=13}else{j=c[b+12>>2]|0;if((j|0)==(c[b+16>>2]|0)){l=b5[c[(c[b>>2]|0)+36>>2]&511](b)|0}else{l=c[j>>2]|0}if((l|0)==-1){k=13;break}if(h){m=b}else{k=15}}}while(0);if((k|0)==13){if(h){k=15}else{m=0}}if((k|0)==15){c[d>>2]=c[d>>2]|6;n=0;return n|0}h=c[g>>2]|0;b=c[h+12>>2]|0;if((b|0)==(c[h+16>>2]|0)){o=b5[c[(c[h>>2]|0)+36>>2]&511](h)|0}else{o=c[b>>2]|0}b=e;if(!(b3[c[(c[b>>2]|0)+12>>2]&63](e,2048,o)|0)){c[d>>2]=c[d>>2]|4;n=0;return n|0}h=e;l=(b3[c[(c[h>>2]|0)+52>>2]&63](e,o,0)|0)<<24>>24;o=c[g>>2]|0;j=o+12|0;a=c[j>>2]|0;if((a|0)==(c[o+16>>2]|0)){b5[c[(c[o>>2]|0)+40>>2]&511](o)|0;p=l;q=f;r=m}else{c[j>>2]=a+4;p=l;q=f;r=m}while(1){s=p-48|0;m=q-1|0;f=c[g>>2]|0;do{if((f|0)==0){t=0}else{l=c[f+12>>2]|0;if((l|0)==(c[f+16>>2]|0)){u=b5[c[(c[f>>2]|0)+36>>2]&511](f)|0}else{u=c[l>>2]|0}if((u|0)==-1){c[g>>2]=0;t=0;break}else{t=c[g>>2]|0;break}}}while(0);f=(t|0)==0;if((r|0)==0){v=t;w=0}else{l=c[r+12>>2]|0;if((l|0)==(c[r+16>>2]|0)){x=b5[c[(c[r>>2]|0)+36>>2]&511](r)|0}else{x=c[l>>2]|0}v=c[g>>2]|0;w=(x|0)==-1?0:r}y=(w|0)==0;if(!((f^y)&(m|0)>0)){break}f=c[v+12>>2]|0;if((f|0)==(c[v+16>>2]|0)){z=b5[c[(c[v>>2]|0)+36>>2]&511](v)|0}else{z=c[f>>2]|0}if(!(b3[c[(c[b>>2]|0)+12>>2]&63](e,2048,z)|0)){n=s;k=61;break}f=((b3[c[(c[h>>2]|0)+52>>2]&63](e,z,0)|0)<<24>>24)+(s*10|0)|0;l=c[g>>2]|0;a=l+12|0;j=c[a>>2]|0;if((j|0)==(c[l+16>>2]|0)){b5[c[(c[l>>2]|0)+40>>2]&511](l)|0;p=f;q=m;r=w;continue}else{c[a>>2]=j+4;p=f;q=m;r=w;continue}}if((k|0)==61){return n|0}do{if((v|0)==0){A=1}else{r=c[v+12>>2]|0;if((r|0)==(c[v+16>>2]|0)){B=b5[c[(c[v>>2]|0)+36>>2]&511](v)|0}else{B=c[r>>2]|0}if((B|0)==-1){c[g>>2]=0;A=1;break}else{A=(c[g>>2]|0)==0;break}}}while(0);do{if(y){k=56}else{g=c[w+12>>2]|0;if((g|0)==(c[w+16>>2]|0)){C=b5[c[(c[w>>2]|0)+36>>2]&511](w)|0}else{C=c[g>>2]|0}if((C|0)==-1){k=56;break}if(A){n=s}else{break}return n|0}}while(0);do{if((k|0)==56){if(A){break}else{n=s}return n|0}}while(0);c[d>>2]=c[d>>2]|2;n=s;return n|0}function nj(b){b=b|0;var d=0,e=0,f=0;d=b;e=b+8|0;f=c[e>>2]|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);if((f|0)!=(c[7204]|0)){a7(c[e>>2]|0)}if((b|0)==0){return}qI(d);return}function nk(b){b=b|0;var d=0;d=b+8|0;b=c[d>>2]|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);if((b|0)==(c[7204]|0)){return}a7(c[d>>2]|0);return}function nl(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=i;i=i+104|0;f=e;e=i;i=i+4|0;c[e>>2]=c[f>>2];f=g|0;l=g+4|0;m=l|0;n=f|0;a[n]=37;o=f+1|0;a[o]=j;p=f+2|0;a[p]=k;a[f+3|0]=0;if(k<<24>>24!=0){a[o]=k;a[p]=j}j=bk(m|0,100,n|0,h|0,c[d+8>>2]|0)|0;d=l+j|0;l=c[e>>2]|0;if((j|0)==0){q=l;r=b|0;c[r>>2]=q;i=g;return}else{s=l;t=m}while(1){m=a[t]|0;if((s|0)==0){u=0}else{l=s+24|0;j=c[l>>2]|0;if((j|0)==(c[s+28>>2]|0)){v=b2[c[(c[s>>2]|0)+52>>2]&127](s,m&255)|0}else{c[l>>2]=j+1;a[j]=m;v=m&255}u=(v|0)==-1?0:s}m=t+1|0;if((m|0)==(d|0)){q=u;break}else{s=u;t=m}}r=b|0;c[r>>2]=q;i=g;return}function nm(b){b=b|0;var d=0,e=0,f=0;d=b;e=b+8|0;f=c[e>>2]|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);if((f|0)!=(c[7204]|0)){a7(c[e>>2]|0)}if((b|0)==0){return}qI(d);return}function nn(b){b=b|0;var d=0;d=b+8|0;b=c[d>>2]|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);if((b|0)==(c[7204]|0)){return}a7(c[d>>2]|0);return}function no(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;i=i+516|0;f=e;e=i;i=i+4|0;c[e>>2]=c[f>>2];f=g|0;l=g+104|0;m=g+112|0;n=g+116|0;o=n|0;p=g+4|0;q=f|0;a[q]=37;r=f+1|0;a[r]=j;s=f+2|0;a[s]=k;a[f+3|0]=0;if(k<<24>>24!=0){a[r]=k;a[s]=j}j=d+8|0;bk(p|0,100,q|0,h|0,c[j>>2]|0)|0;h=l;c[h>>2]=0;c[h+4>>2]=0;c[m>>2]=p;p=bH(c[j>>2]|0)|0;j=qn(o,m,100,l)|0;if((p|0)!=0){bH(p|0)|0}if((j|0)==-1){oa(872)}p=n+(j<<2)|0;n=c[e>>2]|0;if((j|0)==0){t=n;u=b|0;c[u>>2]=t;i=g;return}else{v=n;w=o}while(1){o=c[w>>2]|0;if((v|0)==0){x=0}else{n=v+24|0;j=c[n>>2]|0;if((j|0)==(c[v+28>>2]|0)){y=b2[c[(c[v>>2]|0)+52>>2]&127](v,o)|0}else{c[n>>2]=j+4;c[j>>2]=o;y=o}x=(y|0)==-1?0:v}o=w+4|0;if((o|0)==(p|0)){t=x;break}else{v=x;w=o}}u=b|0;c[u>>2]=t;i=g;return}function np(a){a=a|0;if((a|0)==0){return}qI(a);return}function nq(a){a=a|0;return}function nr(a){a=a|0;return 127}function ns(a){a=a|0;return 127}function nt(a,b){a=a|0;b=b|0;qP(a|0,0,12)|0;return}function nu(a,b){a=a|0;b=b|0;qP(a|0,0,12)|0;return}function nv(a,b){a=a|0;b=b|0;qP(a|0,0,12)|0;return}function nw(b,c){b=b|0;c=c|0;c=b;a[b]=2;a[c+1|0]=45;a[c+2|0]=0;return}function nx(a){a=a|0;return 0}function ny(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;return}function nz(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;return}function nA(a){a=a|0;if((a|0)==0){return}qI(a);return}function nB(a){a=a|0;return}function nC(a){a=a|0;return 127}function nD(a){a=a|0;return 127}function nE(a,b){a=a|0;b=b|0;qP(a|0,0,12)|0;return}function nF(a,b){a=a|0;b=b|0;qP(a|0,0,12)|0;return}function nG(a,b){a=a|0;b=b|0;qP(a|0,0,12)|0;return}function nH(b,c){b=b|0;c=c|0;c=b;a[b]=2;a[c+1|0]=45;a[c+2|0]=0;return}function nI(a){a=a|0;return 0}function nJ(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;return}function nK(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;return}function nL(a){a=a|0;if((a|0)==0){return}qI(a);return}function nM(a){a=a|0;return}function nN(a){a=a|0;return 2147483647}function nO(a){a=a|0;return 2147483647}function nP(a,b){a=a|0;b=b|0;qP(a|0,0,12)|0;return}function nQ(a,b){a=a|0;b=b|0;qP(a|0,0,12)|0;return}function nR(a,b){a=a|0;b=b|0;qP(a|0,0,12)|0;return}function nS(b,d){b=b|0;d=d|0;a[b]=2;d=b+4|0;c[d>>2]=45;c[d+4>>2]=0;return}function nT(a){a=a|0;return 0}function nU(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;return}function nV(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;return}function nW(a){a=a|0;if((a|0)==0){return}qI(a);return}function nX(a){a=a|0;return}function nY(a){a=a|0;return 2147483647}function nZ(a){a=a|0;return 2147483647}function n_(a,b){a=a|0;b=b|0;qP(a|0,0,12)|0;return}function n$(a,b){a=a|0;b=b|0;qP(a|0,0,12)|0;return}function n0(a,b){a=a|0;b=b|0;qP(a|0,0,12)|0;return}function n1(b,d){b=b|0;d=d|0;a[b]=2;d=b+4|0;c[d>>2]=45;c[d+4>>2]=0;return}function n2(a){a=a|0;return 0}function n3(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;return}function n4(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;return}function n5(a){a=a|0;if((a|0)==0){return}qI(a);return}function n6(a){a=a|0;return}function n7(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;d=i;i=i+240|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=d|0;m=d+12|0;n=d+112|0;o=d+120|0;p=d+124|0;q=d+128|0;r=d+140|0;s=n|0;c[s>>2]=m;t=n+4|0;c[t>>2]=484;u=m+100|0;m=c[h+28>>2]|0;v=m;w=m+4|0;I=c[w>>2]|0,c[w>>2]=I+1,I;if((c[7545]|0)!=-1){c[l>>2]=30180;c[l+4>>2]=48;c[l+8>>2]=0;kE(30180,l)}l=(c[7546]|0)-1|0;w=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-w>>2>>>0>l>>>0){x=c[w+(l<<2)>>2]|0;if((x|0)==0){break}y=x;a[p]=0;z=f|0;do{if(n9(e,c[z>>2]|0,g,v,c[h+4>>2]|0,j,p,y,n,o,u)|0){A=q|0;cd[c[(c[x>>2]|0)+32>>2]&15](y,3004,3014,A)|0;B=r|0;C=c[o>>2]|0;D=c[s>>2]|0;E=C-D|0;do{if((E|0)>98){F=qH(E+2|0)|0;if((F|0)!=0){G=F;H=F;break}F=bR(4)|0;c[F>>2]=3284;bl(F|0,24120,94)}else{G=B;H=0}}while(0);if((a[p]&1)==0){J=G}else{a[G]=45;J=G+1|0}if(D>>>0<C>>>0){E=q+10|0;F=q;K=J;L=D;while(1){M=A;while(1){if((M|0)==(E|0)){N=E;break}if((a[M]|0)==(a[L]|0)){N=M;break}else{M=M+1|0}}a[K]=a[3004+(N-F)|0]|0;M=L+1|0;O=K+1|0;if(M>>>0<(c[o>>2]|0)>>>0){K=O;L=M}else{P=O;break}}}else{P=J}a[P]=0;L=bI(B|0,1416,(K=i,i=i+4|0,c[K>>2]=k,K)|0)|0;i=K;if((L|0)==1){if((H|0)==0){break}qI(H);break}L=bR(8)|0;c[L>>2]=3332;K=L+4|0;F=K;do{if((K|0)!=0){while(1){Q=qH(28)|0;if((Q|0)!=0){R=42;break}E=(I=c[7664]|0,c[7664]=I+0,I);if((E|0)==0){break}b8[E&1]()}if((R|0)==42){c[Q+4>>2]=15;c[Q>>2]=15;E=Q+12|0;c[F>>2]=E;c[Q+8>>2]=0;qQ(E|0,1372,16)|0;break}E=bR(4)|0;c[E>>2]=3284;bl(E|0,24120,94)}}while(0);bl(L|0,24144,216)}}while(0);y=e|0;x=c[y>>2]|0;do{if((x|0)==0){S=0}else{if((c[x+12>>2]|0)!=(c[x+16>>2]|0)){S=x;break}if((b5[c[(c[x>>2]|0)+36>>2]&511](x)|0)!=-1){S=x;break}c[y>>2]=0;S=0}}while(0);y=(S|0)==0;x=c[z>>2]|0;do{if((x|0)==0){R=60}else{if((c[x+12>>2]|0)!=(c[x+16>>2]|0)){if(y){break}else{R=62;break}}if((b5[c[(c[x>>2]|0)+36>>2]&511](x)|0)==-1){c[z>>2]=0;R=60;break}else{if(y){break}else{R=62;break}}}}while(0);if((R|0)==60){if(y){R=62}}if((R|0)==62){c[j>>2]=c[j>>2]|2}c[b>>2]=S;z=m+4|0;if(((I=c[z>>2]|0,c[z>>2]=I+ -1,I)|0)==0){b0[c[(c[m>>2]|0)+8>>2]&1023](m)}z=c[s>>2]|0;c[s>>2]=0;if((z|0)==0){i=d;return}b0[c[t>>2]&1023](z);i=d;return}}while(0);d=bR(4)|0;c[d>>2]=3308;bl(d|0,24132,322)}function n8(a){a=a|0;return}function n9(e,f,g,h,j,k,l,m,n,o,p){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;var q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bL=0,bM=0,bN=0,bO=0,bP=0,bQ=0,bS=0,bT=0,bU=0,bV=0,bW=0,bX=0,bY=0,bZ=0,b_=0,b$=0,b2=0,b3=0,b4=0,b6=0,b7=0,b9=0,ca=0,cb=0,cc=0,cd=0,ce=0,cf=0,cg=0,ch=0,ci=0,cj=0,ck=0,cl=0,cm=0,cn=0,co=0;q=i;i=i+532|0;r=q|0;s=q+12|0;t=q+24|0;u=q+28|0;v=q+40|0;w=q+52|0;x=q+64|0;y=q+76|0;z=q+80|0;A=q+92|0;B=q+104|0;C=q+116|0;D=q+128|0;E=q+528|0;F=E;G=i;i=i+12|0;H=G;J=i;i=i+12|0;K=i;i=i+12|0;L=i;i=i+12|0;M=i;i=i+12|0;N=i;i=i+4|0;O=D|0;qP(H|0,0,12)|0;P=J;Q=K;R=L;S=M;qP(P|0,0,12)|0;qP(Q|0,0,12)|0;qP(R|0,0,12)|0;qP(S|0,0,12)|0;T=u;U=v;V=w;W=x;X=z;Y=A;Z=B;_=C;L1:do{if(g){$=t;if((c[7659]|0)!=-1){c[s>>2]=30636;c[s+4>>2]=48;c[s+8>>2]=0;kE(30636,s)}aa=(c[7660]|0)-1|0;ab=c[h+8>>2]|0;do{if((c[h+12>>2]|0)-ab>>2>>>0>aa>>>0){ac=c[ab+(aa<<2)>>2]|0;if((ac|0)==0){break}ad=ac;b1[c[(c[ac>>2]|0)+44>>2]&255]($,ad);c[E>>2]=c[t>>2];ae=ac;b1[c[(c[ae>>2]|0)+32>>2]&255](u,ad);if((a[R]&1)==0){a[L+1|0]=0;a[R]=0}else{a[c[L+8>>2]|0]=0;c[L+4>>2]=0}kJ(L);c[R>>2]=c[T>>2];c[R+4>>2]=c[T+4>>2];c[R+8>>2]=c[T+8>>2];qP(T|0,0,12)|0;b1[c[(c[ae>>2]|0)+28>>2]&255](v,ad);if((a[Q]&1)==0){a[K+1|0]=0;a[Q]=0}else{a[c[K+8>>2]|0]=0;c[K+4>>2]=0}kJ(K);c[Q>>2]=c[U>>2];c[Q+4>>2]=c[U+4>>2];c[Q+8>>2]=c[U+8>>2];qP(U|0,0,12)|0;af=ac;ag=b5[c[(c[af>>2]|0)+12>>2]&511](ad)|0;ah=b5[c[(c[af>>2]|0)+16>>2]&511](ad)|0;b1[c[(c[ae>>2]|0)+20>>2]&255](w,ad);if((a[H]&1)==0){a[G+1|0]=0;a[H]=0}else{a[c[G+8>>2]|0]=0;c[G+4>>2]=0}kJ(G);c[H>>2]=c[V>>2];c[H+4>>2]=c[V+4>>2];c[H+8>>2]=c[V+8>>2];qP(V|0,0,12)|0;b1[c[(c[ae>>2]|0)+24>>2]&255](x,ad);if((a[P]&1)==0){a[J+1|0]=0;a[P]=0}else{a[c[J+8>>2]|0]=0;c[J+4>>2]=0}kJ(J);c[P>>2]=c[W>>2];c[P+4>>2]=c[W+4>>2];c[P+8>>2]=c[W+8>>2];qP(W|0,0,12)|0;ai=b5[c[(c[ac>>2]|0)+36>>2]&511](ad)|0;aj=ah;ak=ag;break L1}}while(0);$=bR(4)|0;c[$>>2]=3308;bl($|0,24132,322);return 0}else{$=y;if((c[7661]|0)!=-1){c[r>>2]=30644;c[r+4>>2]=48;c[r+8>>2]=0;kE(30644,r)}aa=(c[7662]|0)-1|0;ab=c[h+8>>2]|0;do{if((c[h+12>>2]|0)-ab>>2>>>0>aa>>>0){ag=c[ab+(aa<<2)>>2]|0;if((ag|0)==0){break}ah=ag;b1[c[(c[ag>>2]|0)+44>>2]&255]($,ah);c[E>>2]=c[y>>2];ad=ag;b1[c[(c[ad>>2]|0)+32>>2]&255](z,ah);if((a[R]&1)==0){a[L+1|0]=0;a[R]=0}else{a[c[L+8>>2]|0]=0;c[L+4>>2]=0}kJ(L);c[R>>2]=c[X>>2];c[R+4>>2]=c[X+4>>2];c[R+8>>2]=c[X+8>>2];qP(X|0,0,12)|0;b1[c[(c[ad>>2]|0)+28>>2]&255](A,ah);if((a[Q]&1)==0){a[K+1|0]=0;a[Q]=0}else{a[c[K+8>>2]|0]=0;c[K+4>>2]=0}kJ(K);c[Q>>2]=c[Y>>2];c[Q+4>>2]=c[Y+4>>2];c[Q+8>>2]=c[Y+8>>2];qP(Y|0,0,12)|0;ac=ag;ae=b5[c[(c[ac>>2]|0)+12>>2]&511](ah)|0;af=b5[c[(c[ac>>2]|0)+16>>2]&511](ah)|0;b1[c[(c[ad>>2]|0)+20>>2]&255](B,ah);if((a[H]&1)==0){a[G+1|0]=0;a[H]=0}else{a[c[G+8>>2]|0]=0;c[G+4>>2]=0}kJ(G);c[H>>2]=c[Z>>2];c[H+4>>2]=c[Z+4>>2];c[H+8>>2]=c[Z+8>>2];qP(Z|0,0,12)|0;b1[c[(c[ad>>2]|0)+24>>2]&255](C,ah);if((a[P]&1)==0){a[J+1|0]=0;a[P]=0}else{a[c[J+8>>2]|0]=0;c[J+4>>2]=0}kJ(J);c[P>>2]=c[_>>2];c[P+4>>2]=c[_+4>>2];c[P+8>>2]=c[_+8>>2];qP(_|0,0,12)|0;ai=b5[c[(c[ag>>2]|0)+36>>2]&511](ah)|0;aj=af;ak=ae;break L1}}while(0);$=bR(4)|0;c[$>>2]=3308;bl($|0,24132,322);return 0}}while(0);_=n|0;c[o>>2]=c[_>>2];C=e|0;e=m+8|0;m=L+1|0;Z=L+4|0;B=L+8|0;Y=K+1|0;A=K+4|0;X=K+8|0;z=(j&512|0)!=0;j=J+1|0;y=J+4|0;E=J+8|0;J=M+1|0;h=M+4|0;r=M+8|0;W=F+3|0;x=G+4|0;V=n+4|0;n=M|0;M=aj<<24>>24;aj=ak<<24>>24;ak=p;p=484;w=O;U=O;O=D+400|0;D=0;v=0;T=ai;ai=f;L75:while(1){f=c[C>>2]|0;do{if((f|0)==0){al=0}else{if((c[f+12>>2]|0)!=(c[f+16>>2]|0)){al=f;break}if((b5[c[(c[f>>2]|0)+36>>2]&511](f)|0)==-1){c[C>>2]=0;al=0;break}else{al=c[C>>2]|0;break}}}while(0);f=(al|0)==0;do{if((ai|0)==0){am=82}else{if((c[ai+12>>2]|0)!=(c[ai+16>>2]|0)){if(f){an=ai;break}else{ao=p;ap=w;aq=U;ar=D;as=ai;am=407;break L75}}if((b5[c[(c[ai>>2]|0)+36>>2]&511](ai)|0)==-1){am=82;break}if(f){an=ai}else{ao=p;ap=w;aq=U;ar=D;as=ai;am=407;break L75}}}while(0);if((am|0)==82){am=0;if(f){ao=p;ap=w;aq=U;ar=D;as=0;am=407;break}else{an=0}}L95:do{switch(a[F+v|0]|0){case 1:{if((v|0)==3){ao=p;ap=w;aq=U;ar=D;as=an;am=407;break L75}u=c[C>>2]|0;t=c[u+12>>2]|0;if((t|0)==(c[u+16>>2]|0)){at=b5[c[(c[u>>2]|0)+36>>2]&511](u)|0}else{at=d[t]|0}t=at<<24>>24;if((bx(t|0)|0)==0){am=156;break L75}if((b[(c[e>>2]|0)+(t<<1)>>1]&8192)==0){am=156;break L75}t=c[C>>2]|0;u=t+12|0;s=c[u>>2]|0;if((s|0)==(c[t+16>>2]|0)){au=b5[c[(c[t>>2]|0)+40>>2]&511](t)|0}else{c[u>>2]=s+1;au=d[s]|0}s=au&255;u=a[S]|0;t=(u&1)==0;if(t){av=(u&255)>>>1;aw=10;ax=u}else{u=c[n>>2]|0;av=c[h>>2]|0;aw=(u&-2)-1|0;ax=u&255}do{if((av|0)==(aw|0)){if((aw|0)==-17){am=132;break L75}u=(ax&1)==0?J:c[r>>2]|0;do{if(aw>>>0<2147483623>>>0){g=aw+1|0;$=aw<<1;aa=g>>>0<$>>>0?$:g;if(aa>>>0<11>>>0){ay=11;break}ay=aa+16&-16}else{ay=-17}}while(0);aa=(ay|0)==0?1:ay;while(1){az=qH(aa)|0;if((az|0)!=0){break}g=(I=c[7664]|0,c[7664]=I+0,I);if((g|0)==0){am=146;break L75}b8[g&1]()}qQ(az|0,u|0,aw)|0;if(!((aw|0)==10|(u|0)==0)){qI(u)}c[r>>2]=az;c[n>>2]=ay|1;aA=az;am=154}else{if(t){a[S]=(av<<1)+2;aB=J;aC=av+1|0;break}else{aA=c[r>>2]|0;am=154;break}}}while(0);if((am|0)==154){am=0;t=av+1|0;c[h>>2]=t;aB=aA;aC=t}a[aB+av|0]=s;a[aB+aC|0]=0;am=157;break};case 0:{am=157;break};case 3:{t=a[Q]|0;aa=t&255;g=(aa&1|0)==0?aa>>>1:c[A>>2]|0;aa=a[R]|0;$=aa&255;ab=($&1|0)==0?$>>>1:c[Z>>2]|0;if((g|0)==(-ab|0)){aD=D;aE=O;aF=U;aG=w;aH=p;aI=ak;aJ=T;aK=an;break L95}$=(g|0)==0;g=c[C>>2]|0;ae=c[g+12>>2]|0;af=c[g+16>>2]|0;ah=(ae|0)==(af|0);if(!($|(ab|0)==0)){if(ah){ab=b5[c[(c[g>>2]|0)+36>>2]&511](g)|0;ag=c[C>>2]|0;aL=ab;aM=a[Q]|0;aN=ag;aO=c[ag+12>>2]|0;aP=c[ag+16>>2]|0}else{aL=d[ae]|0;aM=t;aN=g;aO=ae;aP=af}af=aN+12|0;ag=(aO|0)==(aP|0);if((aL<<24>>24|0)==(a[(aM&1)==0?Y:c[X>>2]|0]|0)){if(ag){b5[c[(c[aN>>2]|0)+40>>2]&511](aN)|0}else{c[af>>2]=aO+1}af=d[Q]|0;aD=((af&1|0)==0?af>>>1:c[A>>2]|0)>>>0>1>>>0?K:D;aE=O;aF=U;aG=w;aH=p;aI=ak;aJ=T;aK=an;break L95}if(ag){aQ=b5[c[(c[aN>>2]|0)+36>>2]&511](aN)|0}else{aQ=d[aO]|0}if((aQ<<24>>24|0)!=(a[(a[R]&1)==0?m:c[B>>2]|0]|0)){am=248;break L75}ag=c[C>>2]|0;af=ag+12|0;ab=c[af>>2]|0;if((ab|0)==(c[ag+16>>2]|0)){b5[c[(c[ag>>2]|0)+40>>2]&511](ag)|0}else{c[af>>2]=ab+1}a[l]=1;ab=d[R]|0;aD=((ab&1|0)==0?ab>>>1:c[Z>>2]|0)>>>0>1>>>0?L:D;aE=O;aF=U;aG=w;aH=p;aI=ak;aJ=T;aK=an;break L95}if($){if(ah){$=b5[c[(c[g>>2]|0)+36>>2]&511](g)|0;aR=$;aS=a[R]|0}else{aR=d[ae]|0;aS=aa}if((aR<<24>>24|0)!=(a[(aS&1)==0?m:c[B>>2]|0]|0)){aD=D;aE=O;aF=U;aG=w;aH=p;aI=ak;aJ=T;aK=an;break L95}aa=c[C>>2]|0;$=aa+12|0;ab=c[$>>2]|0;if((ab|0)==(c[aa+16>>2]|0)){b5[c[(c[aa>>2]|0)+40>>2]&511](aa)|0}else{c[$>>2]=ab+1}a[l]=1;ab=d[R]|0;aD=((ab&1|0)==0?ab>>>1:c[Z>>2]|0)>>>0>1>>>0?L:D;aE=O;aF=U;aG=w;aH=p;aI=ak;aJ=T;aK=an;break L95}if(ah){ah=b5[c[(c[g>>2]|0)+36>>2]&511](g)|0;aT=ah;aU=a[Q]|0}else{aT=d[ae]|0;aU=t}if((aT<<24>>24|0)!=(a[(aU&1)==0?Y:c[X>>2]|0]|0)){a[l]=1;aD=D;aE=O;aF=U;aG=w;aH=p;aI=ak;aJ=T;aK=an;break L95}t=c[C>>2]|0;ae=t+12|0;ah=c[ae>>2]|0;if((ah|0)==(c[t+16>>2]|0)){b5[c[(c[t>>2]|0)+40>>2]&511](t)|0}else{c[ae>>2]=ah+1}ah=d[Q]|0;aD=((ah&1|0)==0?ah>>>1:c[A>>2]|0)>>>0>1>>>0?K:D;aE=O;aF=U;aG=w;aH=p;aI=ak;aJ=T;aK=an;break};case 2:{if(!((D|0)!=0|v>>>0<2>>>0)){if((v|0)==2){aV=(a[W]|0)!=0}else{aV=0}if(!(z|aV)){aD=0;aE=O;aF=U;aG=w;aH=p;aI=ak;aJ=T;aK=an;break L95}}ah=a[P]|0;ae=c[E>>2]|0;t=(ah&1)==0?j:ae;L193:do{if((v|0)==0){aW=t;aX=ah;aY=ae}else{if((d[F+(v-1)|0]|0)>>>0>=2>>>0){aW=t;aX=ah;aY=ae;break}g=ah&255;L196:do{if((((g&1|0)==0?g>>>1:c[y>>2]|0)|0)==0){aZ=t;a_=ah;a$=ae}else{ab=t;while(1){$=a[ab]|0;if((bx($|0)|0)==0){break}if((b[(c[e>>2]|0)+($<<1)>>1]&8192)==0){break}$=ab+1|0;aa=a[P]|0;af=c[E>>2]|0;ag=aa&255;if(($|0)==(((aa&1)==0?j:af)+((ag&1|0)==0?ag>>>1:c[y>>2]|0)|0)){aZ=$;a_=aa;a$=af;break L196}else{ab=$}}aZ=ab;a_=a[P]|0;a$=c[E>>2]|0}}while(0);g=(a_&1)==0?j:a$;u=aZ-g|0;$=a[S]|0;af=$&255;aa=(af&1|0)==0?af>>>1:c[h>>2]|0;if(u>>>0>aa>>>0){aW=g;aX=a_;aY=a$;break}af=($&1)==0?J:c[r>>2]|0;$=af+aa|0;if((aZ|0)==(g|0)){aW=aZ;aX=a_;aY=a$;break}ag=af+(aa-u)|0;u=g;while(1){if((a[ag]|0)!=(a[u]|0)){aW=g;aX=a_;aY=a$;break L193}aa=ag+1|0;if((aa|0)==($|0)){aW=aZ;aX=a_;aY=a$;break}else{ag=aa;u=u+1|0}}}}while(0);t=aX&255;L210:do{if((aW|0)==(((aX&1)==0?j:aY)+((t&1|0)==0?t>>>1:c[y>>2]|0)|0)){a0=aW;a1=an}else{ae=an;ah=aW;s=an;while(1){u=c[C>>2]|0;do{if((u|0)==0){a2=0}else{if((c[u+12>>2]|0)!=(c[u+16>>2]|0)){a2=u;break}if((b5[c[(c[u>>2]|0)+36>>2]&511](u)|0)==-1){c[C>>2]=0;a2=0;break}else{a2=c[C>>2]|0;break}}}while(0);u=(a2|0)==0;do{if((ae|0)==0){a3=s;am=278}else{if((c[ae+12>>2]|0)!=(c[ae+16>>2]|0)){if(u){a4=ae;a5=s;break}else{a0=ah;a1=s;break L210}}if((b5[c[(c[ae>>2]|0)+36>>2]&511](ae)|0)==-1){a3=0;am=278;break}if(u){a4=ae;a5=s}else{a0=ah;a1=s;break L210}}}while(0);if((am|0)==278){am=0;if(u){a0=ah;a1=a3;break L210}else{a4=0;a5=a3}}ab=c[C>>2]|0;ag=c[ab+12>>2]|0;if((ag|0)==(c[ab+16>>2]|0)){a6=b5[c[(c[ab>>2]|0)+36>>2]&511](ab)|0}else{a6=d[ag]|0}if((a6<<24>>24|0)!=(a[ah]|0)){a0=ah;a1=a5;break L210}ag=c[C>>2]|0;ab=ag+12|0;$=c[ab>>2]|0;if(($|0)==(c[ag+16>>2]|0)){b5[c[(c[ag>>2]|0)+40>>2]&511](ag)|0}else{c[ab>>2]=$+1}$=ah+1|0;ab=a[P]|0;ag=ab&255;if(($|0)==(((ab&1)==0?j:c[E>>2]|0)+((ag&1|0)==0?ag>>>1:c[y>>2]|0)|0)){a0=$;a1=a5;break}else{ae=a4;ah=$;s=a5}}}}while(0);if(!z){aD=D;aE=O;aF=U;aG=w;aH=p;aI=ak;aJ=T;aK=a1;break L95}t=a[P]|0;s=t&255;if((a0|0)==(((t&1)==0?j:c[E>>2]|0)+((s&1|0)==0?s>>>1:c[y>>2]|0)|0)){aD=D;aE=O;aF=U;aG=w;aH=p;aI=ak;aJ=T;aK=a1}else{am=290;break L75}break};case 4:{s=0;t=O;ah=U;ae=w;$=p;ag=ak;ab=an;L242:while(1){g=c[C>>2]|0;do{if((g|0)==0){a7=0}else{if((c[g+12>>2]|0)!=(c[g+16>>2]|0)){a7=g;break}if((b5[c[(c[g>>2]|0)+36>>2]&511](g)|0)==-1){c[C>>2]=0;a7=0;break}else{a7=c[C>>2]|0;break}}}while(0);g=(a7|0)==0;do{if((ab|0)==0){am=302}else{if((c[ab+12>>2]|0)!=(c[ab+16>>2]|0)){if(g){a8=ab;break}else{a9=ab;break L242}}if((b5[c[(c[ab>>2]|0)+36>>2]&511](ab)|0)==-1){am=302;break}if(g){a8=ab}else{a9=ab;break L242}}}while(0);if((am|0)==302){am=0;if(g){a9=0;break}else{a8=0}}aa=c[C>>2]|0;af=c[aa+12>>2]|0;if((af|0)==(c[aa+16>>2]|0)){ba=b5[c[(c[aa>>2]|0)+36>>2]&511](aa)|0}else{ba=d[af]|0}af=ba&255;aa=ba<<24>>24;do{if((bx(aa|0)|0)==0){am=322}else{if((b[(c[e>>2]|0)+(aa<<1)>>1]&2048)==0){am=322;break}ad=c[o>>2]|0;if((ad|0)==(ag|0)){ac=(c[V>>2]|0)!=484;bb=c[_>>2]|0;bc=ag-bb|0;bd=bc>>>0<2147483647>>>0?bc<<1:-1;be=qJ(ac?bb:0,bd)|0;if((be|0)==0){am=312;break L75}do{if(ac){c[_>>2]=be;bf=be}else{bb=c[_>>2]|0;c[_>>2]=be;if((bb|0)==0){bf=be;break}b0[c[V>>2]&1023](bb);bf=c[_>>2]|0}}while(0);c[V>>2]=250;be=bf+bc|0;c[o>>2]=be;bg=(c[_>>2]|0)+bd|0;bh=be}else{bg=ag;bh=ad}c[o>>2]=bh+1;a[bh]=af;bi=s+1|0;bj=t;bk=ah;bm=ae;bn=$;bo=bg}}while(0);if((am|0)==322){am=0;af=d[H]|0;if(!((s|0)!=0&(((af&1|0)==0?af>>>1:c[x>>2]|0)|0)!=0&(aa|0)==(M|0))){a9=a8;break}if((ah|0)==(t|0)){af=ah-ae|0;g=af>>>0<2147483647>>>0?af<<1:-1;if(($|0)==484){bp=0}else{bp=ae}be=qJ(bp,g)|0;ac=be;if((be|0)==0){am=327;break L75}bq=ac+(g>>>2<<2)|0;br=ac+(af>>2<<2)|0;bs=ac;bt=250}else{bq=t;br=ah;bs=ae;bt=$}c[br>>2]=s;bi=0;bj=bq;bk=br+4|0;bm=bs;bn=bt;bo=ag}ac=c[C>>2]|0;af=ac+12|0;g=c[af>>2]|0;if((g|0)==(c[ac+16>>2]|0)){b5[c[(c[ac>>2]|0)+40>>2]&511](ac)|0;s=bi;t=bj;ah=bk;ae=bm;$=bn;ag=bo;ab=a8;continue}else{c[af>>2]=g+1;s=bi;t=bj;ah=bk;ae=bm;$=bn;ag=bo;ab=a8;continue}}if((ae|0)==(ah|0)|(s|0)==0){bu=t;bv=ah;bw=ae;by=$}else{if((ah|0)==(t|0)){ab=ah-ae|0;g=ab>>>0<2147483647>>>0?ab<<1:-1;if(($|0)==484){bz=0}else{bz=ae}af=qJ(bz,g)|0;ac=af;if((af|0)==0){am=339;break L75}bA=ac+(g>>>2<<2)|0;bB=ac+(ab>>2<<2)|0;bC=ac;bD=250}else{bA=t;bB=ah;bC=ae;bD=$}c[bB>>2]=s;bu=bA;bv=bB+4|0;bw=bC;by=bD}if((T|0)>0){ac=c[C>>2]|0;do{if((ac|0)==0){bE=0}else{if((c[ac+12>>2]|0)!=(c[ac+16>>2]|0)){bE=ac;break}if((b5[c[(c[ac>>2]|0)+36>>2]&511](ac)|0)==-1){c[C>>2]=0;bE=0;break}else{bE=c[C>>2]|0;break}}}while(0);ac=(bE|0)==0;do{if((a9|0)==0){am=355}else{if((c[a9+12>>2]|0)!=(c[a9+16>>2]|0)){if(ac){bF=a9;break}else{am=361;break L75}}if((b5[c[(c[a9>>2]|0)+36>>2]&511](a9)|0)==-1){am=355;break}if(ac){bF=a9}else{am=361;break L75}}}while(0);if((am|0)==355){am=0;if(ac){am=361;break L75}else{bF=0}}s=c[C>>2]|0;$=c[s+12>>2]|0;if(($|0)==(c[s+16>>2]|0)){bG=b5[c[(c[s>>2]|0)+36>>2]&511](s)|0}else{bG=d[$]|0}if((bG<<24>>24|0)!=(aj|0)){am=361;break L75}$=c[C>>2]|0;s=$+12|0;ae=c[s>>2]|0;if((ae|0)==(c[$+16>>2]|0)){b5[c[(c[$>>2]|0)+40>>2]&511]($)|0;bH=ag;bI=bF;bJ=T;bK=bF}else{c[s>>2]=ae+1;bH=ag;bI=bF;bJ=T;bK=bF}while(1){ae=c[C>>2]|0;do{if((ae|0)==0){bL=0}else{if((c[ae+12>>2]|0)!=(c[ae+16>>2]|0)){bL=ae;break}if((b5[c[(c[ae>>2]|0)+36>>2]&511](ae)|0)==-1){c[C>>2]=0;bL=0;break}else{bL=c[C>>2]|0;break}}}while(0);ae=(bL|0)==0;do{if((bI|0)==0){bM=bK;am=376}else{if((c[bI+12>>2]|0)!=(c[bI+16>>2]|0)){if(ae){bN=bI;bO=bK;break}else{am=384;break L75}}if((b5[c[(c[bI>>2]|0)+36>>2]&511](bI)|0)==-1){bM=0;am=376;break}if(ae){bN=bI;bO=bK}else{am=384;break L75}}}while(0);if((am|0)==376){am=0;if(ae){am=384;break L75}else{bN=0;bO=bM}}aa=c[C>>2]|0;s=c[aa+12>>2]|0;if((s|0)==(c[aa+16>>2]|0)){bP=b5[c[(c[aa>>2]|0)+36>>2]&511](aa)|0}else{bP=d[s]|0}s=bP<<24>>24;if((bx(s|0)|0)==0){am=384;break L75}if((b[(c[e>>2]|0)+(s<<1)>>1]&2048)==0){am=384;break L75}s=c[o>>2]|0;if((s|0)==(bH|0)){aa=(c[V>>2]|0)!=484;$=c[_>>2]|0;ah=bH-$|0;t=ah>>>0<2147483647>>>0?ah<<1:-1;ab=qJ(aa?$:0,t)|0;if((ab|0)==0){am=387;break L75}do{if(aa){c[_>>2]=ab;bQ=ab}else{$=c[_>>2]|0;c[_>>2]=ab;if(($|0)==0){bQ=ab;break}b0[c[V>>2]&1023]($);bQ=c[_>>2]|0}}while(0);c[V>>2]=250;ab=bQ+ah|0;c[o>>2]=ab;bS=(c[_>>2]|0)+t|0;bT=ab}else{bS=bH;bT=s}ab=c[C>>2]|0;aa=c[ab+12>>2]|0;if((aa|0)==(c[ab+16>>2]|0)){ae=b5[c[(c[ab>>2]|0)+36>>2]&511](ab)|0;bU=ae;bV=c[o>>2]|0}else{bU=d[aa]|0;bV=bT}c[o>>2]=bV+1;a[bV]=bU;aa=bJ-1|0;ae=c[C>>2]|0;ab=ae+12|0;$=c[ab>>2]|0;if(($|0)==(c[ae+16>>2]|0)){b5[c[(c[ae>>2]|0)+40>>2]&511](ae)|0}else{c[ab>>2]=$+1}if((aa|0)>0){bH=bS;bI=bN;bJ=aa;bK=bO}else{bW=bS;bX=aa;bY=bO;break}}}else{bW=ag;bX=T;bY=a9}if((c[o>>2]|0)==(c[_>>2]|0)){am=405;break L75}else{aD=D;aE=bu;aF=bv;aG=bw;aH=by;aI=bW;aJ=bX;aK=bY}break};default:{aD=D;aE=O;aF=U;aG=w;aH=p;aI=ak;aJ=T;aK=an}}}while(0);L380:do{if((am|0)==157){am=0;if((v|0)==3){ao=p;ap=w;aq=U;ar=D;as=an;am=407;break L75}else{bZ=an;b_=an}while(1){f=c[C>>2]|0;do{if((f|0)==0){b$=0}else{if((c[f+12>>2]|0)!=(c[f+16>>2]|0)){b$=f;break}if((b5[c[(c[f>>2]|0)+36>>2]&511](f)|0)==-1){c[C>>2]=0;b$=0;break}else{b$=c[C>>2]|0;break}}}while(0);f=(b$|0)==0;do{if((bZ|0)==0){b2=b_;am=169}else{if((c[bZ+12>>2]|0)!=(c[bZ+16>>2]|0)){if(f){b3=bZ;b4=b_;break}else{aD=D;aE=O;aF=U;aG=w;aH=p;aI=ak;aJ=T;aK=b_;break L380}}if((b5[c[(c[bZ>>2]|0)+36>>2]&511](bZ)|0)==-1){b2=0;am=169;break}if(f){b3=bZ;b4=b_}else{aD=D;aE=O;aF=U;aG=w;aH=p;aI=ak;aJ=T;aK=b_;break L380}}}while(0);if((am|0)==169){am=0;if(f){aD=D;aE=O;aF=U;aG=w;aH=p;aI=ak;aJ=T;aK=b2;break L380}else{b3=0;b4=b2}}s=c[C>>2]|0;t=c[s+12>>2]|0;if((t|0)==(c[s+16>>2]|0)){b6=b5[c[(c[s>>2]|0)+36>>2]&511](s)|0}else{b6=d[t]|0}t=b6<<24>>24;if((bx(t|0)|0)==0){aD=D;aE=O;aF=U;aG=w;aH=p;aI=ak;aJ=T;aK=b4;break L380}if((b[(c[e>>2]|0)+(t<<1)>>1]&8192)==0){aD=D;aE=O;aF=U;aG=w;aH=p;aI=ak;aJ=T;aK=b4;break L380}t=c[C>>2]|0;s=t+12|0;ah=c[s>>2]|0;if((ah|0)==(c[t+16>>2]|0)){b7=b5[c[(c[t>>2]|0)+40>>2]&511](t)|0}else{c[s>>2]=ah+1;b7=d[ah]|0}ah=b7&255;s=a[S]|0;t=(s&1)==0;if(t){b9=(s&255)>>>1;ca=10;cb=s}else{s=c[n>>2]|0;b9=c[h>>2]|0;ca=(s&-2)-1|0;cb=s&255}do{if((b9|0)==(ca|0)){if((ca|0)==-17){am=185;break L75}s=(cb&1)==0?J:c[r>>2]|0;do{if(ca>>>0<2147483623>>>0){ac=ca+1|0;aa=ca<<1;$=ac>>>0<aa>>>0?aa:ac;if($>>>0<11>>>0){cc=11;break}cc=$+16&-16}else{cc=-17}}while(0);ad=(cc|0)==0?1:cc;while(1){cd=qH(ad)|0;if((cd|0)!=0){break}bd=(I=c[7664]|0,c[7664]=I+0,I);if((bd|0)==0){am=199;break L75}b8[bd&1]()}qQ(cd|0,s|0,ca)|0;if(!((ca|0)==10|(s|0)==0)){qI(s)}c[r>>2]=cd;c[n>>2]=cc|1;ce=cd;am=207}else{if(t){a[S]=(b9<<1)+2;cf=J;cg=b9+1|0;break}else{ce=c[r>>2]|0;am=207;break}}}while(0);if((am|0)==207){am=0;t=b9+1|0;c[h>>2]=t;cf=ce;cg=t}a[cf+b9|0]=ah;a[cf+cg|0]=0;bZ=b3;b_=b4}}}while(0);ag=v+1|0;if(ag>>>0<4>>>0){ak=aI;p=aH;w=aG;U=aF;O=aE;D=aD;v=ag;T=aJ;ai=aK}else{ao=aH;ap=aG;aq=aF;ar=aD;as=aK;am=407;break}}L440:do{if((am|0)==132){kF();return 0}else if((am|0)==146){aK=bR(4)|0;c[aK>>2]=3284;bl(aK|0,24120,94);return 0}else if((am|0)==156){c[k>>2]=c[k>>2]|4;ch=0;ci=w;cj=p}else if((am|0)==185){kF();return 0}else if((am|0)==199){aK=bR(4)|0;c[aK>>2]=3284;bl(aK|0,24120,94);return 0}else if((am|0)==248){c[k>>2]=c[k>>2]|4;ch=0;ci=w;cj=p}else if((am|0)==290){c[k>>2]=c[k>>2]|4;ch=0;ci=w;cj=p}else if((am|0)==312){aK=bR(4)|0;c[aK>>2]=3284;bl(aK|0,24120,94);return 0}else if((am|0)==327){aK=bR(4)|0;c[aK>>2]=3284;bl(aK|0,24120,94);return 0}else if((am|0)==339){aK=bR(4)|0;c[aK>>2]=3284;bl(aK|0,24120,94);return 0}else if((am|0)==361){c[k>>2]=c[k>>2]|4;ch=0;ci=bw;cj=by}else if((am|0)==384){c[k>>2]=c[k>>2]|4;ch=0;ci=bw;cj=by}else if((am|0)==387){aK=bR(4)|0;c[aK>>2]=3284;bl(aK|0,24120,94);return 0}else if((am|0)==405){c[k>>2]=c[k>>2]|4;ch=0;ci=bw;cj=by}else if((am|0)==407){L464:do{if((ar|0)!=0){aK=ar;aD=ar+1|0;aF=ar+8|0;aG=ar+4|0;aH=1;ai=as;L466:while(1){aJ=d[aK]|0;if((aJ&1|0)==0){ck=aJ>>>1}else{ck=c[aG>>2]|0}if(aH>>>0>=ck>>>0){break L464}aJ=c[C>>2]|0;do{if((aJ|0)==0){cl=0}else{if((c[aJ+12>>2]|0)!=(c[aJ+16>>2]|0)){cl=aJ;break}if((b5[c[(c[aJ>>2]|0)+36>>2]&511](aJ)|0)==-1){c[C>>2]=0;cl=0;break}else{cl=c[C>>2]|0;break}}}while(0);aJ=(cl|0)==0;do{if((ai|0)==0){am=424}else{if((c[ai+12>>2]|0)!=(c[ai+16>>2]|0)){if(aJ){cm=ai;break}else{break L466}}if((b5[c[(c[ai>>2]|0)+36>>2]&511](ai)|0)==-1){am=424;break}if(aJ){cm=ai}else{break L466}}}while(0);if((am|0)==424){am=0;if(aJ){break}else{cm=0}}ah=c[C>>2]|0;T=c[ah+12>>2]|0;if((T|0)==(c[ah+16>>2]|0)){cn=b5[c[(c[ah>>2]|0)+36>>2]&511](ah)|0}else{cn=d[T]|0}if((a[aK]&1)==0){co=aD}else{co=c[aF>>2]|0}if((cn<<24>>24|0)!=(a[co+aH|0]|0)){break}T=aH+1|0;ah=c[C>>2]|0;v=ah+12|0;D=c[v>>2]|0;if((D|0)==(c[ah+16>>2]|0)){b5[c[(c[ah>>2]|0)+40>>2]&511](ah)|0;aH=T;ai=cm;continue}else{c[v>>2]=D+1;aH=T;ai=cm;continue}}c[k>>2]=c[k>>2]|4;ch=0;ci=ap;cj=ao;break L440}}while(0);if((ap|0)==(aq|0)){ch=1;ci=aq;cj=ao;break}c[N>>2]=0;oc(G,ap,aq,N);if((c[N>>2]|0)==0){ch=1;ci=ap;cj=ao;break}c[k>>2]=c[k>>2]|4;ch=0;ci=ap;cj=ao}}while(0);do{if((a[S]&1)!=0){ao=c[r>>2]|0;if((ao|0)==0){break}qI(ao)}}while(0);do{if((a[R]&1)!=0){r=c[B>>2]|0;if((r|0)==0){break}qI(r)}}while(0);do{if((a[Q]&1)!=0){B=c[X>>2]|0;if((B|0)==0){break}qI(B)}}while(0);do{if((a[P]&1)!=0){X=c[E>>2]|0;if((X|0)==0){break}qI(X)}}while(0);do{if((a[H]&1)!=0){E=c[G+8>>2]|0;if((E|0)==0){break}qI(E)}}while(0);if((ci|0)==0){i=q;return ch|0}b0[cj&1023](ci);i=q;return ch|0}function oa(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0;b=bR(8)|0;c[b>>2]=3332;d=b+4|0;e=d;if((d|0)==0){bl(b|0,24144,216)}d=qR(a|0)|0;f=d+13|0;g=(f|0)==0?1:f;while(1){h=qH(g)|0;if((h|0)!=0){i=17;break}f=(I=c[7664]|0,c[7664]=I+0,I);if((f|0)==0){i=11;break}b8[f&1]()}if((i|0)==11){g=bR(4)|0;c[g>>2]=3284;bl(g|0,24120,94)}else if((i|0)==17){c[h+4>>2]=d;c[h>>2]=d;i=h+12|0;c[e>>2]=i;c[h+8>>2]=0;qQ(i|0,a|0,d+1|0)|0;bl(b|0,24144,216)}}function ob(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0;d=i;i=i+128|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=d|0;m=d+12|0;n=d+112|0;o=d+120|0;p=d+124|0;q=n|0;c[q>>2]=m;r=n+4|0;c[r>>2]=484;s=m+100|0;m=c[h+28>>2]|0;t=m;u=m+4|0;I=c[u>>2]|0,c[u>>2]=I+1,I;if((c[7545]|0)!=-1){c[l>>2]=30180;c[l+4>>2]=48;c[l+8>>2]=0;kE(30180,l)}l=(c[7546]|0)-1|0;u=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-u>>2>>>0>l>>>0){v=c[u+(l<<2)>>2]|0;if((v|0)==0){break}w=v;a[p]=0;x=f|0;y=c[x>>2]|0;do{if(n9(e,y,g,t,c[h+4>>2]|0,j,p,w,n,o,s)|0){z=k;if((a[z]&1)==0){a[k+1|0]=0;a[z]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}A=v;if((a[p]&1)!=0){B=b2[c[(c[A>>2]|0)+28>>2]&127](w,45)|0;C=a[z]|0;D=C&1;if(D<<24>>24==0){E=(C&255)>>>1;F=10}else{E=c[k+4>>2]|0;F=(c[k>>2]&-2)-1|0}if((E|0)==(F|0)){kM(k,F,1,F,F,0);G=a[z]&1}else{G=D}if(G<<24>>24==1){D=c[k+8>>2]|0;C=E+1|0;c[k+4>>2]=C;H=D;J=C}else{a[z]=(E<<1)+2;H=k+1|0;J=E+1|0}a[H+E|0]=B;a[H+J|0]=0}B=b2[c[(c[A>>2]|0)+28>>2]&127](w,48)|0;A=c[o>>2]|0;C=A-1|0;D=c[q>>2]|0;while(1){if(D>>>0>=C>>>0){break}if((a[D]|0)==B<<24>>24){D=D+1|0}else{break}}B=D;C=a[z]|0;K=C&255;if((K&1|0)==0){L=K>>>1}else{L=c[k+4>>2]|0}if((C&1)==0){M=10;N=C}else{C=c[k>>2]|0;M=(C&-2)-1|0;N=C&255}C=A-B|0;if((A|0)==(D|0)){break}if((M-L|0)>>>0<C>>>0){kM(k,M,L+C-M|0,L,L,0);O=a[z]|0}else{O=N}if((O&1)==0){P=k+1|0}else{P=c[k+8>>2]|0}K=A+(L-B)|0;B=D;Q=P+L|0;while(1){a[Q]=a[B]|0;R=B+1|0;if((R|0)==(A|0)){break}B=R;Q=Q+1|0}a[P+K|0]=0;Q=L+C|0;if((a[z]&1)==0){a[z]=Q<<1;break}else{c[k+4>>2]=Q;break}}}while(0);w=e|0;v=c[w>>2]|0;do{if((v|0)==0){S=0}else{if((c[v+12>>2]|0)!=(c[v+16>>2]|0)){S=v;break}if((b5[c[(c[v>>2]|0)+36>>2]&511](v)|0)!=-1){S=v;break}c[w>>2]=0;S=0}}while(0);w=(S|0)==0;do{if((y|0)==0){T=57}else{if((c[y+12>>2]|0)!=(c[y+16>>2]|0)){if(w){break}else{T=59;break}}if((b5[c[(c[y>>2]|0)+36>>2]&511](y)|0)==-1){c[x>>2]=0;T=57;break}else{if(w){break}else{T=59;break}}}}while(0);if((T|0)==57){if(w){T=59}}if((T|0)==59){c[j>>2]=c[j>>2]|2}c[b>>2]=S;x=m+4|0;if(((I=c[x>>2]|0,c[x>>2]=I+ -1,I)|0)==0){b0[c[(c[m>>2]|0)+8>>2]&1023](m)}x=c[q>>2]|0;c[q>>2]=0;if((x|0)==0){i=d;return}b0[c[r>>2]&1023](x);i=d;return}}while(0);d=bR(4)|0;c[d>>2]=3308;bl(d|0,24132,322)}function oc(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=b;h=b;i=a[h]|0;j=i&255;if((j&1|0)==0){k=j>>>1}else{k=c[b+4>>2]|0}if((k|0)==0){return}do{if((d|0)==(e|0)){l=i}else{k=e-4|0;if(k>>>0>d>>>0){m=d;n=k}else{l=i;break}do{k=c[m>>2]|0;c[m>>2]=c[n>>2];c[n>>2]=k;m=m+4|0;n=n-4|0;}while(m>>>0<n>>>0);l=a[h]|0}}while(0);if((l&1)==0){o=g+1|0}else{o=c[b+8>>2]|0}g=l&255;if((g&1|0)==0){p=g>>>1}else{p=c[b+4>>2]|0}b=e-4|0;e=a[o]|0;g=e<<24>>24;l=e<<24>>24<1|e<<24>>24==127;L22:do{if(b>>>0>d>>>0){e=o+p|0;h=o;n=d;m=g;i=l;while(1){if(!i){if((m|0)!=(c[n>>2]|0)){break}}k=(e-h|0)>1?h+1|0:h;j=n+4|0;q=a[k]|0;r=q<<24>>24;s=q<<24>>24<1|q<<24>>24==127;if(j>>>0<b>>>0){h=k;n=j;m=r;i=s}else{t=r;u=s;break L22}}c[f>>2]=4;return}else{t=g;u=l}}while(0);if(u){return}u=c[b>>2]|0;if(!(t>>>0<u>>>0|(u|0)==0)){return}c[f>>2]=4;return}function od(a){a=a|0;if((a|0)==0){return}qI(a);return}function oe(a){a=a|0;return}function of(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;d=i;i=i+568|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=d|0;m=d+12|0;n=d+412|0;o=d+420|0;p=d+424|0;q=d+428|0;r=d+468|0;s=n|0;c[s>>2]=m;t=n+4|0;c[t>>2]=484;u=m+400|0;m=c[h+28>>2]|0;v=m;w=m+4|0;I=c[w>>2]|0,c[w>>2]=I+1,I;if((c[7543]|0)!=-1){c[l>>2]=30172;c[l+4>>2]=48;c[l+8>>2]=0;kE(30172,l)}l=(c[7544]|0)-1|0;w=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-w>>2>>>0>l>>>0){x=c[w+(l<<2)>>2]|0;if((x|0)==0){break}y=x;a[p]=0;z=f|0;do{if(og(e,c[z>>2]|0,g,v,c[h+4>>2]|0,j,p,y,n,o,u)|0){A=q|0;cd[c[(c[x>>2]|0)+48>>2]&15](y,2992,3002,A)|0;B=r|0;C=c[o>>2]|0;D=c[s>>2]|0;E=C-D|0;do{if((E|0)>392){F=qH((E>>2)+2|0)|0;if((F|0)!=0){G=F;H=F;break}F=bR(4)|0;c[F>>2]=3284;bl(F|0,24120,94)}else{G=B;H=0}}while(0);if((a[p]&1)==0){J=G}else{a[G]=45;J=G+1|0}if(D>>>0<C>>>0){E=q+40|0;F=q;K=J;L=D;while(1){M=A;while(1){if((M|0)==(E|0)){N=E;break}if((c[M>>2]|0)==(c[L>>2]|0)){N=M;break}else{M=M+4|0}}a[K]=a[2992+(N-F>>2)|0]|0;M=L+4|0;O=K+1|0;if(M>>>0<(c[o>>2]|0)>>>0){K=O;L=M}else{P=O;break}}}else{P=J}a[P]=0;L=bI(B|0,1416,(K=i,i=i+4|0,c[K>>2]=k,K)|0)|0;i=K;if((L|0)==1){if((H|0)==0){break}qI(H);break}L=bR(8)|0;c[L>>2]=3332;K=L+4|0;F=K;do{if((K|0)!=0){while(1){Q=qH(28)|0;if((Q|0)!=0){R=42;break}E=(I=c[7664]|0,c[7664]=I+0,I);if((E|0)==0){break}b8[E&1]()}if((R|0)==42){c[Q+4>>2]=15;c[Q>>2]=15;E=Q+12|0;c[F>>2]=E;c[Q+8>>2]=0;qQ(E|0,1372,16)|0;break}E=bR(4)|0;c[E>>2]=3284;bl(E|0,24120,94)}}while(0);bl(L|0,24144,216)}}while(0);y=e|0;x=c[y>>2]|0;do{if((x|0)==0){S=0}else{F=c[x+12>>2]|0;if((F|0)==(c[x+16>>2]|0)){T=b5[c[(c[x>>2]|0)+36>>2]&511](x)|0}else{T=c[F>>2]|0}if((T|0)!=-1){S=x;break}c[y>>2]=0;S=0}}while(0);y=(S|0)==0;x=c[z>>2]|0;do{if((x|0)==0){R=61}else{F=c[x+12>>2]|0;if((F|0)==(c[x+16>>2]|0)){U=b5[c[(c[x>>2]|0)+36>>2]&511](x)|0}else{U=c[F>>2]|0}if((U|0)==-1){c[z>>2]=0;R=61;break}else{if(y){break}else{R=63;break}}}}while(0);if((R|0)==61){if(y){R=63}}if((R|0)==63){c[j>>2]=c[j>>2]|2}c[b>>2]=S;z=m+4|0;if(((I=c[z>>2]|0,c[z>>2]=I+ -1,I)|0)==0){b0[c[(c[m>>2]|0)+8>>2]&1023](m)}z=c[s>>2]|0;c[s>>2]=0;if((z|0)==0){i=d;return}b0[c[t>>2]&1023](z);i=d;return}}while(0);d=bR(4)|0;c[d>>2]=3308;bl(d|0,24132,322)}function og(b,e,f,g,h,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bL=0,bM=0,bN=0,bO=0,bP=0,bQ=0,bS=0,bT=0,bU=0,bV=0,bW=0,bX=0,bY=0,bZ=0,b_=0,b$=0,b2=0,b4=0,b6=0,b7=0,b8=0,b9=0,ca=0,cb=0,cc=0,cd=0,ce=0,cf=0;p=i;i=i+536|0;q=p|0;r=p+12|0;s=p+24|0;t=p+28|0;u=p+40|0;v=p+52|0;w=p+64|0;x=p+76|0;y=p+80|0;z=p+92|0;A=p+104|0;B=p+116|0;C=p+128|0;D=p+132|0;E=p+532|0;F=E;G=i;i=i+12|0;H=G;I=i;i=i+12|0;J=i;i=i+12|0;K=i;i=i+12|0;L=i;i=i+12|0;M=i;i=i+4|0;c[C>>2]=o;o=D|0;qP(H|0,0,12)|0;N=I;O=J;P=K;Q=L;qP(N|0,0,12)|0;qP(O|0,0,12)|0;qP(P|0,0,12)|0;qP(Q|0,0,12)|0;R=t;S=u;T=v;U=w;V=y;W=z;X=A;Y=B;L1:do{if(f){Z=s;if((c[7655]|0)!=-1){c[r>>2]=30620;c[r+4>>2]=48;c[r+8>>2]=0;kE(30620,r)}_=(c[7656]|0)-1|0;$=c[g+8>>2]|0;do{if((c[g+12>>2]|0)-$>>2>>>0>_>>>0){aa=c[$+(_<<2)>>2]|0;if((aa|0)==0){break}ab=aa;b1[c[(c[aa>>2]|0)+44>>2]&255](Z,ab);c[E>>2]=c[s>>2];ac=aa;b1[c[(c[ac>>2]|0)+32>>2]&255](t,ab);if((a[P]&1)==0){c[K+4>>2]=0;a[P]=0}else{c[c[K+8>>2]>>2]=0;c[K+4>>2]=0}kP(K);c[P>>2]=c[R>>2];c[P+4>>2]=c[R+4>>2];c[P+8>>2]=c[R+8>>2];qP(R|0,0,12)|0;b1[c[(c[ac>>2]|0)+28>>2]&255](u,ab);if((a[O]&1)==0){c[J+4>>2]=0;a[O]=0}else{c[c[J+8>>2]>>2]=0;c[J+4>>2]=0}kP(J);c[O>>2]=c[S>>2];c[O+4>>2]=c[S+4>>2];c[O+8>>2]=c[S+8>>2];qP(S|0,0,12)|0;ad=aa;ae=b5[c[(c[ad>>2]|0)+12>>2]&511](ab)|0;af=b5[c[(c[ad>>2]|0)+16>>2]&511](ab)|0;b1[c[(c[aa>>2]|0)+20>>2]&255](v,ab);if((a[H]&1)==0){a[G+1|0]=0;a[H]=0}else{a[c[G+8>>2]|0]=0;c[G+4>>2]=0}kJ(G);c[H>>2]=c[T>>2];c[H+4>>2]=c[T+4>>2];c[H+8>>2]=c[T+8>>2];qP(T|0,0,12)|0;b1[c[(c[ac>>2]|0)+24>>2]&255](w,ab);if((a[N]&1)==0){c[I+4>>2]=0;a[N]=0}else{c[c[I+8>>2]>>2]=0;c[I+4>>2]=0}kP(I);c[N>>2]=c[U>>2];c[N+4>>2]=c[U+4>>2];c[N+8>>2]=c[U+8>>2];qP(U|0,0,12)|0;ag=b5[c[(c[ad>>2]|0)+36>>2]&511](ab)|0;ah=af;ai=ae;break L1}}while(0);Z=bR(4)|0;c[Z>>2]=3308;bl(Z|0,24132,322);return 0}else{Z=x;if((c[7657]|0)!=-1){c[q>>2]=30628;c[q+4>>2]=48;c[q+8>>2]=0;kE(30628,q)}_=(c[7658]|0)-1|0;$=c[g+8>>2]|0;do{if((c[g+12>>2]|0)-$>>2>>>0>_>>>0){ae=c[$+(_<<2)>>2]|0;if((ae|0)==0){break}af=ae;b1[c[(c[ae>>2]|0)+44>>2]&255](Z,af);c[E>>2]=c[x>>2];ab=ae;b1[c[(c[ab>>2]|0)+32>>2]&255](y,af);if((a[P]&1)==0){c[K+4>>2]=0;a[P]=0}else{c[c[K+8>>2]>>2]=0;c[K+4>>2]=0}kP(K);c[P>>2]=c[V>>2];c[P+4>>2]=c[V+4>>2];c[P+8>>2]=c[V+8>>2];qP(V|0,0,12)|0;b1[c[(c[ab>>2]|0)+28>>2]&255](z,af);if((a[O]&1)==0){c[J+4>>2]=0;a[O]=0}else{c[c[J+8>>2]>>2]=0;c[J+4>>2]=0}kP(J);c[O>>2]=c[W>>2];c[O+4>>2]=c[W+4>>2];c[O+8>>2]=c[W+8>>2];qP(W|0,0,12)|0;ad=ae;ac=b5[c[(c[ad>>2]|0)+12>>2]&511](af)|0;aa=b5[c[(c[ad>>2]|0)+16>>2]&511](af)|0;b1[c[(c[ae>>2]|0)+20>>2]&255](A,af);if((a[H]&1)==0){a[G+1|0]=0;a[H]=0}else{a[c[G+8>>2]|0]=0;c[G+4>>2]=0}kJ(G);c[H>>2]=c[X>>2];c[H+4>>2]=c[X+4>>2];c[H+8>>2]=c[X+8>>2];qP(X|0,0,12)|0;b1[c[(c[ab>>2]|0)+24>>2]&255](B,af);if((a[N]&1)==0){c[I+4>>2]=0;a[N]=0}else{c[c[I+8>>2]>>2]=0;c[I+4>>2]=0}kP(I);c[N>>2]=c[Y>>2];c[N+4>>2]=c[Y+4>>2];c[N+8>>2]=c[Y+8>>2];qP(Y|0,0,12)|0;ag=b5[c[(c[ad>>2]|0)+36>>2]&511](af)|0;ah=aa;ai=ac;break L1}}while(0);Z=bR(4)|0;c[Z>>2]=3308;bl(Z|0,24132,322);return 0}}while(0);Y=m|0;c[n>>2]=c[Y>>2];B=b|0;b=l;X=K+4|0;A=K+8|0;W=J+4|0;z=J+8|0;V=(h&512|0)!=0;h=I+4|0;y=I+8|0;I=L+4|0;x=L+8|0;E=F+3|0;g=G+4|0;q=L|0;U=484;w=o;T=o;o=D+400|0;D=0;v=0;S=ag;ag=e;L75:while(1){e=c[B>>2]|0;do{if((e|0)==0){aj=1}else{u=c[e+12>>2]|0;if((u|0)==(c[e+16>>2]|0)){ak=b5[c[(c[e>>2]|0)+36>>2]&511](e)|0}else{ak=c[u>>2]|0}if((ak|0)==-1){c[B>>2]=0;aj=1;break}else{aj=(c[B>>2]|0)==0;break}}}while(0);do{if((ag|0)==0){al=83}else{e=c[ag+12>>2]|0;if((e|0)==(c[ag+16>>2]|0)){am=b5[c[(c[ag>>2]|0)+36>>2]&511](ag)|0}else{am=c[e>>2]|0}if((am|0)==-1){al=83;break}if(aj){an=ag}else{ao=U;ap=w;aq=T;ar=D;as=ag;al=348;break L75}}}while(0);if((al|0)==83){al=0;if(aj){ao=U;ap=w;aq=T;ar=D;as=0;al=348;break}else{an=0}}L97:do{switch(a[F+v|0]|0){case 3:{e=a[O]|0;u=e&255;R=(u&1|0)==0?u>>>1:c[W>>2]|0;u=a[P]|0;t=u&255;s=(t&1|0)==0?t>>>1:c[X>>2]|0;if((R|0)==(-s|0)){at=D;au=o;av=T;aw=w;ax=U;ay=S;az=an;break L97}t=(R|0)==0;R=c[B>>2]|0;r=c[R+12>>2]|0;f=c[R+16>>2]|0;Z=(r|0)==(f|0);if(!(t|(s|0)==0)){if(Z){s=b5[c[(c[R>>2]|0)+36>>2]&511](R)|0;_=c[B>>2]|0;aA=s;aB=a[O]|0;aC=_;aD=c[_+12>>2]|0;aE=c[_+16>>2]|0}else{aA=c[r>>2]|0;aB=e;aC=R;aD=r;aE=f}f=aC+12|0;_=(aD|0)==(aE|0);if((aA|0)==(c[((aB&1)==0?W:c[z>>2]|0)>>2]|0)){if(_){b5[c[(c[aC>>2]|0)+40>>2]&511](aC)|0}else{c[f>>2]=aD+4}f=d[O]|0;at=((f&1|0)==0?f>>>1:c[W>>2]|0)>>>0>1>>>0?J:D;au=o;av=T;aw=w;ax=U;ay=S;az=an;break L97}if(_){aF=b5[c[(c[aC>>2]|0)+36>>2]&511](aC)|0}else{aF=c[aD>>2]|0}if((aF|0)!=(c[((a[P]&1)==0?X:c[A>>2]|0)>>2]|0)){al=206;break L75}_=c[B>>2]|0;f=_+12|0;s=c[f>>2]|0;if((s|0)==(c[_+16>>2]|0)){b5[c[(c[_>>2]|0)+40>>2]&511](_)|0}else{c[f>>2]=s+4}a[k]=1;s=d[P]|0;at=((s&1|0)==0?s>>>1:c[X>>2]|0)>>>0>1>>>0?K:D;au=o;av=T;aw=w;ax=U;ay=S;az=an;break L97}if(t){if(Z){t=b5[c[(c[R>>2]|0)+36>>2]&511](R)|0;aG=t;aH=a[P]|0}else{aG=c[r>>2]|0;aH=u}if((aG|0)!=(c[((aH&1)==0?X:c[A>>2]|0)>>2]|0)){at=D;au=o;av=T;aw=w;ax=U;ay=S;az=an;break L97}u=c[B>>2]|0;t=u+12|0;s=c[t>>2]|0;if((s|0)==(c[u+16>>2]|0)){b5[c[(c[u>>2]|0)+40>>2]&511](u)|0}else{c[t>>2]=s+4}a[k]=1;s=d[P]|0;at=((s&1|0)==0?s>>>1:c[X>>2]|0)>>>0>1>>>0?K:D;au=o;av=T;aw=w;ax=U;ay=S;az=an;break L97}if(Z){Z=b5[c[(c[R>>2]|0)+36>>2]&511](R)|0;aI=Z;aJ=a[O]|0}else{aI=c[r>>2]|0;aJ=e}if((aI|0)!=(c[((aJ&1)==0?W:c[z>>2]|0)>>2]|0)){a[k]=1;at=D;au=o;av=T;aw=w;ax=U;ay=S;az=an;break L97}e=c[B>>2]|0;r=e+12|0;Z=c[r>>2]|0;if((Z|0)==(c[e+16>>2]|0)){b5[c[(c[e>>2]|0)+40>>2]&511](e)|0}else{c[r>>2]=Z+4}Z=d[O]|0;at=((Z&1|0)==0?Z>>>1:c[W>>2]|0)>>>0>1>>>0?J:D;au=o;av=T;aw=w;ax=U;ay=S;az=an;break};case 2:{if(!((D|0)!=0|v>>>0<2>>>0)){if((v|0)==2){aK=(a[E]|0)!=0}else{aK=0}if(!(V|aK)){at=0;au=o;av=T;aw=w;ax=U;ay=S;az=an;break L97}}Z=a[N]|0;r=c[y>>2]|0;e=(Z&1)==0?h:r;L156:do{if((v|0)==0){aL=e;aM=Z;aN=r}else{if((d[F+(v-1)|0]|0)>>>0>=2>>>0){aL=e;aM=Z;aN=r;break}R=Z&255;L159:do{if((((R&1|0)==0?R>>>1:c[h>>2]|0)|0)==0){aO=Z;aP=e;aQ=r}else{s=e;while(1){if(!(b3[c[(c[b>>2]|0)+12>>2]&63](l,8192,c[s>>2]|0)|0)){break}t=s+4|0;u=a[N]|0;f=c[y>>2]|0;_=u&255;if((t|0)==(((u&1)==0?h:f)+(((_&1|0)==0?_>>>1:c[h>>2]|0)<<2)|0)){aO=u;aP=t;aQ=f;break L159}else{s=t}}aO=a[N]|0;aP=s;aQ=c[y>>2]|0}}while(0);R=(aO&1)==0?h:aQ;t=aP-R>>2;f=a[Q]|0;u=f&255;_=(u&1|0)==0?u>>>1:c[I>>2]|0;if(t>>>0>_>>>0){aL=R;aM=aO;aN=aQ;break}u=(f&1)==0?I:c[x>>2]|0;f=u+(_<<2)|0;if((t|0)==0){aL=aP;aM=aO;aN=aQ;break}$=u+(_-t<<2)|0;t=R;while(1){if((c[$>>2]|0)!=(c[t>>2]|0)){aL=R;aM=aO;aN=aQ;break L156}_=$+4|0;if((_|0)==(f|0)){aL=aP;aM=aO;aN=aQ;break}else{$=_;t=t+4|0}}}}while(0);e=aM&255;L172:do{if((aL|0)==(((aM&1)==0?h:aN)+(((e&1|0)==0?e>>>1:c[h>>2]|0)<<2)|0)){aR=aL;aS=an}else{r=an;Z=aL;t=an;while(1){$=c[B>>2]|0;do{if(($|0)==0){aT=1}else{f=c[$+12>>2]|0;if((f|0)==(c[$+16>>2]|0)){aU=b5[c[(c[$>>2]|0)+36>>2]&511]($)|0}else{aU=c[f>>2]|0}if((aU|0)==-1){c[B>>2]=0;aT=1;break}else{aT=(c[B>>2]|0)==0;break}}}while(0);do{if((r|0)==0){aV=t;al=236}else{$=c[r+12>>2]|0;if(($|0)==(c[r+16>>2]|0)){aW=b5[c[(c[r>>2]|0)+36>>2]&511](r)|0}else{aW=c[$>>2]|0}if((aW|0)==-1){aV=0;al=236;break}if(aT){aX=r;aY=t}else{aR=Z;aS=t;break L172}}}while(0);if((al|0)==236){al=0;if(aT){aR=Z;aS=aV;break L172}else{aX=0;aY=aV}}$=c[B>>2]|0;s=c[$+12>>2]|0;if((s|0)==(c[$+16>>2]|0)){aZ=b5[c[(c[$>>2]|0)+36>>2]&511]($)|0}else{aZ=c[s>>2]|0}if((aZ|0)!=(c[Z>>2]|0)){aR=Z;aS=aY;break L172}s=c[B>>2]|0;$=s+12|0;f=c[$>>2]|0;if((f|0)==(c[s+16>>2]|0)){b5[c[(c[s>>2]|0)+40>>2]&511](s)|0}else{c[$>>2]=f+4}f=Z+4|0;$=a[N]|0;s=$&255;if((f|0)==((($&1)==0?h:c[y>>2]|0)+(((s&1|0)==0?s>>>1:c[h>>2]|0)<<2)|0)){aR=f;aS=aY;break}else{r=aX;Z=f;t=aY}}}}while(0);if(!V){at=D;au=o;av=T;aw=w;ax=U;ay=S;az=aS;break L97}e=a[N]|0;t=e&255;if((aR|0)==(((e&1)==0?h:c[y>>2]|0)+(((t&1|0)==0?t>>>1:c[h>>2]|0)<<2)|0)){at=D;au=o;av=T;aw=w;ax=U;ay=S;az=aS}else{al=248;break L75}break};case 0:{al=134;break};case 4:{t=0;e=o;Z=T;r=w;f=U;s=an;L206:while(1){$=c[B>>2]|0;do{if(($|0)==0){a_=1}else{R=c[$+12>>2]|0;if((R|0)==(c[$+16>>2]|0)){a$=b5[c[(c[$>>2]|0)+36>>2]&511]($)|0}else{a$=c[R>>2]|0}if((a$|0)==-1){c[B>>2]=0;a_=1;break}else{a_=(c[B>>2]|0)==0;break}}}while(0);do{if((s|0)==0){al=261}else{$=c[s+12>>2]|0;if(($|0)==(c[s+16>>2]|0)){a0=b5[c[(c[s>>2]|0)+36>>2]&511](s)|0}else{a0=c[$>>2]|0}if((a0|0)==-1){al=261;break}if(a_){a1=s}else{a2=s;break L206}}}while(0);if((al|0)==261){al=0;if(a_){a2=0;break}else{a1=0}}$=c[B>>2]|0;R=c[$+12>>2]|0;if((R|0)==(c[$+16>>2]|0)){a3=b5[c[(c[$>>2]|0)+36>>2]&511]($)|0}else{a3=c[R>>2]|0}if(b3[c[(c[b>>2]|0)+12>>2]&63](l,2048,a3)|0){R=c[n>>2]|0;if((R|0)==(c[C>>2]|0)){oi(m,n,C);a4=c[n>>2]|0}else{a4=R}c[n>>2]=a4+4;c[a4>>2]=a3;a5=t+1|0;a6=e;a7=Z;a8=r;a9=f}else{R=d[H]|0;if(!((((((R&1|0)==0?R>>>1:c[g>>2]|0)|0)==0|(t|0)==0)^1)&(a3|0)==(ah|0))){a2=a1;break}if((Z|0)==(e|0)){R=Z-r|0;$=R>>>0<2147483647>>>0?R<<1:-1;if((f|0)==484){ba=0}else{ba=r}_=qJ(ba,$)|0;u=_;if((_|0)==0){al=277;break L75}bb=u+($>>>2<<2)|0;bc=u+(R>>2<<2)|0;bd=u;be=250}else{bb=e;bc=Z;bd=r;be=f}c[bc>>2]=t;a5=0;a6=bb;a7=bc+4|0;a8=bd;a9=be}u=c[B>>2]|0;R=u+12|0;$=c[R>>2]|0;if(($|0)==(c[u+16>>2]|0)){b5[c[(c[u>>2]|0)+40>>2]&511](u)|0;t=a5;e=a6;Z=a7;r=a8;f=a9;s=a1;continue}else{c[R>>2]=$+4;t=a5;e=a6;Z=a7;r=a8;f=a9;s=a1;continue}}if((r|0)==(Z|0)|(t|0)==0){bf=e;bg=Z;bh=r;bi=f}else{if((Z|0)==(e|0)){s=Z-r|0;$=s>>>0<2147483647>>>0?s<<1:-1;if((f|0)==484){bj=0}else{bj=r}R=qJ(bj,$)|0;u=R;if((R|0)==0){al=289;break L75}bk=u+($>>>2<<2)|0;bm=u+(s>>2<<2)|0;bn=u;bo=250}else{bk=e;bm=Z;bn=r;bo=f}c[bm>>2]=t;bf=bk;bg=bm+4|0;bh=bn;bi=bo}if((S|0)>0){u=c[B>>2]|0;do{if((u|0)==0){bp=1}else{s=c[u+12>>2]|0;if((s|0)==(c[u+16>>2]|0)){bq=b5[c[(c[u>>2]|0)+36>>2]&511](u)|0}else{bq=c[s>>2]|0}if((bq|0)==-1){c[B>>2]=0;bp=1;break}else{bp=(c[B>>2]|0)==0;break}}}while(0);do{if((a2|0)==0){al=306}else{u=c[a2+12>>2]|0;if((u|0)==(c[a2+16>>2]|0)){br=b5[c[(c[a2>>2]|0)+36>>2]&511](a2)|0}else{br=c[u>>2]|0}if((br|0)==-1){al=306;break}if(bp){bs=a2}else{al=312;break L75}}}while(0);if((al|0)==306){al=0;if(bp){al=312;break L75}else{bs=0}}u=c[B>>2]|0;t=c[u+12>>2]|0;if((t|0)==(c[u+16>>2]|0)){bt=b5[c[(c[u>>2]|0)+36>>2]&511](u)|0}else{bt=c[t>>2]|0}if((bt|0)!=(ai|0)){al=312;break L75}t=c[B>>2]|0;u=t+12|0;f=c[u>>2]|0;if((f|0)==(c[t+16>>2]|0)){b5[c[(c[t>>2]|0)+40>>2]&511](t)|0;bu=bs;bv=S;bw=bs}else{c[u>>2]=f+4;bu=bs;bv=S;bw=bs}while(1){f=c[B>>2]|0;do{if((f|0)==0){bx=1}else{u=c[f+12>>2]|0;if((u|0)==(c[f+16>>2]|0)){by=b5[c[(c[f>>2]|0)+36>>2]&511](f)|0}else{by=c[u>>2]|0}if((by|0)==-1){c[B>>2]=0;bx=1;break}else{bx=(c[B>>2]|0)==0;break}}}while(0);do{if((bu|0)==0){bz=bw;al=328}else{f=c[bu+12>>2]|0;if((f|0)==(c[bu+16>>2]|0)){bA=b5[c[(c[bu>>2]|0)+36>>2]&511](bu)|0}else{bA=c[f>>2]|0}if((bA|0)==-1){bz=0;al=328;break}if(bx){bB=bu;bC=bw}else{al=335;break L75}}}while(0);if((al|0)==328){al=0;if(bx){al=335;break L75}else{bB=0;bC=bz}}f=c[B>>2]|0;u=c[f+12>>2]|0;if((u|0)==(c[f+16>>2]|0)){bD=b5[c[(c[f>>2]|0)+36>>2]&511](f)|0}else{bD=c[u>>2]|0}if(!(b3[c[(c[b>>2]|0)+12>>2]&63](l,2048,bD)|0)){al=335;break L75}if((c[n>>2]|0)==(c[C>>2]|0)){oi(m,n,C)}u=c[B>>2]|0;f=c[u+12>>2]|0;if((f|0)==(c[u+16>>2]|0)){bE=b5[c[(c[u>>2]|0)+36>>2]&511](u)|0}else{bE=c[f>>2]|0}f=c[n>>2]|0;c[n>>2]=f+4;c[f>>2]=bE;f=bv-1|0;u=c[B>>2]|0;t=u+12|0;r=c[t>>2]|0;if((r|0)==(c[u+16>>2]|0)){b5[c[(c[u>>2]|0)+40>>2]&511](u)|0}else{c[t>>2]=r+4}if((f|0)>0){bu=bB;bv=f;bw=bC}else{bF=f;bG=bC;break}}}else{bF=S;bG=a2}if((c[n>>2]|0)==(c[Y>>2]|0)){al=346;break L75}else{at=D;au=bf;av=bg;aw=bh;ax=bi;ay=bF;az=bG}break};case 1:{if((v|0)==3){ao=U;ap=w;aq=T;ar=D;as=an;al=348;break L75}f=c[B>>2]|0;r=c[f+12>>2]|0;if((r|0)==(c[f+16>>2]|0)){bH=b5[c[(c[f>>2]|0)+36>>2]&511](f)|0}else{bH=c[r>>2]|0}if(!(b3[c[(c[b>>2]|0)+12>>2]&63](l,8192,bH)|0)){al=133;break L75}r=c[B>>2]|0;f=r+12|0;t=c[f>>2]|0;if((t|0)==(c[r+16>>2]|0)){bI=b5[c[(c[r>>2]|0)+40>>2]&511](r)|0}else{c[f>>2]=t+4;bI=c[t>>2]|0}t=a[Q]|0;f=t&1;if(f<<24>>24==0){bJ=(t&255)>>>1;bK=1}else{bJ=c[I>>2]|0;bK=(c[q>>2]&-2)-1|0}if((bJ|0)==(bK|0)){kQ(L,bK,1,bK,bK,0,0);bL=a[Q]&1}else{bL=f}if(bL<<24>>24==1){f=c[x>>2]|0;t=bJ+1|0;c[I>>2]=t;bM=f;bN=t}else{a[Q]=(bJ<<1)+2;bM=I;bN=bJ+1|0}c[bM+(bJ<<2)>>2]=bI;c[bM+(bN<<2)>>2]=0;al=134;break};default:{at=D;au=o;av=T;aw=w;ax=U;ay=S;az=an}}}while(0);L357:do{if((al|0)==134){al=0;if((v|0)==3){ao=U;ap=w;aq=T;ar=D;as=an;al=348;break L75}else{bO=an;bP=an}while(1){t=c[B>>2]|0;do{if((t|0)==0){bQ=1}else{f=c[t+12>>2]|0;if((f|0)==(c[t+16>>2]|0)){bS=b5[c[(c[t>>2]|0)+36>>2]&511](t)|0}else{bS=c[f>>2]|0}if((bS|0)==-1){c[B>>2]=0;bQ=1;break}else{bQ=(c[B>>2]|0)==0;break}}}while(0);do{if((bO|0)==0){bT=bP;al=147}else{t=c[bO+12>>2]|0;if((t|0)==(c[bO+16>>2]|0)){bU=b5[c[(c[bO>>2]|0)+36>>2]&511](bO)|0}else{bU=c[t>>2]|0}if((bU|0)==-1){bT=0;al=147;break}if(bQ){bV=bO;bW=bP}else{at=D;au=o;av=T;aw=w;ax=U;ay=S;az=bP;break L357}}}while(0);if((al|0)==147){al=0;if(bQ){at=D;au=o;av=T;aw=w;ax=U;ay=S;az=bT;break L357}else{bV=0;bW=bT}}t=c[B>>2]|0;f=c[t+12>>2]|0;if((f|0)==(c[t+16>>2]|0)){bX=b5[c[(c[t>>2]|0)+36>>2]&511](t)|0}else{bX=c[f>>2]|0}if(!(b3[c[(c[b>>2]|0)+12>>2]&63](l,8192,bX)|0)){at=D;au=o;av=T;aw=w;ax=U;ay=S;az=bW;break L357}f=c[B>>2]|0;t=f+12|0;r=c[t>>2]|0;if((r|0)==(c[f+16>>2]|0)){bY=b5[c[(c[f>>2]|0)+40>>2]&511](f)|0}else{c[t>>2]=r+4;bY=c[r>>2]|0}r=a[Q]|0;t=r&1;if(t<<24>>24==0){bZ=(r&255)>>>1;b_=1}else{bZ=c[I>>2]|0;b_=(c[q>>2]&-2)-1|0}if((bZ|0)==(b_|0)){kQ(L,b_,1,b_,b_,0,0);b$=a[Q]&1}else{b$=t}if(b$<<24>>24==1){t=c[x>>2]|0;r=bZ+1|0;c[I>>2]=r;b2=t;b4=r}else{a[Q]=(bZ<<1)+2;b2=I;b4=bZ+1|0}c[b2+(bZ<<2)>>2]=bY;c[b2+(b4<<2)>>2]=0;bO=bV;bP=bW}}}while(0);r=v+1|0;if(r>>>0<4>>>0){U=ax;w=aw;T=av;o=au;D=at;v=r;S=ay;ag=az}else{ao=ax;ap=aw;aq=av;ar=at;as=az;al=348;break}}L404:do{if((al|0)==133){c[j>>2]=c[j>>2]|4;b6=0;b7=w;b8=U}else if((al|0)==277){az=bR(4)|0;c[az>>2]=3284;bl(az|0,24120,94);return 0}else if((al|0)==289){az=bR(4)|0;c[az>>2]=3284;bl(az|0,24120,94);return 0}else if((al|0)==312){c[j>>2]=c[j>>2]|4;b6=0;b7=bh;b8=bi}else if((al|0)==335){c[j>>2]=c[j>>2]|4;b6=0;b7=bh;b8=bi}else if((al|0)==346){c[j>>2]=c[j>>2]|4;b6=0;b7=bh;b8=bi}else if((al|0)==348){L414:do{if((ar|0)!=0){az=ar;at=ar+4|0;av=ar+8|0;aw=1;ax=as;L416:while(1){ag=d[az]|0;if((ag&1|0)==0){b9=ag>>>1}else{b9=c[at>>2]|0}if(aw>>>0>=b9>>>0){break L414}ag=c[B>>2]|0;do{if((ag|0)==0){ca=1}else{ay=c[ag+12>>2]|0;if((ay|0)==(c[ag+16>>2]|0)){cb=b5[c[(c[ag>>2]|0)+36>>2]&511](ag)|0}else{cb=c[ay>>2]|0}if((cb|0)==-1){c[B>>2]=0;ca=1;break}else{ca=(c[B>>2]|0)==0;break}}}while(0);do{if((ax|0)==0){al=366}else{ag=c[ax+12>>2]|0;if((ag|0)==(c[ax+16>>2]|0)){cc=b5[c[(c[ax>>2]|0)+36>>2]&511](ax)|0}else{cc=c[ag>>2]|0}if((cc|0)==-1){al=366;break}if(ca){cd=ax}else{break L416}}}while(0);if((al|0)==366){al=0;if(ca){break}else{cd=0}}ag=c[B>>2]|0;ay=c[ag+12>>2]|0;if((ay|0)==(c[ag+16>>2]|0)){ce=b5[c[(c[ag>>2]|0)+36>>2]&511](ag)|0}else{ce=c[ay>>2]|0}if((a[az]&1)==0){cf=at}else{cf=c[av>>2]|0}if((ce|0)!=(c[cf+(aw<<2)>>2]|0)){break}ay=aw+1|0;ag=c[B>>2]|0;S=ag+12|0;v=c[S>>2]|0;if((v|0)==(c[ag+16>>2]|0)){b5[c[(c[ag>>2]|0)+40>>2]&511](ag)|0;aw=ay;ax=cd;continue}else{c[S>>2]=v+4;aw=ay;ax=cd;continue}}c[j>>2]=c[j>>2]|4;b6=0;b7=ap;b8=ao;break L404}}while(0);if((ap|0)==(aq|0)){b6=1;b7=aq;b8=ao;break}c[M>>2]=0;oc(G,ap,aq,M);if((c[M>>2]|0)==0){b6=1;b7=ap;b8=ao;break}c[j>>2]=c[j>>2]|4;b6=0;b7=ap;b8=ao}else if((al|0)==206){c[j>>2]=c[j>>2]|4;b6=0;b7=w;b8=U}else if((al|0)==248){c[j>>2]=c[j>>2]|4;b6=0;b7=w;b8=U}}while(0);do{if((a[Q]&1)!=0){U=c[x>>2]|0;if((U|0)==0){break}qI(U)}}while(0);do{if((a[P]&1)!=0){x=c[A>>2]|0;if((x|0)==0){break}qI(x)}}while(0);do{if((a[O]&1)!=0){A=c[z>>2]|0;if((A|0)==0){break}qI(A)}}while(0);do{if((a[N]&1)!=0){z=c[y>>2]|0;if((z|0)==0){break}qI(z)}}while(0);do{if((a[H]&1)!=0){y=c[G+8>>2]|0;if((y|0)==0){break}qI(y)}}while(0);if((b7|0)==0){i=p;return b6|0}b0[b8&1023](b7);i=p;return b6|0}function oh(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;d=i;i=i+428|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=d|0;m=d+12|0;n=d+412|0;o=d+420|0;p=d+424|0;q=n|0;c[q>>2]=m;r=n+4|0;c[r>>2]=484;s=m+400|0;m=c[h+28>>2]|0;t=m;u=m+4|0;I=c[u>>2]|0,c[u>>2]=I+1,I;if((c[7543]|0)!=-1){c[l>>2]=30172;c[l+4>>2]=48;c[l+8>>2]=0;kE(30172,l)}l=(c[7544]|0)-1|0;u=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-u>>2>>>0>l>>>0){v=c[u+(l<<2)>>2]|0;if((v|0)==0){break}w=v;a[p]=0;x=f|0;y=c[x>>2]|0;do{if(og(e,y,g,t,c[h+4>>2]|0,j,p,w,n,o,s)|0){z=k;if((a[z]&1)==0){c[k+4>>2]=0;a[z]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}A=v;if((a[p]&1)!=0){B=b2[c[(c[A>>2]|0)+44>>2]&127](w,45)|0;C=a[z]|0;D=C&1;if(D<<24>>24==0){E=(C&255)>>>1;F=1}else{E=c[k+4>>2]|0;F=(c[k>>2]&-2)-1|0}if((E|0)==(F|0)){kQ(k,F,1,F,F,0,0);G=a[z]&1}else{G=D}if(G<<24>>24==1){D=c[k+8>>2]|0;C=E+1|0;c[k+4>>2]=C;H=D;J=C}else{a[z]=(E<<1)+2;H=k+4|0;J=E+1|0}c[H+(E<<2)>>2]=B;c[H+(J<<2)>>2]=0}B=b2[c[(c[A>>2]|0)+44>>2]&127](w,48)|0;A=c[o>>2]|0;C=A-4|0;D=c[q>>2]|0;while(1){if(D>>>0>=C>>>0){break}if((c[D>>2]|0)==(B|0)){D=D+4|0}else{break}}B=D;K=a[z]|0;L=K&255;if((L&1|0)==0){M=L>>>1}else{M=c[k+4>>2]|0}if((K&1)==0){N=1;O=K}else{K=c[k>>2]|0;N=(K&-2)-1|0;O=K&255}K=A-B>>2;if((K|0)==0){break}if((N-M|0)>>>0<K>>>0){kQ(k,N,M+K-N|0,M,M,0,0);P=a[z]|0}else{P=O}if((P&1)==0){Q=k+4|0}else{Q=c[k+8>>2]|0}L=Q+(M<<2)|0;if((D|0)==(A|0)){R=L}else{S=((C+(-B|0)|0)>>>2)+1|0;B=D;T=L;while(1){c[T>>2]=c[B>>2];L=B+4|0;if((L|0)==(A|0)){break}B=L;T=T+4|0}R=Q+(S+M<<2)|0}c[R>>2]=0;T=M+K|0;if((a[z]&1)==0){a[z]=T<<1;break}else{c[k+4>>2]=T;break}}}while(0);w=e|0;v=c[w>>2]|0;do{if((v|0)==0){U=0}else{T=c[v+12>>2]|0;if((T|0)==(c[v+16>>2]|0)){V=b5[c[(c[v>>2]|0)+36>>2]&511](v)|0}else{V=c[T>>2]|0}if((V|0)!=-1){U=v;break}c[w>>2]=0;U=0}}while(0);w=(U|0)==0;do{if((y|0)==0){W=60}else{v=c[y+12>>2]|0;if((v|0)==(c[y+16>>2]|0)){X=b5[c[(c[y>>2]|0)+36>>2]&511](y)|0}else{X=c[v>>2]|0}if((X|0)==-1){c[x>>2]=0;W=60;break}else{if(w){break}else{W=62;break}}}}while(0);if((W|0)==60){if(w){W=62}}if((W|0)==62){c[j>>2]=c[j>>2]|2}c[b>>2]=U;x=m+4|0;if(((I=c[x>>2]|0,c[x>>2]=I+ -1,I)|0)==0){b0[c[(c[m>>2]|0)+8>>2]&1023](m)}x=c[q>>2]|0;c[q>>2]=0;if((x|0)==0){i=d;return}b0[c[r>>2]&1023](x);i=d;return}}while(0);d=bR(4)|0;c[d>>2]=3308;bl(d|0,24132,322)}function oi(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a+4|0;f=(c[e>>2]|0)!=484;g=a|0;a=c[g>>2]|0;h=a;i=(c[d>>2]|0)-h|0;j=i>>>0<2147483647>>>0?i<<1:-1;i=(c[b>>2]|0)-h>>2;if(f){k=a}else{k=0}a=qJ(k,j)|0;k=a;if((a|0)==0){a=bR(4)|0;c[a>>2]=3284;bl(a|0,24120,94)}do{if(f){c[g>>2]=k;l=k}else{a=c[g>>2]|0;c[g>>2]=k;if((a|0)==0){l=k;break}b0[c[e>>2]&1023](a);l=c[g>>2]|0}}while(0);c[e>>2]=250;c[b>>2]=l+(i<<2);c[d>>2]=(c[g>>2]|0)+(j>>>2<<2);return}function oj(a){a=a|0;if((a|0)==0){return}qI(a);return}function ok(a){a=a|0;return}function ol(b,e,f,g,j,l,m){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;l=l|0;m=+m;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;e=i;i=i+240|0;n=f;f=i;i=i+4|0;c[f>>2]=c[n>>2];n=e|0;o=e+112|0;p=e+216|0;q=e+220|0;r=e+224|0;s=e+228|0;t=s;u=i;i=i+12|0;v=u;w=i;i=i+12|0;x=w;y=i;i=i+4|0;z=i;i=i+100|0;A=i;i=i+4|0;B=i;i=i+4|0;C=e+12|0;c[o>>2]=C;D=e+116|0;E=aZ(C|0,100,1364,(C=i,i=i+8|0,h[k>>3]=m,c[C>>2]=c[k>>2],c[C+4>>2]=c[k+4>>2],C)|0)|0;i=C;do{if(E>>>0>99>>>0){do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);F=mI(o,c[7204]|0,1364,(C=i,i=i+8|0,h[k>>3]=m,c[C>>2]=c[k>>2],c[C+4>>2]=c[k+4>>2],C)|0)|0;i=C;G=c[o>>2]|0;if((G|0)==0){H=bR(4)|0;c[H>>2]=3284;bl(H|0,24120,94)}H=qH(F)|0;if((H|0)!=0){J=H;K=F;L=G;M=H;break}H=bR(4)|0;c[H>>2]=3284;bl(H|0,24120,94)}else{J=D;K=E;L=0;M=0}}while(0);E=c[j+28>>2]|0;D=E;C=E+4|0;I=c[C>>2]|0,c[C>>2]=I+1,I;if((c[7545]|0)!=-1){c[n>>2]=30180;c[n+4>>2]=48;c[n+8>>2]=0;kE(30180,n)}n=(c[7546]|0)-1|0;C=c[E+8>>2]|0;do{if((c[E+12>>2]|0)-C>>2>>>0>n>>>0){H=c[C+(n<<2)>>2]|0;if((H|0)==0){break}G=H;F=c[o>>2]|0;cd[c[(c[H>>2]|0)+32>>2]&15](G,F,F+K|0,J)|0;if((K|0)==0){N=0}else{N=(a[c[o>>2]|0]|0)==45}qP(t|0,0,12)|0;qP(v|0,0,12)|0;qP(x|0,0,12)|0;om(g,N,D,p,q,r,s,u,w,y);F=z|0;H=c[y>>2]|0;if((K|0)>(H|0)){O=d[x]|0;if((O&1|0)==0){P=O>>>1}else{P=c[w+4>>2]|0}O=d[v]|0;if((O&1|0)==0){Q=O>>>1}else{Q=c[u+4>>2]|0}R=P+(K-H<<1|1)+Q|0}else{O=d[x]|0;if((O&1|0)==0){S=O>>>1}else{S=c[w+4>>2]|0}O=d[v]|0;if((O&1|0)==0){T=O>>>1}else{T=c[u+4>>2]|0}R=S+2+T|0}O=R+H|0;do{if(O>>>0>100>>>0){U=qH(O)|0;if((U|0)!=0){V=U;W=U;break}U=bR(4)|0;c[U>>2]=3284;bl(U|0,24120,94)}else{V=F;W=0}}while(0);on(V,A,B,c[j+4>>2]|0,J,J+K|0,G,N,p,a[q]|0,a[r]|0,s,u,w,H);mD(b,c[f>>2]|0,V,c[A>>2]|0,c[B>>2]|0,j,l);if((W|0)!=0){qI(W)}do{if((a[x]&1)!=0){F=c[w+8>>2]|0;if((F|0)==0){break}qI(F)}}while(0);do{if((a[v]&1)!=0){H=c[u+8>>2]|0;if((H|0)==0){break}qI(H)}}while(0);do{if((a[t]&1)!=0){H=c[s+8>>2]|0;if((H|0)==0){break}qI(H)}}while(0);H=E+4|0;if(((I=c[H>>2]|0,c[H>>2]=I+ -1,I)|0)==0){b0[c[(c[E>>2]|0)+8>>2]&1023](E)}if((M|0)!=0){qI(M)}if((L|0)==0){i=e;return}qI(L);i=e;return}}while(0);e=bR(4)|0;c[e>>2]=3308;bl(e|0,24132,322)}function om(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;n=i;i=i+28|0;o=n|0;p=n+12|0;q=n+24|0;r=q;s=i;i=i+12|0;t=s;u=i;i=i+4|0;v=u;w=i;i=i+12|0;x=w;y=i;i=i+12|0;z=y;A=i;i=i+12|0;B=A;D=i;i=i+4|0;E=D;F=i;i=i+12|0;G=F;H=i;i=i+4|0;I=H;J=i;i=i+12|0;K=J;L=i;i=i+12|0;M=L;N=i;i=i+12|0;O=N;if(b){if((c[7659]|0)!=-1){c[p>>2]=30636;c[p+4>>2]=48;c[p+8>>2]=0;kE(30636,p)}p=(c[7660]|0)-1|0;b=c[e+8>>2]|0;if((c[e+12>>2]|0)-b>>2>>>0<=p>>>0){P=bR(4)|0;Q=P;c[Q>>2]=3308;bl(P|0,24132,322)}R=c[b+(p<<2)>>2]|0;if((R|0)==0){P=bR(4)|0;Q=P;c[Q>>2]=3308;bl(P|0,24132,322)}P=R;Q=c[R>>2]|0;if(d){b1[c[Q+44>>2]&255](r,P);r=f;C=c[q>>2]|0;a[r]=C;C=C>>8;a[r+1|0]=C;C=C>>8;a[r+2|0]=C;C=C>>8;a[r+3|0]=C;b1[c[(c[R>>2]|0)+32>>2]&255](s,P);s=l;if((a[s]&1)==0){a[l+1|0]=0;a[s]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}kJ(l);c[s>>2]=c[t>>2];c[s+4>>2]=c[t+4>>2];c[s+8>>2]=c[t+8>>2];qP(t|0,0,12)|0}else{b1[c[Q+40>>2]&255](v,P);v=f;C=c[u>>2]|0;a[v]=C;C=C>>8;a[v+1|0]=C;C=C>>8;a[v+2|0]=C;C=C>>8;a[v+3|0]=C;b1[c[(c[R>>2]|0)+28>>2]&255](w,P);w=l;if((a[w]&1)==0){a[l+1|0]=0;a[w]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}kJ(l);c[w>>2]=c[x>>2];c[w+4>>2]=c[x+4>>2];c[w+8>>2]=c[x+8>>2];qP(x|0,0,12)|0}x=R;a[g]=b5[c[(c[x>>2]|0)+12>>2]&511](P)|0;a[h]=b5[c[(c[x>>2]|0)+16>>2]&511](P)|0;x=R;b1[c[(c[x>>2]|0)+20>>2]&255](y,P);y=j;if((a[y]&1)==0){a[j+1|0]=0;a[y]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}kJ(j);c[y>>2]=c[z>>2];c[y+4>>2]=c[z+4>>2];c[y+8>>2]=c[z+8>>2];qP(z|0,0,12)|0;b1[c[(c[x>>2]|0)+24>>2]&255](A,P);A=k;if((a[A]&1)==0){a[k+1|0]=0;a[A]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}kJ(k);c[A>>2]=c[B>>2];c[A+4>>2]=c[B+4>>2];c[A+8>>2]=c[B+8>>2];qP(B|0,0,12)|0;S=b5[c[(c[R>>2]|0)+36>>2]&511](P)|0;c[m>>2]=S;i=n;return}else{if((c[7661]|0)!=-1){c[o>>2]=30644;c[o+4>>2]=48;c[o+8>>2]=0;kE(30644,o)}o=(c[7662]|0)-1|0;P=c[e+8>>2]|0;if((c[e+12>>2]|0)-P>>2>>>0<=o>>>0){T=bR(4)|0;U=T;c[U>>2]=3308;bl(T|0,24132,322)}e=c[P+(o<<2)>>2]|0;if((e|0)==0){T=bR(4)|0;U=T;c[U>>2]=3308;bl(T|0,24132,322)}T=e;U=c[e>>2]|0;if(d){b1[c[U+44>>2]&255](E,T);E=f;C=c[D>>2]|0;a[E]=C;C=C>>8;a[E+1|0]=C;C=C>>8;a[E+2|0]=C;C=C>>8;a[E+3|0]=C;b1[c[(c[e>>2]|0)+32>>2]&255](F,T);F=l;if((a[F]&1)==0){a[l+1|0]=0;a[F]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}kJ(l);c[F>>2]=c[G>>2];c[F+4>>2]=c[G+4>>2];c[F+8>>2]=c[G+8>>2];qP(G|0,0,12)|0}else{b1[c[U+40>>2]&255](I,T);I=f;C=c[H>>2]|0;a[I]=C;C=C>>8;a[I+1|0]=C;C=C>>8;a[I+2|0]=C;C=C>>8;a[I+3|0]=C;b1[c[(c[e>>2]|0)+28>>2]&255](J,T);J=l;if((a[J]&1)==0){a[l+1|0]=0;a[J]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}kJ(l);c[J>>2]=c[K>>2];c[J+4>>2]=c[K+4>>2];c[J+8>>2]=c[K+8>>2];qP(K|0,0,12)|0}K=e;a[g]=b5[c[(c[K>>2]|0)+12>>2]&511](T)|0;a[h]=b5[c[(c[K>>2]|0)+16>>2]&511](T)|0;K=e;b1[c[(c[K>>2]|0)+20>>2]&255](L,T);L=j;if((a[L]&1)==0){a[j+1|0]=0;a[L]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}kJ(j);c[L>>2]=c[M>>2];c[L+4>>2]=c[M+4>>2];c[L+8>>2]=c[M+8>>2];qP(M|0,0,12)|0;b1[c[(c[K>>2]|0)+24>>2]&255](N,T);N=k;if((a[N]&1)==0){a[k+1|0]=0;a[N]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}kJ(k);c[N>>2]=c[O>>2];c[N+4>>2]=c[O+4>>2];c[N+8>>2]=c[O+8>>2];qP(O|0,0,12)|0;S=b5[c[(c[e>>2]|0)+36>>2]&511](T)|0;c[m>>2]=S;i=n;return}}function on(d,e,f,g,h,i,j,k,l,m,n,o,p,q,r){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;var s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0;c[f>>2]=d;s=j;t=q;u=q+1|0;v=q+8|0;w=q+4|0;q=p;x=(g&512|0)==0;y=p+1|0;z=p+4|0;A=p+8|0;p=j+8|0;B=(r|0)>0;C=o;D=o+1|0;E=o+8|0;F=o+4|0;o=-r|0;G=r-1|0;H=(G|0)>0;I=h;h=0;while(1){L3:do{switch(a[l+h|0]|0){case 4:{J=c[f>>2]|0;K=k?I+1|0:I;L=K;while(1){if(L>>>0>=i>>>0){break}M=a[L]|0;if(M<<24>>24<0){break}if((b[(c[p>>2]|0)+(M<<24>>24<<1)>>1]&2048)==0){break}else{L=L+1|0}}M=L;if(B){if(L>>>0>K>>>0){N=K+(-M|0)|0;M=N>>>0<o>>>0?o:N;N=M+r|0;O=L-1|0;P=a[O]|0;c[f>>2]=J+1;a[J]=P;if(O>>>0>K>>>0&H){P=O;O=G;while(1){Q=c[f>>2]|0;R=P-1|0;S=a[R]|0;c[f>>2]=Q+1;a[Q]=S;S=O-1|0;Q=(S|0)>0;if(R>>>0>K>>>0&Q){P=R;O=S}else{T=Q;break}}}else{T=H}O=L+M|0;if(T){U=N;V=O;W=34}else{X=0;Y=N;Z=O}}else{U=r;V=L;W=34}if((W|0)==34){W=0;X=b2[c[(c[s>>2]|0)+28>>2]&127](j,48)|0;Y=U;Z=V}O=c[f>>2]|0;c[f>>2]=O+1;if((Y|0)>0){P=Y;Q=O;while(1){a[Q]=X;S=P-1|0;R=c[f>>2]|0;c[f>>2]=R+1;if((S|0)>0){P=S;Q=R}else{_=R;break}}}else{_=O}a[_]=m;$=Z}else{$=L}if(($|0)==(K|0)){Q=b2[c[(c[s>>2]|0)+28>>2]&127](j,48)|0;P=c[f>>2]|0;c[f>>2]=P+1;a[P]=Q}else{Q=a[C]|0;P=Q&255;if((P&1|0)==0){aa=P>>>1}else{aa=c[F>>2]|0}if((aa|0)==0){ab=$;ac=0;ad=0;ae=-1}else{if((Q&1)==0){af=D}else{af=c[E>>2]|0}ab=$;ac=0;ad=0;ae=a[af]|0}while(1){do{if((ac|0)==(ae|0)){Q=c[f>>2]|0;c[f>>2]=Q+1;a[Q]=n;Q=ad+1|0;P=a[C]|0;N=P&255;if((N&1|0)==0){ag=N>>>1}else{ag=c[F>>2]|0}if(Q>>>0>=ag>>>0){ah=ae;ai=Q;aj=0;break}N=(P&1)==0;if(N){ak=D}else{ak=c[E>>2]|0}if((a[ak+Q|0]|0)==127){ah=-1;ai=Q;aj=0;break}if(N){al=D}else{al=c[E>>2]|0}ah=a[al+Q|0]|0;ai=Q;aj=0}else{ah=ae;ai=ad;aj=ac}}while(0);Q=ab-1|0;N=a[Q]|0;P=c[f>>2]|0;c[f>>2]=P+1;a[P]=N;if((Q|0)==(K|0)){break}else{ab=Q;ac=aj+1|0;ad=ai;ae=ah}}}L=c[f>>2]|0;if((J|0)==(L|0)){am=K;break L3}O=L-1|0;if(J>>>0<O>>>0){an=J;ao=O}else{am=K;break L3}while(1){O=a[an]|0;a[an]=a[ao]|0;a[ao]=O;O=an+1|0;L=ao-1|0;if(O>>>0<L>>>0){an=O;ao=L}else{am=K;break}}break};case 0:{c[e>>2]=c[f>>2];am=I;break};case 1:{c[e>>2]=c[f>>2];K=b2[c[(c[s>>2]|0)+28>>2]&127](j,32)|0;J=c[f>>2]|0;c[f>>2]=J+1;a[J]=K;am=I;break};case 3:{K=a[t]|0;J=K&255;if((J&1|0)==0){ap=J>>>1}else{ap=c[w>>2]|0}if((ap|0)==0){am=I;break L3}if((K&1)==0){aq=u}else{aq=c[v>>2]|0}K=a[aq]|0;J=c[f>>2]|0;c[f>>2]=J+1;a[J]=K;am=I;break};case 2:{K=a[q]|0;J=K&255;L=(J&1|0)==0;if(L){ar=J>>>1}else{ar=c[z>>2]|0}if((ar|0)==0|x){am=I;break L3}if((K&1)==0){as=y}else{as=c[A>>2]|0}if(L){at=J>>>1}else{at=c[z>>2]|0}J=as+at|0;L=c[f>>2]|0;if((at|0)==0){au=L}else{K=as;O=L;while(1){a[O]=a[K]|0;Q=K+1|0;if((Q|0)==(J|0)){break}else{K=Q;O=O+1|0}}au=L+at|0}c[f>>2]=au;am=I;break};default:{am=I}}}while(0);O=h+1|0;if((O|0)==4){break}else{I=am;h=O}}h=a[t]|0;t=h&255;am=(t&1|0)==0;if(am){av=t>>>1}else{av=c[w>>2]|0}if(av>>>0>1>>>0){if((h&1)==0){aw=u}else{aw=c[v>>2]|0}if(am){ax=t>>>1}else{ax=c[w>>2]|0}w=aw+ax|0;t=c[f>>2]|0;if((ax|0)==1){ay=t}else{am=ax-1|0;ax=t;v=aw+1|0;while(1){a[ax]=a[v]|0;aw=v+1|0;if((aw|0)==(w|0)){break}else{ax=ax+1|0;v=aw}}ay=t+am|0}c[f>>2]=ay}ay=g&176;if((ay|0)==16){return}else if((ay|0)==32){c[e>>2]=c[f>>2];return}else{c[e>>2]=d;return}}function oo(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=i;i=i+36|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=e|0;m=e+12|0;n=e+16|0;o=e+20|0;p=e+24|0;q=p;r=i;i=i+12|0;s=r;t=i;i=i+12|0;u=t;v=i;i=i+4|0;w=i;i=i+100|0;x=i;i=i+4|0;y=i;i=i+4|0;z=c[h+28>>2]|0;A=z;B=z+4|0;I=c[B>>2]|0,c[B>>2]=I+1,I;if((c[7545]|0)!=-1){c[l>>2]=30180;c[l+4>>2]=48;c[l+8>>2]=0;kE(30180,l)}l=(c[7546]|0)-1|0;B=c[z+8>>2]|0;do{if((c[z+12>>2]|0)-B>>2>>>0>l>>>0){C=c[B+(l<<2)>>2]|0;if((C|0)==0){break}D=C;E=k;F=k;G=a[F]|0;H=G&255;if((H&1|0)==0){J=H>>>1}else{J=c[k+4>>2]|0}if((J|0)==0){K=0}else{if((G&1)==0){L=E+1|0}else{L=c[k+8>>2]|0}G=a[L]|0;K=G<<24>>24==(b2[c[(c[C>>2]|0)+28>>2]&127](D,45)|0)<<24>>24}qP(q|0,0,12)|0;qP(s|0,0,12)|0;qP(u|0,0,12)|0;om(g,K,A,m,n,o,p,r,t,v);C=w|0;G=a[F]|0;F=G&255;H=(F&1|0)==0;if(H){M=F>>>1}else{M=c[k+4>>2]|0}N=c[v>>2]|0;if((M|0)>(N|0)){if(H){O=F>>>1}else{O=c[k+4>>2]|0}P=d[u]|0;if((P&1|0)==0){Q=P>>>1}else{Q=c[t+4>>2]|0}P=d[s]|0;if((P&1|0)==0){R=P>>>1}else{R=c[r+4>>2]|0}S=Q+(O-N<<1|1)+R|0}else{P=d[u]|0;if((P&1|0)==0){T=P>>>1}else{T=c[t+4>>2]|0}P=d[s]|0;if((P&1|0)==0){U=P>>>1}else{U=c[r+4>>2]|0}S=T+2+U|0}P=S+N|0;do{if(P>>>0>100>>>0){V=qH(P)|0;if((V|0)!=0){W=V;X=V;break}V=bR(4)|0;c[V>>2]=3284;bl(V|0,24120,94)}else{W=C;X=0}}while(0);if((G&1)==0){Y=E+1|0}else{Y=c[k+8>>2]|0}if(H){Z=F>>>1}else{Z=c[k+4>>2]|0}on(W,x,y,c[h+4>>2]|0,Y,Y+Z|0,D,K,m,a[n]|0,a[o]|0,p,r,t,N);mD(b,c[f>>2]|0,W,c[x>>2]|0,c[y>>2]|0,h,j);if((X|0)!=0){qI(X)}do{if((a[u]&1)!=0){C=c[t+8>>2]|0;if((C|0)==0){break}qI(C)}}while(0);do{if((a[s]&1)!=0){N=c[r+8>>2]|0;if((N|0)==0){break}qI(N)}}while(0);do{if((a[q]&1)!=0){N=c[p+8>>2]|0;if((N|0)==0){break}qI(N)}}while(0);N=z+4|0;if(((I=c[N>>2]|0,c[N>>2]=I+ -1,I)|0)!=0){i=e;return}b0[c[(c[z>>2]|0)+8>>2]&1023](z);i=e;return}}while(0);e=bR(4)|0;c[e>>2]=3308;bl(e|0,24132,322)}function op(a){a=a|0;if((a|0)==0){return}qI(a);return}function oq(a){a=a|0;return}function or(b,e,f,g,j,l,m){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;l=l|0;m=+m;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+540|0;n=f;f=i;i=i+4|0;c[f>>2]=c[n>>2];n=e|0;o=e+112|0;p=e+516|0;q=e+520|0;r=e+524|0;s=e+528|0;t=s;u=i;i=i+12|0;v=u;w=i;i=i+12|0;x=w;y=i;i=i+4|0;z=i;i=i+400|0;A=i;i=i+4|0;B=i;i=i+4|0;C=e+12|0;c[o>>2]=C;D=e+116|0;E=aZ(C|0,100,1364,(C=i,i=i+8|0,h[k>>3]=m,c[C>>2]=c[k>>2],c[C+4>>2]=c[k+4>>2],C)|0)|0;i=C;do{if(E>>>0>99>>>0){do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);F=mI(o,c[7204]|0,1364,(C=i,i=i+8|0,h[k>>3]=m,c[C>>2]=c[k>>2],c[C+4>>2]=c[k+4>>2],C)|0)|0;i=C;G=c[o>>2]|0;if((G|0)==0){H=bR(4)|0;c[H>>2]=3284;bl(H|0,24120,94)}H=qH(F<<2)|0;J=H;if((H|0)!=0){K=J;L=F;M=G;N=J;break}J=bR(4)|0;c[J>>2]=3284;bl(J|0,24120,94)}else{K=D;L=E;M=0;N=0}}while(0);E=c[j+28>>2]|0;D=E;C=E+4|0;I=c[C>>2]|0,c[C>>2]=I+1,I;if((c[7543]|0)!=-1){c[n>>2]=30172;c[n+4>>2]=48;c[n+8>>2]=0;kE(30172,n)}n=(c[7544]|0)-1|0;C=c[E+8>>2]|0;do{if((c[E+12>>2]|0)-C>>2>>>0>n>>>0){J=c[C+(n<<2)>>2]|0;if((J|0)==0){break}G=J;F=c[o>>2]|0;cd[c[(c[J>>2]|0)+48>>2]&15](G,F,F+L|0,K)|0;if((L|0)==0){O=0}else{O=(a[c[o>>2]|0]|0)==45}qP(t|0,0,12)|0;qP(v|0,0,12)|0;qP(x|0,0,12)|0;os(g,O,D,p,q,r,s,u,w,y);F=z|0;J=c[y>>2]|0;if((L|0)>(J|0)){H=d[x]|0;if((H&1|0)==0){P=H>>>1}else{P=c[w+4>>2]|0}H=d[v]|0;if((H&1|0)==0){Q=H>>>1}else{Q=c[u+4>>2]|0}R=P+(L-J<<1|1)+Q|0}else{H=d[x]|0;if((H&1|0)==0){S=H>>>1}else{S=c[w+4>>2]|0}H=d[v]|0;if((H&1|0)==0){T=H>>>1}else{T=c[u+4>>2]|0}R=S+2+T|0}H=R+J|0;do{if(H>>>0>100>>>0){U=qH(H<<2)|0;V=U;if((U|0)!=0){W=V;X=V;break}V=bR(4)|0;c[V>>2]=3284;bl(V|0,24120,94)}else{W=F;X=0}}while(0);ot(W,A,B,c[j+4>>2]|0,K,K+(L<<2)|0,G,O,p,c[q>>2]|0,c[r>>2]|0,s,u,w,J);mR(b,c[f>>2]|0,W,c[A>>2]|0,c[B>>2]|0,j,l);if((X|0)!=0){qI(X)}do{if((a[x]&1)!=0){F=c[w+8>>2]|0;if((F|0)==0){break}qI(F)}}while(0);do{if((a[v]&1)!=0){J=c[u+8>>2]|0;if((J|0)==0){break}qI(J)}}while(0);do{if((a[t]&1)!=0){J=c[s+8>>2]|0;if((J|0)==0){break}qI(J)}}while(0);J=E+4|0;if(((I=c[J>>2]|0,c[J>>2]=I+ -1,I)|0)==0){b0[c[(c[E>>2]|0)+8>>2]&1023](E)}if((N|0)!=0){qI(N)}if((M|0)==0){i=e;return}qI(M);i=e;return}}while(0);e=bR(4)|0;c[e>>2]=3308;bl(e|0,24132,322)}function os(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;n=i;i=i+28|0;o=n|0;p=n+12|0;q=n+24|0;r=q;s=i;i=i+12|0;t=s;u=i;i=i+4|0;v=u;w=i;i=i+12|0;x=w;y=i;i=i+12|0;z=y;A=i;i=i+12|0;B=A;D=i;i=i+4|0;E=D;F=i;i=i+12|0;G=F;H=i;i=i+4|0;I=H;J=i;i=i+12|0;K=J;L=i;i=i+12|0;M=L;N=i;i=i+12|0;O=N;if(b){if((c[7655]|0)!=-1){c[p>>2]=30620;c[p+4>>2]=48;c[p+8>>2]=0;kE(30620,p)}p=(c[7656]|0)-1|0;b=c[e+8>>2]|0;if((c[e+12>>2]|0)-b>>2>>>0<=p>>>0){P=bR(4)|0;Q=P;c[Q>>2]=3308;bl(P|0,24132,322)}R=c[b+(p<<2)>>2]|0;if((R|0)==0){P=bR(4)|0;Q=P;c[Q>>2]=3308;bl(P|0,24132,322)}P=R;Q=c[R>>2]|0;if(d){b1[c[Q+44>>2]&255](r,P);r=f;C=c[q>>2]|0;a[r]=C;C=C>>8;a[r+1|0]=C;C=C>>8;a[r+2|0]=C;C=C>>8;a[r+3|0]=C;b1[c[(c[R>>2]|0)+32>>2]&255](s,P);s=l;if((a[s]&1)==0){c[l+4>>2]=0;a[s]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}kP(l);c[s>>2]=c[t>>2];c[s+4>>2]=c[t+4>>2];c[s+8>>2]=c[t+8>>2];qP(t|0,0,12)|0}else{b1[c[Q+40>>2]&255](v,P);v=f;C=c[u>>2]|0;a[v]=C;C=C>>8;a[v+1|0]=C;C=C>>8;a[v+2|0]=C;C=C>>8;a[v+3|0]=C;b1[c[(c[R>>2]|0)+28>>2]&255](w,P);w=l;if((a[w]&1)==0){c[l+4>>2]=0;a[w]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}kP(l);c[w>>2]=c[x>>2];c[w+4>>2]=c[x+4>>2];c[w+8>>2]=c[x+8>>2];qP(x|0,0,12)|0}x=R;c[g>>2]=b5[c[(c[x>>2]|0)+12>>2]&511](P)|0;c[h>>2]=b5[c[(c[x>>2]|0)+16>>2]&511](P)|0;b1[c[(c[R>>2]|0)+20>>2]&255](y,P);y=j;if((a[y]&1)==0){a[j+1|0]=0;a[y]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}kJ(j);c[y>>2]=c[z>>2];c[y+4>>2]=c[z+4>>2];c[y+8>>2]=c[z+8>>2];qP(z|0,0,12)|0;b1[c[(c[R>>2]|0)+24>>2]&255](A,P);A=k;if((a[A]&1)==0){c[k+4>>2]=0;a[A]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}kP(k);c[A>>2]=c[B>>2];c[A+4>>2]=c[B+4>>2];c[A+8>>2]=c[B+8>>2];qP(B|0,0,12)|0;S=b5[c[(c[x>>2]|0)+36>>2]&511](P)|0;c[m>>2]=S;i=n;return}else{if((c[7657]|0)!=-1){c[o>>2]=30628;c[o+4>>2]=48;c[o+8>>2]=0;kE(30628,o)}o=(c[7658]|0)-1|0;P=c[e+8>>2]|0;if((c[e+12>>2]|0)-P>>2>>>0<=o>>>0){T=bR(4)|0;U=T;c[U>>2]=3308;bl(T|0,24132,322)}e=c[P+(o<<2)>>2]|0;if((e|0)==0){T=bR(4)|0;U=T;c[U>>2]=3308;bl(T|0,24132,322)}T=e;U=c[e>>2]|0;if(d){b1[c[U+44>>2]&255](E,T);E=f;C=c[D>>2]|0;a[E]=C;C=C>>8;a[E+1|0]=C;C=C>>8;a[E+2|0]=C;C=C>>8;a[E+3|0]=C;b1[c[(c[e>>2]|0)+32>>2]&255](F,T);F=l;if((a[F]&1)==0){c[l+4>>2]=0;a[F]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}kP(l);c[F>>2]=c[G>>2];c[F+4>>2]=c[G+4>>2];c[F+8>>2]=c[G+8>>2];qP(G|0,0,12)|0}else{b1[c[U+40>>2]&255](I,T);I=f;C=c[H>>2]|0;a[I]=C;C=C>>8;a[I+1|0]=C;C=C>>8;a[I+2|0]=C;C=C>>8;a[I+3|0]=C;b1[c[(c[e>>2]|0)+28>>2]&255](J,T);J=l;if((a[J]&1)==0){c[l+4>>2]=0;a[J]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}kP(l);c[J>>2]=c[K>>2];c[J+4>>2]=c[K+4>>2];c[J+8>>2]=c[K+8>>2];qP(K|0,0,12)|0}K=e;c[g>>2]=b5[c[(c[K>>2]|0)+12>>2]&511](T)|0;c[h>>2]=b5[c[(c[K>>2]|0)+16>>2]&511](T)|0;b1[c[(c[e>>2]|0)+20>>2]&255](L,T);L=j;if((a[L]&1)==0){a[j+1|0]=0;a[L]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}kJ(j);c[L>>2]=c[M>>2];c[L+4>>2]=c[M+4>>2];c[L+8>>2]=c[M+8>>2];qP(M|0,0,12)|0;b1[c[(c[e>>2]|0)+24>>2]&255](N,T);N=k;if((a[N]&1)==0){c[k+4>>2]=0;a[N]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}kP(k);c[N>>2]=c[O>>2];c[N+4>>2]=c[O+4>>2];c[N+8>>2]=c[O+8>>2];qP(O|0,0,12)|0;S=b5[c[(c[K>>2]|0)+36>>2]&511](T)|0;c[m>>2]=S;i=n;return}}function ot(b,d,e,f,g,h,i,j,k,l,m,n,o,p,q){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;var r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0;c[e>>2]=b;r=i;s=p;t=p+4|0;u=p+8|0;p=o;v=(f&512|0)==0;w=o+4|0;x=o+8|0;o=i;y=(q|0)>0;z=n;A=n+1|0;B=n+8|0;C=n+4|0;n=g;g=0;while(1){L3:do{switch(a[k+g|0]|0){case 4:{D=c[e>>2]|0;E=j?n+4|0:n;F=E;while(1){if(F>>>0>=h>>>0){break}if(b3[c[(c[o>>2]|0)+12>>2]&63](i,2048,c[F>>2]|0)|0){F=F+4|0}else{break}}if(y){do{if(F>>>0>E>>>0){G=F;H=q;do{G=G-4|0;I=c[G>>2]|0;J=c[e>>2]|0;c[e>>2]=J+4;c[J>>2]=I;H=H-1|0;K=(H|0)>0;}while(G>>>0>E>>>0&K);if(K){L=H;M=G;N=35;break}I=c[e>>2]|0;c[e>>2]=I+4;O=I;P=G}else{L=q;M=F;N=35}}while(0);do{if((N|0)==35){N=0;I=b2[c[(c[r>>2]|0)+44>>2]&127](i,48)|0;J=c[e>>2]|0;c[e>>2]=J+4;if((L|0)>0){Q=L;R=J}else{O=J;P=M;break}while(1){c[R>>2]=I;J=Q-1|0;S=c[e>>2]|0;c[e>>2]=S+4;if((J|0)>0){Q=J;R=S}else{O=S;P=M;break}}}}while(0);c[O>>2]=l;T=P}else{T=F}if((T|0)==(E|0)){I=b2[c[(c[r>>2]|0)+44>>2]&127](i,48)|0;G=c[e>>2]|0;c[e>>2]=G+4;c[G>>2]=I}else{I=a[z]|0;G=I&255;if((G&1|0)==0){U=G>>>1}else{U=c[C>>2]|0}if((U|0)==0){V=T;W=0;X=0;Y=-1}else{if((I&1)==0){Z=A}else{Z=c[B>>2]|0}V=T;W=0;X=0;Y=a[Z]|0}while(1){do{if((W|0)==(Y|0)){I=c[e>>2]|0;c[e>>2]=I+4;c[I>>2]=m;I=X+1|0;G=a[z]|0;H=G&255;if((H&1|0)==0){_=H>>>1}else{_=c[C>>2]|0}if(I>>>0>=_>>>0){$=Y;aa=I;ab=0;break}H=(G&1)==0;if(H){ac=A}else{ac=c[B>>2]|0}if((a[ac+I|0]|0)==127){$=-1;aa=I;ab=0;break}if(H){ad=A}else{ad=c[B>>2]|0}$=a[ad+I|0]|0;aa=I;ab=0}else{$=Y;aa=X;ab=W}}while(0);I=V-4|0;H=c[I>>2]|0;G=c[e>>2]|0;c[e>>2]=G+4;c[G>>2]=H;if((I|0)==(E|0)){break}else{V=I;W=ab+1|0;X=aa;Y=$}}}F=c[e>>2]|0;if((D|0)==(F|0)){ae=E;break L3}I=F-4|0;if(D>>>0<I>>>0){af=D;ag=I}else{ae=E;break L3}while(1){I=c[af>>2]|0;c[af>>2]=c[ag>>2];c[ag>>2]=I;I=af+4|0;F=ag-4|0;if(I>>>0<F>>>0){af=I;ag=F}else{ae=E;break}}break};case 0:{c[d>>2]=c[e>>2];ae=n;break};case 1:{c[d>>2]=c[e>>2];E=b2[c[(c[r>>2]|0)+44>>2]&127](i,32)|0;D=c[e>>2]|0;c[e>>2]=D+4;c[D>>2]=E;ae=n;break};case 3:{E=a[s]|0;D=E&255;if((D&1|0)==0){ah=D>>>1}else{ah=c[t>>2]|0}if((ah|0)==0){ae=n;break L3}if((E&1)==0){ai=t}else{ai=c[u>>2]|0}E=c[ai>>2]|0;D=c[e>>2]|0;c[e>>2]=D+4;c[D>>2]=E;ae=n;break};case 2:{E=a[p]|0;D=E&255;F=(D&1|0)==0;if(F){aj=D>>>1}else{aj=c[w>>2]|0}if((aj|0)==0|v){ae=n;break L3}if((E&1)==0){ak=w}else{ak=c[x>>2]|0}if(F){al=D>>>1}else{al=c[w>>2]|0}D=ak+(al<<2)|0;F=c[e>>2]|0;if((al|0)==0){am=F}else{E=ak+(al-1<<2)+(-ak|0)|0;I=ak;H=F;while(1){c[H>>2]=c[I>>2];G=I+4|0;if((G|0)==(D|0)){break}I=G;H=H+4|0}am=F+((E>>>2)+1<<2)|0}c[e>>2]=am;ae=n;break};default:{ae=n}}}while(0);H=g+1|0;if((H|0)==4){break}else{n=ae;g=H}}g=a[s]|0;s=g&255;ae=(s&1|0)==0;if(ae){an=s>>>1}else{an=c[t>>2]|0}if(an>>>0>1>>>0){if((g&1)==0){ao=t}else{ao=c[u>>2]|0}if(ae){ap=s>>>1}else{ap=c[t>>2]|0}t=ao+(ap<<2)|0;s=c[e>>2]|0;if((ap|0)==1){aq=s}else{ae=(ao+(ap-2<<2)+(-ao|0)|0)>>>2;ap=s;u=ao+4|0;while(1){c[ap>>2]=c[u>>2];ao=u+4|0;if((ao|0)==(t|0)){break}else{ap=ap+4|0;u=ao}}aq=s+(ae+1<<2)|0}c[e>>2]=aq}aq=f&176;if((aq|0)==32){c[d>>2]=c[e>>2];return}else if((aq|0)==16){return}else{c[d>>2]=b;return}}function ou(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=i;i=i+36|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2];l=e|0;m=e+12|0;n=e+16|0;o=e+20|0;p=e+24|0;q=p;r=i;i=i+12|0;s=r;t=i;i=i+12|0;u=t;v=i;i=i+4|0;w=i;i=i+400|0;x=i;i=i+4|0;y=i;i=i+4|0;z=c[h+28>>2]|0;A=z;B=z+4|0;I=c[B>>2]|0,c[B>>2]=I+1,I;if((c[7543]|0)!=-1){c[l>>2]=30172;c[l+4>>2]=48;c[l+8>>2]=0;kE(30172,l)}l=(c[7544]|0)-1|0;B=c[z+8>>2]|0;do{if((c[z+12>>2]|0)-B>>2>>>0>l>>>0){C=c[B+(l<<2)>>2]|0;if((C|0)==0){break}D=C;E=k;F=a[E]|0;G=F&255;if((G&1|0)==0){H=G>>>1}else{H=c[k+4>>2]|0}if((H|0)==0){J=0}else{if((F&1)==0){K=k+4|0}else{K=c[k+8>>2]|0}F=c[K>>2]|0;J=(F|0)==(b2[c[(c[C>>2]|0)+44>>2]&127](D,45)|0)}qP(q|0,0,12)|0;qP(s|0,0,12)|0;qP(u|0,0,12)|0;os(g,J,A,m,n,o,p,r,t,v);C=w|0;F=a[E]|0;E=F&255;G=(E&1|0)==0;if(G){L=E>>>1}else{L=c[k+4>>2]|0}M=c[v>>2]|0;if((L|0)>(M|0)){if(G){N=E>>>1}else{N=c[k+4>>2]|0}O=d[u]|0;if((O&1|0)==0){P=O>>>1}else{P=c[t+4>>2]|0}O=d[s]|0;if((O&1|0)==0){Q=O>>>1}else{Q=c[r+4>>2]|0}R=P+(N-M<<1|1)+Q|0}else{O=d[u]|0;if((O&1|0)==0){S=O>>>1}else{S=c[t+4>>2]|0}O=d[s]|0;if((O&1|0)==0){T=O>>>1}else{T=c[r+4>>2]|0}R=S+2+T|0}O=R+M|0;do{if(O>>>0>100>>>0){U=qH(O<<2)|0;V=U;if((U|0)!=0){W=V;X=V;break}V=bR(4)|0;c[V>>2]=3284;bl(V|0,24120,94)}else{W=C;X=0}}while(0);if((F&1)==0){Y=k+4|0}else{Y=c[k+8>>2]|0}if(G){Z=E>>>1}else{Z=c[k+4>>2]|0}ot(W,x,y,c[h+4>>2]|0,Y,Y+(Z<<2)|0,D,J,m,c[n>>2]|0,c[o>>2]|0,p,r,t,M);mR(b,c[f>>2]|0,W,c[x>>2]|0,c[y>>2]|0,h,j);if((X|0)!=0){qI(X)}do{if((a[u]&1)!=0){C=c[t+8>>2]|0;if((C|0)==0){break}qI(C)}}while(0);do{if((a[s]&1)!=0){M=c[r+8>>2]|0;if((M|0)==0){break}qI(M)}}while(0);do{if((a[q]&1)!=0){M=c[p+8>>2]|0;if((M|0)==0){break}qI(M)}}while(0);M=z+4|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)!=0){i=e;return}b0[c[(c[z>>2]|0)+8>>2]&1023](z);i=e;return}}while(0);e=bR(4)|0;c[e>>2]=3308;bl(e|0,24132,322)}function ov(a){a=a|0;if((a|0)==0){return}qI(a);return}function ow(a){a=a|0;return}function ox(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((a[d]&1)==0){f=d+1|0}else{f=c[d+8>>2]|0}d=bS(f|0,1)|0;return d>>>(((d|0)!=-1|0)>>>0)|0}function oy(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0;d=i;i=i+12|0;j=d|0;k=j;qP(k|0,0,12)|0;l=b;m=a[h]|0;if((m&1)==0){n=h+1|0}else{n=c[h+8>>2]|0}o=m&255;if((o&1|0)==0){p=o>>>1}else{p=c[h+4>>2]|0}h=n+p|0;do{if((p|0)>0){o=j+1|0;m=j+8|0;q=j|0;r=j+4|0;s=n;t=0;L11:while(1){u=a[s]|0;v=(t&1)==0;if(v){w=(t&255)>>>1;x=10;y=t}else{z=c[q>>2]|0;w=c[r>>2]|0;x=(z&-2)-1|0;y=z&255}do{if((w|0)==(x|0)){if((x|0)==-17){A=15;break L11}z=(y&1)==0?o:c[m>>2]|0;do{if(x>>>0<2147483623>>>0){B=x+1|0;C=x<<1;D=B>>>0<C>>>0?C:B;if(D>>>0<11>>>0){E=11;break}E=D+16&-16}else{E=-17}}while(0);D=(E|0)==0?1:E;while(1){F=qH(D)|0;if((F|0)!=0){break}B=(I=c[7664]|0,c[7664]=I+0,I);if((B|0)==0){A=29;break L11}b8[B&1]()}qQ(F|0,z|0,x)|0;if(!((x|0)==10|(z|0)==0)){qI(z)}c[m>>2]=F;c[q>>2]=E|1;G=F;A=37}else{if(v){a[k]=(w<<1)+2;H=o;J=w+1|0;break}else{G=c[m>>2]|0;A=37;break}}}while(0);if((A|0)==37){A=0;v=w+1|0;c[r>>2]=v;H=G;J=v}a[H+w|0]=u;a[H+J|0]=0;v=s+1|0;K=a[k]|0;if(v>>>0<h>>>0){s=v;t=K}else{A=39;break}}if((A|0)==15){kF()}else if((A|0)==29){t=bR(4)|0;c[t>>2]=3284;bl(t|0,24120,94)}else if((A|0)==39){L=(K&1)==0?o:c[m>>2]|0;M=(e|0)==-1?-1:e<<1;break}}else{L=j+1|0;M=(e|0)==-1?-1:e<<1}}while(0);e=a8(M|0,f|0,g|0,L|0)|0;qP(l|0,0,12)|0;L=qR(e|0)|0;g=e+L|0;L48:do{if((L|0)>0){f=b+8|0;M=b+4|0;K=b+1|0;A=b|0;h=e;J=0;while(1){H=a[h]|0;w=J&1;if(w<<24>>24==0){N=(J&255)>>>1;O=10}else{N=c[M>>2]|0;O=(c[A>>2]&-2)-1|0}if((N|0)==(O|0)){kM(b,O,1,O,O,0);P=a[l]&1}else{P=w}if(P<<24>>24==1){w=c[f>>2]|0;G=N+1|0;c[M>>2]=G;Q=w;R=G}else{a[l]=(N<<1)+2;Q=K;R=N+1|0}a[Q+N|0]=H;a[Q+R|0]=0;H=h+1|0;if(H>>>0>=g>>>0){break L48}h=H;J=a[l]|0}}}while(0);if((a[k]&1)==0){i=d;return}k=c[j+8>>2]|0;if((k|0)==0){i=d;return}qI(k);i=d;return}function oz(a,b){a=a|0;b=b|0;bD(((b|0)==-1?-1:b<<1)|0)|0;return}function oA(a){a=a|0;if((a|0)==0){return}qI(a);return}function oB(a){a=a|0;return}function oC(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((a[d]&1)==0){f=d+1|0}else{f=c[d+8>>2]|0}d=bS(f|0,1)|0;return d>>>(((d|0)!=-1|0)>>>0)|0}function oD(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0;d=i;i=i+204|0;j=d|0;k=d+8|0;l=d+40|0;m=d+44|0;n=d+48|0;o=d+56|0;p=d+184|0;q=d+188|0;r=d+192|0;s=r;t=i;i=i+8|0;u=i;i=i+8|0;qP(s|0,0,12)|0;v=b;w=t|0;c[t+4>>2]=0;c[t>>2]=5540;x=a[h]|0;if((x&1)==0){y=h+4|0}else{y=c[h+8>>2]|0}z=x&255;if((z&1|0)==0){A=z>>>1}else{A=c[h+4>>2]|0}h=y+(A<<2)|0;do{if((A|0)>0){z=t;x=k|0;B=k+32|0;C=r+1|0;D=r+8|0;E=r|0;F=r+4|0;G=y;H=5540;L12:while(1){c[m>>2]=G;J=(b9[c[H+12>>2]&31](w,j,G,h,m,x,B,l)|0)==2;K=c[m>>2]|0;if(J|(K|0)==(G|0)){L=13;break}if(x>>>0<(c[l>>2]|0)>>>0){J=x;do{M=a[J]|0;N=a[s]|0;O=(N&1)==0;if(O){P=(N&255)>>>1;Q=10;R=N}else{N=c[E>>2]|0;P=c[F>>2]|0;Q=(N&-2)-1|0;R=N&255}do{if((P|0)==(Q|0)){if((Q|0)==-17){L=38;break L12}N=(R&1)==0?C:c[D>>2]|0;do{if(Q>>>0<2147483623>>>0){S=Q+1|0;T=Q<<1;U=S>>>0<T>>>0?T:S;if(U>>>0<11>>>0){V=11;break}V=U+16&-16}else{V=-17}}while(0);U=(V|0)==0?1:V;while(1){W=qH(U)|0;if((W|0)!=0){break}S=(I=c[7664]|0,c[7664]=I+0,I);if((S|0)==0){L=52;break L12}b8[S&1]()}qQ(W|0,N|0,Q)|0;if(!((Q|0)==10|(N|0)==0)){qI(N)}c[D>>2]=W;c[E>>2]=V|1;X=W;L=60}else{if(O){a[s]=(P<<1)+2;Y=C;Z=P+1|0;break}else{X=c[D>>2]|0;L=60;break}}}while(0);if((L|0)==60){L=0;O=P+1|0;c[F>>2]=O;Y=X;Z=O}a[Y+P|0]=M;a[Y+Z|0]=0;J=J+1|0;}while(J>>>0<(c[l>>2]|0)>>>0);_=c[m>>2]|0}else{_=K}if(_>>>0>=h>>>0){L=65;break}G=_;H=c[z>>2]|0}if((L|0)==13){z=bR(8)|0;c[z>>2]=3332;H=z+4|0;G=H;do{if((H|0)!=0){while(1){$=qH(33)|0;if(($|0)!=0){L=28;break}F=(I=c[7664]|0,c[7664]=I+0,I);if((F|0)==0){break}b8[F&1]()}if((L|0)==28){c[$+4>>2]=20;c[$>>2]=20;K=$+12|0;c[G>>2]=K;c[$+8>>2]=0;qQ(K|0,872,21)|0;break}K=bR(4)|0;c[K>>2]=3284;bl(K|0,24120,94)}}while(0);bl(z|0,24144,216)}else if((L|0)==38){kF()}else if((L|0)==52){G=bR(4)|0;c[G>>2]=3284;bl(G|0,24120,94)}else if((L|0)==65){aa=(a[s]&1)==0?C:c[D>>2]|0;ab=(e|0)==-1?-1:e<<1;break}}else{aa=r+1|0;ab=(e|0)==-1?-1:e<<1}}while(0);e=a8(ab|0,f|0,g|0,aa|0)|0;qP(v|0,0,12)|0;aa=u|0;c[u+4>>2]=0;c[u>>2]=5488;g=qR(e|0)|0;f=e+g|0;L68:do{if((g|0)>=1){ab=u;$=f;_=o|0;h=o+128|0;m=b+8|0;l=b+4|0;Z=b|0;Y=e;P=5488;while(1){c[q>>2]=Y;X=(b9[c[P+16>>2]&31](aa,n,Y,($-Y|0)>32?Y+32|0:f,q,_,h,p)|0)==2;W=c[q>>2]|0;if(X|(W|0)==(Y|0)){break}if(_>>>0<(c[p>>2]|0)>>>0){X=_;do{V=c[X>>2]|0;Q=a[v]|0;R=Q&1;if(R<<24>>24==0){ac=(Q&255)>>>1;ad=1}else{ac=c[l>>2]|0;ad=(c[Z>>2]&-2)-1|0}if((ac|0)==(ad|0)){kQ(b,ad,1,ad,ad,0,0);ae=a[v]&1}else{ae=R}if(ae<<24>>24==1){R=c[m>>2]|0;Q=ac+1|0;c[l>>2]=Q;af=R;ag=Q}else{a[v]=(ac<<1)+2;af=l;ag=ac+1|0}c[af+(ac<<2)>>2]=V;c[af+(ag<<2)>>2]=0;X=X+4|0;}while(X>>>0<(c[p>>2]|0)>>>0);ah=c[q>>2]|0}else{ah=W}if(ah>>>0>=f>>>0){break L68}Y=ah;P=c[ab>>2]|0}ab=bR(8)|0;c[ab>>2]=3332;P=ab+4|0;Y=P;do{if((P|0)!=0){while(1){ai=qH(33)|0;if((ai|0)!=0){L=93;break}l=(I=c[7664]|0,c[7664]=I+0,I);if((l|0)==0){break}b8[l&1]()}if((L|0)==93){c[ai+4>>2]=20;c[ai>>2]=20;W=ai+12|0;c[Y>>2]=W;c[ai+8>>2]=0;qQ(W|0,872,21)|0;break}W=bR(4)|0;c[W>>2]=3284;bl(W|0,24120,94)}}while(0);bl(ab|0,24144,216)}}while(0);if((a[s]&1)==0){i=d;return}s=c[r+8>>2]|0;if((s|0)==0){i=d;return}qI(s);i=d;return}function oE(a,b){a=a|0;b=b|0;bD(((b|0)==-1?-1:b<<1)|0)|0;return}function oF(b){b=b|0;var d=0;c[b>>2]=4288;d=b+8|0;b=c[d>>2]|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);if((b|0)==(c[7204]|0)){return}a7(c[d>>2]|0);return}function oG(){var b=0,d=0,e=0,f=0,g=0,h=0;b=bR(8)|0;c[b>>2]=3380;d=b+4|0;e=d;if((d|0)==0){f=b;c[f>>2]=3356;bl(b|0,24156,290)}while(1){g=qH(19)|0;if((g|0)!=0){h=16;break}d=(I=c[7664]|0,c[7664]=I+0,I);if((d|0)==0){h=10;break}b8[d&1]()}if((h|0)==10){d=bR(4)|0;c[d>>2]=3284;bl(d|0,24120,94)}else if((h|0)==16){c[g+4>>2]=6;c[g>>2]=6;h=g+12|0;c[e>>2]=h;c[g+8>>2]=0;a[h]=a[1356]|0;a[h+1|0]=a[1357]|0;a[h+2|0]=a[1358]|0;a[h+3|0]=a[1359]|0;a[h+4|0]=a[1360]|0;a[h+5|0]=a[1361]|0;a[h+6|0]=a[1362]|0;f=b;c[f>>2]=3356;bl(b|0,24156,290)}}function oH(a){a=a|0;oI(a);if((a|0)==0){return}qI(a);return}function oI(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;c[b>>2]=4520;d=b+12|0;e=c[d>>2]|0;f=b+8|0;g=c[f>>2]|0;if((e|0)==(g|0)){h=e}else{i=0;j=g;g=e;while(1){e=c[j+(i<<2)>>2]|0;if((e|0)==0){k=g;l=j}else{m=e+4|0;if(((I=c[m>>2]|0,c[m>>2]=I+ -1,I)|0)==0){b0[c[(c[e>>2]|0)+8>>2]&1023](e|0)}k=c[d>>2]|0;l=c[f>>2]|0}e=i+1|0;if(e>>>0<k-l>>2>>>0){i=e;j=l;g=k}else{h=l;break}}}do{if((a[b+144|0]&1)==0){n=h}else{l=c[b+152>>2]|0;if((l|0)==0){n=h;break}qI(l);n=c[f>>2]|0}}while(0);if((n|0)==0){return}f=c[d>>2]|0;if((n|0)!=(f|0)){c[d>>2]=f+(~((f-4+(-n|0)|0)>>>2)<<2)}if((n|0)==(b+24|0)){a[b+136|0]=0;return}else{qI(n);return}}
function oJ(){var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0;b=i;i=i+336|0;d=b|0;e=b+12|0;f=b+24|0;g=b+36|0;h=b+48|0;j=b+60|0;k=b+72|0;l=b+84|0;m=b+96|0;n=b+108|0;o=b+120|0;p=b+132|0;q=b+144|0;r=b+156|0;s=b+168|0;t=b+180|0;u=b+192|0;v=b+204|0;w=b+216|0;x=b+228|0;y=b+240|0;z=b+252|0;A=b+264|0;B=b+276|0;C=b+288|0;D=b+300|0;E=b+312|0;F=b+324|0;if((a[30708]|0)!=0){G=c[7201]|0;i=b;return G|0}if((bd(30708)|0)==0){G=c[7201]|0;i=b;return G|0}do{if((a[30716]|0)==0){if((bd(30716)|0)==0){break}c[7245]=0;c[7244]=4520;a[29112]=1;c[7247]=29e3;c[7246]=29e3;c[7248]=29112;H=28;J=29e3;do{if((J|0)==0){K=0}else{c[J>>2]=0;K=c[7247]|0}J=K+4|0;c[7247]=J;H=H-1|0;}while((H|0)!=0);a[29120]=2;a[29121]=67;a[29122]=0;H=c[7246]|0;if((H|0)!=(J|0)){c[7247]=K+(-((K+(-H|0)|0)>>>2)<<2)}c[7237]=0;c[7236]=4252;if((c[7469]|0)!=-1){c[F>>2]=29876;c[F+4>>2]=48;c[F+8>>2]=0;kE(29876,F)}H=c[7470]|0;L=H-1|0;I=c[7237]|0,c[7237]=I+1,I;M=c[7247]|0;N=c[7246]|0;O=M-N>>2;do{if(O>>>0>L>>>0){P=N}else{if(O>>>0<H>>>0){qf(28984,H-O|0);P=c[7246]|0;break}if(O>>>0<=H>>>0){P=N;break}Q=N+(H<<2)|0;if((Q|0)==(M|0)){P=N;break}c[7247]=M+(~((M-4+(-Q|0)|0)>>>2)<<2);P=N}}while(0);N=c[P+(L<<2)>>2]|0;if((N|0)==0){R=P}else{M=N+4|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)==0){b0[c[(c[N>>2]|0)+8>>2]&1023](N|0)}R=c[7246]|0}c[R+(L<<2)>>2]=28944;c[7235]=0;c[7234]=4216;if((c[7467]|0)!=-1){c[E>>2]=29868;c[E+4>>2]=48;c[E+8>>2]=0;kE(29868,E)}N=c[7468]|0;M=N-1|0;I=c[7235]|0,c[7235]=I+1,I;H=c[7247]|0;O=c[7246]|0;J=H-O>>2;do{if(J>>>0>M>>>0){S=O}else{if(J>>>0<N>>>0){qf(28984,N-J|0);S=c[7246]|0;break}if(J>>>0<=N>>>0){S=O;break}Q=O+(N<<2)|0;if((Q|0)==(H|0)){S=O;break}c[7247]=H+(~((H-4+(-Q|0)|0)>>>2)<<2);S=O}}while(0);O=c[S+(M<<2)>>2]|0;if((O|0)==0){T=S}else{H=O+4|0;if(((I=c[H>>2]|0,c[H>>2]=I+ -1,I)|0)==0){b0[c[(c[O>>2]|0)+8>>2]&1023](O|0)}T=c[7246]|0}c[T+(M<<2)>>2]=28936;c[7287]=0;c[7286]=4616;c[7288]=0;a[29156]=0;c[7288]=c[(a6()|0)>>2];if((c[7545]|0)!=-1){c[D>>2]=30180;c[D+4>>2]=48;c[D+8>>2]=0;kE(30180,D)}O=c[7546]|0;H=O-1|0;I=c[7287]|0,c[7287]=I+1,I;N=c[7247]|0;J=c[7246]|0;L=N-J>>2;do{if(L>>>0>H>>>0){U=J}else{if(L>>>0<O>>>0){qf(28984,O-L|0);U=c[7246]|0;break}if(L>>>0<=O>>>0){U=J;break}Q=J+(O<<2)|0;if((Q|0)==(N|0)){U=J;break}c[7247]=N+(~((N-4+(-Q|0)|0)>>>2)<<2);U=J}}while(0);J=c[U+(H<<2)>>2]|0;if((J|0)==0){V=U}else{N=J+4|0;if(((I=c[N>>2]|0,c[N>>2]=I+ -1,I)|0)==0){b0[c[(c[J>>2]|0)+8>>2]&1023](J|0)}V=c[7246]|0}c[V+(H<<2)>>2]=29144;c[7285]=0;c[7284]=4544;if((c[7543]|0)!=-1){c[C>>2]=30172;c[C+4>>2]=48;c[C+8>>2]=0;kE(30172,C)}J=c[7544]|0;N=J-1|0;I=c[7285]|0,c[7285]=I+1,I;O=c[7247]|0;L=c[7246]|0;M=O-L>>2;do{if(M>>>0>N>>>0){W=L}else{if(M>>>0<J>>>0){qf(28984,J-M|0);W=c[7246]|0;break}if(M>>>0<=J>>>0){W=L;break}Q=L+(J<<2)|0;if((Q|0)==(O|0)){W=L;break}c[7247]=O+(~((O-4+(-Q|0)|0)>>>2)<<2);W=L}}while(0);L=c[W+(N<<2)>>2]|0;if((L|0)==0){X=W}else{O=L+4|0;if(((I=c[O>>2]|0,c[O>>2]=I+ -1,I)|0)==0){b0[c[(c[L>>2]|0)+8>>2]&1023](L|0)}X=c[7246]|0}c[X+(N<<2)>>2]=29136;c[7239]=0;c[7238]=4340;if((c[7473]|0)!=-1){c[B>>2]=29892;c[B+4>>2]=48;c[B+8>>2]=0;kE(29892,B)}L=c[7474]|0;O=L-1|0;I=c[7239]|0,c[7239]=I+1,I;J=c[7247]|0;M=c[7246]|0;H=J-M>>2;do{if(H>>>0>O>>>0){Y=M}else{if(H>>>0<L>>>0){qf(28984,L-H|0);Y=c[7246]|0;break}if(H>>>0<=L>>>0){Y=M;break}Q=M+(L<<2)|0;if((Q|0)==(J|0)){Y=M;break}c[7247]=J+(~((J-4+(-Q|0)|0)>>>2)<<2);Y=M}}while(0);M=c[Y+(O<<2)>>2]|0;if((M|0)==0){Z=Y}else{J=M+4|0;if(((I=c[J>>2]|0,c[J>>2]=I+ -1,I)|0)==0){b0[c[(c[M>>2]|0)+8>>2]&1023](M|0)}Z=c[7246]|0}c[Z+(O<<2)>>2]=28952;c[745]=0;c[744]=4288;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);c[746]=c[7204];if((c[7471]|0)!=-1){c[A>>2]=29884;c[A+4>>2]=48;c[A+8>>2]=0;kE(29884,A)}O=c[7472]|0;M=O-1|0;I=c[745]|0,c[745]=I+1,I;J=c[7247]|0;L=c[7246]|0;H=J-L>>2;do{if(H>>>0>M>>>0){_=L}else{if(H>>>0<O>>>0){qf(28984,O-H|0);_=c[7246]|0;break}if(H>>>0<=O>>>0){_=L;break}N=L+(O<<2)|0;if((N|0)==(J|0)){_=L;break}c[7247]=J+(~((J-4+(-N|0)|0)>>>2)<<2);_=L}}while(0);L=c[_+(M<<2)>>2]|0;if((L|0)==0){$=_}else{J=L+4|0;if(((I=c[J>>2]|0,c[J>>2]=I+ -1,I)|0)==0){b0[c[(c[L>>2]|0)+8>>2]&1023](L|0)}$=c[7246]|0}c[$+(M<<2)>>2]=2976;c[7241]=0;c[7240]=4392;if((c[7475]|0)!=-1){c[z>>2]=29900;c[z+4>>2]=48;c[z+8>>2]=0;kE(29900,z)}L=c[7476]|0;J=L-1|0;I=c[7241]|0,c[7241]=I+1,I;O=c[7247]|0;H=c[7246]|0;N=O-H>>2;do{if(N>>>0>J>>>0){aa=H}else{if(N>>>0<L>>>0){qf(28984,L-N|0);aa=c[7246]|0;break}if(N>>>0<=L>>>0){aa=H;break}Q=H+(L<<2)|0;if((Q|0)==(O|0)){aa=H;break}c[7247]=O+(~((O-4+(-Q|0)|0)>>>2)<<2);aa=H}}while(0);H=c[aa+(J<<2)>>2]|0;if((H|0)==0){ab=aa}else{O=H+4|0;if(((I=c[O>>2]|0,c[O>>2]=I+ -1,I)|0)==0){b0[c[(c[H>>2]|0)+8>>2]&1023](H|0)}ab=c[7246]|0}c[ab+(J<<2)>>2]=28960;c[7243]=0;c[7242]=4444;if((c[7477]|0)!=-1){c[y>>2]=29908;c[y+4>>2]=48;c[y+8>>2]=0;kE(29908,y)}H=c[7478]|0;O=H-1|0;I=c[7243]|0,c[7243]=I+1,I;L=c[7247]|0;N=c[7246]|0;M=L-N>>2;do{if(M>>>0>O>>>0){ac=N}else{if(M>>>0<H>>>0){qf(28984,H-M|0);ac=c[7246]|0;break}if(M>>>0<=H>>>0){ac=N;break}Q=N+(H<<2)|0;if((Q|0)==(L|0)){ac=N;break}c[7247]=L+(~((L-4+(-Q|0)|0)>>>2)<<2);ac=N}}while(0);N=c[ac+(O<<2)>>2]|0;if((N|0)==0){ad=ac}else{L=N+4|0;if(((I=c[L>>2]|0,c[L>>2]=I+ -1,I)|0)==0){b0[c[(c[N>>2]|0)+8>>2]&1023](N|0)}ad=c[7246]|0}c[ad+(O<<2)>>2]=28968;c[7217]=0;c[7216]=3808;a[28872]=46;a[28873]=44;qP(28876,0,12)|0;if((c[7453]|0)!=-1){c[x>>2]=29812;c[x+4>>2]=48;c[x+8>>2]=0;kE(29812,x)}N=c[7454]|0;L=N-1|0;I=c[7217]|0,c[7217]=I+1,I;H=c[7247]|0;M=c[7246]|0;J=H-M>>2;do{if(J>>>0>L>>>0){ae=M}else{if(J>>>0<N>>>0){qf(28984,N-J|0);ae=c[7246]|0;break}if(J>>>0<=N>>>0){ae=M;break}Q=M+(N<<2)|0;if((Q|0)==(H|0)){ae=M;break}c[7247]=H+(~((H-4+(-Q|0)|0)>>>2)<<2);ae=M}}while(0);M=c[ae+(L<<2)>>2]|0;if((M|0)==0){af=ae}else{H=M+4|0;if(((I=c[H>>2]|0,c[H>>2]=I+ -1,I)|0)==0){b0[c[(c[M>>2]|0)+8>>2]&1023](M|0)}af=c[7246]|0}c[af+(L<<2)>>2]=28864;c[737]=0;c[736]=3764;c[738]=46;c[739]=44;qP(2960,0,12)|0;if((c[7451]|0)!=-1){c[w>>2]=29804;c[w+4>>2]=48;c[w+8>>2]=0;kE(29804,w)}M=c[7452]|0;H=M-1|0;I=c[737]|0,c[737]=I+1,I;N=c[7247]|0;J=c[7246]|0;O=N-J>>2;do{if(O>>>0>H>>>0){ag=J}else{if(O>>>0<M>>>0){qf(28984,M-O|0);ag=c[7246]|0;break}if(O>>>0<=M>>>0){ag=J;break}Q=J+(M<<2)|0;if((Q|0)==(N|0)){ag=J;break}c[7247]=N+(~((N-4+(-Q|0)|0)>>>2)<<2);ag=J}}while(0);J=c[ag+(H<<2)>>2]|0;if((J|0)==0){ah=ag}else{N=J+4|0;if(((I=c[N>>2]|0,c[N>>2]=I+ -1,I)|0)==0){b0[c[(c[J>>2]|0)+8>>2]&1023](J|0)}ah=c[7246]|0}c[ah+(H<<2)>>2]=2944;c[7233]=0;c[7232]=4148;if((c[7465]|0)!=-1){c[v>>2]=29860;c[v+4>>2]=48;c[v+8>>2]=0;kE(29860,v)}J=c[7466]|0;N=J-1|0;I=c[7233]|0,c[7233]=I+1,I;M=c[7247]|0;O=c[7246]|0;L=M-O>>2;do{if(L>>>0>N>>>0){ai=O}else{if(L>>>0<J>>>0){qf(28984,J-L|0);ai=c[7246]|0;break}if(L>>>0<=J>>>0){ai=O;break}Q=O+(J<<2)|0;if((Q|0)==(M|0)){ai=O;break}c[7247]=M+(~((M-4+(-Q|0)|0)>>>2)<<2);ai=O}}while(0);O=c[ai+(N<<2)>>2]|0;if((O|0)==0){aj=ai}else{M=O+4|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)==0){b0[c[(c[O>>2]|0)+8>>2]&1023](O|0)}aj=c[7246]|0}c[aj+(N<<2)>>2]=28928;c[7231]=0;c[7230]=4080;if((c[7463]|0)!=-1){c[u>>2]=29852;c[u+4>>2]=48;c[u+8>>2]=0;kE(29852,u)}O=c[7464]|0;M=O-1|0;I=c[7231]|0,c[7231]=I+1,I;J=c[7247]|0;L=c[7246]|0;H=J-L>>2;do{if(H>>>0>M>>>0){ak=L}else{if(H>>>0<O>>>0){qf(28984,O-H|0);ak=c[7246]|0;break}if(H>>>0<=O>>>0){ak=L;break}Q=L+(O<<2)|0;if((Q|0)==(J|0)){ak=L;break}c[7247]=J+(~((J-4+(-Q|0)|0)>>>2)<<2);ak=L}}while(0);L=c[ak+(M<<2)>>2]|0;if((L|0)==0){al=ak}else{J=L+4|0;if(((I=c[J>>2]|0,c[J>>2]=I+ -1,I)|0)==0){b0[c[(c[L>>2]|0)+8>>2]&1023](L|0)}al=c[7246]|0}c[al+(M<<2)>>2]=28920;c[7229]=0;c[7228]=4024;if((c[7461]|0)!=-1){c[t>>2]=29844;c[t+4>>2]=48;c[t+8>>2]=0;kE(29844,t)}L=c[7462]|0;J=L-1|0;I=c[7229]|0,c[7229]=I+1,I;O=c[7247]|0;H=c[7246]|0;N=O-H>>2;do{if(N>>>0>J>>>0){am=H}else{if(N>>>0<L>>>0){qf(28984,L-N|0);am=c[7246]|0;break}if(N>>>0<=L>>>0){am=H;break}Q=H+(L<<2)|0;if((Q|0)==(O|0)){am=H;break}c[7247]=O+(~((O-4+(-Q|0)|0)>>>2)<<2);am=H}}while(0);H=c[am+(J<<2)>>2]|0;if((H|0)==0){an=am}else{O=H+4|0;if(((I=c[O>>2]|0,c[O>>2]=I+ -1,I)|0)==0){b0[c[(c[H>>2]|0)+8>>2]&1023](H|0)}an=c[7246]|0}c[an+(J<<2)>>2]=28912;c[7227]=0;c[7226]=3968;if((c[7459]|0)!=-1){c[s>>2]=29836;c[s+4>>2]=48;c[s+8>>2]=0;kE(29836,s)}H=c[7460]|0;O=H-1|0;I=c[7227]|0,c[7227]=I+1,I;L=c[7247]|0;N=c[7246]|0;M=L-N>>2;do{if(M>>>0>O>>>0){ao=N}else{if(M>>>0<H>>>0){qf(28984,H-M|0);ao=c[7246]|0;break}if(M>>>0<=H>>>0){ao=N;break}Q=N+(H<<2)|0;if((Q|0)==(L|0)){ao=N;break}c[7247]=L+(~((L-4+(-Q|0)|0)>>>2)<<2);ao=N}}while(0);N=c[ao+(O<<2)>>2]|0;if((N|0)==0){ap=ao}else{L=N+4|0;if(((I=c[L>>2]|0,c[L>>2]=I+ -1,I)|0)==0){b0[c[(c[N>>2]|0)+8>>2]&1023](N|0)}ap=c[7246]|0}c[ap+(O<<2)>>2]=28904;c[7297]=0;c[7296]=6268;if((c[7661]|0)!=-1){c[r>>2]=30644;c[r+4>>2]=48;c[r+8>>2]=0;kE(30644,r)}N=c[7662]|0;L=N-1|0;I=c[7297]|0,c[7297]=I+1,I;H=c[7247]|0;M=c[7246]|0;J=H-M>>2;do{if(J>>>0>L>>>0){aq=M}else{if(J>>>0<N>>>0){qf(28984,N-J|0);aq=c[7246]|0;break}if(J>>>0<=N>>>0){aq=M;break}Q=M+(N<<2)|0;if((Q|0)==(H|0)){aq=M;break}c[7247]=H+(~((H-4+(-Q|0)|0)>>>2)<<2);aq=M}}while(0);M=c[aq+(L<<2)>>2]|0;if((M|0)==0){ar=aq}else{H=M+4|0;if(((I=c[H>>2]|0,c[H>>2]=I+ -1,I)|0)==0){b0[c[(c[M>>2]|0)+8>>2]&1023](M|0)}ar=c[7246]|0}c[ar+(L<<2)>>2]=29184;c[7295]=0;c[7294]=6208;if((c[7659]|0)!=-1){c[q>>2]=30636;c[q+4>>2]=48;c[q+8>>2]=0;kE(30636,q)}M=c[7660]|0;H=M-1|0;I=c[7295]|0,c[7295]=I+1,I;N=c[7247]|0;J=c[7246]|0;O=N-J>>2;do{if(O>>>0>H>>>0){as=J}else{if(O>>>0<M>>>0){qf(28984,M-O|0);as=c[7246]|0;break}if(O>>>0<=M>>>0){as=J;break}Q=J+(M<<2)|0;if((Q|0)==(N|0)){as=J;break}c[7247]=N+(~((N-4+(-Q|0)|0)>>>2)<<2);as=J}}while(0);J=c[as+(H<<2)>>2]|0;if((J|0)==0){at=as}else{N=J+4|0;if(((I=c[N>>2]|0,c[N>>2]=I+ -1,I)|0)==0){b0[c[(c[J>>2]|0)+8>>2]&1023](J|0)}at=c[7246]|0}c[at+(H<<2)>>2]=29176;c[7293]=0;c[7292]=6148;if((c[7657]|0)!=-1){c[p>>2]=30628;c[p+4>>2]=48;c[p+8>>2]=0;kE(30628,p)}J=c[7658]|0;N=J-1|0;I=c[7293]|0,c[7293]=I+1,I;M=c[7247]|0;O=c[7246]|0;L=M-O>>2;do{if(L>>>0>N>>>0){au=O}else{if(L>>>0<J>>>0){qf(28984,J-L|0);au=c[7246]|0;break}if(L>>>0<=J>>>0){au=O;break}Q=O+(J<<2)|0;if((Q|0)==(M|0)){au=O;break}c[7247]=M+(~((M-4+(-Q|0)|0)>>>2)<<2);au=O}}while(0);O=c[au+(N<<2)>>2]|0;if((O|0)==0){av=au}else{M=O+4|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)==0){b0[c[(c[O>>2]|0)+8>>2]&1023](O|0)}av=c[7246]|0}c[av+(N<<2)>>2]=29168;c[7291]=0;c[7290]=6088;if((c[7655]|0)!=-1){c[o>>2]=30620;c[o+4>>2]=48;c[o+8>>2]=0;kE(30620,o)}O=c[7656]|0;M=O-1|0;I=c[7291]|0,c[7291]=I+1,I;J=c[7247]|0;L=c[7246]|0;H=J-L>>2;do{if(H>>>0>M>>>0){aw=L}else{if(H>>>0<O>>>0){qf(28984,O-H|0);aw=c[7246]|0;break}if(H>>>0<=O>>>0){aw=L;break}Q=L+(O<<2)|0;if((Q|0)==(J|0)){aw=L;break}c[7247]=J+(~((J-4+(-Q|0)|0)>>>2)<<2);aw=L}}while(0);L=c[aw+(M<<2)>>2]|0;if((L|0)==0){ax=aw}else{J=L+4|0;if(((I=c[J>>2]|0,c[J>>2]=I+ -1,I)|0)==0){b0[c[(c[L>>2]|0)+8>>2]&1023](L|0)}ax=c[7246]|0}c[ax+(M<<2)>>2]=29160;c[7215]=0;c[7214]=3500;if((c[7441]|0)!=-1){c[n>>2]=29764;c[n+4>>2]=48;c[n+8>>2]=0;kE(29764,n)}L=c[7442]|0;J=L-1|0;I=c[7215]|0,c[7215]=I+1,I;O=c[7247]|0;H=c[7246]|0;N=O-H>>2;do{if(N>>>0>J>>>0){ay=H}else{if(N>>>0<L>>>0){qf(28984,L-N|0);ay=c[7246]|0;break}if(N>>>0<=L>>>0){ay=H;break}Q=H+(L<<2)|0;if((Q|0)==(O|0)){ay=H;break}c[7247]=O+(~((O-4+(-Q|0)|0)>>>2)<<2);ay=H}}while(0);H=c[ay+(J<<2)>>2]|0;if((H|0)==0){az=ay}else{O=H+4|0;if(((I=c[O>>2]|0,c[O>>2]=I+ -1,I)|0)==0){b0[c[(c[H>>2]|0)+8>>2]&1023](H|0)}az=c[7246]|0}c[az+(J<<2)>>2]=28856;c[7213]=0;c[7212]=3468;if((c[7439]|0)!=-1){c[m>>2]=29756;c[m+4>>2]=48;c[m+8>>2]=0;kE(29756,m)}H=c[7440]|0;O=H-1|0;I=c[7213]|0,c[7213]=I+1,I;L=c[7247]|0;N=c[7246]|0;M=L-N>>2;do{if(M>>>0>O>>>0){aA=N}else{if(M>>>0<H>>>0){qf(28984,H-M|0);aA=c[7246]|0;break}if(M>>>0<=H>>>0){aA=N;break}Q=N+(H<<2)|0;if((Q|0)==(L|0)){aA=N;break}c[7247]=L+(~((L-4+(-Q|0)|0)>>>2)<<2);aA=N}}while(0);N=c[aA+(O<<2)>>2]|0;if((N|0)==0){aB=aA}else{L=N+4|0;if(((I=c[L>>2]|0,c[L>>2]=I+ -1,I)|0)==0){b0[c[(c[N>>2]|0)+8>>2]&1023](N|0)}aB=c[7246]|0}c[aB+(O<<2)>>2]=28848;c[7211]=0;c[7210]=3436;if((c[7437]|0)!=-1){c[l>>2]=29748;c[l+4>>2]=48;c[l+8>>2]=0;kE(29748,l)}N=c[7438]|0;L=N-1|0;I=c[7211]|0,c[7211]=I+1,I;H=c[7247]|0;M=c[7246]|0;J=H-M>>2;do{if(J>>>0>L>>>0){aC=M}else{if(J>>>0<N>>>0){qf(28984,N-J|0);aC=c[7246]|0;break}if(J>>>0<=N>>>0){aC=M;break}Q=M+(N<<2)|0;if((Q|0)==(H|0)){aC=M;break}c[7247]=H+(~((H-4+(-Q|0)|0)>>>2)<<2);aC=M}}while(0);M=c[aC+(L<<2)>>2]|0;if((M|0)==0){aD=aC}else{H=M+4|0;if(((I=c[H>>2]|0,c[H>>2]=I+ -1,I)|0)==0){b0[c[(c[M>>2]|0)+8>>2]&1023](M|0)}aD=c[7246]|0}c[aD+(L<<2)>>2]=28840;c[7209]=0;c[7208]=3404;if((c[7435]|0)!=-1){c[k>>2]=29740;c[k+4>>2]=48;c[k+8>>2]=0;kE(29740,k)}M=c[7436]|0;H=M-1|0;I=c[7209]|0,c[7209]=I+1,I;N=c[7247]|0;J=c[7246]|0;O=N-J>>2;do{if(O>>>0>H>>>0){aE=J}else{if(O>>>0<M>>>0){qf(28984,M-O|0);aE=c[7246]|0;break}if(O>>>0<=M>>>0){aE=J;break}Q=J+(M<<2)|0;if((Q|0)==(N|0)){aE=J;break}c[7247]=N+(~((N-4+(-Q|0)|0)>>>2)<<2);aE=J}}while(0);J=c[aE+(H<<2)>>2]|0;if((J|0)==0){aF=aE}else{N=J+4|0;if(((I=c[N>>2]|0,c[N>>2]=I+ -1,I)|0)==0){b0[c[(c[J>>2]|0)+8>>2]&1023](J|0)}aF=c[7246]|0}c[aF+(H<<2)>>2]=28832;c[733]=0;c[732]=3676;c[734]=3724;if((c[7449]|0)!=-1){c[j>>2]=29796;c[j+4>>2]=48;c[j+8>>2]=0;kE(29796,j)}J=c[7450]|0;N=J-1|0;I=c[733]|0,c[733]=I+1,I;M=c[7247]|0;O=c[7246]|0;L=M-O>>2;do{if(L>>>0>N>>>0){aG=O}else{if(L>>>0<J>>>0){qf(28984,J-L|0);aG=c[7246]|0;break}if(L>>>0<=J>>>0){aG=O;break}Q=O+(J<<2)|0;if((Q|0)==(M|0)){aG=O;break}c[7247]=M+(~((M-4+(-Q|0)|0)>>>2)<<2);aG=O}}while(0);O=c[aG+(N<<2)>>2]|0;if((O|0)==0){aH=aG}else{M=O+4|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)==0){b0[c[(c[O>>2]|0)+8>>2]&1023](O|0)}aH=c[7246]|0}c[aH+(N<<2)>>2]=2928;c[729]=0;c[728]=3588;c[730]=3636;if((c[7447]|0)!=-1){c[h>>2]=29788;c[h+4>>2]=48;c[h+8>>2]=0;kE(29788,h)}O=c[7448]|0;M=O-1|0;I=c[729]|0,c[729]=I+1,I;J=c[7247]|0;L=c[7246]|0;H=J-L>>2;do{if(H>>>0>M>>>0){aI=L}else{if(H>>>0<O>>>0){qf(28984,O-H|0);aI=c[7246]|0;break}if(H>>>0<=O>>>0){aI=L;break}Q=L+(O<<2)|0;if((Q|0)==(J|0)){aI=L;break}c[7247]=J+(~((J-4+(-Q|0)|0)>>>2)<<2);aI=L}}while(0);L=c[aI+(M<<2)>>2]|0;if((L|0)==0){aJ=aI}else{J=L+4|0;if(((I=c[J>>2]|0,c[J>>2]=I+ -1,I)|0)==0){b0[c[(c[L>>2]|0)+8>>2]&1023](L|0)}aJ=c[7246]|0}c[aJ+(M<<2)>>2]=2912;c[725]=0;c[724]=4496;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);c[726]=c[7204];c[724]=3560;if((c[7445]|0)!=-1){c[g>>2]=29780;c[g+4>>2]=48;c[g+8>>2]=0;kE(29780,g)}M=c[7446]|0;L=M-1|0;I=c[725]|0,c[725]=I+1,I;J=c[7247]|0;O=c[7246]|0;H=J-O>>2;do{if(H>>>0>L>>>0){aK=O}else{if(H>>>0<M>>>0){qf(28984,M-H|0);aK=c[7246]|0;break}if(H>>>0<=M>>>0){aK=O;break}N=O+(M<<2)|0;if((N|0)==(J|0)){aK=O;break}c[7247]=J+(~((J-4+(-N|0)|0)>>>2)<<2);aK=O}}while(0);O=c[aK+(L<<2)>>2]|0;if((O|0)==0){aL=aK}else{J=O+4|0;if(((I=c[J>>2]|0,c[J>>2]=I+ -1,I)|0)==0){b0[c[(c[O>>2]|0)+8>>2]&1023](O|0)}aL=c[7246]|0}c[aL+(L<<2)>>2]=2896;c[721]=0;c[720]=4496;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);c[722]=c[7204];c[720]=3532;if((c[7443]|0)!=-1){c[f>>2]=29772;c[f+4>>2]=48;c[f+8>>2]=0;kE(29772,f)}L=c[7444]|0;O=L-1|0;I=c[721]|0,c[721]=I+1,I;J=c[7247]|0;M=c[7246]|0;H=J-M>>2;do{if(H>>>0>O>>>0){aM=M}else{if(H>>>0<L>>>0){qf(28984,L-H|0);aM=c[7246]|0;break}if(H>>>0<=L>>>0){aM=M;break}N=M+(L<<2)|0;if((N|0)==(J|0)){aM=M;break}c[7247]=J+(~((J-4+(-N|0)|0)>>>2)<<2);aM=M}}while(0);M=c[aM+(O<<2)>>2]|0;if((M|0)==0){aN=aM}else{J=M+4|0;if(((I=c[J>>2]|0,c[J>>2]=I+ -1,I)|0)==0){b0[c[(c[M>>2]|0)+8>>2]&1023](M|0)}aN=c[7246]|0}c[aN+(O<<2)>>2]=2880;c[7225]=0;c[7224]=3888;if((c[7457]|0)!=-1){c[e>>2]=29828;c[e+4>>2]=48;c[e+8>>2]=0;kE(29828,e)}M=c[7458]|0;J=M-1|0;I=c[7225]|0,c[7225]=I+1,I;L=c[7247]|0;H=c[7246]|0;N=L-H>>2;do{if(N>>>0>J>>>0){aO=H}else{if(N>>>0<M>>>0){qf(28984,M-N|0);aO=c[7246]|0;break}if(N>>>0<=M>>>0){aO=H;break}Q=H+(M<<2)|0;if((Q|0)==(L|0)){aO=H;break}c[7247]=L+(~((L-4+(-Q|0)|0)>>>2)<<2);aO=H}}while(0);H=c[aO+(J<<2)>>2]|0;if((H|0)==0){aP=aO}else{L=H+4|0;if(((I=c[L>>2]|0,c[L>>2]=I+ -1,I)|0)==0){b0[c[(c[H>>2]|0)+8>>2]&1023](H|0)}aP=c[7246]|0}c[aP+(J<<2)>>2]=28896;c[7223]=0;c[7222]=3852;if((c[7455]|0)!=-1){c[d>>2]=29820;c[d+4>>2]=48;c[d+8>>2]=0;kE(29820,d)}H=c[7456]|0;L=H-1|0;I=c[7223]|0,c[7223]=I+1,I;M=c[7247]|0;N=c[7246]|0;O=M-N>>2;do{if(O>>>0>L>>>0){aQ=N}else{if(O>>>0<H>>>0){qf(28984,H-O|0);aQ=c[7246]|0;break}if(O>>>0<=H>>>0){aQ=N;break}Q=N+(H<<2)|0;if((Q|0)==(M|0)){aQ=N;break}c[7247]=M+(~((M-4+(-Q|0)|0)>>>2)<<2);aQ=N}}while(0);N=c[aQ+(L<<2)>>2]|0;if((N|0)==0){aR=aQ}else{M=N+4|0;if(((I=c[M>>2]|0,c[M>>2]=I+ -1,I)|0)==0){b0[c[(c[N>>2]|0)+8>>2]&1023](N|0)}aR=c[7246]|0}c[aR+(L<<2)>>2]=28888;c[7202]=28976}}while(0);aR=c[7202]|0;c[7203]=aR;aQ=aR+4|0;I=c[aQ>>2]|0,c[aQ>>2]=I+1,I;c[7201]=28812;G=c[7201]|0;i=b;return G|0}function oK(a){a=a|0;if((a|0)==0){return}qI(a);return}function oL(a){a=a|0;if((a|0)==0){return}b0[c[(c[a>>2]|0)+4>>2]&1023](a);return}function oM(a){a=a|0;c[a+4>>2]=(I=c[7479]|0,c[7479]=I+1,I)+1;return}function oN(a){a=a|0;if((a|0)==0){return}qI(a);return}function oO(a,d,e){a=a|0;d=d|0;e=e|0;var f=0;if(e>>>0>=128>>>0){f=0;return f|0}f=(b[(c[(a6()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16!=0;return f|0}function oP(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;if((d|0)==(e|0)){g=d;return g|0}else{h=d;i=f}while(1){f=c[h>>2]|0;if(f>>>0<128>>>0){j=b[(c[(a6()|0)>>2]|0)+(f<<1)>>1]|0}else{j=0}b[i>>1]=j;f=h+4|0;if((f|0)==(e|0)){g=e;break}else{h=f;i=i+2|0}}return g|0}function oQ(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((e|0)==(f|0)){g=e;return g|0}else{h=e}while(1){e=c[h>>2]|0;if(e>>>0<128>>>0){if((b[(c[(a6()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16!=0){g=h;i=8;break}}e=h+4|0;if((e|0)==(f|0)){g=f;i=9;break}else{h=e}}if((i|0)==8){return g|0}else if((i|0)==9){return g|0}return 0}function oR(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;a=e;while(1){if((a|0)==(f|0)){g=f;h=8;break}e=c[a>>2]|0;if(e>>>0>=128>>>0){g=a;h=9;break}if((b[(c[(a6()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16==0){g=a;h=10;break}else{a=a+4|0}}if((h|0)==8){return g|0}else if((h|0)==10){return g|0}else if((h|0)==9){return g|0}return 0}function oS(a,b){a=a|0;b=b|0;var d=0;if(b>>>0>=128>>>0){d=b;return d|0}d=c[(c[(bT()|0)>>2]|0)+(b<<2)>>2]|0;return d|0}function oT(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((b|0)==(d|0)){e=b;return e|0}else{f=b}while(1){b=c[f>>2]|0;if(b>>>0<128>>>0){g=c[(c[(bT()|0)>>2]|0)+(b<<2)>>2]|0}else{g=b}c[f>>2]=g;b=f+4|0;if((b|0)==(d|0)){e=d;break}else{f=b}}return e|0}function oU(a,b){a=a|0;b=b|0;var d=0;if(b>>>0>=128>>>0){d=b;return d|0}d=c[(c[(bU()|0)>>2]|0)+(b<<2)>>2]|0;return d|0}function oV(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((b|0)==(d|0)){e=b;return e|0}else{f=b}while(1){b=c[f>>2]|0;if(b>>>0<128>>>0){g=c[(c[(bU()|0)>>2]|0)+(b<<2)>>2]|0}else{g=b}c[f>>2]=g;b=f+4|0;if((b|0)==(d|0)){e=d;break}else{f=b}}return e|0}function oW(a,b){a=a|0;b=b|0;return b<<24>>24|0}function oX(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((d|0)==(e|0)){g=d;return g|0}else{h=d;i=f}while(1){c[i>>2]=a[h]|0;f=h+1|0;if((f|0)==(e|0)){g=e;break}else{h=f;i=i+4|0}}return g|0}function oY(a,b,c){a=a|0;b=b|0;c=c|0;return(b>>>0<128>>>0?b&255:c)|0}function oZ(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;if((d|0)==(e|0)){h=d;return h|0}b=(e-4+(-d|0)|0)>>>2;i=d;j=g;while(1){g=c[i>>2]|0;a[j]=g>>>0<128>>>0?g&255:f;g=i+4|0;if((g|0)==(e|0)){break}else{i=g;j=j+1|0}}h=d+(b+1<<2)|0;return h|0}function o_(b){b=b|0;var d=0;c[b>>2]=4616;d=c[b+8>>2]|0;do{if((d|0)!=0){if((a[b+12|0]&1)!=0){qI(d)}if((b|0)!=0){break}return}}while(0);qI(b);return}function o$(b){b=b|0;var d=0;c[b>>2]=4616;d=c[b+8>>2]|0;if((d|0)==0){return}if((a[b+12|0]&1)==0){return}qI(d);return}function o0(a,b){a=a|0;b=b|0;var d=0;if(b<<24>>24<0){d=b;return d|0}d=c[(c[(bT()|0)>>2]|0)+((b&255)<<2)>>2]&255;return d|0}function o1(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((d|0)==(e|0)){f=d;return f|0}else{g=d}while(1){d=a[g]|0;if(d<<24>>24<0){h=d}else{h=c[(c[(bT()|0)>>2]|0)+(d<<24>>24<<2)>>2]&255}a[g]=h;d=g+1|0;if((d|0)==(e|0)){f=e;break}else{g=d}}return f|0}function o2(a,b){a=a|0;b=b|0;var d=0;if(b<<24>>24<0){d=b;return d|0}d=c[(c[(bU()|0)>>2]|0)+(b<<24>>24<<2)>>2]&255;return d|0}function o3(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((d|0)==(e|0)){f=d;return f|0}else{g=d}while(1){d=a[g]|0;if(d<<24>>24<0){h=d}else{h=c[(c[(bU()|0)>>2]|0)+(d<<24>>24<<2)>>2]&255}a[g]=h;d=g+1|0;if((d|0)==(e|0)){f=e;break}else{g=d}}return f|0}function o4(a,b){a=a|0;b=b|0;return b|0}function o5(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((c|0)==(d|0)){f=c;return f|0}else{g=c;h=e}while(1){a[h]=a[g]|0;e=g+1|0;if((e|0)==(d|0)){f=d;break}else{g=e;h=h+1|0}}return f|0}function o6(a,b,c){a=a|0;b=b|0;c=c|0;return(b<<24>>24<0?c:b)|0}function o7(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((c|0)==(d|0)){g=c;return g|0}else{h=c;i=f}while(1){f=a[h]|0;a[i]=f<<24>>24<0?e:f;f=h+1|0;if((f|0)==(d|0)){g=d;break}else{h=f;i=i+1|0}}return g|0}function o8(a){a=a|0;if((a|0)==0){return}qI(a);return}function o9(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[f>>2]=d;c[i>>2]=g;return 3}function pa(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[f>>2]=d;c[i>>2]=g;return 3}function pb(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function pc(a){a=a|0;return 1}function pd(a){a=a|0;return 1}function pe(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;b=d-c|0;return(b>>>0<e>>>0?b:e)|0}function pf(a){a=a|0;return 1}function pg(b){b=b|0;var d=0,e=0;c[b>>2]=4288;d=b+8|0;e=c[d>>2]|0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);if((e|0)!=(c[7204]|0)){a7(c[d>>2]|0)}if((b|0)==0){return}qI(b);return}function ph(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0;d=i;i=i+256|0;l=d|0;m=e;while(1){if((m|0)==(f|0)){n=f;break}if((c[m>>2]|0)==0){n=m;break}else{m=m+4|0}}c[k>>2]=h;c[g>>2]=e;L5:do{if((e|0)==(f|0)|(h|0)==(j|0)){o=e}else{m=j;p=b+8|0;q=l|0;r=h;s=e;t=n;while(1){u=t-s>>2;v=bH(c[p>>2]|0)|0;w=c[g>>2]|0;x=(r|0)!=0;y=x?m-r|0:256;z=x?r:q;L9:do{if((w|0)==0|(y|0)==0){A=0;B=u;C=y;D=z;E=w}else{F=y;G=u;H=0;I=z;J=w;L10:while(1){K=G>>>0>=F>>>0;if(!(K|G>>>0>32>>>0)){A=H;B=G;C=F;D=I;E=J;break L9}L=K?F:G;M=G-L|0;L13:do{if((I|0)==0){K=c[J>>2]|0;if((K|0)==0){N=0;O=J;break}else{P=0;Q=J;R=K}while(1){do{if(R>>>0>127>>>0){if(R>>>0<2048>>>0){S=2;break}if(R>>>0<55296>>>0|(R-57344|0)>>>0<8192>>>0){S=3;break}if((R-65536|0)>>>0<1048576>>>0){S=4}else{T=15;break L10}}else{S=1}}while(0);K=S+P|0;U=Q+4|0;V=c[U>>2]|0;if((V|0)==0){W=K;X=J;T=56;break}else{P=K;Q=U;R=V}}}else{L23:do{if(L>>>0>3>>>0){V=L;U=I;Y=J;while(1){K=c[Y>>2]|0;if((K|0)==0){Z=V;_=U;$=Y;break L23}if(K>>>0>127>>>0){do{if((U|0)==0){aa=1}else{if(K>>>0<128>>>0){a[U]=K;aa=1;break}if(K>>>0<2048>>>0){a[U]=K>>>6|192;a[U+1|0]=K&63|128;aa=2;break}if(K>>>0<55296>>>0|(K-57344|0)>>>0<8192>>>0){a[U]=K>>>12|224;a[U+1|0]=K>>>6&63|128;a[U+2|0]=K&63|128;aa=3;break}if((K-65536|0)>>>0>=1048576>>>0){T=29;break L10}a[U]=K>>>18|240;a[U+1|0]=K>>>12&63|128;a[U+2|0]=K>>>6&63|128;a[U+3|0]=K&63|128;aa=4}}while(0);ab=U+aa|0;ac=V-aa|0;ad=Y}else{a[U]=K;ab=U+1|0;ac=V-1|0;ad=Y}ae=ad+4|0;if(ac>>>0>3>>>0){V=ac;U=ab;Y=ae}else{Z=ac;_=ab;$=ae;break}}}else{Z=L;_=I;$=J}}while(0);L45:do{if((Z|0)==0){af=0}else{U=Z;V=_;ag=$;while(1){ae=c[ag>>2]|0;if((ae|0)==0){T=54;break}if(ae>>>0>127>>>0){ah=ae>>>0<2048>>>0;do{if(ah){ai=2}else{if(ae>>>0<55296>>>0|(ae-57344|0)>>>0<8192>>>0){ai=3;break}if((ae-65536|0)>>>0<1048576>>>0){ai=4}else{T=38;break L10}}}while(0);if(ai>>>0>U>>>0){T=40;break}do{if((V|0)!=0){if(ae>>>0<128>>>0){a[V]=ae;break}if(ah){a[V]=ae>>>6|192;a[V+1|0]=ae&63|128;break}if(ae>>>0<55296>>>0|(ae-57344|0)>>>0<8192>>>0){a[V]=ae>>>12|224;a[V+1|0]=ae>>>6&63|128;a[V+2|0]=ae&63|128;break}if((ae-65536|0)>>>0<1048576>>>0){a[V]=ae>>>18|240;a[V+1|0]=ae>>>12&63|128;a[V+2|0]=ae>>>6&63|128;a[V+3|0]=ae&63|128;break}else{c[(bA()|0)>>2]=84;break}}}while(0);aj=V+ai|0;ak=U-ai|0;al=ag}else{a[V]=ae;aj=V+1|0;ak=U-1|0;al=ag}if((ak|0)==0){af=0;break L45}else{U=ak;V=aj;ag=al+4|0}}if((T|0)==40){T=0;W=L-U|0;X=ag;T=56;break L13}else if((T|0)==54){T=0;a[V]=0;af=U;break}}}while(0);W=L-af|0;X=0;T=56}}while(0);if((T|0)==56){T=0;if((W|0)==-1){A=-1;B=M;C=0;D=I;E=X;break L9}else{N=W;O=X}}if((I|0)==(q|0)){am=q;an=F}else{am=I+N|0;an=F-N|0}L=N+H|0;if((O|0)==0|(an|0)==0){A=L;B=M;C=an;D=am;E=O;break L9}else{F=an;G=M;H=L;I=am;J=O}}if((T|0)==15){T=0;c[(bA()|0)>>2]=84;A=-1;B=M;C=0;D=I;E=J;break}else if((T|0)==38){T=0;c[(bA()|0)>>2]=84;A=-1;B=M;C=0;D=I;E=ag;break}else if((T|0)==29){T=0;c[(bA()|0)>>2]=84;A=-1;B=M;C=0;D=I;E=Y;break}}}while(0);L88:do{if((E|0)==0){ao=A;ap=0}else{if((C|0)==0|(B|0)==0){ao=A;ap=E;break}else{aq=C;ar=B;as=A;at=D;au=E}L90:while(1){w=c[au>>2]|0;do{if((at|0)==0){av=1}else{if(w>>>0<128>>>0){a[at]=w;av=1;break}if(w>>>0<2048>>>0){a[at]=w>>>6|192;a[at+1|0]=w&63|128;av=2;break}if(w>>>0<55296>>>0|(w-57344|0)>>>0<8192>>>0){a[at]=w>>>12|224;a[at+1|0]=w>>>6&63|128;a[at+2|0]=w&63|128;av=3;break}if((w-65536|0)>>>0>=1048576>>>0){break L90}a[at]=w>>>18|240;a[at+1|0]=w>>>12&63|128;a[at+2|0]=w>>>6&63|128;a[at+3|0]=w&63|128;av=4}}while(0);w=au+4|0;z=ar-1|0;u=as+1|0;if((aq|0)==(av|0)|(z|0)==0){ao=u;ap=w;break L88}aq=aq-av|0;ar=z;as=u;at=at+av|0;au=w}c[(bA()|0)>>2]=84;ao=-1;ap=au}}while(0);if(x){c[g>>2]=ap}if((v|0)!=0){bH(v|0)|0}if((ao|0)==0){aw=1;T=112;break}else if((ao|0)==(-1|0)){T=80;break}I=(c[k>>2]|0)+ao|0;c[k>>2]=I;if((I|0)==(j|0)){T=109;break}if((t|0)==(f|0)){ax=f;ay=I;az=c[g>>2]|0}else{I=bH(c[p>>2]|0)|0;if((I|0)!=0){bH(I|0)|0}I=c[k>>2]|0;if((I|0)==(j|0)){aw=1;T=114;break}c[k>>2]=I+1;a[I]=0;I=(c[g>>2]|0)+4|0;c[g>>2]=I;J=I;while(1){if((J|0)==(f|0)){aA=f;break}if((c[J>>2]|0)==0){aA=J;break}else{J=J+4|0}}ax=aA;ay=c[k>>2]|0;az=I}if((az|0)==(f|0)|(ay|0)==(j|0)){o=az;break L5}else{r=ay;s=az;t=ax}}if((T|0)==112){i=d;return aw|0}else if((T|0)==114){i=d;return aw|0}else if((T|0)==80){c[k>>2]=r;L132:do{if((s|0)==(c[g>>2]|0)){aB=s}else{t=s;q=r;while(1){m=c[t>>2]|0;J=bH(c[p>>2]|0)|0;do{if((q|0)==0){aC=1}else{if(m>>>0<128>>>0){a[q]=m;aC=1;break}if(m>>>0<2048>>>0){a[q]=m>>>6|192;a[q+1|0]=m&63|128;aC=2;break}if(m>>>0<55296>>>0|(m-57344|0)>>>0<8192>>>0){a[q]=m>>>12|224;a[q+1|0]=m>>>6&63|128;a[q+2|0]=m&63|128;aC=3;break}if((m-65536|0)>>>0<1048576>>>0){a[q]=m>>>18|240;a[q+1|0]=m>>>12&63|128;a[q+2|0]=m>>>6&63|128;a[q+3|0]=m&63|128;aC=4;break}else{c[(bA()|0)>>2]=84;aC=-1;break}}}while(0);if((J|0)!=0){bH(J|0)|0}if((aC|0)==-1){aB=t;break L132}m=(c[k>>2]|0)+aC|0;c[k>>2]=m;v=t+4|0;if((v|0)==(c[g>>2]|0)){aB=v;break}else{t=v;q=m}}}}while(0);c[g>>2]=aB;aw=2;i=d;return aw|0}else if((T|0)==109){o=c[g>>2]|0;break}}}while(0);aw=(o|0)!=(f|0)|0;i=d;return aw|0}function pi(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0;l=i;i=i+1036|0;m=l|0;n=l+1024|0;o=l+1028|0;p=e;while(1){if((p|0)==(f|0)){q=f;break}if((a[p]|0)==0){q=p;break}else{p=p+1|0}}c[k>>2]=h;c[g>>2]=e;L5:do{if((e|0)==(f|0)|(h|0)==(j|0)){r=e}else{p=d;s=o;t=j;u=b+8|0;v=m|0;w=d|0;x=h;y=e;z=q;while(1){A=c[p+4>>2]|0;c[s>>2]=c[p>>2];c[s+4>>2]=A;B=z;A=B-y|0;C=bH(c[u>>2]|0)|0;D=c[g>>2]|0;c[n>>2]=D;E=(x|0)!=0;F=E?t-x>>2:256;G=E?x:v;L9:do{if((D|0)==0|(F|0)==0){H=0;I=A;J=F;K=G;L=D}else{M=F;N=A;O=0;P=G;Q=D;while(1){R=N>>>2;S=R>>>0>=M>>>0;if(!(S|N>>>0>131>>>0)){H=O;I=N;J=M;K=P;L=Q;break L9}T=S?M:R;U=N-T|0;R=qn(P,n,T,d)|0;if((R|0)==-1){break}if((P|0)==(v|0)){V=v;W=M}else{V=P+(R<<2)|0;W=M-R|0}T=R+O|0;R=c[n>>2]|0;if((R|0)==0|(W|0)==0){H=T;I=U;J=W;K=V;L=R;break L9}else{M=W;N=U;O=T;P=V;Q=R}}H=-1;I=U;J=0;K=P;L=c[n>>2]|0}}while(0);L19:do{if((L|0)==0){X=H;Y=0}else{if((J|0)==0|(I|0)==0){X=H;Y=L;break}else{Z=J;_=I;$=H;aa=K;ab=L}while(1){ac=qm(aa,ab,_,d)|0;if((ac+2|0)>>>0<3>>>0){break}D=ab+ac|0;c[n>>2]=D;G=Z-1|0;A=$+1|0;if((G|0)==0|(_|0)==(ac|0)){X=A;Y=D;break L19}else{Z=G;_=_-ac|0;$=A;aa=aa+4|0;ab=D}}if((ac|0)==0){c[n>>2]=0;X=$;Y=0;break}else if((ac|0)==(-1|0)){X=-1;Y=ab;break}else{c[w>>2]=0;X=$;Y=ab;break}}}while(0);if(E){c[g>>2]=Y}if((C|0)!=0){bH(C|0)|0}if((X|0)==(-1|0)){ad=26;break}else if((X|0)==0){ae=2;ad=51;break}P=(c[k>>2]|0)+(X<<2)|0;c[k>>2]=P;if((P|0)==(j|0)){ad=48;break}D=c[g>>2]|0;if((z|0)==(f|0)){af=f;ag=P;ah=D}else{A=bH(c[u>>2]|0)|0;G=qm(P,D,1,d)|0;if((A|0)!=0){bH(A|0)|0}if((G|0)!=0){ae=2;ad=55;break}c[k>>2]=(c[k>>2]|0)+4;G=(c[g>>2]|0)+1|0;c[g>>2]=G;A=G;while(1){if((A|0)==(f|0)){ai=f;break}if((a[A]|0)==0){ai=A;break}else{A=A+1|0}}af=ai;ag=c[k>>2]|0;ah=G}if((ah|0)==(f|0)|(ag|0)==(j|0)){r=ah;break L5}else{x=ag;y=ah;z=af}}if((ad|0)==26){c[k>>2]=x;L50:do{if((y|0)==(c[g>>2]|0)){aj=y}else{z=x;w=y;while(1){v=bH(c[u>>2]|0)|0;t=qm(z,w,B-w|0,o)|0;if((v|0)!=0){bH(v|0)|0}if((t|0)==0){ak=w+1|0}else if((t|0)==(-1|0)){ad=32;break}else if((t|0)==(-2|0)){ad=33;break}else{ak=w+t|0}t=(c[k>>2]|0)+4|0;c[k>>2]=t;if((ak|0)==(c[g>>2]|0)){aj=ak;break L50}else{z=t;w=ak}}if((ad|0)==32){c[g>>2]=w;ae=2;i=l;return ae|0}else if((ad|0)==33){c[g>>2]=w;ae=1;i=l;return ae|0}}}while(0);c[g>>2]=aj;ae=(aj|0)!=(f|0)|0;i=l;return ae|0}else if((ad|0)==48){r=c[g>>2]|0;break}else if((ad|0)==51){i=l;return ae|0}else if((ad|0)==55){i=l;return ae|0}}}while(0);ae=(r|0)!=(f|0)|0;i=l;return ae|0}function pj(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;d=bH(c[a+8>>2]|0)|0;if((d|0)==0){return 0}bH(d|0)|0;return 0}function pk(a){a=a|0;var b=0,d=0;b=a+8|0;a=bH(c[b>>2]|0)|0;if((a|0)!=0){bH(a|0)|0}a=c[b>>2]|0;if((a|0)==0){d=1;return d|0}b=bH(a|0)|0;if((b|0)==0){d=0;return d|0}bH(b|0)|0;d=0;return d|0}function pl(a){a=a|0;return 0}function pm(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;if((f|0)==0|(d|0)==(e|0)){g=0;return g|0}h=e;i=a+8|0;a=(b|0)!=0?b:26840;b=d;d=0;j=0;while(1){k=bH(c[i>>2]|0)|0;l=qm(0,b,h-b|0,a)|0;if((k|0)!=0){bH(k|0)|0}if((l|0)==0){m=1;n=b+1|0}else if((l|0)==(-1|0)|(l|0)==(-2|0)){g=d;o=11;break}else{m=l;n=b+l|0}l=m+d|0;k=j+1|0;if(k>>>0>=f>>>0|(n|0)==(e|0)){g=l;o=12;break}else{b=n;d=l;j=k}}if((o|0)==11){return g|0}else if((o|0)==12){return g|0}return 0}function pn(a){a=a|0;var b=0,d=0;b=c[a+8>>2]|0;do{if((b|0)==0){d=1}else{a=bH(b|0)|0;if((a|0)==0){d=4;break}bH(a|0)|0;d=4}}while(0);return d|0}function po(a){a=a|0;if((a|0)==0){return}qI(a);return}function pp(d,f,g,h,i,j,k,l){d=d|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=h;L1:do{if(g>>>0<h>>>0){d=k;m=j;n=g;while(1){o=b[n>>1]|0;p=o&65535;do{if((o&65535)>>>0<128>>>0){if((d-m|0)<1){q=1;r=m;s=n;break L1}a[m]=o;t=m+1|0;u=n}else{if((o&65535)>>>0<2048>>>0){if((d-m|0)<2){q=1;r=m;s=n;break L1}a[m]=p>>>6|192;a[m+1|0]=p&63|128;t=m+2|0;u=n;break}if((o&65535)>>>0<55296>>>0){if((d-m|0)<3){q=1;r=m;s=n;break L1}a[m]=p>>>12|224;a[m+1|0]=p>>>6&63|128;a[m+2|0]=p&63|128;t=m+3|0;u=n;break}if((o&65535)>>>0>=56320>>>0){if((o&65535)>>>0<57344>>>0){q=2;r=m;s=n;break L1}if((d-m|0)<3){q=1;r=m;s=n;break L1}a[m]=p>>>12|224;a[m+1|0]=p>>>6&63|128;a[m+2|0]=p&63|128;t=m+3|0;u=n;break}if((f-n|0)<4){q=1;r=m;s=n;break L1}v=n+2|0;w=e[v>>1]|0;if((w&64512|0)!=56320){q=2;r=m;s=n;break L1}if((d-m|0)<4){q=1;r=m;s=n;break L1}x=p&960;if(((x<<10)+65536|0)>>>0>1114111>>>0){q=2;r=m;s=n;break L1}y=(x>>>6)+1|0;a[m]=y>>>2|240;a[m+1|0]=p>>>2&15|y<<4&48|128;a[m+2|0]=p<<4&48|w>>>6&15|128;a[m+3|0]=w&63|128;t=m+4|0;u=v}}while(0);p=u+2|0;if(p>>>0<h>>>0){m=t;n=p}else{q=0;r=t;s=p;break}}}else{q=0;r=j;s=g}}while(0);c[i>>2]=g+(s-g>>1<<1);c[l>>2]=j+(r-j);return q|0}function pq(e,f,g,h,i,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;L1:do{if(g>>>0<h>>>0){f=h;e=k;m=j;n=g;while(1){if(m>>>0>=k>>>0){o=m;p=n;q=31;break L1}r=a[n]|0;s=r&255;do{if(r<<24>>24>-1){b[m>>1]=r&255;t=m;u=n+1|0}else{if((r&255)>>>0<194>>>0){v=2;w=m;x=n;break L1}if((r&255)>>>0<224>>>0){if((f-n|0)<2){v=1;w=m;x=n;break L1}y=d[n+1|0]|0;if((y&192|0)!=128){v=2;w=m;x=n;break L1}b[m>>1]=y&63|s<<6&1984;t=m;u=n+2|0;break}if((r&255)>>>0<240>>>0){if((f-n|0)<3){v=1;w=m;x=n;break L1}y=a[n+1|0]|0;z=a[n+2|0]|0;if((s|0)==224){if((y&-32)<<24>>24!=-96){v=2;w=m;x=n;break L1}}else if((s|0)==237){if((y&-32)<<24>>24!=-128){v=2;w=m;x=n;break L1}}else{if((y&-64)<<24>>24!=-128){v=2;w=m;x=n;break L1}}A=z&255;if((A&192|0)!=128){v=2;w=m;x=n;break L1}b[m>>1]=(y&255)<<6&4032|s<<12|A&63;t=m;u=n+3|0;break}if((r&255)>>>0>=245>>>0){v=2;w=m;x=n;break L1}if((f-n|0)<4){v=1;w=m;x=n;break L1}A=a[n+1|0]|0;y=a[n+2|0]|0;z=a[n+3|0]|0;if((s|0)==240){if((A+112&255)>>>0>=48>>>0){v=2;w=m;x=n;break L1}}else if((s|0)==244){if((A&-16)<<24>>24!=-128){v=2;w=m;x=n;break L1}}else{if((A&-64)<<24>>24!=-128){v=2;w=m;x=n;break L1}}B=y&255;if((B&192|0)!=128){v=2;w=m;x=n;break L1}y=z&255;if((y&192|0)!=128){v=2;w=m;x=n;break L1}if((e-m|0)<4){v=1;w=m;x=n;break L1}z=s&7;C=A&255;if((C<<12&196608|z<<18)>>>0>1114111>>>0){v=2;w=m;x=n;break L1}b[m>>1]=C<<2&60|B>>>4&3|((C>>>4&3|z<<2)<<6)+16320|55296;z=m+2|0;b[z>>1]=B<<6&960|y&63|56320;t=z;u=n+4|0}}while(0);s=t+2|0;if(u>>>0<h>>>0){m=s;n=u}else{o=s;p=u;q=31;break}}}else{o=j;p=g;q=31}}while(0);if((q|0)==31){v=p>>>0<h>>>0|0;w=o;x=p}c[i>>2]=g+(x-g);c[l>>2]=j+(w-j>>1<<1);return v|0}function pr(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function ps(a){a=a|0;return 0}function pt(a){a=a|0;return 0}function pu(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;L1:do{if(d>>>0<e>>>0&(f|0)!=0){c=e;b=0;g=d;L3:while(1){h=a[g]|0;i=h&255;do{if(h<<24>>24>-1){j=g+1|0;k=b}else{if((h&255)>>>0<194>>>0){l=g;break L1}if((h&255)>>>0<224>>>0){if((c-g|0)<2){l=g;break L1}if((a[g+1|0]&-64)<<24>>24!=-128){l=g;break L1}j=g+2|0;k=b;break}if((h&255)>>>0<240>>>0){m=g;if((c-m|0)<3){l=g;break L1}n=a[g+1|0]|0;o=a[g+2|0]|0;if((i|0)==224){if((n&-32)<<24>>24!=-96){p=14;break L3}}else if((i|0)==237){if((n&-32)<<24>>24!=-128){p=16;break L3}}else{if((n&-64)<<24>>24!=-128){p=18;break L3}}if((o&-64)<<24>>24!=-128){l=g;break L1}j=g+3|0;k=b;break}if((h&255)>>>0>=245>>>0){l=g;break L1}q=g;if((c-q|0)<4){l=g;break L1}if((f-b|0)>>>0<2>>>0){l=g;break L1}o=a[g+1|0]|0;n=a[g+2|0]|0;r=a[g+3|0]|0;if((i|0)==240){if((o+112&255)>>>0>=48>>>0){p=26;break L3}}else if((i|0)==244){if((o&-16)<<24>>24!=-128){p=28;break L3}}else{if((o&-64)<<24>>24!=-128){p=30;break L3}}if((n&-64)<<24>>24!=-128){l=g;break L1}if((r&-64)<<24>>24!=-128){l=g;break L1}if(((o&255)<<12&196608|i<<18&1835008)>>>0>1114111>>>0){l=g;break L1}j=g+4|0;k=b+1|0}}while(0);i=k+1|0;if(j>>>0<e>>>0&i>>>0<f>>>0){b=i;g=j}else{l=j;break L1}}if((p|0)==14){s=m-d|0;return s|0}else if((p|0)==16){s=m-d|0;return s|0}else if((p|0)==18){s=m-d|0;return s|0}else if((p|0)==26){s=q-d|0;return s|0}else if((p|0)==28){s=q-d|0;return s|0}else if((p|0)==30){s=q-d|0;return s|0}}else{l=d}}while(0);s=l-d|0;return s|0}function pv(a){a=a|0;return 4}function pw(a){a=a|0;if((a|0)==0){return}qI(a);return}function px(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0;L1:do{if(e>>>0<f>>>0){d=i;b=h;k=e;while(1){l=c[k>>2]|0;if((l&-2048|0)==55296|l>>>0>1114111>>>0){m=2;n=b;o=k;break L1}do{if(l>>>0<128>>>0){if((d-b|0)<1){m=1;n=b;o=k;break L1}a[b]=l;p=b+1|0}else{if(l>>>0<2048>>>0){if((d-b|0)<2){m=1;n=b;o=k;break L1}a[b]=l>>>6|192;a[b+1|0]=l&63|128;p=b+2|0;break}q=d-b|0;if(l>>>0<65536>>>0){if((q|0)<3){m=1;n=b;o=k;break L1}a[b]=l>>>12|224;a[b+1|0]=l>>>6&63|128;a[b+2|0]=l&63|128;p=b+3|0;break}else{if((q|0)<4){m=1;n=b;o=k;break L1}a[b]=l>>>18|240;a[b+1|0]=l>>>12&63|128;a[b+2|0]=l>>>6&63|128;a[b+3|0]=l&63|128;p=b+4|0;break}}}while(0);l=k+4|0;if(l>>>0<f>>>0){b=p;k=l}else{m=0;n=p;o=l;break}}}else{m=0;n=h;o=e}}while(0);c[g>>2]=e+(o-e>>2<<2);c[j>>2]=h+(n-h);return m|0}function py(b,e,f,g,h,i,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;L1:do{if(f>>>0<g>>>0){e=g;b=i;l=f;while(1){if(b>>>0>=j>>>0){m=b;n=l;o=30;break L1}p=a[l]|0;q=p&255;do{if(p<<24>>24>-1){c[b>>2]=q;r=l+1|0}else{if((p&255)>>>0<194>>>0){s=2;t=b;u=l;break L1}if((p&255)>>>0<224>>>0){if((e-l|0)<2){s=1;t=b;u=l;break L1}v=d[l+1|0]|0;if((v&192|0)!=128){s=2;t=b;u=l;break L1}c[b>>2]=v&63|q<<6&1984;r=l+2|0;break}if((p&255)>>>0<240>>>0){if((e-l|0)<3){s=1;t=b;u=l;break L1}v=a[l+1|0]|0;w=a[l+2|0]|0;if((q|0)==224){if((v&-32)<<24>>24!=-96){s=2;t=b;u=l;break L1}}else if((q|0)==237){if((v&-32)<<24>>24!=-128){s=2;t=b;u=l;break L1}}else{if((v&-64)<<24>>24!=-128){s=2;t=b;u=l;break L1}}x=w&255;if((x&192|0)!=128){s=2;t=b;u=l;break L1}c[b>>2]=(v&255)<<6&4032|q<<12&61440|x&63;r=l+3|0;break}if((p&255)>>>0>=245>>>0){s=2;t=b;u=l;break L1}if((e-l|0)<4){s=1;t=b;u=l;break L1}x=a[l+1|0]|0;v=a[l+2|0]|0;w=a[l+3|0]|0;if((q|0)==240){if((x+112&255)>>>0>=48>>>0){s=2;t=b;u=l;break L1}}else if((q|0)==244){if((x&-16)<<24>>24!=-128){s=2;t=b;u=l;break L1}}else{if((x&-64)<<24>>24!=-128){s=2;t=b;u=l;break L1}}y=v&255;if((y&192|0)!=128){s=2;t=b;u=l;break L1}v=w&255;if((v&192|0)!=128){s=2;t=b;u=l;break L1}w=(x&255)<<12&258048|q<<18&1835008|y<<6&4032|v&63;if(w>>>0>1114111>>>0){s=2;t=b;u=l;break L1}c[b>>2]=w;r=l+4|0}}while(0);q=b+4|0;if(r>>>0<g>>>0){b=q;l=r}else{m=q;n=r;o=30;break}}}else{m=i;n=f;o=30}}while(0);if((o|0)==30){s=n>>>0<g>>>0|0;t=m;u=n}c[h>>2]=f+(u-f);c[k>>2]=i+(t-i>>2<<2);return s|0}function pz(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function pA(a){a=a|0;return 0}function pB(a){a=a|0;return 0}function pC(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;L1:do{if(d>>>0<e>>>0&(f|0)!=0){c=e;b=1;g=d;L3:while(1){h=a[g]|0;i=h&255;do{if(h<<24>>24>-1){j=g+1|0}else{if((h&255)>>>0<194>>>0){k=g;break L1}if((h&255)>>>0<224>>>0){if((c-g|0)<2){k=g;break L1}if((a[g+1|0]&-64)<<24>>24!=-128){k=g;break L1}j=g+2|0;break}if((h&255)>>>0<240>>>0){l=g;if((c-l|0)<3){k=g;break L1}m=a[g+1|0]|0;n=a[g+2|0]|0;if((i|0)==224){if((m&-32)<<24>>24!=-96){o=14;break L3}}else if((i|0)==237){if((m&-32)<<24>>24!=-128){o=16;break L3}}else{if((m&-64)<<24>>24!=-128){o=18;break L3}}if((n&-64)<<24>>24!=-128){k=g;break L1}j=g+3|0;break}if((h&255)>>>0>=245>>>0){k=g;break L1}p=g;if((c-p|0)<4){k=g;break L1}n=a[g+1|0]|0;m=a[g+2|0]|0;q=a[g+3|0]|0;if((i|0)==240){if((n+112&255)>>>0>=48>>>0){o=25;break L3}}else if((i|0)==244){if((n&-16)<<24>>24!=-128){o=27;break L3}}else{if((n&-64)<<24>>24!=-128){o=29;break L3}}if((m&-64)<<24>>24!=-128){k=g;break L1}if((q&-64)<<24>>24!=-128){k=g;break L1}if(((n&255)<<12&196608|i<<18&1835008)>>>0>1114111>>>0){k=g;break L1}j=g+4|0}}while(0);if(!(j>>>0<e>>>0&b>>>0<f>>>0)){k=j;break L1}b=b+1|0;g=j}if((o|0)==14){r=l-d|0;return r|0}else if((o|0)==16){r=l-d|0;return r|0}else if((o|0)==18){r=l-d|0;return r|0}else if((o|0)==25){r=p-d|0;return r|0}else if((o|0)==27){r=p-d|0;return r|0}else if((o|0)==29){r=p-d|0;return r|0}}else{k=d}}while(0);r=k-d|0;return r|0}function pD(a){a=a|0;return 4}function pE(a){a=a|0;if((a|0)==0){return}qI(a);return}function pF(a){a=a|0;if((a|0)==0){return}qI(a);return}function pG(b){b=b|0;var d=0;c[b>>2]=3808;do{if((a[b+12|0]&1)!=0){d=c[b+20>>2]|0;if((d|0)!=0){qI(d)}if((b|0)!=0){break}return}}while(0);qI(b);return}function pH(b){b=b|0;var d=0;c[b>>2]=3808;if((a[b+12|0]&1)==0){return}d=c[b+20>>2]|0;if((d|0)==0){return}qI(d);return}function pI(b){b=b|0;var d=0;c[b>>2]=3764;do{if((a[b+16|0]&1)!=0){d=c[b+24>>2]|0;if((d|0)!=0){qI(d)}if((b|0)!=0){break}return}}while(0);qI(b);return}function pJ(b){b=b|0;var d=0;c[b>>2]=3764;if((a[b+16|0]&1)==0){return}d=c[b+24>>2]|0;if((d|0)==0){return}qI(d);return}function pK(b){b=b|0;return a[b+8|0]|0}function pL(a){a=a|0;return c[a+8>>2]|0}function pM(b){b=b|0;return a[b+9|0]|0}function pN(a){a=a|0;return c[a+12>>2]|0}function pO(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=d+12|0;if((a[e]&1)==0){f=b;c[f>>2]=c[e>>2];c[f+4>>2]=c[e+4>>2];c[f+8>>2]=c[e+8>>2];return}e=c[d+20>>2]|0;f=c[d+16>>2]|0;if(f>>>0>4294967279>>>0){kF()}do{if(f>>>0<11>>>0){a[b]=f<<1;g=b+1|0}else{d=f+16&-16;h=(d|0)==0?1:d;while(1){i=qH(h)|0;if((i|0)!=0){j=18;break}k=(I=c[7664]|0,c[7664]=I+0,I);if((k|0)==0){break}b8[k&1]()}if((j|0)==18){c[b+8>>2]=i;c[b>>2]=d|1;c[b+4>>2]=f;g=i;break}h=bR(4)|0;c[h>>2]=3284;bl(h|0,24120,94)}}while(0);qQ(g|0,e|0,f)|0;a[g+f|0]=0;return}function pP(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=d+16|0;if((a[e]&1)==0){f=b;c[f>>2]=c[e>>2];c[f+4>>2]=c[e+4>>2];c[f+8>>2]=c[e+8>>2];return}e=c[d+24>>2]|0;f=c[d+20>>2]|0;if(f>>>0>4294967279>>>0){kF()}do{if(f>>>0<11>>>0){a[b]=f<<1;g=b+1|0}else{d=f+16&-16;h=(d|0)==0?1:d;while(1){i=qH(h)|0;if((i|0)!=0){j=18;break}k=(I=c[7664]|0,c[7664]=I+0,I);if((k|0)==0){break}b8[k&1]()}if((j|0)==18){c[b+8>>2]=i;c[b>>2]=d|1;c[b+4>>2]=f;g=i;break}h=bR(4)|0;c[h>>2]=3284;bl(h|0,24120,94)}}while(0);qQ(g|0,e|0,f)|0;a[g+f|0]=0;return}function pQ(b,c){b=b|0;c=c|0;c=b;a[b]=8;b=c+1|0;C=1702195828;a[b]=C;C=C>>8;a[b+1|0]=C;C=C>>8;a[b+2|0]=C;C=C>>8;a[b+3|0]=C;a[c+5|0]=0;return}function pR(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;while(1){d=qH(32)|0;if((d|0)!=0){break}b=(I=c[7664]|0,c[7664]=I+0,I);if((b|0)==0){e=9;break}b8[b&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94)}e=d;c[a+8>>2]=e;c[a>>2]=9;c[a+4>>2]=4;a=1292;b=4;f=e;while(1){e=b-1|0;c[f>>2]=c[a>>2];if((e|0)==0){break}else{a=a+4|0;b=e;f=f+4|0}}c[d+16>>2]=0;return}function pS(b,c){b=b|0;c=c|0;c=b;a[b]=10;b=c+1|0;a[b]=a[1188]|0;a[b+1|0]=a[1189]|0;a[b+2|0]=a[1190]|0;a[b+3|0]=a[1191]|0;a[b+4|0]=a[1192]|0;a[c+6|0]=0;return}function pT(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;while(1){d=qH(32)|0;if((d|0)!=0){break}b=(I=c[7664]|0,c[7664]=I+0,I);if((b|0)==0){e=9;break}b8[b&1]()}if((e|0)==9){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94)}e=d;c[a+8>>2]=e;c[a>>2]=9;c[a+4>>2]=5;a=1160;b=5;f=e;while(1){e=b-1|0;c[f>>2]=c[a>>2];if((e|0)==0){break}else{a=a+4|0;b=e;f=f+4|0}}c[d+20>>2]=0;return}function pU(b){b=b|0;var d=0;if((a[30820]|0)!=0){d=c[7314]|0;return d|0}if((bd(30820)|0)==0){d=c[7314]|0;return d|0}do{if((a[30692]|0)==0){if((bd(30692)|0)==0){break}qP(28348,0,168)|0;a0(782,0,u|0)|0}}while(0);kH(28348,1500);kH(28360,1492);kH(28372,1484);kH(28384,1472);kH(28396,1460);kH(28408,1452);kH(28420,1440);kH(28432,1436);kH(28444,1432);kH(28456,1428);kH(28468,1424);kH(28480,1420);kH(28492,1400);kH(28504,1396);c[7314]=28348;d=c[7314]|0;return d|0}function pV(b){b=b|0;var d=0;if((a[30764]|0)!=0){d=c[7299]|0;return d|0}if((bd(30764)|0)==0){d=c[7299]|0;return d|0}do{if((a[30668]|0)==0){if((bd(30668)|0)==0){break}qP(27604,0,168)|0;a0(342,0,u|0)|0}}while(0);kO(27604,1900,6);kO(27616,1872,6);kO(27628,1840,7);kO(27640,1760,9);kO(27652,1724,8);kO(27664,1696,6);kO(27676,1660,8);kO(27688,1644,3);kO(27700,1592,3);kO(27712,1576,3);kO(27724,1560,3);kO(27736,1544,3);kO(27748,1528,3);kO(27760,1512,3);c[7299]=27604;d=c[7299]|0;return d|0}function pW(b){b=b|0;var d=0;if((a[30812]|0)!=0){d=c[7313]|0;return d|0}if((bd(30812)|0)==0){d=c[7313]|0;return d|0}do{if((a[30684]|0)==0){if((bd(30684)|0)==0){break}qP(28060,0,288)|0;a0(486,0,u|0)|0}}while(0);kH(28060,276);kH(28072,264);kH(28084,256);kH(28096,248);kH(28108,244);kH(28120,236);kH(28132,228);kH(28144,220);kH(28156,168);kH(28168,160);kH(28180,148);kH(28192,136);kH(28204,132);kH(28216,128);kH(28228,124);kH(28240,120);kH(28252,244);kH(28264,116);kH(28276,112);kH(28288,1944);kH(28300,1940);kH(28312,1936);kH(28324,1932);kH(28336,1928);c[7313]=28060;d=c[7313]|0;return d|0}function pX(b){b=b|0;var d=0;if((a[30756]|0)!=0){d=c[7298]|0;return d|0}if((bd(30756)|0)==0){d=c[7298]|0;return d|0}do{if((a[30660]|0)==0){if((bd(30660)|0)==0){break}qP(27316,0,288)|0;a0(660,0,u|0)|0}}while(0);kO(27316,808,7);kO(27328,772,8);kO(27340,748,5);kO(27352,724,5);kO(27364,412,3);kO(27376,704,4);kO(27388,684,4);kO(27400,656,6);kO(27412,616,9);kO(27424,564,7);kO(27436,528,8);kO(27448,492,8);kO(27460,476,3);kO(27472,460,3);kO(27484,444,3);kO(27496,428,3);kO(27508,412,3);kO(27520,396,3);kO(27532,380,3);kO(27544,364,3);kO(27556,348,3);kO(27568,332,3);kO(27580,316,3);kO(27592,300,3);c[7298]=27316;d=c[7298]|0;return d|0}function pY(b){b=b|0;var d=0;if((a[30828]|0)!=0){d=c[7315]|0;return d|0}if((bd(30828)|0)==0){d=c[7315]|0;return d|0}do{if((a[30700]|0)==0){if((bd(30700)|0)==0){break}qP(28516,0,288)|0;a0(376,0,u|0)|0}}while(0);kH(28516,844);kH(28528,840);c[7315]=28516;d=c[7315]|0;return d|0}function pZ(b){b=b|0;var d=0;if((a[30772]|0)!=0){d=c[7300]|0;return d|0}if((bd(30772)|0)==0){d=c[7300]|0;return d|0}do{if((a[30676]|0)==0){if((bd(30676)|0)==0){break}qP(27772,0,288)|0;a0(512,0,u|0)|0}}while(0);kO(27772,860,2);kO(27784,848,2);c[7300]=27772;d=c[7300]|0;return d|0}function p_(b){b=b|0;var c=0;if((a[30836]|0)!=0){return 29264}if((bd(30836)|0)==0){return 29264}a[29264]=16;b=29265;c=b|0;C=623865125;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;c=b+4|0;C=2032480100;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;a[29273]=0;a0(770,29264,u|0)|0;return 29264}function p$(b){b=b|0;var d=0,e=0,f=0,g=0;if((a[30780]|0)!=0){return 29204}if((bd(30780)|0)==0){return 29204}while(1){d=qH(48)|0;if((d|0)!=0){break}b=(I=c[7664]|0,c[7664]=I+0,I);if((b|0)==0){e=11;break}b8[b&1]()}if((e|0)==11){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}e=d;c[7303]=e;c[7301]=13;c[7302]=8;b=1124;f=8;g=e;while(1){e=f-1|0;c[g>>2]=c[b>>2];if((e|0)==0){break}else{b=b+4|0;f=e;g=g+4|0}}c[d+32>>2]=0;a0(562,29204,u|0)|0;return 29204}function p0(b){b=b|0;var c=0;if((a[30860]|0)!=0){return 29300}if((bd(30860)|0)==0){return 29300}a[29300]=16;b=29301;c=b|0;C=624576549;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;c=b+4|0;C=1394948685;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;a[29309]=0;a0(770,29300,u|0)|0;return 29300}function p1(b){b=b|0;var d=0,e=0,f=0,g=0;if((a[30804]|0)!=0){return 29240}if((bd(30804)|0)==0){return 29240}while(1){d=qH(48)|0;if((d|0)!=0){break}b=(I=c[7664]|0,c[7664]=I+0,I);if((b|0)==0){e=11;break}b8[b&1]()}if((e|0)==11){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}e=d;c[7312]=e;c[7310]=13;c[7311]=8;b=1072;f=8;g=e;while(1){e=f-1|0;c[g>>2]=c[b>>2];if((e|0)==0){break}else{b=b+4|0;f=e;g=g+4|0}}c[d+32>>2]=0;a0(562,29240,u|0)|0;return 29240}function p2(b){b=b|0;var d=0,e=0;if((a[30852]|0)!=0){return 29288}if((bd(30852)|0)==0){return 29288}while(1){d=qH(32)|0;if((d|0)!=0){e=13;break}b=(I=c[7664]|0,c[7664]=I+0,I);if((b|0)==0){e=11;break}b8[b&1]()}if((e|0)==11){b=bR(4)|0;c[b>>2]=3284;bl(b|0,24120,94);return 0}else if((e|0)==13){c[7324]=d;c[7322]=33;c[7323]=20;qQ(d|0,1048,20)|0;a[d+20|0]=0;a0(770,29288,u|0)|0;return 29288}return 0}function p3(b){b=b|0;var d=0,e=0,f=0,g=0;if((a[30796]|0)!=0){return 29228}if((bd(30796)|0)==0){return 29228}while(1){d=qH(96)|0;if((d|0)!=0){break}b=(I=c[7664]|0,c[7664]=I+0,I);if((b|0)==0){e=11;break}b8[b&1]()}if((e|0)==11){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}e=d;c[7309]=e;c[7307]=25;c[7308]=20;b=964;f=20;g=e;while(1){e=f-1|0;c[g>>2]=c[b>>2];if((e|0)==0){break}else{b=b+4|0;f=e;g=g+4|0}}c[d+80>>2]=0;a0(562,29228,u|0)|0;return 29228}function p4(b){b=b|0;var d=0,e=0;if((a[30844]|0)!=0){return 29276}if((bd(30844)|0)==0){return 29276}while(1){d=qH(16)|0;if((d|0)!=0){e=13;break}b=(I=c[7664]|0,c[7664]=I+0,I);if((b|0)==0){e=11;break}b8[b&1]()}if((e|0)==11){b=bR(4)|0;c[b>>2]=3284;bl(b|0,24120,94);return 0}else if((e|0)==13){c[7321]=d;c[7319]=17;c[7320]=11;qQ(d|0,952,11)|0;a[d+11|0]=0;a0(770,29276,u|0)|0;return 29276}return 0}function p5(b){b=b|0;var d=0,e=0,f=0,g=0;if((a[30788]|0)!=0){return 29216}if((bd(30788)|0)==0){return 29216}while(1){d=qH(48)|0;if((d|0)!=0){break}b=(I=c[7664]|0,c[7664]=I+0,I);if((b|0)==0){e=11;break}b8[b&1]()}if((e|0)==11){e=bR(4)|0;c[e>>2]=3284;bl(e|0,24120,94);return 0}e=d;c[7306]=e;c[7304]=13;c[7305]=11;b=904;f=11;g=e;while(1){e=f-1|0;c[g>>2]=c[b>>2];if((e|0)==0){break}else{b=b+4|0;f=e;g=g+4|0}}c[d+44>>2]=0;a0(562,29216,u|0)|0;return 29216}function p6(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+4|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;h=1.1125369292536007e-308;i=f;return+h}j=bA()|0;k=c[j>>2]|0;c[j>>2]=0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);l=+qO(b,g);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=1.1125369292536007e-308;i=f;return+h}if((b|0)!=34){h=l;i=f;return+h}c[e>>2]=4;h=l;i=f;return+h}function p7(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+4|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=bA()|0;k=c[j>>2]|0;c[j>>2]=0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);l=+qO(b,g);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)!=34){h=l;i=f;return+h}c[e>>2]=4;h=l;i=f;return+h}function p8(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+4|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=bA()|0;k=c[j>>2]|0;c[j>>2]=0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);l=+qO(b,g);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)==34){c[e>>2]=4}h=l;i=f;return+h}function p9(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+4|0;h=g|0;do{if((b|0)==(d|0)){c[e>>2]=4;j=0;k=0}else{if((a[b]|0)==45){c[e>>2]=4;j=0;k=0;break}l=bA()|0;m=c[l>>2]|0;c[l>>2]=0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);n=aI(b|0,h|0,f|0,c[7204]|0)|0;o=c[l>>2]|0;if((o|0)==0){c[l>>2]=m}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;k=0;break}if((o|0)!=34){j=K;k=n;break}c[e>>2]=4;j=-1;k=-1}}while(0);i=g;return(K=j,k)|0}function qa(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+4|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=bA()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);m=aI(b|0,h|0,f|0,c[7204]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&m>>>0>-1>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function qb(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+4|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=bA()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);m=aI(b|0,h|0,f|0,c[7204]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&m>>>0>-1>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function qc(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+4|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=bA()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);m=aI(b|0,h|0,f|0,c[7204]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&m>>>0>65535>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m&65535;i=g;return j|0}return 0}function qd(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+4|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;k=0;i=g;return(K=j,k)|0}l=bA()|0;m=c[l>>2]|0;c[l>>2]=0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);n=bN(b|0,h|0,f|0,c[7204]|0)|0;f=K;b=c[l>>2]|0;if((b|0)==0){c[l>>2]=m}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;k=0;i=g;return(K=j,k)|0}if((b|0)!=34){j=f;k=n;i=g;return(K=j,k)|0}c[e>>2]=4;e=0;b=(f|0)>(e|0)|(f|0)==(e|0)&n>>>0>0>>>0;j=b?2147483647:-2147483648;k=b?-1:0;i=g;return(K=j,k)|0}function qe(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+4|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}k=bA()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[30724]|0)==0){if((bd(30724)|0)==0){break}c[7204]=aS(2147483647,1344,0)|0}}while(0);m=bN(b|0,h|0,f|0,c[7204]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=-1;h=0;if((b|0)==34|((f|0)<(d|0)|(f|0)==(d|0)&m>>>0<-2147483648>>>0)|((f|0)>(h|0)|(f|0)==(h|0)&m>>>0>2147483647>>>0)){c[e>>2]=4;e=0;j=(f|0)>(e|0)|(f|0)==(e|0)&m>>>0>0>>>0?2147483647:-2147483648;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function qf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;e=b+8|0;f=b+4|0;g=c[f>>2]|0;h=c[e>>2]|0;i=g;if(h-i>>2>>>0>=d>>>0){j=d;k=g;do{if((k|0)==0){l=0}else{c[k>>2]=0;l=c[f>>2]|0}k=l+4|0;c[f>>2]=k;j=j-1|0;}while((j|0)!=0);return}j=b+16|0;k=b|0;l=c[k>>2]|0;g=i-l>>2;i=g+d|0;if(i>>>0>1073741823>>>0){oG()}m=h-l|0;do{if(m>>2>>>0>536870910>>>0){n=1073741823;o=11}else{l=m>>1;h=l>>>0<i>>>0?i:l;if((h|0)==0){p=0;q=0;break}l=b+128|0;if(!((a[l]&1)==0&h>>>0<29>>>0)){n=h;o=11;break}a[l]=1;p=j;q=h}}while(0);do{if((o|0)==11){i=n<<2;m=(i|0)==0?1:i;while(1){r=qH(m)|0;if((r|0)!=0){o=22;break}i=(I=c[7664]|0,c[7664]=I+0,I);if((i|0)==0){break}b8[i&1]()}if((o|0)==22){p=r;q=n;break}m=bR(4)|0;c[m>>2]=3284;bl(m|0,24120,94)}}while(0);n=d;d=p+(g<<2)|0;do{if((d|0)==0){s=0}else{c[d>>2]=0;s=d}d=s+4|0;n=n-1|0;}while((n|0)!=0);n=c[k>>2]|0;s=(c[f>>2]|0)-n|0;r=p+(g-(s>>2)<<2)|0;g=n;qQ(r|0,g|0,s)|0;c[k>>2]=r;c[f>>2]=d;c[e>>2]=p+(q<<2);if((n|0)==0){return}if((n|0)==(j|0)){a[b+128|0]=0;return}else{qI(g);return}}function qg(b){b=b|0;do{if((a[28048]&1)!=0){b=c[7014]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28036]&1)!=0){b=c[7011]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28024]&1)!=0){b=c[7008]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28012]&1)!=0){b=c[7005]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28e3]&1)!=0){b=c[7002]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27988]&1)!=0){b=c[6999]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27976]&1)!=0){b=c[6996]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27964]&1)!=0){b=c[6993]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27952]&1)!=0){b=c[6990]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27940]&1)!=0){b=c[6987]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27928]&1)!=0){b=c[6984]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27916]&1)!=0){b=c[6981]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27904]&1)!=0){b=c[6978]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27892]&1)!=0){b=c[6975]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27880]&1)!=0){b=c[6972]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27868]&1)!=0){b=c[6969]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27856]&1)!=0){b=c[6966]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27844]&1)!=0){b=c[6963]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27832]&1)!=0){b=c[6960]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27820]&1)!=0){b=c[6957]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27808]&1)!=0){b=c[6954]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27796]&1)!=0){b=c[6951]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27784]&1)!=0){b=c[6948]|0;if((b|0)==0){break}qI(b)}}while(0);if((a[27772]&1)==0){return}b=c[6945]|0;if((b|0)==0){return}qI(b);return}function qh(b){b=b|0;do{if((a[28792]&1)!=0){b=c[7200]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28780]&1)!=0){b=c[7197]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28768]&1)!=0){b=c[7194]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28756]&1)!=0){b=c[7191]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28744]&1)!=0){b=c[7188]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28732]&1)!=0){b=c[7185]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28720]&1)!=0){b=c[7182]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28708]&1)!=0){b=c[7179]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28696]&1)!=0){b=c[7176]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28684]&1)!=0){b=c[7173]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28672]&1)!=0){b=c[7170]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28660]&1)!=0){b=c[7167]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28648]&1)!=0){b=c[7164]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28636]&1)!=0){b=c[7161]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28624]&1)!=0){b=c[7158]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28612]&1)!=0){b=c[7155]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28600]&1)!=0){b=c[7152]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28588]&1)!=0){b=c[7149]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28576]&1)!=0){b=c[7146]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28564]&1)!=0){b=c[7143]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28552]&1)!=0){b=c[7140]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28540]&1)!=0){b=c[7137]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28528]&1)!=0){b=c[7134]|0;if((b|0)==0){break}qI(b)}}while(0);if((a[28516]&1)==0){return}b=c[7131]|0;if((b|0)==0){return}qI(b);return}function qi(b){b=b|0;do{if((a[27592]&1)!=0){b=c[6900]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27580]&1)!=0){b=c[6897]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27568]&1)!=0){b=c[6894]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27556]&1)!=0){b=c[6891]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27544]&1)!=0){b=c[6888]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27532]&1)!=0){b=c[6885]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27520]&1)!=0){b=c[6882]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27508]&1)!=0){b=c[6879]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27496]&1)!=0){b=c[6876]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27484]&1)!=0){b=c[6873]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27472]&1)!=0){b=c[6870]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27460]&1)!=0){b=c[6867]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27448]&1)!=0){b=c[6864]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27436]&1)!=0){b=c[6861]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27424]&1)!=0){b=c[6858]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27412]&1)!=0){b=c[6855]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27400]&1)!=0){b=c[6852]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27388]&1)!=0){b=c[6849]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27376]&1)!=0){b=c[6846]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27364]&1)!=0){b=c[6843]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27352]&1)!=0){b=c[6840]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27340]&1)!=0){b=c[6837]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27328]&1)!=0){b=c[6834]|0;if((b|0)==0){break}qI(b)}}while(0);if((a[27316]&1)==0){return}b=c[6831]|0;if((b|0)==0){return}qI(b);return}function qj(b){b=b|0;do{if((a[28336]&1)!=0){b=c[7086]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28324]&1)!=0){b=c[7083]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28312]&1)!=0){b=c[7080]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28300]&1)!=0){b=c[7077]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28288]&1)!=0){b=c[7074]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28276]&1)!=0){b=c[7071]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28264]&1)!=0){b=c[7068]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28252]&1)!=0){b=c[7065]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28240]&1)!=0){b=c[7062]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28228]&1)!=0){b=c[7059]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28216]&1)!=0){b=c[7056]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28204]&1)!=0){b=c[7053]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28192]&1)!=0){b=c[7050]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28180]&1)!=0){b=c[7047]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28168]&1)!=0){b=c[7044]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28156]&1)!=0){b=c[7041]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28144]&1)!=0){b=c[7038]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28132]&1)!=0){b=c[7035]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28120]&1)!=0){b=c[7032]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28108]&1)!=0){b=c[7029]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28096]&1)!=0){b=c[7026]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28084]&1)!=0){b=c[7023]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28072]&1)!=0){b=c[7020]|0;if((b|0)==0){break}qI(b)}}while(0);if((a[28060]&1)==0){return}b=c[7017]|0;if((b|0)==0){return}qI(b);return}function qk(b){b=b|0;do{if((a[27760]&1)!=0){b=c[6942]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27748]&1)!=0){b=c[6939]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27736]&1)!=0){b=c[6936]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27724]&1)!=0){b=c[6933]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27712]&1)!=0){b=c[6930]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27700]&1)!=0){b=c[6927]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27688]&1)!=0){b=c[6924]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27676]&1)!=0){b=c[6921]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27664]&1)!=0){b=c[6918]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27652]&1)!=0){b=c[6915]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27640]&1)!=0){b=c[6912]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27628]&1)!=0){b=c[6909]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[27616]&1)!=0){b=c[6906]|0;if((b|0)==0){break}qI(b)}}while(0);if((a[27604]&1)==0){return}b=c[6903]|0;if((b|0)==0){return}qI(b);return}function ql(b){b=b|0;do{if((a[28504]&1)!=0){b=c[7128]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28492]&1)!=0){b=c[7125]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28480]&1)!=0){b=c[7122]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28468]&1)!=0){b=c[7119]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28456]&1)!=0){b=c[7116]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28444]&1)!=0){b=c[7113]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28432]&1)!=0){b=c[7110]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28420]&1)!=0){b=c[7107]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28408]&1)!=0){b=c[7104]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28396]&1)!=0){b=c[7101]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28384]&1)!=0){b=c[7098]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28372]&1)!=0){b=c[7095]|0;if((b|0)==0){break}qI(b)}}while(0);do{if((a[28360]&1)!=0){b=c[7092]|0;if((b|0)==0){break}qI(b)}}while(0);if((a[28348]&1)==0){return}b=c[7089]|0;if((b|0)==0){return}qI(b);return}function qm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,t=0,u=0,v=0,w=0;g=i;i=i+4|0;h=g|0;c[h>>2]=b;j=((f|0)==0?26836:f)|0;f=c[j>>2]|0;L1:do{if((d|0)==0){if((f|0)==0){k=0}else{break}i=g;return k|0}else{if((b|0)==0){l=h;c[h>>2]=l;m=l}else{m=b}if((e|0)==0){k=-2;i=g;return k|0}do{if((f|0)==0){l=a[d]|0;n=l&255;if(l<<24>>24>-1){c[m>>2]=n;k=l<<24>>24!=0|0;i=g;return k|0}else{l=n-194|0;if(l>>>0>50>>>0){break L1}o=d+1|0;p=c[s+(l<<2)>>2]|0;q=e-1|0;break}}else{o=d;p=f;q=e}}while(0);L17:do{if((q|0)==0){r=p}else{l=a[o]|0;n=(l&255)>>>3;if((n-16|n+(p>>26))>>>0>7>>>0){break L1}else{t=o;u=p;v=q;w=l}while(1){t=t+1|0;u=u<<6|(w&255)-128;v=v-1|0;if((u|0)>=0){break}if((v|0)==0){r=u;break L17}w=a[t]|0;if(((w&255)-128|0)>>>0>63>>>0){break L1}}c[j>>2]=0;c[m>>2]=u;k=e-v|0;i=g;return k|0}}while(0);c[j>>2]=r;k=-2;i=g;return k|0}}while(0);c[j>>2]=0;c[(bA()|0)>>2]=84;k=-1;i=g;return k|0}function qn(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0;h=c[e>>2]|0;do{if((g|0)==0){i=5}else{j=g|0;k=c[j>>2]|0;if((k|0)==0){i=5;break}if((b|0)==0){l=k;m=h;n=f;i=16;break}c[j>>2]=0;o=k;p=h;q=b;r=f;i=36}}while(0);if((i|0)==5){if((b|0)==0){t=h;u=f;i=7}else{v=h;w=b;x=f;i=6}}L7:while(1){if((i|0)==36){i=0;h=d[p]|0;g=h>>>3;if((g-16|g+(o>>26))>>>0>7>>>0){i=37;break}g=p+1|0;y=h-128|o<<6;do{if((y|0)<0){h=(d[g]|0)-128|0;if(h>>>0>63>>>0){i=40;break L7}k=p+2|0;z=h|y<<6;if((z|0)>=0){A=z;B=k;break}h=(d[k]|0)-128|0;if(h>>>0>63>>>0){i=43;break L7}A=h|z<<6;B=p+3|0}else{A=y;B=g}}while(0);c[q>>2]=A;v=B;w=q+4|0;x=r-1|0;i=6;continue}else if((i|0)==16){i=0;g=(d[m]|0)>>>3;if((g-16|g+(l>>26))>>>0>7>>>0){i=17;break}g=m+1|0;do{if((l&33554432|0)==0){C=g}else{if(((d[g]|0)-128|0)>>>0>63>>>0){i=20;break L7}h=m+2|0;if((l&524288|0)==0){C=h;break}if(((d[h]|0)-128|0)>>>0>63>>>0){i=23;break L7}C=m+3|0}}while(0);t=C;u=n-1|0;i=7;continue}else if((i|0)==6){i=0;if((x|0)==0){D=f;i=59;break}else{E=x;F=w;G=v}while(1){g=a[G]|0;do{if(((g&255)-1|0)>>>0<127>>>0){if((G&3|0)==0&E>>>0>3>>>0){H=E;I=F;J=G}else{K=G;L=F;M=E;N=g;break}while(1){O=c[J>>2]|0;if(((O-16843009|O)&-2139062144|0)!=0){i=31;break}c[I>>2]=O&255;c[I+4>>2]=d[J+1|0]|0;c[I+8>>2]=d[J+2|0]|0;P=J+4|0;Q=I+16|0;c[I+12>>2]=d[J+3|0]|0;R=H-4|0;if(R>>>0>3>>>0){H=R;I=Q;J=P}else{i=30;break}}if((i|0)==31){i=0;K=J;L=I;M=H;N=O&255;break}else if((i|0)==30){i=0;K=P;L=Q;M=R;N=a[P]|0;break}}else{K=G;L=F;M=E;N=g}}while(0);S=N&255;if((S-1|0)>>>0>=127>>>0){break}c[L>>2]=S;g=M-1|0;if((g|0)==0){D=f;i=55;break L7}else{E=g;F=L+4|0;G=K+1|0}}g=S-194|0;if(g>>>0>50>>>0){T=M;U=L;V=K;W=N;i=48;break}o=c[s+(g<<2)>>2]|0;p=K+1|0;q=L;r=M;i=36;continue}else if((i|0)==7){i=0;g=a[t]|0;do{if(((g&255)-1|0)>>>0<127>>>0){if((t&3|0)!=0){X=t;Y=u;Z=g;break}h=c[t>>2]|0;if(((h-16843009|h)&-2139062144|0)==0){k=u;j=t;while(1){_=j+4|0;$=k-4|0;aa=c[_>>2]|0;if(((aa-16843009|aa)&-2139062144|0)==0){k=$;j=_}else{ab=$;ac=_;ad=aa;break}}}else{ab=u;ac=t;ad=h}X=ac;Y=ab;Z=ad&255}else{X=t;Y=u;Z=g}}while(0);g=Z&255;if((g-1|0)>>>0<127>>>0){t=X+1|0;u=Y-1|0;i=7;continue}j=g-194|0;if(j>>>0>50>>>0){T=Y;U=b;V=X;W=Z;i=48;break}l=c[s+(j<<2)>>2]|0;m=X+1|0;n=Y;i=16;continue}}if((i|0)==37){ae=o;af=p-1|0;ag=q;ah=r;i=46}else if((i|0)==55){return D|0}else if((i|0)==59){return D|0}else if((i|0)==40){ae=y;af=p-1|0;ag=q;ah=r;i=46}else if((i|0)==20){ae=l;af=m-1|0;ag=b;ah=n;i=46}else if((i|0)==43){ae=z;af=p-1|0;ag=q;ah=r;i=46}else if((i|0)==23){ae=l;af=m-1|0;ag=b;ah=n;i=46}else if((i|0)==17){ae=l;af=m-1|0;ag=b;ah=n;i=46}do{if((i|0)==46){if((ae|0)!=0){ai=ag;aj=af;break}T=ah;U=ag;V=af;W=a[af]|0;i=48}}while(0);do{if((i|0)==48){if(W<<24>>24!=0){ai=U;aj=V;break}if((U|0)!=0){c[U>>2]=0;c[e>>2]=0}D=f-T|0;return D|0}}while(0);c[(bA()|0)>>2]=84;if((ai|0)==0){D=-1;return D|0}c[e>>2]=aj;D=-1;return D|0}function qo(a){a=a|0;if((a|0)==0){return}qI(a);return}function qp(a){a=a|0;return}function qq(a){a=a|0;return 1312}function qr(a){a=a|0;return}function qs(a){a=a|0;return}function qt(a){a=a|0;return}function qu(a){a=a|0;if((a|0)==0){return}qI(a);return}function qv(a){a=a|0;if((a|0)==0){return}qI(a);return}function qw(a){a=a|0;if((a|0)==0){return}qI(a);return}function qx(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;e=i;i=i+112|0;f=e|0;g=e+56|0;if((a|0)==(b|0)){h=1;i=e;return h|0}if((b|0)==0){h=0;i=e;return h|0}j=b;k=c[b>>2]|0;b=j+(c[k-8>>2]|0)|0;l=c[k-4>>2]|0;k=l;c[f>>2]=26752;c[f+4>>2]=j;c[f+8>>2]=26764;c[f+12>>2]=-1;j=f+16|0;m=f+20|0;n=f+24|0;o=f+28|0;p=f+32|0;q=f+40|0;qP(j|0,0,39)|0;do{if((l|0)==26752){c[f+48>>2]=1;cc[c[(c[6688]|0)+20>>2]&63](k,f,b,b,1,0);r=(c[n>>2]|0)==1?b:0}else{b_[c[(c[l>>2]|0)+24>>2]&7](k,f,b,1,0);s=c[f+36>>2]|0;if((s|0)==0){if((c[q>>2]|0)!=1){r=0;break}if((c[o>>2]|0)!=1){r=0;break}r=(c[p>>2]|0)==1?c[m>>2]|0:0;break}else if((s|0)!=1){r=0;break}if((c[n>>2]|0)!=1){if((c[q>>2]|0)!=0){r=0;break}if((c[o>>2]|0)!=1){r=0;break}if((c[p>>2]|0)!=1){r=0;break}}r=c[j>>2]|0}}while(0);j=r;if((r|0)==0){h=0;i=e;return h|0}qP(g|0,0,56)|0;c[g>>2]=j;c[g+8>>2]=a;c[g+12>>2]=-1;c[g+48>>2]=1;b$[c[(c[r>>2]|0)+28>>2]&31](j,g,c[d>>2]|0,1);if((c[g+24>>2]|0)!=1){h=0;i=e;return h|0}c[d>>2]=c[g+16>>2];h=1;i=e;return h|0}function qy(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((c[d+8>>2]|0)!=(b|0)){return}b=d+16|0;g=c[b>>2]|0;if((g|0)==0){c[b>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((g|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function qz(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((b|0)!=(c[d+8>>2]|0)){g=c[b+8>>2]|0;b$[c[(c[g>>2]|0)+28>>2]&31](g,d,e,f);return}g=d+16|0;b=c[g>>2]|0;if((b|0)==0){c[g>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function qA(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;if((b|0)==(c[d+8>>2]|0)){g=d+16|0;h=c[g>>2]|0;if((h|0)==0){c[g>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((h|0)!=(e|0)){h=d+36|0;c[h>>2]=(c[h>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}h=d+24|0;if((c[h>>2]|0)!=2){return}c[h>>2]=f;return}h=c[b+12>>2]|0;g=b+16+(h<<3)|0;i=c[b+20>>2]|0;j=i>>8;if((i&1|0)==0){k=j}else{k=c[(c[e>>2]|0)+j>>2]|0}j=c[b+16>>2]|0;b$[c[(c[j>>2]|0)+28>>2]&31](j,d,e+k|0,(i&2|0)!=0?f:2);if((h|0)<=1){return}h=d+54|0;i=e;k=b+24|0;while(1){b=c[k+4>>2]|0;j=b>>8;if((b&1|0)==0){l=j}else{l=c[(c[i>>2]|0)+j>>2]|0}j=c[k>>2]|0;b$[c[(c[j>>2]|0)+28>>2]&31](j,d,e+l|0,(b&2|0)!=0?f:2);if((a[h]&1)!=0){m=17;break}b=k+8|0;if(b>>>0<g>>>0){k=b}else{m=20;break}}if((m|0)==17){return}else if((m|0)==20){return}}function qB(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;h=b|0;if((h|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}i=d+28|0;if((c[i>>2]|0)==1){return}c[i>>2]=f;return}if((h|0)==(c[d>>2]|0)){do{if((c[d+16>>2]|0)!=(e|0)){h=d+20|0;if((c[h>>2]|0)==(e|0)){break}c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4){return}j=c[b+12>>2]|0;k=b+16+(j<<3)|0;L19:do{if((j|0)>0){l=d+52|0;m=d+53|0;n=d+54|0;o=b+8|0;p=d+24|0;q=e;r=0;s=b+16|0;t=0;L21:while(1){a[l]=0;a[m]=0;u=c[s+4>>2]|0;v=u>>8;if((u&1|0)==0){w=v}else{w=c[(c[q>>2]|0)+v>>2]|0}v=c[s>>2]|0;cc[c[(c[v>>2]|0)+20>>2]&63](v,d,e,e+w|0,2-(u>>>1&1)|0,g);if((a[n]&1)!=0){x=t;y=r;break}do{if((a[m]&1)==0){z=t;A=r}else{if((a[l]&1)==0){if((c[o>>2]&1|0)==0){x=1;y=r;break L21}else{z=1;A=r;break}}if((c[p>>2]|0)==1){break L19}if((c[o>>2]&2|0)==0){break L19}else{z=1;A=1}}}while(0);u=s+8|0;if(u>>>0<k>>>0){r=A;s=u;t=z}else{x=z;y=A;break}}if((y&1)==0){B=x;C=23}else{D=x;C=26}}else{B=0;C=23}}while(0);do{if((C|0)==23){c[h>>2]=e;k=d+40|0;c[k>>2]=(c[k>>2]|0)+1;if((c[d+36>>2]|0)!=1){D=B;C=26;break}if((c[d+24>>2]|0)!=2){D=B;C=26;break}a[d+54|0]=1;D=B;C=26}}while(0);do{if((C|0)==26){if((D&1)!=0){break}c[i>>2]=4;return}}while(0);c[i>>2]=3;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}D=c[b+12>>2]|0;B=b+16+(D<<3)|0;x=c[b+20>>2]|0;y=x>>8;if((x&1|0)==0){E=y}else{E=c[(c[e>>2]|0)+y>>2]|0}y=c[b+16>>2]|0;b_[c[(c[y>>2]|0)+24>>2]&7](y,d,e+E|0,(x&2|0)!=0?f:2,g);x=b+24|0;if((D|0)<=1){return}D=c[b+8>>2]|0;do{if((D&2|0)==0){b=d+36|0;if((c[b>>2]|0)==1){break}if((D&1|0)==0){E=d+54|0;y=e;A=x;while(1){if((a[E]&1)!=0){C=61;break}if((c[b>>2]|0)==1){C=68;break}z=c[A+4>>2]|0;w=z>>8;if((z&1|0)==0){F=w}else{F=c[(c[y>>2]|0)+w>>2]|0}w=c[A>>2]|0;b_[c[(c[w>>2]|0)+24>>2]&7](w,d,e+F|0,(z&2|0)!=0?f:2,g);z=A+8|0;if(z>>>0<B>>>0){A=z}else{C=60;break}}if((C|0)==68){return}else if((C|0)==60){return}else if((C|0)==61){return}}A=d+24|0;y=d+54|0;E=e;i=x;while(1){if((a[y]&1)!=0){C=59;break}if((c[b>>2]|0)==1){if((c[A>>2]|0)==1){C=62;break}}z=c[i+4>>2]|0;w=z>>8;if((z&1|0)==0){G=w}else{G=c[(c[E>>2]|0)+w>>2]|0}w=c[i>>2]|0;b_[c[(c[w>>2]|0)+24>>2]&7](w,d,e+G|0,(z&2|0)!=0?f:2,g);z=i+8|0;if(z>>>0<B>>>0){i=z}else{C=63;break}}if((C|0)==59){return}else if((C|0)==62){return}else if((C|0)==63){return}}}while(0);G=d+54|0;F=e;D=x;while(1){if((a[G]&1)!=0){C=55;break}x=c[D+4>>2]|0;i=x>>8;if((x&1|0)==0){H=i}else{H=c[(c[F>>2]|0)+i>>2]|0}i=c[D>>2]|0;b_[c[(c[i>>2]|0)+24>>2]&7](i,d,e+H|0,(x&2|0)!=0?f:2,g);x=D+8|0;if(x>>>0<B>>>0){D=x}else{C=57;break}}if((C|0)==55){return}else if((C|0)==57){return}}function qC(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;h=b|0;if((h|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}i=d+28|0;if((c[i>>2]|0)==1){return}c[i>>2]=f;return}if((h|0)!=(c[d>>2]|0)){h=c[b+8>>2]|0;b_[c[(c[h>>2]|0)+24>>2]&7](h,d,e,f,g);return}do{if((c[d+16>>2]|0)!=(e|0)){h=d+20|0;if((c[h>>2]|0)==(e|0)){break}c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4){return}j=d+52|0;a[j]=0;k=d+53|0;a[k]=0;l=c[b+8>>2]|0;cc[c[(c[l>>2]|0)+20>>2]&63](l,d,e,e,1,g);if((a[k]&1)==0){m=0;n=13}else{if((a[j]&1)==0){m=1;n=13}}L23:do{if((n|0)==13){c[h>>2]=e;j=d+40|0;c[j>>2]=(c[j>>2]|0)+1;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){n=16;break}a[d+54|0]=1;if(m){break L23}}else{n=16}}while(0);if((n|0)==16){if(m){break}}c[i>>2]=4;return}}while(0);c[i>>2]=3;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function qD(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;if((c[d+8>>2]|0)==(b|0)){if((c[d+4>>2]|0)!=(e|0)){return}g=d+28|0;if((c[g>>2]|0)==1){return}c[g>>2]=f;return}if((c[d>>2]|0)!=(b|0)){return}do{if((c[d+16>>2]|0)!=(e|0)){b=d+20|0;if((c[b>>2]|0)==(e|0)){break}c[d+32>>2]=f;c[b>>2]=e;b=d+40|0;c[b>>2]=(c[b>>2]|0)+1;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){break}a[d+54|0]=1}}while(0);c[d+44>>2]=4;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function qE(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((b|0)!=(c[d+8>>2]|0)){i=d+52|0;j=a[i]&1;k=d+53|0;l=a[k]&1;m=c[b+12>>2]|0;n=b+16+(m<<3)|0;a[i]=0;a[k]=0;o=c[b+20>>2]|0;p=o>>8;if((o&1|0)==0){q=p}else{q=c[(c[f>>2]|0)+p>>2]|0}p=c[b+16>>2]|0;cc[c[(c[p>>2]|0)+20>>2]&63](p,d,e,f+q|0,(o&2|0)!=0?g:2,h);L6:do{if((m|0)>1){o=d+24|0;q=b+8|0;p=d+54|0;r=f;s=b+24|0;do{if((a[p]&1)!=0){break L6}do{if((a[i]&1)==0){if((a[k]&1)==0){break}if((c[q>>2]&1|0)==0){break L6}}else{if((c[o>>2]|0)==1){break L6}if((c[q>>2]&2|0)==0){break L6}}}while(0);a[i]=0;a[k]=0;t=c[s+4>>2]|0;u=t>>8;if((t&1|0)==0){v=u}else{v=c[(c[r>>2]|0)+u>>2]|0}u=c[s>>2]|0;cc[c[(c[u>>2]|0)+20>>2]&63](u,d,e,f+v|0,(t&2|0)!=0?g:2,h);s=s+8|0;}while(s>>>0<n>>>0)}}while(0);a[i]=j;a[k]=l;return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;l=c[f>>2]|0;if((l|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((l|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;l=c[e>>2]|0;if((l|0)==2){c[e>>2]=g;w=g}else{w=l}if(!((c[d+48>>2]|0)==1&(w|0)==1)){return}a[d+54|0]=1;return}function qF(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0;if((b|0)!=(c[d+8>>2]|0)){i=c[b+8>>2]|0;cc[c[(c[i>>2]|0)+20>>2]&63](i,d,e,f,g,h);return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;h=c[f>>2]|0;if((h|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((h|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;h=c[e>>2]|0;if((h|0)==2){c[e>>2]=g;j=g}else{j=h}if(!((c[d+48>>2]|0)==1&(j|0)==1)){return}a[d+54|0]=1;return}function qG(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0;if((c[d+8>>2]|0)!=(b|0)){return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;b=c[f>>2]|0;if((b|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;b=c[e>>2]|0;if((b|0)==2){c[e>>2]=g;i=g}else{i=b}if(!((c[d+48>>2]|0)==1&(i|0)==1)){return}a[d+54|0]=1;return}function qH(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0;do{if(a>>>0<245>>>0){if(a>>>0<11>>>0){b=16}else{b=a+11&-8}d=b>>>3;e=c[6711]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=26884+(h<<2)|0;j=26884+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[6711]=e&~(1<<g)}else{if(l>>>0<(c[6715]|0)>>>0){bL();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{bL();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[6713]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=26884+(p<<2)|0;m=26884+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[6711]=e&~(1<<r)}else{if(l>>>0<(c[6715]|0)>>>0){bL();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{bL();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[6713]|0;if((l|0)!=0){q=c[6716]|0;d=l>>>3;l=d<<1;f=26884+(l<<2)|0;k=c[6711]|0;h=1<<d;do{if((k&h|0)==0){c[6711]=k|h;s=f;t=26884+(l+2<<2)|0}else{d=26884+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[6715]|0)>>>0){s=g;t=d;break}bL();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[6713]=m;c[6716]=e;n=i;return n|0}l=c[6712]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[27148+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[6715]|0;if(r>>>0<i>>>0){bL();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){bL();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){bL();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){bL();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){bL();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{bL();return 0}}}while(0);L78:do{if((e|0)!=0){f=d+28|0;i=27148+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[6712]=c[6712]&~(1<<c[f>>2]);break L78}else{if(e>>>0<(c[6715]|0)>>>0){bL();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L78}}}while(0);if(v>>>0<(c[6715]|0)>>>0){bL();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[6715]|0)>>>0){bL();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[6715]|0)>>>0){bL();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16>>>0){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[6713]|0;if((f|0)!=0){e=c[6716]|0;i=f>>>3;f=i<<1;q=26884+(f<<2)|0;k=c[6711]|0;g=1<<i;do{if((k&g|0)==0){c[6711]=k|g;y=q;z=26884+(f+2<<2)|0}else{i=26884+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[6715]|0)>>>0){y=l;z=i;break}bL();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[6713]=p;c[6716]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231>>>0){o=-1;break}f=a+11|0;g=f&-8;k=c[6712]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215>>>0){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[27148+(A<<2)>>2]|0;L126:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L126}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=(i|-i)&k;if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[27148+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[6713]|0)-g|0)>>>0){o=g;break}q=K;m=c[6715]|0;if(q>>>0<m>>>0){bL();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){bL();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){bL();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){bL();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){bL();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{bL();return 0}}}while(0);L176:do{if((e|0)!=0){i=K+28|0;m=27148+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[6712]=c[6712]&~(1<<c[i>>2]);break L176}else{if(e>>>0<(c[6715]|0)>>>0){bL();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L176}}}while(0);if(L>>>0<(c[6715]|0)>>>0){bL();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[6715]|0)>>>0){bL();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[6715]|0)>>>0){bL();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16>>>0){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256>>>0){e=i<<1;m=26884+(e<<2)|0;r=c[6711]|0;j=1<<i;do{if((r&j|0)==0){c[6711]=r|j;O=m;P=26884+(e+2<<2)|0}else{i=26884+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[6715]|0)>>>0){O=d;P=i;break}bL();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215>>>0){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=27148+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[6712]|0;l=1<<Q;if((m&l|0)==0){c[6712]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=151;break}else{l=l<<1;m=j}}if((T|0)==151){if(S>>>0<(c[6715]|0)>>>0){bL();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[6715]|0;if(m>>>0<i>>>0){bL();return 0}if(j>>>0<i>>>0){bL();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[6713]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[6716]|0;if(S>>>0>15>>>0){R=J;c[6716]=R+o;c[6713]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[6713]=0;c[6716]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[6714]|0;if(o>>>0<J>>>0){S=J-o|0;c[6714]=S;J=c[6717]|0;K=J;c[6717]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[6703]|0)==0){J=bq(30)|0;if((J-1&J|0)==0){c[6705]=J;c[6704]=J;c[6706]=-1;c[6707]=-1;c[6708]=0;c[6822]=0;c[6703]=(bY(0)|0)&-16^1431655768;break}else{bL();return 0}}}while(0);J=o+48|0;S=c[6705]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[6821]|0;do{if((O|0)!=0){P=c[6819]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L268:do{if((c[6822]&4|0)==0){O=c[6717]|0;L270:do{if((O|0)==0){T=181}else{L=O;P=27292;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=181;break L270}else{P=M}}if((P|0)==0){T=181;break}L=R-(c[6714]|0)&Q;if(L>>>0>=2147483647>>>0){W=0;break}m=bz(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=190}}while(0);do{if((T|0)==181){O=bz(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[6704]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[6819]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647>>>0)){W=0;break}m=c[6821]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=bz($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=190}}while(0);L290:do{if((T|0)==190){m=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=201;break L268}do{if((Z|0)!=-1&_>>>0<2147483647>>>0&_>>>0<J>>>0){g=c[6705]|0;O=K-_+g&-g;if(O>>>0>=2147483647>>>0){ac=_;break}if((bz(O|0)|0)==-1){bz(m|0)|0;W=Y;break L290}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=201;break L268}}}while(0);c[6822]=c[6822]|4;ad=W;T=198}else{ad=0;T=198}}while(0);do{if((T|0)==198){if(S>>>0>=2147483647>>>0){break}W=bz(S|0)|0;Z=bz(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)!=-1){aa=Z?ac:ad;ab=Y;T=201}}}while(0);do{if((T|0)==201){ad=(c[6819]|0)+aa|0;c[6819]=ad;if(ad>>>0>(c[6820]|0)>>>0){c[6820]=ad}ad=c[6717]|0;L310:do{if((ad|0)==0){S=c[6715]|0;if((S|0)==0|ab>>>0<S>>>0){c[6715]=ab}c[6823]=ab;c[6824]=aa;c[6826]=0;c[6720]=c[6703];c[6719]=-1;S=0;do{Y=S<<1;ac=26884+(Y<<2)|0;c[26884+(Y+3<<2)>>2]=ac;c[26884+(Y+2<<2)>>2]=ac;S=S+1|0;}while((S|0)!=32);S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=aa-40-ae|0;c[6717]=ab+ae;c[6714]=S;c[ab+(ae+4)>>2]=S|1;c[ab+(aa-36)>>2]=40;c[6718]=c[6707]}else{S=27292;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=213;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==213){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa;ac=c[6717]|0;Y=(c[6714]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[6717]=Z+ai;c[6714]=W;c[Z+(ai+4)>>2]=W|1;c[Z+(Y+4)>>2]=40;c[6718]=c[6707];break L310}}while(0);if(ab>>>0<(c[6715]|0)>>>0){c[6715]=ab}S=ab+aa|0;Y=27292;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=223;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==223){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=S-(ab+ak)-o|0;c[ab+(ak+4)>>2]=o|3;do{if((Z|0)==(c[6717]|0)){J=(c[6714]|0)+K|0;c[6714]=J;c[6717]=_;c[ab+(W+4)>>2]=J|1}else{if((Z|0)==(c[6716]|0)){J=(c[6713]|0)+K|0;c[6713]=J;c[6716]=_;c[ab+(W+4)>>2]=J|1;c[ab+(J+W)>>2]=J;break}J=aa+4|0;X=c[ab+(al+J)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L354:do{if(X>>>0<256>>>0){U=c[ab+((al|8)+aa)>>2]|0;Q=c[ab+(aa+12+al)>>2]|0;R=26884+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[6715]|0)>>>0){bL();return 0}if((c[U+12>>2]|0)==(Z|0)){break}bL();return 0}}while(0);if((Q|0)==(U|0)){c[6711]=c[6711]&~(1<<V);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[6715]|0)>>>0){bL();return 0}m=Q+8|0;if((c[m>>2]|0)==(Z|0)){am=m;break}bL();return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;m=c[ab+((al|24)+aa)>>2]|0;P=c[ab+(aa+12+al)>>2]|0;do{if((P|0)==(R|0)){O=al|16;g=ab+(O+J)|0;L=c[g>>2]|0;if((L|0)==0){e=ab+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){an=0;break}else{ao=O;ap=e}}else{ao=L;ap=g}while(1){g=ao+20|0;L=c[g>>2]|0;if((L|0)!=0){ao=L;ap=g;continue}g=ao+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ao=L;ap=g}}if(ap>>>0<(c[6715]|0)>>>0){bL();return 0}else{c[ap>>2]=0;an=ao;break}}else{g=c[ab+((al|8)+aa)>>2]|0;if(g>>>0<(c[6715]|0)>>>0){bL();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){bL();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;an=P;break}else{bL();return 0}}}while(0);if((m|0)==0){break}P=ab+(aa+28+al)|0;U=27148+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=an;if((an|0)!=0){break}c[6712]=c[6712]&~(1<<c[P>>2]);break L354}else{if(m>>>0<(c[6715]|0)>>>0){bL();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=an}else{c[m+20>>2]=an}if((an|0)==0){break L354}}}while(0);if(an>>>0<(c[6715]|0)>>>0){bL();return 0}c[an+24>>2]=m;R=al|16;P=c[ab+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[6715]|0)>>>0){bL();return 0}else{c[an+16>>2]=P;c[P+24>>2]=an;break}}}while(0);P=c[ab+(R+J)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[6715]|0)>>>0){bL();return 0}else{c[an+20>>2]=P;c[P+24>>2]=an;break}}}while(0);aq=ab+(($|al)+aa)|0;ar=$+K|0}else{aq=Z;ar=K}J=aq+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4)>>2]=ar|1;c[ab+(ar+W)>>2]=ar;J=ar>>>3;if(ar>>>0<256>>>0){V=J<<1;X=26884+(V<<2)|0;P=c[6711]|0;m=1<<J;do{if((P&m|0)==0){c[6711]=P|m;as=X;at=26884+(V+2<<2)|0}else{J=26884+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[6715]|0)>>>0){as=U;at=J;break}bL();return 0}}while(0);c[at>>2]=_;c[as+12>>2]=_;c[ab+(W+8)>>2]=as;c[ab+(W+12)>>2]=X;break}V=ac;m=ar>>>8;do{if((m|0)==0){au=0}else{if(ar>>>0>16777215>>>0){au=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;au=ar>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=27148+(au<<2)|0;c[ab+(W+28)>>2]=au;c[ab+(W+20)>>2]=0;c[ab+(W+16)>>2]=0;X=c[6712]|0;Q=1<<au;if((X&Q|0)==0){c[6712]=X|Q;c[m>>2]=V;c[ab+(W+24)>>2]=m;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}if((au|0)==31){av=0}else{av=25-(au>>>1)|0}Q=ar<<av;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(ar|0)){break}aw=X+16+(Q>>>31<<2)|0;m=c[aw>>2]|0;if((m|0)==0){T=296;break}else{Q=Q<<1;X=m}}if((T|0)==296){if(aw>>>0<(c[6715]|0)>>>0){bL();return 0}else{c[aw>>2]=V;c[ab+(W+24)>>2]=X;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[6715]|0;if(X>>>0<$>>>0){bL();return 0}if(m>>>0<$>>>0){bL();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ab+(W+8)>>2]=m;c[ab+(W+12)>>2]=X;c[ab+(W+24)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=27292;while(1){ax=c[W>>2]|0;if(ax>>>0<=Y>>>0){ay=c[W+4>>2]|0;az=ax+ay|0;if(az>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=ax+(ay-39)|0;if((W&7|0)==0){aA=0}else{aA=-W&7}W=ax+(ay-47+aA)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aB=0}else{aB=-_&7}_=aa-40-aB|0;c[6717]=ab+aB;c[6714]=_;c[ab+(aB+4)>>2]=_|1;c[ab+(aa-36)>>2]=40;c[6718]=c[6707];c[ac+4>>2]=27;c[W>>2]=c[6823];c[W+4>>2]=c[6824];c[W+8>>2]=c[6825];c[W+12>>2]=c[6826];c[6823]=ab;c[6824]=aa;c[6826]=0;c[6825]=W;W=ac+28|0;c[W>>2]=7;if((ac+32|0)>>>0<az>>>0){_=W;while(1){W=_+4|0;c[W>>2]=7;if((_+8|0)>>>0<az>>>0){_=W}else{break}}}if((ac|0)==(Y|0)){break}_=ac-ad|0;W=Y+(_+4)|0;c[W>>2]=c[W>>2]&-2;c[ad+4>>2]=_|1;c[Y+_>>2]=_;W=_>>>3;if(_>>>0<256>>>0){K=W<<1;Z=26884+(K<<2)|0;S=c[6711]|0;m=1<<W;do{if((S&m|0)==0){c[6711]=S|m;aC=Z;aD=26884+(K+2<<2)|0}else{W=26884+(K+2<<2)|0;Q=c[W>>2]|0;if(Q>>>0>=(c[6715]|0)>>>0){aC=Q;aD=W;break}bL();return 0}}while(0);c[aD>>2]=ad;c[aC+12>>2]=ad;c[ad+8>>2]=aC;c[ad+12>>2]=Z;break}K=ad;m=_>>>8;do{if((m|0)==0){aE=0}else{if(_>>>0>16777215>>>0){aE=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;ac=(Y+520192|0)>>>16&4;W=Y<<ac;Y=(W+245760|0)>>>16&2;Q=14-(ac|S|Y)+(W<<Y>>>15)|0;aE=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=27148+(aE<<2)|0;c[ad+28>>2]=aE;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[6712]|0;Q=1<<aE;if((Z&Q|0)==0){c[6712]=Z|Q;c[m>>2]=K;c[ad+24>>2]=m;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aE|0)==31){aF=0}else{aF=25-(aE>>>1)|0}Q=_<<aF;Z=c[m>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(_|0)){break}aG=Z+16+(Q>>>31<<2)|0;m=c[aG>>2]|0;if((m|0)==0){T=331;break}else{Q=Q<<1;Z=m}}if((T|0)==331){if(aG>>>0<(c[6715]|0)>>>0){bL();return 0}else{c[aG>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;_=c[Q>>2]|0;m=c[6715]|0;if(Z>>>0<m>>>0){bL();return 0}if(_>>>0<m>>>0){bL();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=_;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[6714]|0;if(ad>>>0<=o>>>0){break}_=ad-o|0;c[6714]=_;ad=c[6717]|0;Q=ad;c[6717]=Q+o;c[Q+(o+4)>>2]=_|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[(bA()|0)>>2]=12;n=0;return n|0}function qI(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[6715]|0;if(b>>>0<e>>>0){bL()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){bL()}h=f&-8;i=a+(h-8)|0;j=i;L10:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){bL()}if((n|0)==(c[6716]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[6713]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256>>>0){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=26884+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){bL()}if((c[k+12>>2]|0)==(n|0)){break}bL()}}while(0);if((s|0)==(k|0)){c[6711]=c[6711]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){bL()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}bL()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){bL()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){bL()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){bL()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{bL()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=27148+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[6712]=c[6712]&~(1<<c[v>>2]);q=n;r=o;break L10}else{if(p>>>0<(c[6715]|0)>>>0){bL()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L10}}}while(0);if(A>>>0<(c[6715]|0)>>>0){bL()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[6715]|0)>>>0){bL()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[6715]|0)>>>0){bL()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){bL()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){bL()}do{if((e&2|0)==0){if((j|0)==(c[6717]|0)){B=(c[6714]|0)+r|0;c[6714]=B;c[6717]=q;c[q+4>>2]=B|1;if((q|0)!=(c[6716]|0)){return}c[6716]=0;c[6713]=0;return}if((j|0)==(c[6716]|0)){B=(c[6713]|0)+r|0;c[6713]=B;c[6716]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L112:do{if(e>>>0<256>>>0){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=26884+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[6715]|0)>>>0){bL()}if((c[u+12>>2]|0)==(j|0)){break}bL()}}while(0);if((g|0)==(u|0)){c[6711]=c[6711]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[6715]|0)>>>0){bL()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}bL()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[6715]|0)>>>0){bL()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[6715]|0)>>>0){bL()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){bL()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{bL()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=27148+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[6712]=c[6712]&~(1<<c[t>>2]);break L112}else{if(f>>>0<(c[6715]|0)>>>0){bL()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L112}}}while(0);if(E>>>0<(c[6715]|0)>>>0){bL()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[6715]|0)>>>0){bL()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[6715]|0)>>>0){bL()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[6716]|0)){H=B;break}c[6713]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256>>>0){d=r<<1;e=26884+(d<<2)|0;A=c[6711]|0;E=1<<r;do{if((A&E|0)==0){c[6711]=A|E;I=e;J=26884+(d+2<<2)|0}else{r=26884+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[6715]|0)>>>0){I=h;J=r;break}bL()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215>>>0){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=27148+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[6712]|0;d=1<<K;do{if((r&d|0)==0){c[6712]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=129;break}else{A=A<<1;J=E}}if((N|0)==129){if(M>>>0<(c[6715]|0)>>>0){bL()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[6715]|0;if(J>>>0<E>>>0){bL()}if(B>>>0<E>>>0){bL()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[6719]|0)-1|0;c[6719]=q;if((q|0)==0){O=27300}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[6719]=-1;return}function qJ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;if((a|0)==0){d=qH(b)|0;return d|0}if(b>>>0>4294967231>>>0){c[(bA()|0)>>2]=12;d=0;return d|0}if(b>>>0<11>>>0){e=16}else{e=b+11&-8}f=a-8|0;g=a-4|0;h=c[g>>2]|0;i=h&-8;j=i-8|0;k=a+j|0;l=k;m=c[6715]|0;if(f>>>0<m>>>0){bL();return 0}n=h&3;if(!((n|0)!=1&(j|0)>-8)){bL();return 0}j=i|4;o=a+(j-8)|0;p=c[o>>2]|0;if((p&1|0)==0){bL();return 0}L21:do{if((n|0)==0){if(e>>>0<256>>>0|i>>>0<(e|4)>>>0){break}if((i-e|0)>>>0>c[6705]<<1>>>0|(f|0)==0){break}else{d=a}return d|0}else{do{if(i>>>0<e>>>0){if((l|0)==(c[6717]|0)){q=(c[6714]|0)+i|0;if(q>>>0<=e>>>0){break L21}r=q-e|0;c[g>>2]=h&1|e|2;c[a+((e|4)-8)>>2]=r|1;c[6717]=a+(e-8);c[6714]=r;break}if((l|0)==(c[6716]|0)){r=(c[6713]|0)+i|0;if(r>>>0<e>>>0){break L21}q=r-e|0;if(q>>>0>15>>>0){c[g>>2]=h&1|e|2;c[a+((e|4)-8)>>2]=q|1;c[a+(r-8)>>2]=q;s=a+(r-4)|0;c[s>>2]=c[s>>2]&-2;t=a+(e-8)|0;u=q}else{c[g>>2]=h&1|r|2;q=a+(r-4)|0;c[q>>2]=c[q>>2]|1;t=0;u=0}c[6713]=u;c[6716]=t;break}if((p&2|0)!=0){break L21}q=(p&-8)+i|0;if(q>>>0<e>>>0){break L21}r=q-e|0;s=p>>>3;L42:do{if(p>>>0<256>>>0){v=c[a+i>>2]|0;w=c[a+j>>2]|0;x=26884+(s<<1<<2)|0;do{if((v|0)!=(x|0)){if(v>>>0<m>>>0){bL();return 0}if((c[v+12>>2]|0)==(l|0)){break}bL();return 0}}while(0);if((w|0)==(v|0)){c[6711]=c[6711]&~(1<<s);break}do{if((w|0)==(x|0)){y=w+8|0}else{if(w>>>0<m>>>0){bL();return 0}z=w+8|0;if((c[z>>2]|0)==(l|0)){y=z;break}bL();return 0}}while(0);c[v+12>>2]=w;c[y>>2]=v}else{x=k;z=c[a+(i+16)>>2]|0;A=c[a+j>>2]|0;do{if((A|0)==(x|0)){B=a+(i+12)|0;C=c[B>>2]|0;if((C|0)==0){D=a+(i+8)|0;E=c[D>>2]|0;if((E|0)==0){F=0;break}else{G=E;H=D}}else{G=C;H=B}while(1){B=G+20|0;C=c[B>>2]|0;if((C|0)!=0){G=C;H=B;continue}B=G+16|0;C=c[B>>2]|0;if((C|0)==0){break}else{G=C;H=B}}if(H>>>0<m>>>0){bL();return 0}else{c[H>>2]=0;F=G;break}}else{B=c[a+i>>2]|0;if(B>>>0<m>>>0){bL();return 0}C=B+12|0;if((c[C>>2]|0)!=(x|0)){bL();return 0}D=A+8|0;if((c[D>>2]|0)==(x|0)){c[C>>2]=A;c[D>>2]=B;F=A;break}else{bL();return 0}}}while(0);if((z|0)==0){break}A=a+(i+20)|0;v=27148+(c[A>>2]<<2)|0;do{if((x|0)==(c[v>>2]|0)){c[v>>2]=F;if((F|0)!=0){break}c[6712]=c[6712]&~(1<<c[A>>2]);break L42}else{if(z>>>0<(c[6715]|0)>>>0){bL();return 0}w=z+16|0;if((c[w>>2]|0)==(x|0)){c[w>>2]=F}else{c[z+20>>2]=F}if((F|0)==0){break L42}}}while(0);if(F>>>0<(c[6715]|0)>>>0){bL();return 0}c[F+24>>2]=z;x=c[a+(i+8)>>2]|0;do{if((x|0)!=0){if(x>>>0<(c[6715]|0)>>>0){bL();return 0}else{c[F+16>>2]=x;c[x+24>>2]=F;break}}}while(0);x=c[a+(i+12)>>2]|0;if((x|0)==0){break}if(x>>>0<(c[6715]|0)>>>0){bL();return 0}else{c[F+20>>2]=x;c[x+24>>2]=F;break}}}while(0);if(r>>>0>=16>>>0){c[g>>2]=c[g>>2]&1|e|2;c[a+((e|4)-8)>>2]=r|3;s=a+((q|4)-8)|0;c[s>>2]=c[s>>2]|1;qK(a+(e-8)|0,r);break}c[g>>2]=q|c[g>>2]&1|2;s=a+((q|4)-8)|0;c[s>>2]=c[s>>2]|1;d=a;return d|0}else{s=i-e|0;if(s>>>0<=15>>>0){break}c[g>>2]=h&1|e|2;c[a+((e|4)-8)>>2]=s|3;c[o>>2]=c[o>>2]|1;qK(a+(e-8)|0,s);d=a;return d|0}}while(0);if((f|0)==0){break}else{d=a}return d|0}}while(0);f=qH(b)|0;if((f|0)==0){d=0;return d|0}e=c[g>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;qQ(f|0,a|0,g>>>0<b>>>0?g:b)|0;qI(a);d=f;return d|0}function qK(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;L1:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[6715]|0;if(i>>>0<l>>>0){bL()}if((j|0)==(c[6716]|0)){m=d+(b+4)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[6713]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256>>>0){p=c[d+(8-h)>>2]|0;q=c[d+(12-h)>>2]|0;r=26884+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){bL()}if((c[p+12>>2]|0)==(j|0)){break}bL()}}while(0);if((q|0)==(p|0)){c[6711]=c[6711]&~(1<<m);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){bL()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}bL()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h)>>2]|0;t=c[d+(12-h)>>2]|0;do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4)|0;w=c[v>>2]|0;if((w|0)==0){x=d+u|0;u=c[x>>2]|0;if((u|0)==0){y=0;break}else{z=u;A=x}}else{z=w;A=v}while(1){v=z+20|0;w=c[v>>2]|0;if((w|0)!=0){z=w;A=v;continue}v=z+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{z=w;A=v}}if(A>>>0<l>>>0){bL()}else{c[A>>2]=0;y=z;break}}else{v=c[d+(8-h)>>2]|0;if(v>>>0<l>>>0){bL()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){bL()}x=t+8|0;if((c[x>>2]|0)==(r|0)){c[w>>2]=t;c[x>>2]=v;y=t;break}else{bL()}}}while(0);if((m|0)==0){n=j;o=k;break}t=d+(28-h)|0;l=27148+(c[t>>2]<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[6712]=c[6712]&~(1<<c[t>>2]);n=j;o=k;break L1}else{if(m>>>0<(c[6715]|0)>>>0){bL()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=y}else{c[m+20>>2]=y}if((y|0)==0){n=j;o=k;break L1}}}while(0);if(y>>>0<(c[6715]|0)>>>0){bL()}c[y+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[6715]|0)>>>0){bL()}else{c[y+16>>2]=t;c[t+24>>2]=y;break}}}while(0);t=c[d+(r+4)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[6715]|0)>>>0){bL()}else{c[y+20>>2]=t;c[t+24>>2]=y;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[6715]|0;if(e>>>0<a>>>0){bL()}y=d+(b+4)|0;z=c[y>>2]|0;do{if((z&2|0)==0){if((f|0)==(c[6717]|0)){A=(c[6714]|0)+o|0;c[6714]=A;c[6717]=n;c[n+4>>2]=A|1;if((n|0)!=(c[6716]|0)){return}c[6716]=0;c[6713]=0;return}if((f|0)==(c[6716]|0)){A=(c[6713]|0)+o|0;c[6713]=A;c[6716]=n;c[n+4>>2]=A|1;c[n+A>>2]=A;return}A=(z&-8)+o|0;s=z>>>3;L101:do{if(z>>>0<256>>>0){g=c[d+(b+8)>>2]|0;t=c[d+(b+12)>>2]|0;h=26884+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){bL()}if((c[g+12>>2]|0)==(f|0)){break}bL()}}while(0);if((t|0)==(g|0)){c[6711]=c[6711]&~(1<<s);break}do{if((t|0)==(h|0)){B=t+8|0}else{if(t>>>0<a>>>0){bL()}m=t+8|0;if((c[m>>2]|0)==(f|0)){B=m;break}bL()}}while(0);c[g+12>>2]=t;c[B>>2]=g}else{h=e;m=c[d+(b+24)>>2]|0;l=c[d+(b+12)>>2]|0;do{if((l|0)==(h|0)){i=d+(b+20)|0;p=c[i>>2]|0;if((p|0)==0){q=d+(b+16)|0;v=c[q>>2]|0;if((v|0)==0){C=0;break}else{D=v;E=q}}else{D=p;E=i}while(1){i=D+20|0;p=c[i>>2]|0;if((p|0)!=0){D=p;E=i;continue}i=D+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{D=p;E=i}}if(E>>>0<a>>>0){bL()}else{c[E>>2]=0;C=D;break}}else{i=c[d+(b+8)>>2]|0;if(i>>>0<a>>>0){bL()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){bL()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;C=l;break}else{bL()}}}while(0);if((m|0)==0){break}l=d+(b+28)|0;g=27148+(c[l>>2]<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=C;if((C|0)!=0){break}c[6712]=c[6712]&~(1<<c[l>>2]);break L101}else{if(m>>>0<(c[6715]|0)>>>0){bL()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=C}else{c[m+20>>2]=C}if((C|0)==0){break L101}}}while(0);if(C>>>0<(c[6715]|0)>>>0){bL()}c[C+24>>2]=m;h=c[d+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[6715]|0)>>>0){bL()}else{c[C+16>>2]=h;c[h+24>>2]=C;break}}}while(0);h=c[d+(b+20)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[6715]|0)>>>0){bL()}else{c[C+20>>2]=h;c[h+24>>2]=C;break}}}while(0);c[n+4>>2]=A|1;c[n+A>>2]=A;if((n|0)!=(c[6716]|0)){F=A;break}c[6713]=A;return}else{c[y>>2]=z&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;F=o}}while(0);o=F>>>3;if(F>>>0<256>>>0){z=o<<1;y=26884+(z<<2)|0;C=c[6711]|0;b=1<<o;do{if((C&b|0)==0){c[6711]=C|b;G=y;H=26884+(z+2<<2)|0}else{o=26884+(z+2<<2)|0;d=c[o>>2]|0;if(d>>>0>=(c[6715]|0)>>>0){G=d;H=o;break}bL()}}while(0);c[H>>2]=n;c[G+12>>2]=n;c[n+8>>2]=G;c[n+12>>2]=y;return}y=n;G=F>>>8;do{if((G|0)==0){I=0}else{if(F>>>0>16777215>>>0){I=31;break}H=(G+1048320|0)>>>16&8;z=G<<H;b=(z+520192|0)>>>16&4;C=z<<b;z=(C+245760|0)>>>16&2;o=14-(b|H|z)+(C<<z>>>15)|0;I=F>>>((o+7|0)>>>0)&1|o<<1}}while(0);G=27148+(I<<2)|0;c[n+28>>2]=I;c[n+20>>2]=0;c[n+16>>2]=0;o=c[6712]|0;z=1<<I;if((o&z|0)==0){c[6712]=o|z;c[G>>2]=y;c[n+24>>2]=G;c[n+12>>2]=n;c[n+8>>2]=n;return}if((I|0)==31){J=0}else{J=25-(I>>>1)|0}I=F<<J;J=c[G>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(F|0)){break}K=J+16+(I>>>31<<2)|0;G=c[K>>2]|0;if((G|0)==0){L=126;break}else{I=I<<1;J=G}}if((L|0)==126){if(K>>>0<(c[6715]|0)>>>0){bL()}c[K>>2]=y;c[n+24>>2]=J;c[n+12>>2]=n;c[n+8>>2]=n;return}K=J+8|0;L=c[K>>2]|0;I=c[6715]|0;if(J>>>0<I>>>0){bL()}if(L>>>0<I>>>0){bL()}c[L+12>>2]=y;c[K>>2]=y;c[n+8>>2]=L;c[n+12>>2]=J;c[n+24>>2]=0;return}function qL(a){a=a|0;if((a|0)==0){return}qI(a);return}function qM(a){a=a|0;return}function qN(a){a=a|0;return 1108}function qO(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0,t=0,u=0,v=0,w=0.0,x=0,y=0,z=0,A=0.0,B=0.0,C=0,D=0,E=0,F=0.0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0.0,P=0,Q=0,R=0.0,S=0.0,T=0.0;e=b;while(1){f=e+1|0;if((aP(a[e]|0)|0)==0){break}else{e=f}}g=a[e]|0;if((g<<24>>24|0)==45){i=f;j=1}else if((g<<24>>24|0)==43){i=f;j=0}else{i=e;j=0}e=-1;f=0;g=i;while(1){l=a[g]|0;if(((l<<24>>24)-48|0)>>>0<10>>>0){m=e}else{if(l<<24>>24!=46|(e|0)>-1){break}else{m=f}}e=m;f=f+1|0;g=g+1|0}m=g+(-f|0)|0;i=(e|0)<0;n=((i^1)<<31>>31)+f|0;o=(n|0)>18;p=(o?-18:-n|0)+(i?f:e)|0;e=o?18:n;do{if((e|0)==0){q=b;r=0.0}else{if((e|0)>9){n=m;o=e;f=0;while(1){i=a[n]|0;s=n+1|0;if(i<<24>>24==46){t=a[s]|0;u=n+2|0}else{t=i;u=s}v=(f*10|0)-48+(t<<24>>24)|0;s=o-1|0;if((s|0)>9){n=u;o=s;f=v}else{break}}w=+(v|0)*1.0e9;x=9;y=u;z=14}else{if((e|0)>0){w=0.0;x=e;y=m;z=14}else{A=0.0;B=0.0}}if((z|0)==14){f=y;o=x;n=0;while(1){s=a[f]|0;i=f+1|0;if(s<<24>>24==46){C=a[i]|0;D=f+2|0}else{C=s;D=i}E=(n*10|0)-48+(C<<24>>24)|0;i=o-1|0;if((i|0)>0){f=D;o=i;n=E}else{break}}A=+(E|0);B=w}F=B+A;do{if((l<<24>>24|0)==69|(l<<24>>24|0)==101){n=g+1|0;o=a[n]|0;if((o<<24>>24|0)==45){G=g+2|0;H=1}else if((o<<24>>24|0)==43){G=g+2|0;H=0}else{G=n;H=0}n=a[G]|0;if(((n<<24>>24)-48|0)>>>0<10>>>0){I=G;J=0;K=n}else{L=0;M=G;N=H;break}while(1){n=(K<<24>>24)-48+(J*10|0)|0;o=I+1|0;f=a[o]|0;if(((f<<24>>24)-48|0)>>>0<10>>>0){I=o;J=n;K=f}else{L=n;M=o;N=H;break}}}else{L=0;M=g;N=0}}while(0);o=p+((N|0)==0?L:-L|0)|0;n=(o|0)<0?-o|0:o;if((n|0)>511){c[(bA()|0)>>2]=34;O=1.0;P=40;Q=511;z=31}else{if((n|0)==0){R=1.0}else{O=1.0;P=40;Q=n;z=31}}if((z|0)==31){while(1){z=0;if((Q&1|0)==0){S=O}else{S=O*(c[k>>2]=c[P>>2],c[k+4>>2]=c[P+4>>2],+h[k>>3])}n=Q>>1;if((n|0)==0){R=S;break}else{O=S;P=P+8|0;Q=n;z=31}}}if((o|0)>-1){q=M;r=F*R;break}else{q=M;r=F/R;break}}}while(0);if((d|0)!=0){c[d>>2]=q}if((j|0)==0){T=r;return+T}T=-0.0-r;return+T}function qP(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;g=b&3;h=d|d<<8|d<<16|d<<24;i=f&~3;if(g){g=b+4-g|0;while((b|0)<(g|0)){a[b]=d;b=b+1|0}}while((b|0)<(i|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function qQ(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function qR(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function qS(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;if((c|0)<(b|0)&(b|0)<(c+d|0)){e=b;c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b]=a[c]|0}b=e}else{qQ(b,c,d)|0}return b|0}function qT(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(K=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function qU(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(K=e,a-c>>>0|0)|0}function qV(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){K=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}K=a<<c-32;return 0}function qW(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){K=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}K=0;return b>>>c-32|0}function qX(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){K=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}K=(b|0)<0?-1:0;return b>>c-32|0}function qY(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function qZ(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function q_(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=ag(d,c)|0;f=a>>>16;a=(e>>>16)+(ag(d,f)|0)|0;d=b>>>16;b=ag(d,c)|0;return(K=(a>>>16)+(ag(d,f)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|e&65535|0)|0}function q$(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=qU(e^a,f^b,e,f)|0;b=K;a=g^e;e=h^f;f=qU((q4(i,b,qU(g^c,h^d,g,h)|0,K,0)|0)^a,K^e,a,e)|0;return(K=K,f)|0}function q0(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=qU(h^a,j^b,h,j)|0;b=K;q4(m,b,qU(k^d,l^e,k,l)|0,K,g)|0;l=qU(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=K;i=f;return(K=j,l)|0}function q1(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=q_(e,a)|0;f=K;return(K=(ag(b,a)|0)+(ag(d,e)|0)+f|f&0,c|0|0)|0}function q2(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=q4(a,b,c,d,0)|0;return(K=K,e)|0}function q3(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;q4(a,b,d,e,g)|0;i=f;return(K=c[g+4>>2]|0,c[g>>2]|0)|0}function q4(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(K=n,o)|0}else{if(!m){n=0;o=0;return(K=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;n=0;o=0;return(K=n,o)|0}}m=(l|0)==0;do{if((j|0)==0){if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(K=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(K=n,o)|0}p=l-1|0;if((p&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=p&i|b&0}n=0;o=i>>>((qZ(l|0)|0)>>>0);return(K=n,o)|0}p=(qY(l|0)|0)-(qY(i|0)|0)|0;if(p>>>0<=30){q=p+1|0;r=31-p|0;s=q;t=i<<r|g>>>(q>>>0);u=i>>>(q>>>0);v=0;w=g<<r;break}if((f|0)==0){n=0;o=0;return(K=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(K=n,o)|0}else{if(!m){r=(qY(l|0)|0)-(qY(i|0)|0)|0;if(r>>>0<=31){q=r+1|0;p=31-r|0;x=r-31>>31;s=q;t=g>>>(q>>>0)&x|i<<p;u=i>>>(q>>>0)&x;v=0;w=g<<p;break}if((f|0)==0){n=0;o=0;return(K=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(K=n,o)|0}p=j-1|0;if((p&j|0)!=0){x=(qY(j|0)|0)+33-(qY(i|0)|0)|0;q=64-x|0;r=32-x|0;y=r>>31;z=x-32|0;A=z>>31;s=x;t=r-1>>31&i>>>(z>>>0)|(i<<r|g>>>(x>>>0))&A;u=A&i>>>(x>>>0);v=g<<q&y;w=(i<<q|g>>>(z>>>0))&y|g<<r&x-33>>31;break}if((f|0)!=0){c[f>>2]=p&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=a|0|0;return(K=n,o)|0}else{p=qZ(j|0)|0;n=i>>>(p>>>0)|0;o=i<<32-p|g>>>(p>>>0)|0;return(K=n,o)|0}}}while(0);if((s|0)==0){B=w;C=v;D=u;E=t;F=0;G=0}else{g=d|0|0;d=k|e&0;e=qT(g,d,-1,-1)|0;k=K;i=w;w=v;v=u;u=t;t=s;s=0;while(1){H=w>>>31|i<<1;I=s|w<<1;j=u<<1|i>>>31|0;a=u>>>31|v<<1|0;qU(e,k,j,a)|0;b=K;h=b>>31|((b|0)<0?-1:0)<<1;J=h&1;L=qU(j,a,h&g,(((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1)&d)|0;M=K;b=t-1|0;if((b|0)==0){break}else{i=H;w=I;v=M;u=L;t=b;s=J}}B=H;C=I;D=M;E=L;F=0;G=J}J=C;C=0;if((f|0)!=0){c[f>>2]=E;c[f+4>>2]=D}n=(J|0)>>>31|(B|C)<<1|(C<<1|J>>>31)&0|F;o=(J<<1|0>>>31)&-2|G;return(K=n,o)|0}function q5(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;b_[a&7](b|0,c|0,d|0,e|0,f|0)}function q6(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;b$[a&31](b|0,c|0,d|0,e|0)}function q7(a,b){a=a|0;b=b|0;b0[a&1023](b|0)}function q8(a,b,c){a=a|0;b=b|0;c=c|0;b1[a&255](b|0,c|0)}function q9(a,b,c){a=a|0;b=b|0;c=c|0;return b2[a&127](b|0,c|0)|0}function ra(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return b3[a&63](b|0,c|0,d|0)|0}function rb(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;b4[a&7](b|0,c|0,d|0,e|0,f|0,g|0,+h)}function rc(a,b){a=a|0;b=b|0;return b5[a&511](b|0)|0}function rd(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;b6[a&127](b|0,c|0,d|0,e|0,f|0,g|0,h|0)}function re(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;b7[a&15](b|0,c|0,d|0,e|0,f|0,+g)}function rf(a){a=a|0;b8[a&1]()}function rg(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;return b9[a&31](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)|0}function rh(a,b,c,d,e,f,g,h,i,j){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;ca[a&7](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0)}function ri(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;cb[a&15](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)}function rj(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;cc[a&63](b|0,c|0,d|0,e|0,f|0,g|0)}function rk(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return cd[a&15](b|0,c|0,d|0,e|0)|0}function rl(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return ce[a&31](b|0,c|0,d|0,e|0,f|0)|0}function rm(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;cf[a&63](b|0,c|0,d|0)}function rn(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ah(0)}function ro(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ah(1)}function rp(a){a=a|0;ah(2)}function rq(a,b){a=a|0;b=b|0;ah(3)}function rr(a,b){a=a|0;b=b|0;ah(4);return 0}function rs(a,b,c){a=a|0;b=b|0;c=c|0;ah(5);return 0}function rt(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;ah(6)}function ru(a){a=a|0;ah(7);return 0}function rv(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;ah(8)}function rw(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;ah(9)}function rx(){ah(10)}function ry(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;ah(11);return 0}function rz(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;ah(12)}function rA(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;ah(13)}function rB(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ah(14)}function rC(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ah(15);return 0}function rD(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ah(16);return 0}function rE(a,b,c){a=a|0;b=b|0;c=c|0;ah(17)}
// EMSCRIPTEN_END_FUNCS
var b_=[rn,rn,qC,rn,qD,rn,qB,rn];var b$=[ro,ro,qz,ro,ld,ro,qy,ro,k$,ro,lW,ro,eh,ro,qA,ro,jL,ro,lR,ro,d5,ro,d6,ro,ro,ro,ro,ro,ro,ro,ro,ro];var b0=[rp,rp,cC,rp,fY,rp,oA,rp,dV,rp,lY,rp,g9,rp,hM,rp,iH,rp,eU,rp,ov,rp,fO,rp,e1,rp,iV,rp,kn,rp,en,rp,kX,rp,lo,rp,ft,rp,fC,rp,f7,rp,hQ,rp,d0,rp,jN,rp,oM,rp,j5,rp,f0,rp,jV,rp,mx,rp,eb,rp,kh,rp,po,rp,mc,rp,hf,rp,fv,rp,eT,rp,jK,rp,jC,rp,eo,rp,lO,rp,lK,rp,gk,rp,nA,rp,c3,rp,gd,rp,gP,rp,cP,rp,qM,rp,ji,rp,eE,rp,oK,rp,io,rp,g5,rp,o_,rp,dQ,rp,na,rp,md,rp,hs,rp,jy,rp,dt,rp,g3,rp,lC,rp,iG,rp,hx,rp,eF,rp,ow,rp,hB,rp,gI,rp,ia,rp,od,rp,oL,rp,eX,rp,et,rp,iw,rp,gU,rp,cM,rp,mN,rp,di,rp,ip,rp,ec,rp,gJ,rp,c6,rp,ds,rp,nL,rp,dw,rp,e2,rp,ew,rp,oI,rp,oF,rp,ha,rp,d_,rp,dE,rp,n5,rp,gH,rp,pH,rp,es,rp,ez,rp,fx,rp,iy,rp,dn,rp,kd,rp,gs,rp,pG,rp,ej,rp,lI,rp,iD,rp,fJ,rp,hN,rp,kl,rp,cY,rp,jq,rp,iY,rp,cF,rp,dX,rp,d2,rp,lU,rp,fg,rp,hO,rp,hU,rp,nq,rp,ir,rp,pJ,rp,gj,rp,oN,rp,dN,rp,qI,rp,fq,rp,h7,rp,gw,rp,op,rp,go,rp,f9,rp,eL,rp,h2,rp,iC,rp,jG,rp,j6,rp,ga,rp,ls,rp,fp,rp,fB,rp,hC,rp,lT,rp,nm,rp,is,rp,ki,rp,fo,rp,gn,rp,gx,rp,dy,rp,my,rp,e9,rp,dj,rp,i3,rp,jv,rp,dI,rp,f8,rp,dY,rp,pw,rp,dD,rp,fc,rp,qp,rp,ge,rp,gi,rp,jj,rp,nM,rp,dc,rp,qw,rp,ln,rp,gt,rp,gG,rp,qk,rp,lz,rp,jx,rp,nj,rp,m9,rp,dm,rp,lL,rp,hK,rp,qL,rp,kW,rp,fP,rp,kt,rp,fS,rp,c9,rp,i9,rp,cU,rp,im,rp,qh,rp,c0,rp,gY,rp,i8,rp,ib,rp,jm,rp,oH,rp,lD,rp,k9,rp,ee,rp,eJ,rp,fs,rp,jH,rp,hL,rp,o8,rp,gZ,rp,jz,rp,fd,rp,cN,rp,lp,rp,cV,rp,jc,rp,cK,rp,lJ,rp,nW,rp,hk,rp,d1,rp,lE,rp,er,rp,eA,rp,iv,rp,qv,rp,il,rp,qt,rp,kC,rp,fj,rp,he,rp,jI,rp,fA,rp,e4,rp,j$,rp,eY,rp,c$,rp,fT,rp,cG,rp,c4,rp,n6,rp,ii,rp,nk,rp,hj,rp,oe,rp,qo,rp,jr,rp,h_,rp,n8,rp,qj,rp,gL,rp,np,rp,mM,rp,c2,rp,gy,rp,ik,rp,gQ,rp,dM,rp,h6,rp,f4,rp,j0,rp,e3,rp,qg,rp,lu,rp,kz,rp,qs,rp,eu,rp,i_,rp,dd,rp,jn,rp,pg,rp,dH,rp,jd,rp,oj,rp,c8,rp,g6,rp,e6,rp,fk,rp,jh,rp,fG,rp,g4,rp,pI,rp,oq,rp,fF,rp,lZ,rp,iU,rp,jb,rp,kN,rp,eO,rp,gM,rp,eB,rp,ed,rp,fb,rp,gV,rp,jU,rp,jE,rp,eZ,rp,hR,rp,iM,rp,h1,rp,fr,rp,ly,rp,ex,rp,jJ,rp,kA,rp,hb,rp,iZ,rp,i7,rp,lm,rp,c1,rp,lN,rp,cT,rp,de,rp,it,rp,kD,rp,dZ,rp,ei,rp,eg,rp,dx,rp,lB,rp,eK,rp,nn,rp,ic,rp,hV,rp,fX,rp,ey,rp,hP,rp,pF,rp,lP,rp,ke,rp,kx,rp,cL,rp,em,rp,jF,rp,d$,rp,kV,rp,qi,rp,lx,rp,ja,rp,c_,rp,ff,rp,gD,rp,hn,rp,i5,rp,lM,rp,nX,rp,f$,rp,m_,rp,i4,rp,ev,rp,nB,rp,jP,rp,hw,rp,dR,rp,gF,rp,hF,rp,g2,rp,lt,rp,k8,rp,fw,rp,lw,rp,f5,rp,ho,rp,hZ,rp,pE,rp,hG,rp,ht,rp,cR,rp,iL,rp,m$,rp,jw,rp,qu,rp,iu,rp,oB,rp,jO,rp,i1,rp,e8,rp,hg,rp,lr,rp,i6,rp,qr,rp,eP,rp,iQ,rp,fK,rp,dW,rp,i2,rp,ok,rp,iI,rp,iP,rp,je,rp,f6,rp,kG,rp,o$,rp,kk,rp,cO,rp,g1,rp,ef,rp,ql,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp,rp];var b1=[rq,rq,cH,rq,pS,rq,ih,rq,eD,rq,fL,rq,n0,rq,f_,rq,hH,rq,hm,rq,nE,rq,pP,rq,cS,rq,cX,rq,nV,rq,hv,rq,jg,rq,fi,rq,e7,rq,pO,rq,eN,rq,nK,rq,fR,rq,hd,rq,jQ,rq,oz,rq,ij,rq,la,rq,nw,rq,el,rq,n3,rq,nS,rq,nv,rq,nt,rq,n1,rq,cE,rq,fl,rq,gX,rq,f1,rq,h0,rq,j1,rq,jD,rq,iO,rq,dG,rq,gE,rq,gO,rq,jW,rq,n4,rq,pR,rq,h9,rq,dp,rq,gc,rq,nF,rq,n_,rq,gv,rq,pT,rq,nU,rq,nH,rq,dv,rq,dl,rq,hE,rq,dS,rq,hT,rq,cQ,rq,jp,rq,gR,rq,fI,rq,iX,rq,dP,rq,kY,rq,d3,rq,oE,rq,j7,rq,nP,rq,db,rq,nz,rq,ny,rq,iF,rq,nu,rq,jB,rq,nQ,rq,e5,rq,gm,rq,nR,rq,hp,rq,nG,rq,pQ,rq,nJ,rq,cZ,rq,n$,rq,fz,rq,eW,rq,gC,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq,rq];var b2=[rr,rr,gg,rr,ka,rr,gK,rr,kg,rr,eH,rr,e_,rr,oW,rr,hz,rr,o4,rr,iJ,rr,jZ,rr,j4,rr,oS,rr,iS,rr,fM,rr,dz,rr,dT,rr,cI,rr,jk,rr,iq,rr,gf,rr,hh,rr,fe,rr,fV,rr,gS,rr,i$,rr,gz,rr,k5,rr,hI,rr,eG,rr,hX,rr,o0,rr,f2,rr,k7,rr,df,rr,g$,rr,h4,rr,ll,rr,oU,rr,jt,rr,fD,rr,id,rr,hq,rr,eR,rr,fm,rr,dK,rr,o2,rr,gq,rr,jT,rr,dq,rr,ep,rr,lj,rr,rr,rr,rr,rr,rr,rr,rr,rr,rr,rr,rr,rr,rr,rr,rr,rr,rr,rr,rr,rr,rr,rr];var b3=[rs,rs,lS,rs,o1,rs,oV,rs,qx,rs,kq,rs,oY,rs,lX,rs,kp,rs,k6,rs,k2,rs,lk,rs,oO,rs,lb,rs,oC,rs,o6,rs,j3,rs,oT,rs,g_,rs,jS,rs,lg,rs,o3,rs,ox,rs,kZ,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs];var b4=[rt,rt,ol,rt,or,rt,rt,rt];var b5=[ru,ru,dA,ru,p5,ru,dU,ru,k3,ru,dL,ru,pd,ru,pX,ru,k1,ru,k4,ru,fN,ru,eS,ru,p3,ru,nC,ru,gr,ru,dO,ru,h5,ru,m0,ru,pV,ru,kf,ru,jo,ru,eq,ru,cW,ru,j9,ru,gA,ru,li,ru,pk,ru,du,ru,lh,ru,gT,ru,fh,ru,pA,ru,fW,ru,p$,ru,pc,ru,pZ,ru,gl,ru,eI,ru,cJ,ru,qq,ru,hY,ru,hi,ru,km,ru,hl,ru,pN,ru,pK,ru,eM,ru,p_,ru,ju,ru,pL,ru,k0,ru,pf,ru,ku,ru,n2,ru,ek,ru,p0,ru,dr,ru,jR,ru,nD,ru,pt,ru,p1,ru,fn,ru,iK,ru,hu,ru,jf,ru,eV,ru,fZ,ru,pl,ru,gb,ru,nY,ru,hc,ru,pU,ru,jX,ru,gW,ru,hS,ru,pB,ru,kr,ru,gu,ru,lG,ru,nx,ru,h8,ru,g0,ru,qN,ru,eC,ru,jl,ru,jY,ru,gN,ru,fy,ru,nr,ru,pM,ru,da,ru,le,ru,j2,ru,pW,ru,nI,ru,p4,ru,j8,ru,iW,ru,lf,ru,dk,ru,h$,ru,fQ,ru,ns,ru,kj,ru,nN,ru,pn,ru,nT,ru,i0,ru,nO,ru,iN,ru,pY,ru,nZ,ru,ps,ru,nb,ru,e$,ru,p2,ru,gh,ru,fH,ru,cD,ru,dF,ru,iT,ru,f3,ru,hD,ru,hJ,ru,fE,ru,hr,ru,pv,ru,dg,ru,hA,ru,iE,ru,ie,ru,pD,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru,ru];var b6=[rv,rv,m5,rv,nc,rv,m1,rv,ne,rv,ou,rv,mU,rv,mS,rv,ng,rv,m4,rv,oo,rv,mp,rv,l1,rv,m3,rv,l6,rv,mj,rv,nf,rv,nd,rv,ml,rv,mG,rv,mE,rv,mh,rv,mi,rv,l9,rv,mk,rv,mg,rv,me,rv,mo,rv,mn,rv,mm,rv,l3,rv,m2,rv,l5,rv,l2,rv,l4,rv,l0,rv,l8,rv,l7,rv,l_,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv,rv];var b7=[rw,rw,mV,rw,mH,rw,mK,rw,mX,rw,rw,rw,rw,rw,rw,rw];var b8=[rx,rx];var b9=[ry,ry,ph,ry,pq,ry,pp,ry,py,ry,pi,ry,o9,ry,px,ry,pa,ry,ry,ry,ry,ry,ry,ry,ry,ry,ry,ry,ry,ry,ry,ry];var ca=[rz,rz,m6,rz,nh,rz,rz,rz];var cb=[rA,rA,no,rA,nl,rA,n7,rA,of,rA,ob,rA,oh,rA,rA,rA];var cc=[rB,rB,qE,rB,mT,rB,mP,rB,mO,rB,qF,rB,gp,rB,mY,rB,oy,rB,eQ,rB,lc,rB,mF,rB,mL,rB,h3,rB,mz,rB,mA,rB,qG,rB,oD,rB,k_,rB,rB,rB,rB,rB,rB,rB,rB,rB,rB,rB,rB,rB,rB,rB,rB,rB,rB,rB,rB,rB,rB,rB,rB,rB,rB,rB];var cd=[rC,rC,oX,rC,oP,rC,oQ,rC,o5,rC,oR,rC,rC,rC,rC,rC];var ce=[rD,rD,oZ,rD,pr,rD,o7,rD,lV,rD,pC,rD,pu,rD,pj,rD,lQ,rD,pe,rD,pz,rD,pm,rD,pb,rD,rD,rD,rD,rD,rD,rD];var cf=[rE,rE,d4,rE,fU,rE,kw,rE,kv,rE,hW,rE,hy,rE,c5,rE,ix,rE,g8,rE,js,rE,fu,rE,ko,rE,dJ,rE,lH,rE,iR,rE,ks,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE,rE];return{_Select:cz,_strlen:qR,_free:qI,_Scan:cx,_realloc:qJ,_memmove:qS,__GLOBAL__I_a:kc,_memset:qP,_malloc:qH,_memcpy:qQ,_Where:cA,runPostSets:cw,stackAlloc:cg,stackSave:ch,stackRestore:ci,setThrew:cj,setTempRet0:cm,setTempRet1:cn,setTempRet2:co,setTempRet3:cp,setTempRet4:cq,setTempRet5:cr,setTempRet6:cs,setTempRet7:ct,setTempRet8:cu,setTempRet9:cv,dynCall_viiiii:q5,dynCall_viiii:q6,dynCall_vi:q7,dynCall_vii:q8,dynCall_iii:q9,dynCall_iiii:ra,dynCall_viiiiiid:rb,dynCall_ii:rc,dynCall_viiiiiii:rd,dynCall_viiiiid:re,dynCall_v:rf,dynCall_iiiiiiiii:rg,dynCall_viiiiiiiii:rh,dynCall_viiiiiiii:ri,dynCall_viiiiii:rj,dynCall_iiiii:rk,dynCall_iiiiii:rl,dynCall_viii:rm}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_viiiii": invoke_viiiii, "invoke_viiii": invoke_viiii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_iii": invoke_iii, "invoke_iiii": invoke_iiii, "invoke_viiiiiid": invoke_viiiiiid, "invoke_ii": invoke_ii, "invoke_viiiiiii": invoke_viiiiiii, "invoke_viiiiid": invoke_viiiiid, "invoke_v": invoke_v, "invoke_iiiiiiiii": invoke_iiiiiiiii, "invoke_viiiiiiiii": invoke_viiiiiiiii, "invoke_viiiiiiii": invoke_viiiiiiii, "invoke_viiiiii": invoke_viiiiii, "invoke_iiiii": invoke_iiiii, "invoke_iiiiii": invoke_iiiiii, "invoke_viii": invoke_viii, "_llvm_lifetime_end": _llvm_lifetime_end, "__scanString": __scanString, "_pthread_mutex_lock": _pthread_mutex_lock, "___cxa_end_catch": ___cxa_end_catch, "_strtoull": _strtoull, "_fflush": _fflush, "_fputc": _fputc, "_fwrite": _fwrite, "_send": _send, "_fputs": _fputs, "_emscripten_get_now": _emscripten_get_now, "_isspace": _isspace, "_read": _read, "___cxa_guard_abort": ___cxa_guard_abort, "_newlocale": _newlocale, "___gxx_personality_v0": ___gxx_personality_v0, "_pthread_cond_wait": _pthread_cond_wait, "___cxa_rethrow": ___cxa_rethrow, "___resumeException": ___resumeException, "_llvm_va_end": _llvm_va_end, "_clock_gettime": _clock_gettime, "_snprintf": _snprintf, "_fgetc": _fgetc, "__getFloat": __getFloat, "_atexit": _atexit, "___cxa_free_exception": ___cxa_free_exception, "___setErrNo": ___setErrNo, "_isxdigit": _isxdigit, "_exit": _exit, "_sprintf": _sprintf, "___ctype_b_loc": ___ctype_b_loc, "_freelocale": _freelocale, "_catgets": _catgets, "__isLeapYear": __isLeapYear, "_asprintf": _asprintf, "___cxa_is_number_type": ___cxa_is_number_type, "___cxa_does_inherit": ___cxa_does_inherit, "___cxa_guard_acquire": ___cxa_guard_acquire, "___cxa_begin_catch": ___cxa_begin_catch, "_recv": _recv, "__parseInt64": __parseInt64, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "___cxa_call_unexpected": ___cxa_call_unexpected, "__exit": __exit, "_strftime": _strftime, "___cxa_throw": ___cxa_throw, "_llvm_eh_exception": _llvm_eh_exception, "_pread": _pread, "_usleep": _usleep, "__arraySum": __arraySum, "_sysconf": _sysconf, "_puts": _puts, "_nanosleep": _nanosleep, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "__formatString": __formatString, "_pthread_cond_broadcast": _pthread_cond_broadcast, "__ZSt9terminatev": __ZSt9terminatev, "_isascii": _isascii, "_pthread_mutex_unlock": _pthread_mutex_unlock, "_sbrk": _sbrk, "___errno_location": ___errno_location, "_strerror": _strerror, "_pthread_mutex_destroy": _pthread_mutex_destroy, "_catclose": _catclose, "_llvm_lifetime_start": _llvm_lifetime_start, "___cxa_guard_release": ___cxa_guard_release, "_ungetc": _ungetc, "_uselocale": _uselocale, "_sscanf": _sscanf, "___assert_fail": ___assert_fail, "_fread": _fread, "_abort": _abort, "_isdigit": _isdigit, "_strtoll": _strtoll, "__addDays": __addDays, "__reallyNegative": __reallyNegative, "_write": _write, "___cxa_allocate_exception": ___cxa_allocate_exception, "_catopen": _catopen, "___ctype_toupper_loc": ___ctype_toupper_loc, "___ctype_tolower_loc": ___ctype_tolower_loc, "_pwrite": _pwrite, "_strerror_r": _strerror_r, "_llvm_trap": _llvm_trap, "_time": _time, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity, "_stdin": _stdin, "__ZTVN10__cxxabiv117__class_type_infoE": __ZTVN10__cxxabiv117__class_type_infoE, "__ZTVN10__cxxabiv120__si_class_type_infoE": __ZTVN10__cxxabiv120__si_class_type_infoE, "_stderr": _stderr, "___fsmu8": ___fsmu8, "_stdout": _stdout, "___dso_handle": ___dso_handle }, buffer);
var _Select = Module["_Select"] = asm["_Select"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _Scan = Module["_Scan"] = asm["_Scan"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var __GLOBAL__I_a = Module["__GLOBAL__I_a"] = asm["__GLOBAL__I_a"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _Where = Module["_Where"] = asm["_Where"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viiiiiid = Module["dynCall_viiiiiid"] = asm["dynCall_viiiiiid"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = asm["dynCall_viiiiiii"];
var dynCall_viiiiid = Module["dynCall_viiiiid"] = asm["dynCall_viiiiid"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = asm["dynCall_iiiiiiiii"];
var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = asm["dynCall_viiiiiiiii"];
var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = asm["dynCall_viiiiiiii"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm["dynCall_iiiiii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// TODO: strip out parts of this we do not need
//======= begin closure i64 code =======
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */
var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };
  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.
    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };
  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};
  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }
    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };
  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };
  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };
  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }
    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };
  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.
  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;
  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);
  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);
  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);
  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };
  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };
  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (this.isZero()) {
      return '0';
    }
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }
    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };
  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };
  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };
  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };
  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };
  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };
  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };
  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };
  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }
    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };
  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };
  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };
  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }
    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }
    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }
    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }
      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }
      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };
  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };
  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };
  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };
  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };
  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };
  //======= begin jsbn =======
  var navigator = { appName: 'Modern Browser' }; // polyfill a little
  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/
  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);
  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }
  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }
  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }
  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }
  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }
  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }
  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // jsbn2 stuff
  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }
  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }
  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;
  //======= end jsbn =======
  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();
//======= end closure i64 code =======
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    Module['calledRun'] = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
var asm = {};
asm.scan = Module.cwrap('Scan', 'number', ['number']);
asm.select = Module.cwrap('Select', 'number', ['number']);
asm.where = Module.cwrap('Where', 'number', ['number']);
