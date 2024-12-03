const MORSE_CODE_DICT = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
    'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
    'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
    'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
    'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
    'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....',
    '7': '--...', '8': '---..', '9': '----.', ' ': '/'
  };
  
  const inputText = document.getElementById('inputText');
  const outputText = document.getElementById('outputText');
  const errorMessage = document.getElementById('errorMessage');
  
  function textToMorse(text) {
    return text.toUpperCase().split('').map(char => {
      if (MORSE_CODE_DICT[char]) {
        return MORSE_CODE_DICT[char];
      } else {
        return null;
      }
    }).join(' ');
  }
  
  function morseToText(morse) {
    const reverseDict = Object.fromEntries(
      Object.entries(MORSE_CODE_DICT).map(([key, value]) => [value, key])
    );
    return morse.split(' ').map(code => reverseDict[code] || '?').join('');
  }
  
  inputText.addEventListener('input', () => {
    const input = inputText.value;
    const morse = textToMorse(input);
  
    if (morse.includes(null)) {
      errorMessage.textContent = "Invalid characters detected!";
      outputText.value = '';
    } else {
      errorMessage.textContent = '';
      outputText.value = morse;
    }
  });
  
// 音频参数配置
const AUDIO_CONTEXT = new (window.AudioContext || window.webkitAudioContext)();
const UNIT_DURATION = 0.1; // 单位时长，控制速度（秒）

/**
 * 播放摩斯码声音
 * @param {string} morseCode 摩斯码字符串
 */
function playMorseAudio(morseCode) {
  let time = AUDIO_CONTEXT.currentTime; // 当前音频时间

  const oscillator = AUDIO_CONTEXT.createOscillator(); // 声音发生器
  const gainNode = AUDIO_CONTEXT.createGain(); // 控制音量
  oscillator.type = "sine"; // 正弦波声音
  oscillator.frequency.setValueAtTime(600, AUDIO_CONTEXT.currentTime); // 600Hz频率
  oscillator.connect(gainNode).connect(AUDIO_CONTEXT.destination);

  // 解析摩斯码
  for (let symbol of morseCode) {
    if (symbol === ".") {
      // 短音
      gainNode.gain.setValueAtTime(1, time);
      time += UNIT_DURATION;
      gainNode.gain.setValueAtTime(0, time);
    } else if (symbol === "-") {
      // 长音
      gainNode.gain.setValueAtTime(1, time);
      time += UNIT_DURATION * 3;
      gainNode.gain.setValueAtTime(0, time);
    } else if (symbol === " ") {
      // 字符间间隔
      time += UNIT_DURATION * 3;
    } else if (symbol === "/") {
      // 单词间间隔
      time += UNIT_DURATION * 7;
    }
    time += UNIT_DURATION; // 符号间静音间隔
  }

  oscillator.start();
  oscillator.stop(time); // 停止振荡器
}

// 绑定播放按钮
document.getElementById("playAudio").addEventListener("click", () => {
  const morseCode = outputText.value.trim();
  if (morseCode) {
    playMorseAudio(morseCode);
  } else {
    alert("No Morse code to play!");
  }
});

/**
 * 下载摩斯码声音为 WAV 文件
 * @param {string} morseCode 摩斯码字符串
 */
function downloadMorseAudio(morseCode) {
  const sampleRate = 44100; // 采样率
  const duration = calculateDuration(morseCode) * sampleRate; // 总时长
  const audioBuffer = AUDIO_CONTEXT.createBuffer(1, duration, sampleRate);
  const data = audioBuffer.getChannelData(0);

  let position = 0;
  for (let symbol of morseCode) {
    if (symbol === ".") {
      // 短音
      generateTone(data, position, sampleRate, UNIT_DURATION);
      position += UNIT_DURATION * sampleRate;
    } else if (symbol === "-") {
      // 长音
      generateTone(data, position, sampleRate, UNIT_DURATION * 3);
      position += UNIT_DURATION * 3 * sampleRate;
    } else if (symbol === " ") {
      // 符号间间隔
      position += UNIT_DURATION * sampleRate;
    } else if (symbol === "/") {
      // 单词间间隔
      position += UNIT_DURATION * 7 * sampleRate;
    }
    position += UNIT_DURATION * sampleRate; // 静音间隔
  }

  const wavBlob = createWavFile(audioBuffer);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(wavBlob);
  link.download = generateFileName()+".wav";
  link.click();
}

// 绑定下载按钮
document.getElementById("downloadAudio").addEventListener("click", () => {
  const morseCode = outputText.value.trim();
  if (morseCode) {
    downloadMorseAudio(morseCode);
  } else {
    alert("No Morse code to download!");
  }
});

/**
 * 生成正弦波音频数据
 */
function generateTone(data, start, sampleRate, duration) {
  const frequency = 600; // Hz
  const amplitude = 0.5; // 振幅
  for (let i = 0; i < duration * sampleRate; i++) {
    data[start + i] = amplitude * Math.sin(2 * Math.PI * frequency * (i / sampleRate));
  }
}

/**
 * 计算摩斯码时长
 */
