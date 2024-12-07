lines = (@num ":" _  @num|1.., _|"\n")*

num = n:$[0-9]+ { return parseInt(n, 10) }
_ = [ \t]+
