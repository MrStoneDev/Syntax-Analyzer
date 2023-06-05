import fs from 'fs';
import readline from 'readline';
import { States, Finals } from './transitionTable.js';

const inputFile = 'input.txt';
const outputFile = 'tokens.txt';
const errorFile = 'errors.txt';

const readStream = fs.createReadStream(inputFile, 'utf8');

const writeStream = fs.createWriteStream(outputFile, 'utf8');

const errorStream = fs.createWriteStream(errorFile, 'utf8');

const rl = readline.createInterface({
  input: readStream,
  crlfDelay: Infinity
});

let lineCount = 0;
let curr = '';
let state = 0;
let carry = false;
const rsl = [];

const analyzeChar = (char, position) => {
  const currState = States[state];
  let matched = false;
  if (currState.moves) {
    for (const key in currState.moves) {
      const compare = RegExp(key);
      console.log('Comparison -> ', compare, ' to: <', char, '>');
      console.log('current token -> ', curr);
      const match = char.match(compare);
      console.log('Matched? -> ', match);
      if (match) {
        if (currState.will === 'carry') {
          carry = true;
        }
        state = currState.moves[key];
        matched = true;
        curr = curr + char;
        break;
      }
    }
  } else if (currState.will === 'end') {
    rsl.push({ type: Finals[state], value: curr });
    carry = false;
    matched = true;
    console.log('   final -> ', curr);
    state = 0;
    curr = '';
    return true;
  }
  if (!matched) {
    if (currState.will === 'end') {
      if (currState.predates) {
        if (Finals[currState.predates] === rsl[rsl.length-1].type) {
          rsl.pop();
        }
      }
      rsl.push({ type: Finals[state], value: curr });
      carry = false;
      matched = true;
      console.log('--> final -> ', curr);
      state = 0;
      curr = '';
      return true;
    } else {
      throw new Error(`Invalid character: ${char}, at position ${position}`);
    }
  }
};

rl.on('line', (line) => {
  try {
    const chars = line.split('');
    console.log(chars, chars.length);
    for (let index = 0; index <= chars.length; index++) {
      let char;
      if (index < chars.length) {
        char = chars[index];
      } else {
        char = ' ';
      }
      const pos = index + 1;
      console.log('   State -> ', state, ' - Pos -> ', index);
      const n = analyzeChar(char, pos);
      if (n) {
        index--;
      }
    }
    lineCount++;

    const output = rsl.map(token => `${token.type}: ${token.value}`).join('\n');
    writeStream.write(output + '\n');
  } catch (error) {
    lineCount++;

    if (rsl) {
      const output = rsl.map(token => `${token.type}: ${token.value}`).join('\n');
      writeStream.write(output + '\n');
    }

    errorStream.write('Error on line ' + lineCount + ' -> ' + error);
    console.error('Error on line ' + lineCount + ' -> ' + error);
  }
});

rl.on('close', () => {
  if (carry) {
    console.error('Error on line ' + lineCount + ' -> ' + curr + ' was not closed');
    errorStream.write('Error on line ' + lineCount + ' -> ' + curr + ' was not closed');
  }
  console.log(rsl);
  console.log('Finished');
  writeStream.end();
  errorStream.end();
});