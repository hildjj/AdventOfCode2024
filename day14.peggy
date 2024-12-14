lines = (@line "\n")*
line = "p=" @num "," @num _ "v=" @num "," @num
num = n:$("-"?[0-9]+) { return parseInt(n, 10) }
_ = [ \t]+
