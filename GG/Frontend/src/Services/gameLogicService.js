import axios from '../Utils/axios';

export const startTermMatching = async (userId, difficulty = 'Beginner', count = 6) => {
  const response = await axios.post('/api/games/term-matching/start', { userId, difficulty, count });
  return response;
};

export const submitTermMatching = async (userId, answers) => {
  const response = await axios.post('/api/games/term-matching/submit', { userId, answers });
  return response;
};

export const startGrammarQuiz = async (userId, difficulty = 'Beginner', count = 5) => {
  const response = await axios.post('/api/games/grammar-quiz/start', { userId, difficulty, count });
  return response;
};

export const submitGrammarQuiz = async (userId, answers) => {
  const response = await axios.post('/api/games/grammar-quiz/submit', { userId, answers });
  return response;
};

export const startPronunciationDrill = async (userId, difficulty = 'Beginner', count = 5) => {
  const response = await axios.post('/api/games/pronunciation-drill/start', { userId, difficulty, count });
  return response;
};

export const submitPronunciationDrill = async (userId, completedCount) => {
  const response = await axios.post('/api/games/pronunciation-drill/submit', { userId, completedCount });
  return response;
};
