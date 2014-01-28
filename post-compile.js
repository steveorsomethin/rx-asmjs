var asm = {};

asm.scan = Module.cwrap('Scan', 'number', ['number']);
asm.select = Module.cwrap('Select', 'number', ['number']);
asm.where = Module.cwrap('Where', 'number', ['number']);
