const historyLen = 24;
const data = {
  cpu: Array(historyLen).fill(42),
  req: Array(historyLen).fill(1200),
  err: Array(historyLen).fill(3),
};
let prev = { cpu: 42, req: 1200, err: 3 };

const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 600 },
  plugins: { legend: { display: false } },
  scales: {
    x: { display: false },
    y: {
      grid: { color: "rgba(45,212,191,0.08)" },
      ticks: { color: "#64748b", font: { family: "IBM Plex Mono" } },
    },
  },
};

const cpuChart = new Chart(document.getElementById("chart-cpu"), {
  type: "line",
  data: {
    labels: data.cpu.map((_, i) => i),
    datasets: [{
      data: [...data.cpu],
      borderColor: "#2dd4bf",
      backgroundColor: "rgba(45,212,191,0.12)",
      fill: true,
      tension: 0.35,
    }],
  },
  options: { ...chartOpts, plugins: { ...chartOpts.plugins, title: { display: true, text: "CPU %", color: "#94a3b8" } } },
});

const reqChart = new Chart(document.getElementById("chart-req"), {
  type: "line",
  data: {
    labels: data.req.map((_, i) => i),
    datasets: [{
      data: [...data.req],
      borderColor: "#38bdf8",
      backgroundColor: "rgba(56,189,248,0.1)",
      fill: true,
      tension: 0.35,
    }],
  },
  options: { ...chartOpts, plugins: { ...chartOpts.plugins, title: { display: true, text: "Requests/s", color: "#94a3b8" } } },
});

function randWalk(val, min, max, step) {
  let next = val + (Math.random() - 0.48) * step;
  return Math.min(max, Math.max(min, next));
}

function logIncident(msg, level = "info") {
  const ul = document.getElementById("incident-log");
  const li = document.createElement("li");
  li.className = level;
  const t = new Date().toLocaleTimeString();
  li.textContent = `[${t}] ${msg}`;
  ul.prepend(li);
  while (ul.children.length > 12) ul.removeChild(ul.lastChild);
}

function fmtDelta(cur, old) {
  const d = cur - old;
  const sign = d >= 0 ? "+" : "";
  return `${sign}${d.toFixed(d % 1 ? 1 : 0)}`;
}

function tick() {
  const thCpu = +document.getElementById("th-cpu").value;
  const thErr = +document.getElementById("th-err").value;

  prev = { cpu: data.cpu.at(-1), req: data.req.at(-1), err: data.err.at(-1) };

  data.cpu.push(randWalk(data.cpu.at(-1), 18, 98, 8));
  data.req.push(randWalk(data.req.at(-1), 400, 2800, 180));
  data.err.push(randWalk(data.err.at(-1), 0, 28, 4));

  data.cpu.shift();
  data.req.shift();
  data.err.shift();

  const cpu = data.cpu.at(-1);
  const req = Math.round(data.req.at(-1));
  const err = Math.round(data.err.at(-1));

  document.getElementById("val-cpu").textContent = `${cpu.toFixed(1)}%`;
  document.getElementById("val-req").textContent = req.toLocaleString();
  document.getElementById("val-err").textContent = err;
  document.getElementById("delta-cpu").textContent = fmtDelta(cpu, prev.cpu) + " vs last";
  document.getElementById("delta-req").textContent = fmtDelta(req, prev.req) + " vs last";
  document.getElementById("delta-err").textContent = fmtDelta(err, prev.err) + " vs last";

  cpuChart.data.datasets[0].data = [...data.cpu];
  reqChart.data.datasets[0].data = [...data.req];
  cpuChart.update();
  reqChart.update();

  const cardCpu = document.getElementById("card-cpu");
  const cardErr = document.getElementById("card-err");
  cardCpu.classList.toggle("alert", cpu > thCpu);
  cardErr.classList.toggle("alert", err > thErr);

  const status = document.getElementById("val-status");
  const cardStatus = document.getElementById("card-status");
  if (cpu > thCpu || err > thErr) {
    status.textContent = "Degraded";
    cardStatus.classList.remove("ok");
    cardStatus.classList.add("alert");
  } else {
    status.textContent = "Healthy";
    cardStatus.classList.add("ok");
    cardStatus.classList.remove("alert");
  }

  if (cpu > thCpu && Math.random() > 0.6) {
    logIncident(`CPU spike ${cpu.toFixed(1)}% exceeded threshold ${thCpu}%`, "crit");
  }
  if (err > thErr && Math.random() > 0.5) {
    logIncident(`Error rate ${err}/min above ${thErr}/min`, "warn");
  }
}

function updateClock() {
  document.getElementById("clock").textContent = new Date().toLocaleString();
}

updateClock();
setInterval(updateClock, 1000);
setInterval(tick, 2200);
tick();
logIncident("Dashboard initialized — monitoring active");
