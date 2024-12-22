lines = (@num "\n")*

num = n:$[0-9]+ { return BigInt(n) }
_ = [ \t]+
