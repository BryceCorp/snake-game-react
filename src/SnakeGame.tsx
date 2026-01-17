import { useState, useEffect, useCallback, useRef } from 'react';
import './SnakeGame.css';

type Position = {
  x: number;
  y: number;
};

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 150;

function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const directionRef = useRef<Direction>(INITIAL_DIRECTION);
  const gameLoopRef = useRef<number | null>(null);

  // Generate random food position
  const generateFood = useCallback((): Position => {
    const newFood: Position = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    return newFood;
  }, []);

  // Check if position is valid (not on snake)
  const isValidFoodPosition = useCallback((pos: Position, snakeBody: Position[]): boolean => {
    return !snakeBody.some(segment => segment.x === pos.x && segment.y === pos.y);
  }, []);

  // Initialize food position
  useEffect(() => {
    let newFood = generateFood();
    while (!isValidFoodPosition(newFood, snake)) {
      newFood = generateFood();
    }
    setFood(newFood);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted && e.key !== ' ') return;
      
      if (e.key === ' ') {
        if (gameOver) {
          // Restart game
          setSnake(INITIAL_SNAKE);
          directionRef.current = INITIAL_DIRECTION;
          setGameOver(false);
          setScore(0);
          setIsPaused(false);
          setGameStarted(true);
          let newFood = generateFood();
          while (!isValidFoodPosition(newFood, INITIAL_SNAKE)) {
            newFood = generateFood();
          }
          setFood(newFood);
        } else {
          setIsPaused(prev => !prev);
        }
        return;
      }

      if (isPaused || gameOver) return;

      const keyMap: Record<string, Direction> = {
        'ArrowUp': 'UP',
        'ArrowDown': 'DOWN',
        'ArrowLeft': 'LEFT',
        'ArrowRight': 'RIGHT',
        'w': 'UP',
        's': 'DOWN',
        'a': 'LEFT',
        'd': 'RIGHT',
      };

      const newDirection = keyMap[e.key];
      if (newDirection) {
        // Prevent reversing into itself
        const oppositeDirections: Record<Direction, Direction> = {
          'UP': 'DOWN',
          'DOWN': 'UP',
          'LEFT': 'RIGHT',
          'RIGHT': 'LEFT',
        };
        
        if (newDirection !== oppositeDirections[directionRef.current]) {
          directionRef.current = newDirection;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, isPaused, gameOver, generateFood, isValidFoodPosition]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || isPaused || gameOver) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    gameLoopRef.current = window.setInterval(() => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        const currentDirection = directionRef.current;

        // Move head based on direction
        switch (currentDirection) {
          case 'UP':
            head.y -= 1;
            break;
          case 'DOWN':
            head.y += 1;
            break;
          case 'LEFT':
            head.x -= 1;
            break;
          case 'RIGHT':
            head.x += 1;
            break;
        }

        // Check wall collision
        if (
          head.x < 0 ||
          head.x >= GRID_SIZE ||
          head.y < 0 ||
          head.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          setScore(prev => prev + 10);
          
          // Generate new food
          let newFood = generateFood();
          while (!isValidFoodPosition(newFood, newSnake)) {
            newFood = generateFood();
          }
          setFood(newFood);
          
          return newSnake;
        }

        // Remove tail if no food eaten
        newSnake.pop();
        return newSnake;
      });
    }, GAME_SPEED);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameStarted, isPaused, gameOver, food, generateFood, isValidFoodPosition]);

  const startGame = () => {
    setGameStarted(true);
    setIsPaused(false);
  };

  return (
    <div className="snake-game-container">
      <div className="game-header">
        <h1>Snake Game</h1>
        <div className="score">Score: {score}</div>
      </div>

      <div className="game-board">
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
          const x = index % GRID_SIZE;
          const y = Math.floor(index / GRID_SIZE);
          const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y;
          const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y);
          const isFood = food.x === x && food.y === y;

          return (
            <div
              key={index}
              className={`cell ${isSnakeHead ? 'snake-head' : ''} ${isSnakeBody ? 'snake-body' : ''} ${isFood ? 'food' : ''}`}
            />
          );
        })}
      </div>

      {!gameStarted && (
        <div className="game-overlay">
          <div className="overlay-content">
            <h2>Snake Game</h2>
            <p>Use arrow keys or WASD to move</p>
            <p>Press SPACE to pause</p>
            <button onClick={startGame} className="start-button">
              Start Game
            </button>
          </div>
        </div>
      )}

      {gameOver && gameStarted && (
        <div className="game-overlay">
          <div className="overlay-content">
            <h2>Game Over!</h2>
            <p>Final Score: {score}</p>
            <p>Press SPACE to restart</p>
          </div>
        </div>
      )}

      {isPaused && gameStarted && !gameOver && (
        <div className="game-overlay">
          <div className="overlay-content">
            <h2>Paused</h2>
            <p>Press SPACE to resume</p>
          </div>
        </div>
      )}

      <div className="game-controls">
        <div className="controls-info">
          <p><strong>Controls:</strong></p>
          <p>Arrow Keys / WASD - Move</p>
          <p>Space - Pause / Restart</p>
        </div>
      </div>
    </div>
  );
}

export default SnakeGame;