function calculateDuration(morseCode) {
  let duration = 0;
  for (let symbol of morseCode) {
    if (symbol === ".") {
      duration += UNIT_DURATION;
    } else if (symbol === "-") {
      duration += UNIT_DURATION * 3;
    } else if (symbol === " ") {
      duration += UNIT_DURATION * 3;
    } else if (symbol === "/") {
      duration += UNIT_DURATION * 7;
    }
    duration += UNIT_DURATION; // 符号间间隔
  }
  return duration;
}

/**
 * 创建 WAV 文件
 */
function createWavFile(audioBuffer) {
  const wav = new DataView(new ArrayBuffer(44 + audioBuffer.length * 2));
  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      wav.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  writeString(0, "RIFF");
  wav.setUint32(4, 36 + audioBuffer.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  wav.setUint32(16, 16, true);
  wav.setUint16(20, 1, true);
  wav.setUint16(22, 1, true);
  wav.setUint32(24, audioBuffer.sampleRate, true);
  wav.setUint32(28, audioBuffer.sampleRate * 2, true);
  wav.setUint16(32, 2, true);
  wav.setUint16(34, 16, true);
  writeString(36, "data");
  wav.setUint32(40, audioBuffer.length * 2, true);

  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    wav.setInt16(offset, audioBuffer.getChannelData(0)[i] * 0x7fff, true);
    offset += 2;
  }

  return new Blob([wav], { type: "audio/wav" });
}

  
// 等待 DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 第一个输入框的复制功能
    const copyInputButton = document.querySelector('.copy-input-btn');
    const inputTextArea = document.getElementById('inputText');
    
    // 第二个输入框的复制功能
    const copyOutputButton = document.querySelector('.copy-output-btn');
    const outputTextArea = document.getElementById('outputText');
    
    const errorMessage = document.getElementById('errorMessage');

    // 处理第一个输入框的复制
    if (copyInputButton) {
        copyInputButton.addEventListener('click', handleCopy(inputTextArea));
    }

    // 处理第二个输入框的复制
    if (copyOutputButton) {
        copyOutputButton.addEventListener('click', handleCopy(outputTextArea));
    }

    // 复制处理函数
    function handleCopy(textArea) {
        return () => {
            if (textArea.value) {
                textArea.select();
                try {
                    document.execCommand('copy');
                    errorMessage.textContent = 'Copied to clipboard!';
                    errorMessage.style.color = '#28a745';
                    setTimeout(() => {
                        errorMessage.textContent = '';
                    }, 3000);
                } catch (err) {
                    console.error('Failed to copy:', err);
                    errorMessage.textContent = 'Failed to copy text';
                    errorMessage.style.color = '#dc3545';
                    setTimeout(() => {
                        errorMessage.textContent = '';
                    }, 3000);
                }
            }
        };
    }
});
  
document.addEventListener('DOMContentLoaded', () => {
    const categoryItems = document.querySelectorAll('.category-item');

    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            // 移除所有项的 active 类
            categoryItems.forEach(i => i.classList.remove('active'));
            // 添加 active 类到当前点击项
            item.classList.add('active');
        });
    });
});
  
function generateFileName() {
    // 获取当前时间
    const now = new Date();
    
    // 格式化年月日时分秒
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // 生成三位随机数
    const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    
    // 组合文件名：年月日时分秒+随机数
    return `${year}${month}${day}${hours}${minutes}${seconds}${randomNum}`;
}

// 在下载WAV文件的代码中使用
document.addEventListener('DOMContentLoaded', () => {
    const downloadAudioButton = document.getElementById('downloadAudio');
    const downloadTxtButton = document.getElementById('downloadTxt');
    const outputText = document.getElementById('outputText');
    let audioData; // 假设这是你的音频数据

    function generateFileName() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        
        return `${year}${month}${day}${hours}${minutes}${seconds}${randomNum}`;
    }

    // 下载WAV文件
    if (downloadAudioButton) {
        downloadAudioButton.addEventListener('click', () => {
            if (audioData) {  // 确保音频数据存在
                const fileName = generateFileName(); // 生成文件名
                const blob = new Blob([audioData], { type: 'audio/wav' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fileName}.wav`;  // 使用生成的文件名
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                console.error('Audio data is not available.');
            }
        });
    }

    // 下载TXT文件
    if (downloadTxtButton) {
        downloadTxtButton.addEventListener('click', () => {
            if (outputText.value) {  // 确保有文本内容
                const fileName = generateFileName(); // 生成文件名
                const blob = new Blob([outputText.value], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fileName}.txt`;  // 使用生成的文件名
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                console.error('No text available to download.');
            }
        });
    }
});
function addText(text) {
    const inputTextArea = document.getElementById('inputText');
    inputTextArea.value += (inputTextArea.value ? ' ' : '') + text; // Append text with a space if there's existing text
    convertToMorse(inputTextArea.value); // Call the function to convert to Morse code
}

function convertToMorse(text) {
    const morseCodeMap = {
        'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
        'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
        'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
        'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
        'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
        '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
        '8': '---..', '9': '----.', ' ': '/'
    };

    const morseCode = text.toUpperCase().split('').map(char => morseCodeMap[char] || '').join(' ');
    document.getElementById('outputText').value = morseCode; // Update the output textarea
}
  