const $ = (s) => document.querySelector(s),
  garden = $("#garden"),
  plant = $("#plant"),
  effect = $("#effect"),
  helper = $("#helper"),
  chart = $("#chart"),
  ctx = chart.getContext("2d");
let water = false,
  reset = false,
  pace = "lesson",
  history = [],
  lastStage = 0,
  eventKey = "",
  completeCelebrated = false;
const stageNames = ["씨앗", "새싹", "튼튼한 잎", "꽃봉오리", "활짝 핀 꽃"];
const messages = {
  happy: ["정말 행복해!", "빛과 온도, 습도가 모두 좋아요."],
  growing: ["쑥쑥 자라는 중", "환경을 유지하고 흙을 살펴주세요."],
  thirsty: ["목이 말라요", "Dial로 양을 정하고 Button으로 물을 주세요."],
  overwatered: ["물이 너무 많아요", "잠시 물 주기를 쉬어주세요."],
  dark: ["조금 어두워요", "식물이 빛을 받을 수 있게 해주세요."],
  cold: ["조금 추워요", "교실 온도를 따뜻하게 살펴주세요."],
  hot: ["너무 더워요", "조금 시원한 환경이 필요해요."],
  dry_air: ["공기가 건조해요", "습도를 올릴 방법을 찾아보세요."],
};
document.querySelectorAll("[data-pace]").forEach(
  (button) =>
    (button.onclick = () => {
      pace = button.dataset.pace;
      queueReset();
      document
        .querySelectorAll("[data-pace]")
        .forEach((x) => x.classList.toggle("active", x === button));
    }),
);
function queueReset() {
  reset = true;
  lastStage = 0;
  eventKey = "";
  completeCelebrated = false;
  history = [];
}
$("#reset").onclick = queueReset;
$("#water").onclick = () => (water = true);
function confetti() {
  const box = $("#celebration"),
    colors = ["#53bd70", "#c9ef65", "#51bfe2", "#f6c754", "#f5846c"];
  box.innerHTML = Array.from(
    { length: 45 },
    () =>
      `<i style="--x:${Math.random() * 100}%;--c:${colors[Math.floor(Math.random() * colors.length)]}"></i>`,
  ).join("");
  setTimeout(() => (box.innerHTML = ""), 1600);
}
function graph() {
  const w = chart.width,
    h = chart.height;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "#d7e3d6";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (i * h) / 4);
    ctx.lineTo(w, (i * h) / 4);
    ctx.stroke();
  }
  const keys = [
    ["temperature", "#f5846c", (v) => (v + 10) / 70],
    ["humidity", "#51bfe2", (v) => v / 100],
    ["light", "#f6c754", (v) => v / 100],
  ];
  for (const [key, color, norm] of keys) {
    ctx.beginPath();
    history.forEach((item, i) => {
      const x = (i / Math.max(1, history.length - 1)) * w,
        y = h - Math.max(0, Math.min(1, norm(item[key]))) * h;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}
function updateOutput(input, suffix) {
  input.nextElementSibling.textContent = input.value + suffix;
}
document
  .querySelectorAll(".mock input")
  .forEach(
    (input) =>
      (input.oninput = () =>
        updateOutput(
          input,
          input.id.includes("temp")
            ? "°C"
            : input.id.includes("dial")
              ? ""
              : "%",
        )),
  );
$("#mock-distance").oninput = () => updateOutput($("#mock-distance"), "cm");
function render(data) {
  $("#mode").textContent =
    data.mode === "real" ? "● ENV + CARE MODULES LIVE" : "● MOCK CONTROLS";
  document
    .querySelectorAll(".mock input")
    .forEach((x) => (x.disabled = data.mode === "real"));
  $("#stage-name").textContent = stageNames[data.stage];
  $("#growth").textContent = Math.floor(data.growth) + "%";
  $("#happiness").textContent = Math.round(data.happiness);
  $("#score").textContent = String(data.score).padStart(3, "0");
  const min = Math.floor(data.remaining / 60),
    sec = Math.floor(data.remaining % 60);
  $("#time").textContent = `${min}:${String(sec).padStart(2, "0")}`;
  garden.dataset.status = data.status;
  garden.style.setProperty(
    "--light-alpha",
    Math.max(0.04, (data.light / 100) * 0.5),
  );
  plant.style.backgroundImage = `url('/projects/classroom-garden/assets/plant_stages/stage-${data.stage}.png')`;
  plant.dataset.pose = data.pose;
  $("#growth-bar").style.setProperty("--growth", data.growth + "%");
  const msg = messages[data.status] || messages.growing;
  $("#speech strong").textContent = msg[0];
  $("#speech span").textContent = msg[1];
  $("#quality").textContent = data.environment_quality + "%";
  $("#temperature").textContent = data.temperature + "°C";
  $("#humidity").textContent = data.humidity + "%";
  $("#light").textContent = data.light + "%";
  $("#temp-bar").style.setProperty(
    "--value",
    Math.max(0, Math.min(100, ((data.temperature + 10) / 70) * 100)) + "%",
  );
  $("#humidity-bar").style.setProperty("--value", data.humidity + "%");
  $("#light-bar").style.setProperty("--value", data.light + "%");
  $("#soil").textContent = data.soil + "%";
  $("#soil-bar").style.setProperty("--soil", data.soil + "%");
  $("#water-amount").textContent = "+" + data.water_amount + "ml";
  $("#dial").style.setProperty("--dial", data.dial + "%");
  $("#dial-value").textContent = Math.round(data.dial);
  $("#distance").textContent = data.distance + "cm";
  $("#pet").classList.toggle("active", data.distance < 12);
  $("#waters").textContent = data.waters;
  $("#pets").textContent = data.pets;
  history.push(data);
  history = history.slice(-100);
  graph();
  if (!data.event) eventKey = "";
  if (data.event && data.event !== eventKey) {
    eventKey = data.event;
    effect.className = "effect " + (data.event === "water" ? "water" : "pet");
    setTimeout(() => (effect.className = "effect"), 1500);
  }
  if (data.stage > lastStage) {
    lastStage = data.stage;
    helper.className = "helper cheer";
    confetti();
    setTimeout(() => (helper.className = "helper data"), 1100);
  } else if (
    ["thirsty", "overwatered", "dark", "cold", "hot", "dry_air"].includes(
      data.status,
    )
  )
    helper.className = "helper warn";
  else if (data.status === "happy") helper.className = "helper cheer";
  else helper.className = "helper data";
  if (data.complete && !completeCelebrated) {
    completeCelebrated = true;
    confetti();
  }
}
async function poll() {
  try {
    const sentWater = water,
      sentReset = reset,
      r = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperature: +$("#mock-temp").value,
          humidity: +$("#mock-humidity").value,
          light: +$("#mock-light").value,
          dial: +$("#mock-dial").value,
          distance: +$("#mock-distance").value,
          button: water,
          reset,
          pace,
        }),
      }),
      data = await r.json();
    if (sentWater === water) water = false;
    if (sentReset === reset) reset = false;
    if (!r.ok) throw Error(data.error);
    render(data);
  } catch (error) {
    $("#mode").textContent = "● 연결 오류";
    $("#speech strong").textContent = "모듈을 기다리는 중";
    $("#speech span").textContent = error.message;
  }
  setTimeout(poll, 200);
}
poll();
