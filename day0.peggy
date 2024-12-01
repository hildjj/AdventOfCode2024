lines = (@num "\n")*

num = n:$[0-9]+ { return parseInt(n, 10) }
_ = [ \t]+
