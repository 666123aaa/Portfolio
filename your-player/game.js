const video = document.getElementById("video");
const startHint = document.getElementById("startHint");
const choiceOverlay = document.getElementById("choiceOverlay");
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const debugEl = document.getElementById("debug");

let stageIndex = 0;
let hasUserGesture = false;

/**
 * 结构说明：
 * - type: "auto"   播放完自动进入下一幕
 * - type: "choice" 显示问题与选项（中英双语）；点选项播放对应视频，播完进入下一幕
 *
 * bilingual fields:
 * - question: { zh: "...", en: "..." }
 * - options: [{ zh:"...", en:"...", video:"..." }, ...]
 */
const stages = [
  // 0 出生：先加载作为开头画面（不自动播放，等点击开始后播放）
  { type: "auto", video: "assets/0_birth_observe.mp4", isIntro: true },

  // 1 toddler 玩具
  {
    type: "choice",
       question: { zh: "你现在是个婴儿，想要什么玩具？", en: "You are a baby now. What kind of toy do you want?" },
    options: [
      { zh: "毛绒玩偶 / 玩具厨房", en: "Plush toys / Toy kitchen", video: "assets/1_toddler_toy_A.mp4" },
      { zh: "积木 / 玩具汽车",     en: "Blocks / Toy cars",       video: "assets/1_toddler_toy_B.mp4" },
      { zh: "绘本 / 音乐玩具",     en: "Picture books / Music toys", video: "assets/1_toddler_toy_C.mp4" }
    ]
  },

  // 2 幼儿园 情绪
  {
    type: "choice",
    question: { zh: "被抢了玩具，你的反应是？", en: "A toy is taken away—what do you do?" },
    options: [
      { zh: "大声说“不”，抢回来", en: "Say “No” and take it back", video: "assets/2_kindergarten_A.mp4" },
      { zh: "找老师 / 分享协商",   en: "Ask teacher / Negotiate & share", video: "assets/2_kindergarten_B.mp4" },
      { zh: "安慰转移注意力",     en: "Comfort and redirect attention", video: "assets/2_kindergarten_C.mp4" }
    ]
  },

  // 3 小学 兴趣
  {
    type: "choice",
    question: { zh: "兴趣班报名，你建议？", en: "Which extracurricular class do you suggest?" },
    options: [
      { zh: "舞蹈 / 声乐",   en: "Dance / Vocal",         video: "assets/3_primary_A.mp4" },
      { zh: "编程 / 机器人", en: "Coding / Robotics",     video: "assets/3_primary_B.mp4" },
      { zh: "足球 / 篮球",   en: "Football / Basketball", video: "assets/3_primary_C.mp4" },
      { zh: "绘画 / 书法",   en: "Art / Calligraphy",     video: "assets/3_primary_D.mp4" }
    ]
  },

  // 4 青春期 着装
  {
    type: "choice",
    question: { zh: "买衣服，你建议？", en: "Buying clothes—what do you suggest?" },
    options: [
      { zh: "符合大众期待", en: "Match common expectations", video: "assets/4_teen_A.mp4" },
      { zh: "TA自己喜欢",   en: "What they personally like", video: "assets/4_teen_B.mp4" },
      { zh: "宽松运动装",   en: "Loose sportswear",          video: "assets/4_teen_C.mp4" }
    ]
  },

  // 5 成人 选择
  {
    type: "choice",
    question: { zh: "人生选择，你的核心建议是？", en: "A life decision—what’s your core advice?" },
    options: [
      { zh: "高薪高压行业", en: "High-pay, high-pressure path", video: "assets/5_adult_A.mp4" },
      { zh: "稳定可兼顾",   en: "Stable and balanced life",     video: "assets/5_adult_B.mp4" },
      { zh: "追随热情",     en: "Follow genuine passion",       video: "assets/5_adult_C.mp4" }
    ]
  },

  // 6 终章
  { type: "auto", video: "assets/6_report_end.mp4" }
];

function setDebug(text) {
  if (!debugEl) return;
  debugEl.textContent = text;
}

function formatBilingual(obj) {
  // obj: {zh, en}
  return `${obj.zh}\n${obj.en}`;
}

function clearChoices() {
  choiceOverlay.style.display = "none";
  questionEl.textContent = "";
  optionsEl.innerHTML = "";
}

function showChoices(question, options) {
  choiceOverlay.style.display = "grid";

  // 中英双语：两行显示
  questionEl.textContent = formatBilingual(question);

  optionsEl.innerHTML = "";
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = `${opt.zh}\n${opt.en}`;
    btn.onclick = () => {
      hasUserGesture = true; // 交互成立
      clearChoices();
      playVideo(opt.video, true);
    };
    optionsEl.appendChild(btn);
  });
}

function safePlay() {
  if (!hasUserGesture) return;

  const p = video.play();
  if (p && typeof p.catch === "function") {
    p.catch(err => {
      console.log("play blocked:", err);
      setDebug("play blocked: " + err.name);
    });
  }
}

function playVideo(src, goNextOnEnd) {
  video.onended = null;

  video.pause();
  video.src = src;
  video.load();

  setDebug(`stage=${stageIndex} src=${src}`);

  safePlay();

  video.onended = () => {
    if (!goNextOnEnd) return;
    stageIndex++;
    runStage();
  };
}

function runStage() {
  const s = stages[stageIndex];
  if (!s) {
    clearChoices();
    setDebug("END");
    return;
  }

  if (s.type === "auto") {
    clearChoices();
    playVideo(s.video, true);
    return;
  }

  if (s.type === "choice") {
    // 选择阶段：不自动播放，等待用户点按钮（按钮点击会触发播放）
    showChoices(s.question, s.options);
    return;
  }
}

/**
 * 开头逻辑：
 * - 先把第一个视频（stage 0）load 出来，让画面出现在屏幕上（不 play）
 * - 中央显示 “点击开始 / Click to start”
 * - 用户点击后：隐藏提示并开始播放（此时才 play，避免 NotAllowedError）
 */
function preloadIntroFrame() {
  stageIndex = 0;
  const intro = stages[0];

  video.src = intro.video;
  video.load();

  // 尽量让第一帧显示出来：loadeddata 后轻触到 0 秒
  video.addEventListener("loadeddata", () => {
    try {
      video.currentTime = 0;
      video.pause();
    } catch (_) {}
  }, { once: true });
}

startHint.addEventListener("click", () => {
  hasUserGesture = true;
  startHint.style.display = "none";
  // 从第0幕开始播放
  stageIndex = 0;
  runStage();
  safePlay(); // 再保险一次
});

// 初始化：只预载第一幕画面，不播放
document.addEventListener("DOMContentLoaded", () => {
  clearChoices();
  preloadIntroFrame();
});
