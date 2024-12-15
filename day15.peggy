{{
const E = 0;
const S = 1;
const W = 2;
const N = 3;
}}
game = @board "\n" @moves
board = (@[#O@.]+ "\n")+

moves = (@dir+ "\n")+

dir
  = "<" { return W }
  / ">" { return E }
  / "v" { return S }
  / "^" { return N }
