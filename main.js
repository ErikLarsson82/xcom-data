
const margin = ({top: 20, right: 20, bottom: 200, left: 50})
const width = 800 - margin.left - margin.right
const height = 600 - margin.top - margin.bottom

const parseTime = d3.timeParse("%d-%b-%y")
const formatTime = d3.timeFormat("%b %d")

let showVanilla = true,
  showEvolution = true,
  showCargo = true,
  showTog = true,
  showOccupation = true,
  showOnslaught = true,
  showInfiltration = true,
  showMisdirection = true,
  showDomination = true

  

const svg = initGraph()

function parseData(d, i) {
  d.date = parseTime(d.date);
  d.score = isNaN(+d.score) ? d.score : +d.score;
  d.i = i
  return d;
}

const opacity = name => bool => bool ? name : [name].concat("dim").join(" ")

function setIcons() {
  document.getElementById("xcom").className = opacity("icon")(showVanilla)
  document.getElementById("exalt").className = opacity("icon")(showEvolution)
  document.getElementById("cargo").className = opacity("button")(showCargo)
  document.getElementById("tog").className = opacity("button")(showTog)
  document.getElementById("occupation-checkbox").innerHTML = showOccupation ? '[X]' : '[ ]'
}

function initGraph() {

  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom])

  d3.select('#graph-container').append(() => svg.node())

  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(${margin.left},${height + 130})`)

  svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},${margin.top})`)
      
  const content = svg.append("g")
    .attr("class", "content")
    .attr("transform", `translate(${margin.left},${margin.top})`)

  svg.append("text")
      .attr("y", 10)
      .attr("x", 80)
      .attr("dy", "1em")
      .attr("font-size", "35px")
      .style("text-anchor", "left")
      .text("XCOM Score Card");  

  svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 5)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Score");  

  svg.append("text")
      .attr("y", 570)
      .attr("x", (width / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Date");

  render()

  return svg
}

function render() {
  d3.tsv("data.tsv").then(x => x.filter(hiddenData)).then(renderGraph)
}

const isVanilla = d => d.game === "vanilla"
const isEvolution = d => !isVanilla(d)    

const hiddenData = x => {
  if (!showVanilla && isVanilla(x)) {
    return false
  }
  if (!showEvolution && !isVanilla(x)) {
    return false
  }
  if (!showCargo && x.group === '👤') {
    return false
  }
  if (!showTog && x.group === '👪') {
    return false
  }
  if (!showOccupation && x.mission === 'Occupation') {
    return false
  }
  if (!showOnslaught && x.mission === 'Onslaught') {
    return false
  }
  if (!showInfiltration && x.mission === 'Infiltration') {
    return false
  }
  if (!showMisdirection && x.mission === 'Misdirection') {
    return false
  }
  if (!showDomination && x.mission === 'Domination') {
    return false
  }
  return true
}

function allCheckboxes() {
  if (!showOccupation) {
    document.getElementById("select-all-checkbox").innerHTML = '[X]'
    showOccupation = true
    showOnslaught = true
    showInfiltration = true
    showMisdirection = true
    showDomination = true
  } else {
    document.getElementById("select-all-checkbox").innerHTML = '[ ]'
    showOccupation = false
    showOnslaught = false
    showInfiltration = false
    showMisdirection = false
    showDomination = false
  }
}

function renderGraph(_data) {

  setIcons()

  const data = _data.map(parseData)

  const missions = [
    "Onslaught",
    "Occupation",
    "Infiltration",
    "Misdirection",
    "Domination",
    "Supression",
    "Annihilation",
    "All"
  ].map(mission => {

    const sum = (acc, curr) => acc + curr
    const currentMission = d => d.mission === mission

    const visibleData = data.filter(hiddenData)
    const missionData = mission === "All" ? visibleData : visibleData.filter(currentMission)

    const scores = missionData.filter(d => !isNaN(+d.score)).map(d => d.score)

    const played = missionData
    
    const wins = missionData.filter(d => (!isNaN(+d.score) && d.score > 0) || d.score === "WIN")
      
    const losses = missionData.filter(d => (!isNaN(+d.score) && d.score < 0) || d.score === "LOSS")
    
    document.getElementById(`${mission.toLowerCase()}-average`).innerHTML = scores.length === 0 ? "-" : (scores.reduce(sum, 0) / scores.length).toFixed(2)
    document.getElementById(`${mission.toLowerCase()}-ratio`).innerHTML = played.length === 0 ? "-" : `${Math.round((wins.length / played.length) * 100)} %`
    document.getElementById(`${mission.toLowerCase()}-amount`).innerHTML = played.length === 0 ? "-" : played.length
  })

  const x = d3.scaleBand()
    .domain(d3.range(data.length))
    .range([0, width])
    .padding(0.2)
    .paddingOuter(0.2)
    .align(1)

  const scores = data.filter(x=>!isNaN(x.score)).map(x=>x.score)
  const min = scores.length > 0 ? d3.min(scores) : -100

  const y = d3.scaleLinear()
    .domain([min, 100])
    .range([height + 10, margin.top])

  svg.select(".x-axis")
      .call(d3.axisBottom(x).tickFormat(i => formatTime(data[i].date)).ticks(data.length))
      .selectAll("text")
      .attr("transform", "rotate(90)")
      .style("text-anchor", "start")
      .attr("y", -4)
      .attr("x", 10);

  svg.select(".y-axis")
    .call(d3.axisLeft(y))

  const selection = svg.select(".content")
    .selectAll("rect")
    .data(data, x=>`${x.i}`)
    .join("rect")

  // WIN with score +123
  selection.filter(d => typeof d.score === 'number' && d.score > 0)
      .attr("x", d => x(d.i))
      .attr("y", d => y(d.score))
      .attr("fill", '#00ff00')
      .attr("stroke", "inherit")
      .attr("stroke-dasharray", 0)
      .attr("height", d => y(0) - y(Math.abs(d.score)))
      .attr("width", x.bandwidth())

  // WIN without score
  selection.filter(d => d.score === "WIN")
      .attr("x", d => x(d.i))
      .attr("y", d => y(20))
      .attr("fill", '#00000000')
      .attr("stroke", '#00ff00')
      .attr("stroke-dasharray", 4)
      .attr("height", y(0) - y(20))
      .attr("width", x.bandwidth())

  // LOSS with score +123
  selection.filter(d => typeof d.score === 'number' && d.score < 0)
      .attr("x", d => x(d.i))
      .attr("y", y(0))
      .attr("fill", 'red')
      .attr("height", d => y(0) - y(Math.abs(d.score)))
      .attr("stroke", "inherit")
      .attr("stroke-dasharray", 0)
      .attr("width", x.bandwidth())

  // LOSS without score DNF
  selection.filter(d => d.score === "LOSS")
      .attr("x", d => x(d.i))
      .attr("y", d => y(0))
      .attr("fill", '#00000000')
      .attr("stroke", 'red')
      .attr("stroke-dasharray", 4)
      .attr("height", y(0) - y(20))
      .attr("width", x.bandwidth())

/*
  svg.select(".content")
    .selectAll("text")
    .data(data, x=>`${x.i}`)
      .join("text")
      .filter(d => d.score === "LOSS")
      .text("DNF")
      .style("text-anchor", "middle")
      .attr("font-size", "5px")
      .attr("y", y(-12))
      .attr("x", d => x(d.i) + 7)
      .attr("fill", "red")
  */ 

  svg.select(".content")
    .selectAll(".player-icons")
    .data(data, x=>`${x.i}`)
    .join("text")
      .attr("class", "player-icons")
      .attr("x", (d, i) => x(i) + (x.bandwidth() / 2) + 2)
      .attr("y", (d, i) => y(min - 15))
      .attr("fill", d => d.group === '👤' ? '#ef14ef' : 'white')
      .style("text-anchor", "middle")
      .text(d => d.group)

  svg.select(".content")
    .selectAll(".match-icons")
    .data(data, x=>`${x.i}`)
    .join("image")
      .attr("class", "match-icons")
      .attr("x", (d, i) => x(i) + (x.bandwidth() / 2) - 8)
      .attr("y", (d, i) => y(min - 19))
      .attr("href", d => d.game === 'vanilla' ? 'xcom.png' : 'exalt-logo.png')
      .attr("width", "20")
      .attr("height", "20")

  svg.select(".content")
    .selectAll(".mission-icons")
    .data(data, x=>`${x.i}`)
    .join("image")
      .attr("class", "mission-icons")
      .attr("x", (d, i) => x(i) + (x.bandwidth() / 2) - 8)
      .attr("y", (d, i) => y(min - 30))
      .attr("href", d => `mission-icon-${d.mission === '-' ? 'unknown' : d.mission }.png`)
      .attr("width", "20")
      .attr("height", "20")

}