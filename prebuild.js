const fs = require('fs');

const toCopy = [
    ["node_modules/z3-solver/build/z3-built.js", "static/z3-built.js"],
    ["node_modules/z3-solver/build/z3-built.wasm", "static/z3-built.wasm"],
]

for (const [from, to] of toCopy) {
    const data = fs.readFileSync(from); 
    fs.writeFileSync(to, data);
}
