schemata = (lock / key)|.., "\n"|

lock = "#####" "\n" rows:row+ { return {type: 'lock', rows, h: []}}

key = rows:row+ { return { type: 'key', rows: rows.slice(0, -1), h: []}}

row = @[#.]+ "\n"
