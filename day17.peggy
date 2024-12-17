def = @registers "\n" @program "\n"
registers = r:register+ { return Object.fromEntries(r) }

register = "Register" _ @[A-Z] ":" _ @num "\n"

program = "Program:" _ @num|1.., ","|

num = n:$[0-9]+ { return BigInt(n) }
_ = [ \t]+
