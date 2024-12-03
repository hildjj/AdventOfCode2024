commands
  = cmd:command* { return cmd.filter(d => d != null) }

command
  = "don't()" { return false }
  / "do()" { return true }
  / "mul(" @num "," @num ")"
  / . { return null }

num
  = n:$[0-9]+ { return parseInt(n, 10) }